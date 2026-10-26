const User = require("../models/User");
const HelpRequest = require("../models/HelpRequest");

exports.findMatches = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the help request
    const helpRequest = await HelpRequest.findById(requestId);

    if (!helpRequest) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    // Make sure only the student who created the request can find mentors
    if (helpRequest.student.toString() !== req.userId) {
      return res.status(403).json({
        message: "You are not allowed to access this request",
      });
    }

    // Find available students other than the requester
    const students = await User.find({
      _id: { $ne: req.userId },
      availability: true,
    }).select("-password");

    // Convert requested subject/topic to lowercase
    const requestedSubject = helpRequest.subject.toLowerCase();
    const requestedTopic = helpRequest.topic.toLowerCase();

    const matches = students
      .map((student) => {
        let score = 0;

        const skills = student.skills.map((skill) =>
          skill.toLowerCase()
        );

        const topics = student.topicsCanTeach.map((topic) =>
          topic.toLowerCase()
        );

        // Subject/skill match
        if (skills.includes(requestedSubject)) {
          score += 50;
        }

        // Topic match
        if (topics.includes(requestedTopic)) {
          score += 50;
        }

        return {
          student,
          score,
        };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score);

    res.status(200).json({
      message: "Matching students found",
      request: {
        id: helpRequest._id,
        subject: helpRequest.subject,
        topic: helpRequest.topic,
      },
      matches,
    });

  } catch (error) {
    console.log("❌ MATCHING ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};