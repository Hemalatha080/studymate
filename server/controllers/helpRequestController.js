const HelpRequest = require("../models/HelpRequest");

exports.createHelpRequest = async (req, res) => {
  try {
    const {
      subject,
      topic,
      description,
      urgency,
    } = req.body;

    const helpRequest = await HelpRequest.create({
      student: req.userId,
      subject,
      topic,
      description,
      urgency,
    });

    res.status(201).json({
      message: "Help request created successfully",
      helpRequest,
    });

  } catch (error) {
  console.log("❌ HELP REQUEST ERROR:", error);

  res.status(500).json({
    message: "Server Error",
    error: error.message,
  });
}
};
exports.getMyHelpRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find({
      student: req.userId,
    })
      .populate("mentor", "name email skills topicsCanTeach")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Help requests fetched successfully",
      requests,
    });

  } catch (error) {
    console.log("❌ GET REQUESTS ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
exports.acceptHelpRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const helpRequest = await HelpRequest.findById(requestId);

    if (!helpRequest) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    if (helpRequest.status !== "Open") {
      return res.status(400).json({
        message: "This help request is no longer available",
      });
    }

    if (helpRequest.student.toString() === req.userId) {
      return res.status(400).json({
        message: "You cannot accept your own help request",
      });
    }

    helpRequest.mentor = req.userId;
    helpRequest.status = "Accepted";

    await helpRequest.save();

    // Get Socket.IO instance
    const io = req.app.get("io");

    // Notify the student who created the request
    io.to(helpRequest.student.toString()).emit(
      "requestAccepted",
      {
        message: "Your help request has been accepted!",
        requestId: helpRequest._id,
        mentorId: req.userId,
      }
    );

    res.status(200).json({
      message: "Help request accepted successfully",
      helpRequest,
    });

  } catch (error) {
    console.log("❌ ACCEPT REQUEST ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};