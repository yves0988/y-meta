
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Temporary message storage
let messages = [];

// Home route
app.get("/", (req, res) => {
  res.send("My backend is working!");
});

// Send a message
app.post("/messages", (req, res) => {
  const { sender, message } = req.body;

  if (!sender || !message) {
    return res.status(400).json({
      error: "Sender and message are required"
    });
  }

  const newMessage = {
    id: messages.length + 1,
    sender,
    message,
    date: new Date()
  };

  messages.push(newMessage);

  res.status(201).json({
    success: true,
    data: newMessage
  });
});

// Get all messages
app.get("/messages", (req, res) => {
  res.json(messages);
});

// Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
