const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Itanga amadosiye ya app, harimo index.html, app.js na style.css.
app.use(express.static(path.join(__dirname)));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Y-META server is running" });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (data = {}) => {
    const { roomId, userName } = data;

    if (typeof roomId !== "string" || !roomId.trim()) {
      socket.emit("call-error", "Injiza izina rya room.");
      return;
    }

    const cleanRoomId = roomId.trim();
    const cleanUserName =
      typeof userName === "string" && userName.trim()
        ? userName.trim()
        : "Guest";

    socket.join(cleanRoomId);
    socket.data.roomId = cleanRoomId;
    socket.data.userName = cleanUserName;

    // Bimenyesha abandi bari muri room ko umuntu mushya yinjiye.
    socket.to(cleanRoomId).emit("user-connected", {
      userId: socket.id,
      userName: cleanUserName
    });

    // Bimenyesha uwinjiye ko yakiriwe.
    socket.emit("room-joined", {
      roomId: cleanRoomId,
      userId: socket.id,
      userName: cleanUserName
    });

    console.log(`${cleanUserName} joined room: ${cleanRoomId}`);
  });

  socket.on("signal", (data = {}) => {
    const { targetId, signal } = data;

    if (!targetId || !signal) {
      console.warn("Received invalid signal from:", socket.id);
      return;
    }

    // Yohereza WebRTC signal ku muntu igenewe.
    io.to(targetId).emit("signal", {
      from: socket.id,
      signal
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;

    if (roomId) {
      socket.to(roomId).emit("user-disconnected", {
        userId: socket.id
      });
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Y-META server is running on port ${PORT}`);
});
