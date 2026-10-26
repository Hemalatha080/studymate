const Session = require("../models/Session");
const HelpRequest = require("../models/HelpRequest");

// Create a session from an accepted help request
exports.createSession = async (req, res) => {
  try {
    const { requestId } = req.body;

    const helpRequest = await HelpRequest.findById(requestId);

    if (!helpRequest) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    if (helpRequest.status !== "Accepted") {
      return res.status(400).json({
        message: "Help request must be accepted first",
      });
    }

    if (!helpRequest.mentor) {
      return res.status(400).json({
        message: "No mentor assigned to this request",
      });
    }

    // Check if a session already exists
    const existingSession = await Session.findOne({
      helpRequest: requestId,
    });

    if (existingSession) {
      return res.status(400).json({
        message: "Session already exists",
        session: existingSession,
      });
    }

    const session = await Session.create({
      helpRequest: helpRequest._id,
      student: helpRequest.student,
      mentor: helpRequest.mentor,
    });

    res.status(201).json({
      message: "Tutoring session created successfully",
      session,
    });
  } catch (error) {
    console.log("❌ CREATE SESSION ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


// Get a session by ID
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate("student", "name email")
      .populate("mentor", "name email")
      .populate("helpRequest");

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    res.status(200).json({
      message: "Session found",
      session,
    });
  } catch (error) {
    console.log("❌ GET SESSION ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};