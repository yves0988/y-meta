
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || true,
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();
const activeCalls = new Map();

function sendUsers() {
  const onlineUsers = Array.from(users.entries()).map(
    ([id, name]) => ({ id, name })
  );

  io.emit("online-users", onlineUsers);
}

function endCall(socket, notifyOther = true) {
  const otherId = activeCalls.get(socket.id);

  if (otherId) {
    activeCalls.delete(socket.id);
    activeCalls.delete(otherId);

    if (notifyOther) {
      io.to(otherId).emit("call-ended");
    }
  }
}

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("register", (userName, callback) => {
    const name = String(userName || "").trim().slice(0, 30);

    if (!name) {
      return callback?.({
        ok: false,
        error: "Please enter your name."
      });
    }

    users.set(socket.id, name);

    callback?.({
      ok: true,
      id: socket.id,
      name
    });

    sendUsers();
  });

  socket.on("call-user", ({ targetId }, callback) => {

    if (!users.has(socket.id) || !users.has(targetId)) {
      return callback?.({
        ok: false,
        error: "User is not online."
      });
    }

    if (
      activeCalls.has(socket.id) ||
      activeCalls.has(targetId)
    ) {
      return callback?.({
        ok: false,
        error: "One of the users is already in a call."
      });
    }

    activeCalls.set(socket.id, targetId);
    activeCalls.set(targetId, socket.id);

    io.to(targetId).emit("incoming-call", {
      from: socket.id,
      name: users.get(socket.id)
    });

    callback?.({ ok: true });
  });

  socket.on("accept-call", ({ targetId }) => {

    if (
      activeCalls.get(socket.id) !== targetId ||
      activeCalls.get(targetId) !== socket.id
    ) return;

    io.to(targetId).emit("call-accepted", {
      from: socket.id
    });
  });

  socket.on("reject-call", ({ targetId }) => {

    if (activeCalls.get(socket.id) !== targetId) return;

    endCall(socket);

    io.to(targetId).emit("call-rejected");
  });

  socket.on("signal", ({ targetId, signal }) => {

    if (
      activeCalls.get(socket.id) !== targetId ||
      activeCalls.get(targetId) !== socket.id
    ) return;

    io.to(targetId).emit("signal", {
      from: socket.id,
      signal
    });
  });

  socket.on("end-call", () => {
    endCall(socket);
  });

  socket.on("disconnect", () => {

    endCall(socket);

    users.delete(socket.id);

    sendUsers();

    console.log("User disconnected:", socket.id);
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Y-META server running on port ${PORT}`);
});
