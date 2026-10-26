import { useEffect, useState } from "react";
import socket from "./socket";

function NotificationTest() {
  const [notification, setNotification] = useState("");

  useEffect(() => {
    // Test Student's MongoDB user ID
    const userId = "6a76ec1e55d65cfd60b40fc1";

    // Join this student's private Socket.IO room
    socket.emit("joinRoom", userId);

    // Listen for mentor acceptance
    socket.on("requestAccepted", (data) => {
      console.log("🔔 Notification received:", data);

      setNotification(data.message);
    });

    return () => {
      socket.off("requestAccepted");
    };
  }, []);

  return (
    <div>
      <h2>StudyMate Notifications</h2>

      {notification && (
        <p>{notification}</p>
      )}
    </div>
  );
}

export default NotificationTest;