
 express from "express";
 cors from "cors";
 dotenv from "dotenv";
 crypto from "crypto";
 twilio from "twilio";
 { AccessToken } from "livekit-server-sdk";

dotenv.config();

 app = express();

app.use(cors({
  origin: process.env.APP_URL
}));

app.use(express.json());

 calls =  Map();

 smsEnabled =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

 sms = smsEnabled
  ? twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  : ;

 validPhone(phone) {
   /^\+[1-9]\d{7,14}$/.test(phone);
}

  createToken(room, identity) {
   token =  AccessToken(
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

    token.toJwt();
}

// Start a video call
app.post("/api/calls",  (req, res) => {
   {
     { phone } = req.body;

     (!validPhone(phone)) {
       res.status(400).json({
        error: "Enter a valid international phone number."
      });
    }

     room = crypto.randomUUID();

     expiresAt = Date.now() + 30 * 60 * 1000;

    calls.set(room, { expiresAt });

     token =  createToken(
      room,
      "caller-" + crypto.randomUUID()
    );

     inviteLink =
      `${process.env.APP_URL}/call/${room}`;

     (sms) {
       sms.messages.create({
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

  }  (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to create video call."
    });
  }
});

// Receiver requests permission to enter the room
app.post("/api/token",  (req, res) => {
   {
     { room } = req.body;

     call = calls.get(room);

     (!call || call.expiresAt < Date.now()) {
      calls.delete(room);

       res.status(404).json({
        error: "This invitation has expired."
      });
    }

     token =  createToken(
      room,
      "guest-" + crypto.randomUUID()
    );

    res.json({
      token,
      serverUrl: process.env.LIVEKIT_URL
    });

  }  (error) {
    res.status(500).json({
      error: "Unable to join call."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "Y Meta server running" });
});

setInterval(() => {
   ( [room, call] of calls) {
     (call.expiresAt < Date.now()) {
      calls.delete(room);
    }
  }
}, 60000);

app.listen(process.env.PORT || 5000, () => {
  console.log("Y Meta server running");
});
