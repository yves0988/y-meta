require("dotenv").config();

const express = require("express");
const path = require("path");
const twilio = require("twilio");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const requiredEnv = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_API_KEY_SID",
  "TWILIO_API_KEY_SECRET",
  "TWILIO_TWIML_APP_SID",
  "TWILIO_CALLER_ID"
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env`);
    process.exit(1);
  }
}

// Browser requests a short-lived access token from the server.
// Keep Twilio secrets on the server, never in the browser.
app.get("/token", (_req, res) => {
  const identity = `ymeta-${Math.random().toString(36).slice(2, 12)}`;

  const token = new twilio.jwt.AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { identity, ttl: 3600 }
  );

  token.addGrant(
    new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID
    })
  );

  res.json({ token: token.toJwt() });
});

// Twilio requests these instructions when the browser starts a call.
app.post("/voice", (req, res) => {
  const to = String(req.body.To || "").trim();

  // Require international E.164 format, e.g. +2507XXXXXXXX.
  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    return res
      .status(400)
      .type("text/plain")
      .send("Enter a valid phone number in international format, e.g. +2507XXXXXXXX.");
  }

  const response = new twilio.twiml.VoiceResponse();
  const dial = response.dial({
    callerId: process.env.TWILIO_CALLER_ID
  });

  dial.number(to);

  res.type("text/xml").send(response.toString());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Y-META server running at http://localhost:${port}`);
});
