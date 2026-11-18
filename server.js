
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

io.on("connection", (socket) => {

  socket.on("register", (userName) => {
    const name = String(userName || "").trim();

    if (!name) return;

    users.set(socket.id, name);

    socket.emit("registered", {
      id: socket.id,
      name
    });
  });

  socket.on("call-user", ({ targetId }) => {
    if (!users.has(socket.id) || !users.has(targetId)) {
      socket.emit("call-error", "User not available.");
      return;
    }

    io.to(targetId).emit("incoming-call", {
      from: socket.id,
      name: users.get(socket.id)
    });
  });

  socket.on("accept-call", ({ targetId }) => {
    io.to(targetId).emit("call-accepted", {
      from: socket.id
    });
  });

  socket.on("reject-call", ({ targetId }) => {
    io.to(targetId).emit("call-rejected");
  });

  socket.on("signal", ({ targetId, signal }) => {
    io.to(targetId).emit("signal", {
      from: socket.id,
      signal
    });
  });

  socket.on("end-call", ({ targetId }) => {
    if (targetId) {
      io.to(targetId).emit("call-ended");
    }
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Y-META running on port ${PORT}`);
});
