
// Track active connections for each user
const onlineUsers = new Map();

// Send current online users to everyone
function broadcastOnlineUsers() {
  io.emit("online_users", Array.from(onlineUsers.keys()));
}

// SOCKET.IO AUTHENTICATION
io.use((socket, next) => {
  const userId = socket.request.session?.userId;

  if (!userId) {
    return next(new Error("Not authenticated"));
  }

  socket.userId = userId;
  next();
});

// CONNECT USERS
io.on("connection", (socket) => {

  const userId = socket.userId;

  // Add this user's connection
  const connections = onlineUsers.get(userId) || new Set();

  connections.add(socket.id);
  onlineUsers.set(userId, connections);

  // Join private room
  socket.join(`user:${userId}`);

  console.log("User online:", userId);

  // Update everyone
  broadcastOnlineUsers();

  // SEND MESSAGE
  socket.on("send_message", (data, callback) => {
    try {
      const receiverId = Number(data?.receiverId);
      const message = data?.message;

      if (
        !Number.isSafeInteger(receiverId) ||
        receiverId < 1 ||
        typeof message !== "string" ||
        !message.trim() ||
        message.length > 2000
      ) {
        return callback?.({ error: "Invalid message" });
      }

      const receiver = db.prepare(
        "SELECT id FROM users WHERE id = ?"
      ).get(receiverId);

      if (!receiver || receiverId === userId) {
        return callback?.({ error: "Invalid recipient" });
      }

      const result = db.prepare(`
        INSERT INTO messages
        (sender_id, receiver_id, message)
        VALUES (?, ?, ?)
      `).run(userId, receiverId, message.trim());

      const savedMessage = db.prepare(`
        SELECT id, sender_id, receiver_id, message, created_at
        FROM messages WHERE id = ?
      `).get(Number(result.lastInsertRowid));

      io.to(`user:${userId}`)
        .to(`user:${receiverId}`)
        .emit("new_message", savedMessage);

      callback?.({ success: true });

    } catch (error) {
      console.error(error);
      callback?.({ error: "Could not send message" });
    }
  });

  // DISCONNECT USER
  socket.on("disconnect", () => {

    const connections = onlineUsers.get(userId);

    if (connections) {
      connections.delete(socket.id);

      // Only mark offline if no connections remain
      if (connections.size === 0) {
        onlineUsers.delete(userId);
        console.log("User offline:", userId);
      }
    }

    // Update everyone's user list
    broadcastOnlineUsers();
  });

});
