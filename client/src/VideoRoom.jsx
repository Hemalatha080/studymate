import { useEffect, useRef, useState } from "react";
import socket from "./socket";
import "./VideoRoom.css";

function VideoRoom() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [joined, setJoined] = useState(false);
  const [otherUserJoined, setOtherUserJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // New UI states
  const [connectionStatus, setConnectionStatus] = useState("waiting");
  const [participantLeft, setParticipantLeft] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const participantName = "StudyMate Participant";

  // Your actual Session ID
  const sessionId = "6a771f1a5b19187bd6b4d86a";

  // --------------------------------------------------
  // SOCKET EVENTS
  // --------------------------------------------------

  useEffect(() => {
    socket.on("userJoinedVideoRoom", async () => {
      console.log("👤 Another user joined the video room");

      setOtherUserJoined(true);
      setParticipantLeft(false);
      setConnectionStatus("connecting");

      await createOffer();
    });

    // Receive WebRTC Offer
    socket.on("offer", async (offer) => {
      console.log("📡 Offer received");

      setParticipantLeft(false);
      setOtherUserJoined(true);
      setConnectionStatus("connecting");

      await createAnswer(offer);
    });

    // Receive WebRTC Answer
    socket.on("answer", async (answer) => {
      console.log("📡 Answer received");

      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        } catch (error) {
          console.error(
            "❌ Error setting remote description:",
            error
          );
        }
      }
    });

    // Receive ICE Candidate
    socket.on("iceCandidate", async (candidate) => {
      console.log("🧊 ICE candidate received");

      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("❌ ICE candidate error:", error);
        }
      }
    });

    // Other participant left
    socket.on("userLeftVideoRoom", () => {
      console.log("📞 Other participant left the video room");

      setOtherUserJoined(false);
      setParticipantLeft(true);
      setConnectionStatus("waiting");

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      console.log("🧹 Remote video cleared");
    });

    return () => {
      socket.off("userJoinedVideoRoom");
      socket.off("offer");
      socket.off("answer");
      socket.off("iceCandidate");
      socket.off("userLeftVideoRoom");
    };
  }, []);

  // --------------------------------------------------
  // CALL TIMER
  // --------------------------------------------------

  useEffect(() => {
    if (!joined) {
      setCallSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setCallSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [joined]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const mm = String(minutes).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
    }

    return `${mm}:${ss}`;
  };

  // --------------------------------------------------
  // CREATE PEER CONNECTION
  // --------------------------------------------------

  const createPeerConnection = () => {
    // Close old connection if one exists
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerConnectionRef.current = peerConnection;

    // Add local camera/audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(
          track,
          localStreamRef.current
        );
      });
    }

    // Receive remote audio/video
    peerConnection.ontrack = (event) => {
      console.log("🎥 Remote stream received");

      if (
        remoteVideoRef.current &&
        event.streams[0]
      ) {
        remoteVideoRef.current.srcObject =
          event.streams[0];

        remoteVideoRef.current
          .play()
          .catch((error) => {
            console.log(
              "ℹ️ Remote video autoplay waiting:",
              error
            );
          });
      }
    };

    // Send ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    // Detect connection state
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;

      console.log(
        "🔗 WebRTC connection state:",
        state
      );

      if (state === "connected") {
        setConnectionStatus("connected");
        setParticipantLeft(false);
        setOtherUserJoined(true);
      }

      if (state === "connecting") {
        setConnectionStatus("connecting");
      }

      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        setConnectionStatus("waiting");
        setOtherUserJoined(false);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      }
    };

    return peerConnection;
  };

  // --------------------------------------------------
  // CREATE OFFER
  // --------------------------------------------------

  const createOffer = async () => {
    try {
      const peerConnection =
        createPeerConnection();

      const offer =
        await peerConnection.createOffer();

      await peerConnection.setLocalDescription(
        offer
      );

      socket.emit("offer", {
        sessionId,
        offer,
      });

      console.log("📡 Offer sent");
    } catch (error) {
      console.error(
        "❌ Offer error:",
        error
      );
    }
  };

  // --------------------------------------------------
  // CREATE ANSWER
  // --------------------------------------------------

  const createAnswer = async (offer) => {
    try {
      const peerConnection =
        createPeerConnection();

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer =
        await peerConnection.createAnswer();

      await peerConnection.setLocalDescription(
        answer
      );

      socket.emit("answer", {
        sessionId,
        answer,
      });

      console.log("📡 Answer sent");
    } catch (error) {
      console.error(
        "❌ Answer error:",
        error
      );
    }
  };

  // --------------------------------------------------
  // START CALL
  // --------------------------------------------------

  const startCall = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          stream;
      }

      socket.emit(
        "joinVideoRoom",
        sessionId
      );

      setJoined(true);
      setMicOn(true);
      setCameraOn(true);
      setConnectionStatus("waiting");
      setParticipantLeft(false);

      console.log(
        "🎥 Joined video room:",
        sessionId
      );
    } catch (error) {
      console.error(
        "❌ Camera/Microphone error:",
        error
      );
    }
  };

  // --------------------------------------------------
  // MICROPHONE
  // --------------------------------------------------

  const toggleMicrophone = () => {
    if (!localStreamRef.current) return;

    const audioTrack =
      localStreamRef.current
        .getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled =
        !audioTrack.enabled;

      setMicOn(audioTrack.enabled);

      console.log(
        audioTrack.enabled
          ? "🎤 Microphone ON"
          : "🔇 Microphone OFF"
      );
    }
  };

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    const videoTrack =
      localStreamRef.current
        .getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled =
        !videoTrack.enabled;

      setCameraOn(videoTrack.enabled);

      console.log(
        videoTrack.enabled
          ? "📷 Camera ON"
          : "📷 Camera OFF"
      );
    }
  };

  // --------------------------------------------------
  // STOP SCREEN SHARING
  // --------------------------------------------------

  const stopScreenShare = async () => {
    try {
      const cameraTrack =
        localStreamRef.current?.getVideoTracks()[0];

      if (!cameraTrack) {
        console.warn(
          "⚠️ Camera track not found"
        );
        return;
      }

      if (peerConnectionRef.current) {
        const sender =
          peerConnectionRef.current
            .getSenders()
            .find(
              (sender) =>
                sender.track &&
                sender.track.kind === "video"
            );

        if (sender) {
          await sender.replaceTrack(
            cameraTrack
          );

          console.log(
            "📷 Camera track restored"
          );
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          localStreamRef.current;
      }

      if (screenStreamRef.current) {
        screenStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        screenStreamRef.current = null;
      }

      setScreenSharing(false);

      console.log(
        "🖥️ Screen sharing stopped"
      );
    } catch (error) {
      console.error(
        "❌ Stop screen sharing error:",
        error
      );
    }
  };

  // --------------------------------------------------
  // SCREEN SHARING
  // --------------------------------------------------

  const toggleScreenShare = async () => {
    console.log("🖥️ Share button clicked");

    if (screenSharing) {
      await stopScreenShare();
      return;
    }

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia
      ) {
        alert(
          "Screen sharing is not supported by this browser/device."
        );

        console.error(
          "❌ getDisplayMedia is not supported"
        );

        return;
      }

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

      console.log(
        "✅ Screen stream received:",
        screenStream
      );

      screenStreamRef.current =
        screenStream;

      const screenTrack =
        screenStream.getVideoTracks()[0];

      if (peerConnectionRef.current) {
        const sender =
          peerConnectionRef.current
            .getSenders()
            .find(
              (sender) =>
                sender.track &&
                sender.track.kind === "video"
            );

        if (sender) {
          await sender.replaceTrack(
            screenTrack
          );

          console.log(
            "🖥️ Screen track sent to remote participant"
          );
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          screenStream;
      }

      setScreenSharing(true);

      screenTrack.onended = async () => {
        console.log(
          "🛑 Screen sharing ended by browser"
        );

        await stopScreenShare();
      };
    } catch (error) {
      console.error(
        "❌ Screen sharing error:",
        error
      );

      setScreenSharing(false);
    }
  };

  // --------------------------------------------------
  // LEAVE CALL
  // --------------------------------------------------

  const leaveCall = () => {
    console.log(
      "📞 Leaving video session"
    );

    socket.emit(
      "leaveVideoRoom",
      sessionId
    );

    if (screenStreamRef.current) {
      screenStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setJoined(false);
    setOtherUserJoined(false);
    setScreenSharing(false);
    setMicOn(true);
    setCameraOn(true);
    setConnectionStatus("waiting");
    setParticipantLeft(false);

    console.log(
      "📞 Left video session"
    );
  };

  // --------------------------------------------------
  // PROFESSIONAL VIDEO CALL UI
  // --------------------------------------------------

  return (
    <div className="meeting-page">

      {/* HEADER */}
      <header className="meeting-header">
        <div className="meeting-brand">
          <div className="brand-mark">S</div>

          <div>
            <h1>StudyMate</h1>
            <span>Private tutoring session</span>
          </div>
        </div>

        {joined && (
          <div className="meeting-meta">
            <div
              className={`status-pill status-${connectionStatus}`}
            >
              <span className="status-dot" />

              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Waiting"}
            </div>

            <div className="call-duration">
              {formatDuration(callSeconds)}
            </div>
          </div>
        )}
      </header>

      <main className="meeting-stage">

        {/* BEFORE JOINING */}
        {!joined ? (
          <div className="prejoin-card">
            <div className="prejoin-icon">
              🎥
            </div>

            <h2>Ready to join?</h2>

            <p>
              Join your StudyMate tutoring session
              and connect with your participant.
            </p>

            <button
              className="join-call-button"
              onClick={startCall}
            >
              Join video session
            </button>

            <span className="session-code">
              Session ID: {sessionId.slice(-8)}
            </span>
          </div>
        ) : (

          <>
            {/* REMOTE VIDEO */}
            <section className="remote-video-container">

              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />

              {/* WAITING STATE */}
              {!otherUserJoined &&
                !participantLeft && (
                  <div className="remote-placeholder">

                    <div className="participant-avatar">
                      {participantName.charAt(0)}
                    </div>

                    <h2>{participantName}</h2>

                    <div className="waiting-animation">
                      <span />
                      <span />
                      <span />
                    </div>

                    <p>
                      Waiting for participant to join...
                    </p>

                  </div>
                )}

              {/* PARTICIPANT LEFT */}
              {participantLeft && (
                <div className="remote-placeholder">

                  <div className="participant-avatar">
                    {participantName.charAt(0)}
                  </div>

                  <h2>{participantName}</h2>

                  <p className="participant-left-text">
                    Participant left the call
                  </p>

                  <span className="waiting-note">
                    Waiting for them to reconnect...
                  </span>

                </div>
              )}

              {/* PARTICIPANT NAME */}
              {otherUserJoined && (
                <div className="participant-label">
                  <span className="online-dot" />
                  {participantName}
                </div>
              )}

              {/* SCREEN SHARE INDICATOR */}
              {screenSharing && (
                <div className="screen-share-indicator">
                  🖥️ You are sharing your screen
                </div>
              )}

              {/* LOCAL VIDEO */}
              <div className="local-video-wrapper">

                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="local-video"
                />

                {!cameraOn && (
                  <div className="camera-off-overlay">
                    <div className="self-avatar">
                      You
                    </div>
                  </div>
                )}

                <div className="local-video-label">
                  You
                </div>

                {!micOn && (
                  <div className="muted-indicator">
                    🔇
                  </div>
                )}

              </div>

            </section>

            {/* CONTROLS */}
            <div className="meeting-controls">

              <button
                className={`control-button ${
                  !micOn ? "control-disabled" : ""
                }`}
                onClick={toggleMicrophone}
              >
                <span className="control-icon">
                  {micOn ? "🎤" : "🔇"}
                </span>

                <span>
                  {micOn ? "Mute" : "Unmute"}
                </span>
              </button>

              <button
                className={`control-button ${
                  !cameraOn ? "control-disabled" : ""
                }`}
                onClick={toggleCamera}
              >
                <span className="control-icon">
                  {cameraOn ? "📹" : "🚫"}
                </span>

                <span>
                  {cameraOn
                    ? "Camera"
                    : "Start video"}
                </span>
              </button>

              <button
                className={`control-button ${
                  screenSharing
                    ? "control-active"
                    : ""
                }`}
                onClick={toggleScreenShare}
              >
                <span className="control-icon">
                  🖥️
                </span>

                <span>
                  {screenSharing
                    ? "Stop share"
                    : "Share"}
                </span>
              </button>

              <button
                className="control-button end-call-button"
                onClick={leaveCall}
              >
                <span className="control-icon">
                  📞
                </span>

                <span>Leave</span>
              </button>

            </div>

          </>
        )}

      </main>
    </div>
  );
}

export default VideoRoom;