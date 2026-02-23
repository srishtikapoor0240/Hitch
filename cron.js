
const cron = require("node-cron");
const Ride = require("./models/Ride");
const User = require("./models/User");
const admin = require("./config/firebase");

const sendNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error("FCM cron error:", err.message);
  }
};

cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const rides = await Ride.find({
      isActive: true,
      lastInterestAt: { $gte: fifteenMinAgo, $lte: tenMinAgo },
    }).populate("poster").populate("interests.user", "name");

    for (const ride of rides) {
      const pendingInterests = ride.interests.filter((i) => i.status === "interested");

      if (pendingInterests.length === 0) continue;

      const posterFcm = ride.poster.fcmToken;

      for (const interest of pendingInterests) {
        await sendNotification(
          posterFcm,
          "Is this ride confirmed? 🤔",
          `Is the ride with ${interest.user.name} confirmed? Tap to confirm and update your seat count.`,
          {
            type: "confirmation_reminder",
            rideId: ride._id.toString(),
            interestedUserId: interest.user._id.toString(),
            interestedUserName: interest.user.name,
          }
        );
      }
    }

    console.log(`[CRON] Confirmation reminder task ran at ${now.toISOString()}`);
  } catch (err) {
    console.error("[CRON] Confirmation reminder error:", err.message);
  }
});


cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Ride.deleteMany({
      date: { $lt: today },
    });

    console.log(`[CRON] Auto-deleted ${result.deletedCount} expired rides at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("[CRON] Auto-delete error:", err.message);
  }
});

console.log("[CRON] All scheduled tasks registered.");
