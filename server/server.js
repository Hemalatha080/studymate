const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const app = require("./app");

connectDB();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io available inside controllers
app.set("io", io);
// Socket.IO connection
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Store the video session this socket is currently in
  let videoSessionId = null;

  // Personal notification room
  socket.on("joinRoom", (userId) => {
    socket.join(userId);

    console.log(`👤 User ${userId} joined their room`);
  });

  // Video session room
  socket.on("joinVideoRoom", (sessionId) => {
    socket.join(sessionId);
    videoSessionId = sessionId;

    console.log(
      `🎥 User ${socket.id} joined video room: ${sessionId}`
    );

    socket.to(sessionId).emit("userJoinedVideoRoom");
  });

  // WebRTC Offer
  socket.on("offer", ({ sessionId, offer }) => {
    console.log("📡 Offer received");

    socket.to(sessionId).emit("offer", offer);
  });

  // WebRTC Answer
  socket.on("answer", ({ sessionId, answer }) => {
    console.log("📡 Answer received");

    socket.to(sessionId).emit("answer", answer);
  });

  // ICE Candidate
  socket.on("iceCandidate", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("iceCandidate", candidate);
  });

  // User manually leaves video call
  socket.on("leaveVideoRoom", (sessionId) => {
    console.log(
      `📞 User ${socket.id} left video room: ${sessionId}`
    );

    socket.to(sessionId).emit("userLeftVideoRoom");

    socket.leave(sessionId);

    if (videoSessionId === sessionId) {
      videoSessionId = null;
    }
  });

  // User closes browser / disconnects
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    if (videoSessionId) {
      socket.to(videoSessionId).emit("userLeftVideoRoom");

      console.log(
        `📞 Notified video room ${videoSessionId} that user left`
      );
    }
  });
});
// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});