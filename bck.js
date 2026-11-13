
 express = require("express");
 http = require("http");
 { Server } = require("socket.io");
 session = require("express-session");
 SQLiteStore = require("connect-sqlite3")(session);
 bcrypt = require("bcrypt");
 path = require("path");

 db = require("./database");

 app = express();
 server = http.createServer(app);
 io =  Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Create session storage
 sessionMiddleware = session({
  store:  SQLiteStore({
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
 requireLogin(req, res, next) {
   (!req.session.userId) {
     res.status(401).json({
      error: "Please log in first"
    });
  }

  next();
}

// REGISTER
app.post("/api/register",  (req, res) => {
   {
     { username, password } = req.body;

     (
       username !== "string" ||
       password !== "string" ||
      !/^[a-zA-Z0-9_]{3,20}$/.test(username) ||
      password.length < 8 ||
      password.length > 72
    ) {
       res.status(400).json({
        error: "Use a username of 3-20 letters, numbers or underscores and a password of 8-72 characters."
      });
    }

     hashedPassword =  bcrypt.hash(password, 12);

     

    req.session.userId = Number(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      username
    });

  }  (error) {
     (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
       res.status(409).json({
        error: "Username already exists"
      });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN
app.post("/api/login",  (req, res) => {
   {
     { username, password } = req.body;

     (
       username !== "string" ||
       password !== "string"
    ) {
       res.status(400).json({
        error: "Enter username and password"
      });
    }

     user = db.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).get(username);

     (!user || !( bcrypt.compare(password, user.password))) {
       res.status(401).json({
        error: "Incorrect username or password"
      });
    }

    req.session.regenerate((err) => {
       (err) {
         res.status(500).json({ error: "Login failed" });
      }

      req.session.userId = user.id;

      res.json({
        success: true,
        username: user.username
      });
    });

  }  (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// CHECK CURRENT USER
app.get("/api/me", requireLogin, (req, res) => {
   user = db.prepare(
    "SELECT id, username FROM users WHERE id = ?"
  ).get(req.session.userId);

   (!user) {
     res.status(401).json({ error: "User not found" });
  }

  res.json(user);
});

// GET ALL OTHER USERS
app.get("/api/users", requireLogin, (req, res) => {
   users = db.prepare(`
    SELECT id, username
    FROM users
    WHERE id != ?
    ORDER BY username
  `).all(req.session.userId);

  res.json(users);
});

// GET CONVERSATION HISTORY
app.get("/api/messages/:userId", requireLogin, (req, res) => {
   otherId = Number(req.params.userId);

   (!Number.isSafeInteger(otherId) || otherId < 1) {
     res.status(400).json({ error: "Invalid user ID" });
  }

   messages = db.prepare(`
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
   userId = socket.request.session?.userId;

   (!userId) {
     next( Error("Not authenticated"));
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
         callback?.({
          error: "Invalid message"
        });
      }

       receiver = db.prepare(
        "SELECT id FROM users WHERE id = ?"
      ).get(receiverId);

       (!receiver || receiverId === socket.userId) {
         callback?.({
          error: "Invalid recipient"
        });
      }

       result = db.prepare(`
        INSERT INTO messages
        (sender_id, receiver_id, message)
        VALUES (?, ?, ?)
      `).run(
        socket.userId,
        receiverId,
        message.trim()
      );

       savedMessage = db.prepare(`
        SELECT id, sender_id, receiver_id, message, created_at
        FROM messages WHERE id = ?
      `).get(Number(result.lastInsertRowid));

      // Deliver to the sender and receiver
      io.to(`user:${socket.userId}`)
        .to(`user:${receiverId}`)
        .emit("new_message", savedMessage);

      callback?.({ success: true });

    }  (error) {
      callback?.({ error: "Could not send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});

// START SERVER
 PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
