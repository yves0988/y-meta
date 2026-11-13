
 React, { useState } from "react";

 {
  LiveKitRoom,
  VideoConference
} from "@livekit/components-react";

 "@livekit/components-styles";

 API = "https://your-y-meta-api.com";

 VideoRoom({ token, serverUrl }) {
   (
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

   App() {
   [phone, setPhone] = useState("");
   [call, setCall] = useState();
   [loading, setLoading] = useState(false);
   [error, setError] = useState("");

   roomFromUrl =
    window.location.pathname.match(/^\/call\/([a-f0-9-]+)$/i)?.[1];

    startCall() {
    setLoading(true);
    setError("");

     {
       response =  fetch(API + "/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone })
      });

       data =  response.json();

       (!response.ok)   Error(data.error);

      setCall(data);

    }  (e) {
      setError(e.message);
    }

    setLoading(false);
  }

    joinCall() {
    setLoading(true);
    setError("");

     {
       response =  fetch(API + "/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room: roomFromUrl
        })
      });

       data =  response.json();

       (!response.ok)   Error(data.error);

      setCall(data);

    }  (e) {
      setError(e.message);
    }

    setLoading(false);
  }

   (call?.token) {
     (
      <VideoRoom
        token={call.token}
        serverUrl={call.serverUrl}
      />
    );
  }

   (
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
          <h1>Connect  anyone</h1>

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
