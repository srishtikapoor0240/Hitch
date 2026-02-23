
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Ride = require("../models/Ride");
const User = require("../models/User");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { from, to, date, gender, timeFrom, timeTo } = req.query;

    const query = {
      isActive: true,
      poster: { $ne: req.user._id },
    };

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

router.get("/buddies", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "travelBuddies",
      "name gender phone"
    );

    res.status(200).json({ travelBuddies: user.travelBuddies });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
