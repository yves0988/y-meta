
// Track active connections for each user
 onlineUsers =  Map();

// Send current online users to everyone
 broadcastOnlineUsers() {
  io.emit("online_users", Array.from(onlineUsers.keys()));
}

// SOCKET.IO AUTHENTICATION
io.use((socket, next) => {
   userId = socket.request.session?.userId;

   (!userId) {
     next( Error("Not authenticated"));
  }

  socket.userId = userId;
  next();
});

// CONNECT USERS
io.on("connection", (socket) => {

   userId = socket.userId;

  // Add this user's connection
   connections = onlineUsers.get(userId) || new Set();

  connections.add(socket.id);
  onlineUsers.set(userId, connections);

  // Join private room
  socket.join(`user:${userId}`);

  console.log("User online:", userId);

  // Update everyone
  broadcastOnlineUsers();

  // SEND MESSAGE
  socket.on("send_message", (data, callback) => {
     {
       receiverId = Number(data?.receiverId);
       message = data?.message;

       (
        !Number.isSafeInteger(receiverId) ||
        receiverId < 1 ||
         message !== "string" ||
        !message.trim() ||
        message.length > 2000
      ) {
         callback?.({ error: "Invalid message" });
      }

       receiver = db.prepare(
        "SELECT id FROM users WHERE id = ?"
      ).get(receiverId);

       (!receiver || receiverId === userId) {
         callback?.({ error: "Invalid recipient" });
      }

       result = db.prepare(`
        INSERT INTO messages
        (sender_id, receiver_id, message)
        VALUES (?, ?, ?)
      `).run(userId, receiverId, message.trim());

       savedMessage = db.prepare(`
        SELECT id, sender_id, receiver_id, message, created_at
        FROM messages WHERE id = ?
      `).get(Number(result.lastInsertRowid));

      io.to(`user:${userId}`)
        .to(`user:${receiverId}`)
        .emit("new_message", savedMessage);

      callback?.({ success: true });

    }  (error) {
      console.error(error);
      callback?.({ error: "Could not send message" });
    }
  });

  // DISCONNECT USER
  socket.on("disconnect", () => {

     connections = onlineUsers.get(userId);

     (connections) {
      connections.delete(socket.id);

      // Only mark offline if no connections remain
       (connections.size === 0) {
        onlineUsers.delete(userId);
        console.log("User offline:", userId);
      }
    }

    // Update everyone's user list
    broadcastOnlineUsers();
  });

});
