const express = require("express");

const router = express.Router();

const {
  createSession,
  getSession,
} = require("../controllers/sessionController");

const protect = require("../middleware/authMiddleware");

router.post("/", protect, createSession);

router.get("/:sessionId", protect, getSession);

module.exports = router;