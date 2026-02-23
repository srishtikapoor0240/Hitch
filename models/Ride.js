

const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["interested", "confirmed", "rejected"],
    default: "interested",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const rideSchema = new mongoose.Schema(
  {
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    from: {
      type: String,
      required: true,
      trim: true,
    },

    to: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    preferredGenders: [
      {
        type: String,
        enum: ["male", "female", "other", "any"],
      },
    ],

    interests: [interestSchema],

    isActive: {
      type: Boolean,
      default: true,
    },

    
    lastInterestAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", rideSchema);
