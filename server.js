const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, userName }, reply) => {
    const room = String(roomId || "").trim();
    const name = String(userName || "").trim();

    if (!/^\d{4,12}$/.test(room) || !name) {
      reply?.({ ok: false, error: "Enter your name and a 4–12 digit room code." });
      return;
    }

    const members = io.sockets.adapter.rooms.get(room);
    if (members && members.size >= 2) {
      reply?.({ ok: false, error: "This demo room already has two people." });
      return;
    }

    socket.join(room);
    socket.data.roomId = room;
    socket.data.userName = name;

    // Notify the first person so they can start the peer connection.
    socket.to(room).emit("peer-joined", {
      userId: socket.id,
      userName: name
    });

    reply?.({ ok: true, roomId: room });
  });

  socket.on("signal", ({ targetId, signal } = {}) => {
    const room = socket.data.roomId;
    const target = io.sockets.sockets.get(targetId);

    // Only relay signals to someone in the same room.
    if (room && target?.data.roomId === room) {
      target.emit("signal", { from: socket.id, signal });
    }
  });

  function leaveRoom() {
    const room = socket.data.roomId;
    if (!room) return;

    socket.to(room).emit("peer-left");
    socket.leave(room);
    delete socket.data.roomId;
  }

  socket.on("leave-room", leaveRoom);
  socket.on("disconnect", leaveRoom);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Y-META running at http://localhost:${PORT}`);
});
