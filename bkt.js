const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "https://yves0988.github.io"
}));

app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Y-META backend is running!"
    });
});

// Example API endpoint
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Y-META is connected successfully!"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Y-META server running on port ${PORT}`);
});
