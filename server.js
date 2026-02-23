
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("./config/firebase");

const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/auth", require("./routes/auth"));
app.use("/api/rides", require("./routes/rides"));
app.use("/api/dashboard", require("./routes/dashboard"));


app.get("/", (req, res) => {
  res.json({ status: "Travel App Backend is running 🚀" });
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);

   
      require("./cron");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
