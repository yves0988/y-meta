
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import twilio from "twilio";
import { AccessToken } from "livekit-server-sdk";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.APP_URL
}));

app.use(express.json());

const calls = new Map();

const smsEnabled =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

const sms = smsEnabled
  ? twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  : null;

function validPhone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

async function createToken(room, identity) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity,
      ttl: "15m"
    }
  );

  token.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true
  });

  return await token.toJwt();
}

// Start a video call
app.post("/api/calls", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!validPhone(phone)) {
      return res.status(400).json({
        error: "Enter a valid international phone number."
      });
    }

    const room = crypto.randomUUID();

    const expiresAt = Date.now() + 30 * 60 * 1000;

    calls.set(room, { expiresAt });

    const token = await createToken(
      room,
      "caller-" + crypto.randomUUID()
    );

    const inviteLink =
      `${process.env.APP_URL}/call/${room}`;

    if (sms) {
      await sms.messages.create({
        body:
          `You have received a Y Meta video call invitation. ` +
          `Open this link to join: ${inviteLink}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
    }

    res.json({
      room,
      token,
      serverUrl: process.env.LIVEKIT_URL,
      inviteLink,
      smsSent: Boolean(sms)
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to create video call."
    });
  }
});

// Receiver requests permission to enter the room
app.post("/api/token", async (req, res) => {
  try {
    const { room } = req.body;

    const call = calls.get(room);

    if (!call || call.expiresAt < Date.now()) {
      calls.delete(room);

      return res.status(404).json({
        error: "This invitation has expired."
      });
    }

    const token = await createToken(
      room,
      "guest-" + crypto.randomUUID()
    );

    res.json({
      token,
      serverUrl: process.env.LIVEKIT_URL
    });

  } catch (error) {
    res.status(500).json({
      error: "Unable to join call."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "Y Meta server running" });
});

setInterval(() => {
  for (const [room, call] of calls) {
    if (call.expiresAt < Date.now()) {
      calls.delete(room);
    }
  }
}, 60000);

app.listen(process.env.PORT || 5000, () => {
  console.log("Y Meta server running");
});
