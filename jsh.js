
import React, { useState } from "react";

import {
  LiveKitRoom,
  VideoConference
} from "@livekit/components-react";

import "@livekit/components-styles";

const API = "https://your-y-meta-api.com";

function VideoRoom({ token, serverUrl }) {
  return (
    <div style={{ height: "90vh" }}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={() => {
          window.location.href = "/";
        }}
        style={{ height: "100%" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

export default function App() {
  const [phone, setPhone] = useState("");
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roomFromUrl =
    window.location.pathname.match(/^\/call\/([a-f0-9-]+)$/i)?.[1];

  async function startCall() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API + "/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setCall(data);

    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  async function joinCall() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API + "/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room: roomFromUrl
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setCall(data);

    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  if (call?.token) {
    return (
      <VideoRoom
        token={call.token}
        serverUrl={call.serverUrl}
      />
    );
  }

  return (
    <main className="app">
      <div className="logo">Y META</div>

      {roomFromUrl ? (
        <>
          <h1>Incoming video invitation</h1>
          <p>You can join without installing Y Meta.</p>

          <button onClick={joinCall} disabled={loading}>
            {loading ? "Connecting..." : "Join Video Call"}
          </button>
        </>
      ) : (
        <>
          <h1>Connect with anyone</h1>

          <p>
            Make video calls to friends and family.
          </p>

          <input
            type="tel"
            placeholder="+2507XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button onClick={startCall} disabled={loading}>
            {loading ? "Starting..." : "Start Video Call"}
          </button>
        </>
      )}

      {call?.inviteLink && (
        <div className="invitation">
          <h3>Invitation created</h3>
          <p>SMS sent: {call.smsSent ? "Yes" : "No"}</p>
          <a href={call.inviteLink}>
            Open invitation
          </a>
          <button
            onClick={() =>
              navigator.clipboard.writeText(call.inviteLink)
            }
          >
            Copy invitation link
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
