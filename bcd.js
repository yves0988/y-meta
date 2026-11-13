
 express = require("express");

 app = express();

app.use(express.json());

// Receive a message
app.post("/send-message", (req, res) => {
 message = req.body.message;

  console.log("New message:", message);

  res.json({
    success: true,
    reply: "Message received successfully!"
  });
});

app.listen(3000, () => {
  console.log("Backend is running on port 3000");
});
