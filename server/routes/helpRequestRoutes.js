const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createHelpRequest,
  getMyHelpRequests,
  acceptHelpRequest,
} = require("../controllers/helpRequestController");


router.post(
  "/",
  protect,
  createHelpRequest
);
router.get("/my", protect, getMyHelpRequests);
router.put("/:requestId/accept", protect, acceptHelpRequest);
module.exports = router;