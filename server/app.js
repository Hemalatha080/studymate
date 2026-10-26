console.log("✅ THIS IS THE STUDYMATE APP.JS");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const helpRequestRoutes = require("./routes/helpRequestRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to StudyMate API 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/help-requests", helpRequestRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/sessions", sessionRoutes);
app.get("/test", (req, res) => {
  res.send("Test route is working");
});
module.exports = app;