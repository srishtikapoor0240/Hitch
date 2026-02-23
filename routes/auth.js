
const express = require("express");
const router = express.Router();
const admin = require("../config/firebase");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const { name, gender, fcmToken } = req.body;

    if (!name || !gender) {
      return res.status(400).json({ message: "name and gender are required" });
    }


    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (user) {
    
      user.fcmToken = fcmToken || user.fcmToken;
      await user.save();
      return res.status(200).json({ message: "User already registered", user });
    }

    const phone = decoded.phone_number;
    if (!phone) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    user = new User({
      firebaseUid: decoded.uid,
      phone,
      name,
      gender,
      fcmToken: fcmToken || null,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    const { fcmToken } = req.body;
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ firebaseUid: decoded.uid }).populate(
      "travelBuddies",
      "name gender phone"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
