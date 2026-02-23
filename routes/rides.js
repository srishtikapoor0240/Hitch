
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Ride = require("../models/Ride");
const User = require("../models/User");
const admin = require("../config/firebase");

const sendNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data, 
    });
  } catch (err) {
    console.error("FCM error:", err.message);
  }
};

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { from, to, date, time, totalSeats, preferredGenders } = req.body;

    if (!from || !to || !date || !time || !totalSeats) {
      return res.status(400).json({ message: "from, to, date, time, totalSeats are required" });
    }

    const ride = new Ride({
      poster: req.user._id,
      from,
      to,
      date: new Date(date),
      time,
      totalSeats,
      availableSeats: totalSeats,
      preferredGenders: preferredGenders || ["any"],
    });

    await ride.save();
    res.status(201).json({ message: "Ride posted successfully", ride });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { from, to, date, gender, timeFrom, timeTo } = req.query;

    const query = { isActive: true };

    if (from) query.from = { $regex: from, $options: "i" };
    if (to) query.to = { $regex: to, $options: "i" };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (gender) {
      query.preferredGenders = { $in: [gender, "any"] };
    }

    if (timeFrom || timeTo) {
      query.time = {};
      if (timeFrom) query.time.$gte = timeFrom;
      if (timeTo) query.time.$lte = timeTo;
    }

    const rides = await Ride.find(query)
      .populate("poster", "name gender phone")
      .sort({ date: 1, time: 1 });

    res.status(200).json({ rides });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/today", authMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const rides = await Ride.find({
      isActive: true,
      date: { $gte: start, $lte: end },
    })
      .populate("poster", "name gender phone")
      .sort({ time: 1 });

    res.status(200).json({ rides });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/:rideId/interest", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).populate("poster");

    if (!ride || !ride.isActive) {
      return res.status(404).json({ message: "Ride not found or no longer active" });
    }

    if (ride.poster._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot join your own ride" });
    }

    const alreadyInterested = ride.interests.find(
      (i) => i.user.toString() === req.user._id.toString()
    );
    if (alreadyInterested) {
      return res.status(400).json({ message: "You have already expressed interest in this ride" });
    }

    if (ride.availableSeats <= 0) {
      return res.status(400).json({ message: "No seats available" });
    }

    ride.interests.push({ user: req.user._id, status: "interested" });
    ride.lastInterestAt = new Date();
    await ride.save();

    const posterFcm = ride.poster.fcmToken;
    await sendNotification(
      posterFcm,
      "Someone is interested in your ride! 🚗",
      `${req.user.name} wants to join your ride from ${ride.from} to ${ride.to}.`,
      {
        type: "interest",
        rideId: ride._id.toString(),
        interestedUserId: req.user._id.toString(),
        interestedUserName: req.user.name,
      }
    );

    res.status(200).json({ message: "Interest expressed. Poster has been notified." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/:rideId/confirm", authMiddleware, async (req, res) => {
  try {
    const { interestedUserId, action } = req.body;

    if (!["confirm", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be 'confirm' or 'reject'" });
    }

    const ride = await Ride.findById(req.params.rideId);

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.poster.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the ride poster can confirm or reject" });
    }

    const interest = ride.interests.find(
      (i) => i.user.toString() === interestedUserId
    );

    if (!interest) {
      return res.status(404).json({ message: "Interest record not found" });
    }

    if (interest.status === "confirmed") {
      return res.status(400).json({ message: "User already confirmed" });
    }

    const interestedUser = await User.findById(interestedUserId);

    if (action === "confirm") {
      interest.status = "confirmed";
      ride.availableSeats = Math.max(0, ride.availableSeats - 1);

      
      if (ride.availableSeats === 0) {
        ride.isActive = false;

        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { travelBuddies: interestedUserId },
        });
        await User.findByIdAndUpdate(interestedUserId, {
          $addToSet: { travelBuddies: req.user._id },
        });
      }

      await ride.save();

      await sendNotification(
        interestedUser.fcmToken,
        "Ride Confirmed! 🎉",
        `${req.user.name} confirmed your seat for the ride from ${ride.from} to ${ride.to}.`,
        { type: "confirmed", rideId: ride._id.toString() }
      );

      return res.status(200).json({
        message: "User confirmed",
        availableSeats: ride.availableSeats,
      });
    }

    if (action === "reject") {
      interest.status = "rejected";
      await ride.save();

      await sendNotification(
        interestedUser.fcmToken,
        "Ride Update",
        `Unfortunately ${req.user.name} couldn't accommodate you this time.`,
        { type: "rejected", rideId: ride._id.toString() }
      );

      return res.status(200).json({ message: "User rejected" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/:rideId/chat-request", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).populate("poster");

    if (!ride || !ride.isActive) {
      return res.status(404).json({ message: "Ride not found or inactive" });
    }

    await sendNotification(
      ride.poster.fcmToken,
      "Someone wants to chat 💬",
      `${req.user.name} wants to chat about your ride from ${ride.from} to ${ride.to}.`,
      {
        type: "chat_request",
        rideId: ride._id.toString(),
        requesterName: req.user.name,
        requesterPhone: req.user.phone,
        requesterId: req.user._id.toString(),
      }
    );

    res.status(200).json({
      message: "Chat request sent to poster",
      posterPhone: ride.poster.phone, 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/:rideId", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.poster.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own ride" });
    }

    await Ride.findByIdAndDelete(req.params.rideId);

    res.status(200).json({ message: "Ride deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/my-rides", authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({ poster: req.user._id })
      .populate("interests.user", "name gender phone")
      .sort({ date: -1 });

    res.status(200).json({ rides });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
