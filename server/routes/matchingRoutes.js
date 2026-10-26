const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  findMatches,
} = require("../controllers/matchingController");

router.get("/:requestId", protect, findMatches);

module.exports = router;