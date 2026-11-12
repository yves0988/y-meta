
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcrypt");
const path = require("path");

const db = require("./database");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Create session storage
const sessionMiddleware = session({
  store: new SQLiteStore({
    db: "sessions.sqlite",
    dir: "./"
  }),
  secret: process.env.SESSION_SECRET || "change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);

// Share login sessions with Socket.IO
io.engine.use(sessionMiddleware);

// Check whether a user is logged in
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "Please log in first"
    });
  }

  next();
}

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !/^[a-zA-Z0-9_]{3,20}$/.test(username) ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        error: "Use a username of 3-20 letters, numbers or underscores and a password of 8-72 characters."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (username, password)
      VALUES (?, ?)
    `).run(username, hashedPassword);

    req.session.userId = Number(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      username
    });

  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        error: "Username already exists"
      });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Enter username and password"
      });
    }

    const user = db.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).get(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Incorrect username or password"
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }

      req.session.userId = user.id;

      res.json({
        success: true,
        username: user.username
      });
    });

  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// CHECK CURRENT USER
app.get("/api/me", requireLogin, (req, res) => {
  const user = db.prepare(
    "SELECT id, username FROM users WHERE id = ?"
  ).get(req.session.userId);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  res.json(user);
});

// GET ALL OTHER USERS
app.get("/api/users", requireLogin, (req, res) => {
  const users = db.prepare(`
    SELECT id, username
    FROM users
    WHERE id != ?
    ORDER BY username
  `).all(req.session.userId);

  res.json(users);
});

// GET CONVERSATION HISTORY
app.get("/api/messages/:userId", requireLogin, (req, res) => {
  const otherId = Number(req.params.userId);

  if (!Number.isSafeInteger(otherId) || otherId < 1) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const messages = db.prepare(`
    SELECT id, sender_id, receiver_id, message, created_at
    FROM messages
    WHERE
      (sender_id = ? AND receiver_id = ?)
      OR
      (sender_id = ? AND receiver_id = ?)
    ORDER BY id ASC
    LIMIT 200
  `).all(
    req.session.userId,
    otherId,
    otherId,
    req.session.userId
  );

  res.json(messages);
});

// LOGOUT
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// SOCKET.IO AUTHENTICATION
io.use((socket, next) => {
  const userId = socket.request.session?.userId;

  if (!userId) {
    return next(new Error("Not authenticated"));
  }

  socket.userId = userId;
  next();
});

// CONNECT USERS TO THEIR PRIVATE ROOMS
io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);

  console.log("User connected:", socket.userId);

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
        return callback?.({
          error: "Invalid message"
        });
      }

      const receiver = db.prepare(
        "SELECT id FROM users WHERE id = ?"
      ).get(receiverId);

      if (!receiver || receiverId === socket.userId) {
        return callback?.({
          error: "Invalid recipient"
        });
      }

      const result = db.prepare(`
        INSERT INTO messages
        (sender_id, receiver_id, message)
        VALUES (?, ?, ?)
      `).run(
        socket.userId,
        receiverId,
        message.trim()
      );

      const savedMessage = db.prepare(`
        SELECT id, sender_id, receiver_id, message, created_at
        FROM messages WHERE id = ?
      `).get(Number(result.lastInsertRowid));

      // Deliver to the sender and receiver
      io.to(`user:${socket.userId}`)
        .to(`user:${receiverId}`)
        .emit("new_message", savedMessage);

      callback?.({ success: true });

    } catch (error) {
      callback?.({ error: "Could not send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
