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

  socket.on("join-room", ({ roomId, userName }) => {
    if (!roomId) return;

    socket.join(roomId);

    socket.data.roomId = roomId;
    socket.data.userName = userName || "Guest";

    socket.to(roomId).emit("user-connected", {
      userId: socket.id,
      userName: socket.data.userName
    });

    socket.emit("room-joined", {
      roomId,
      userId: socket.id,
      userName: socket.data.userName
    });
  });

  socket.on("signal", ({ targetId, signal }) => {
    socket.to(targetId).emit("signal", {
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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Y-META running at http://localhost:${PORT}`);
});

