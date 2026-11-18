const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Y-META server is running" });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (data = {}) => {
    const roomId = typeof data.roomId === "string" ? data.roomId.trim() : "";
    const userName = typeof data.userName === "string" && data.userName.trim()
      ? data.userName.trim()
      : "Guest";

    if (!roomId) {
      socket.emit("call-error", "Enter a room name to join the call.");
      return;
    }

    // Ensure a socket belongs to only one call room at a time.
    const previousRoom = socket.data.roomId;
    if (previousRoom && previousRoom !== roomId) {
      socket.to(previousRoom).emit("user-disconnected", { userId: socket.id });
      socket.leave(previousRoom);
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName;

    socket.to(roomId).emit("user-connected", {
      userId: socket.id,
      userName
    });

    socket.emit("room-joined", {
      roomId,
      userId: socket.id,
      userName
    });

    console.log(`${userName} joined room ${roomId}`);
  });

  socket.on("signal", (data = {}) => {
    const { targetId, signal } = data;
    if (typeof targetId !== "string" || !signal) return;

    // Socket.IO automatically creates a private room for every socket ID.
    io.to(targetId).emit("signal", { from: socket.id, signal });
  });

  socket.on("leave-room", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    socket.to(roomId).emit("user-disconnected", { userId: socket.id });
    socket.leave(roomId);
    delete socket.data.roomId;
    delete socket.data.userName;
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit("user-disconnected", { userId: socket.id });
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Y-META server is running on port ${PORT}`);
});
