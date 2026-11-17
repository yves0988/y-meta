const socket = io();

const nameInput = document.getElementById("userName");
const roomInput = document.getElementById("roomCode");
const joinButton = document.getElementById("joinCall");
const leaveButton = document.getElementById("leaveCall");
const statusText = document.getElementById("status");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream = null;
let peer = null;
let joined = false;

document.getElementById("generateCode").addEventListener("click", () => {
  roomInput.value = String(Math.floor(100000 + Math.random() * 900000));
  statusText.textContent = "Share this room code with the other person.";
});

function makePeer(isInitiator, otherUserId) {
  peer = new SimplePeer({
    initiator: isInitiator,
    trickle: false,
    stream: localStream,
    config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    }
  });

  peer.on("signal", (signal) => {
    socket.emit("signal", { targetId: otherUserId, signal });
  });

  peer.on("stream", (stream) => {
    remoteVideo.srcObject = stream;
    statusText.textContent = "Call connected.";
  });

  peer.on("error", (error) => {
    console.error("Peer connection error:", error);
    statusText.textContent = "Call connection failed. Check network and server.";
  });

  peer.on("close", () => {
    remoteVideo.srcObject = null;
  });
}

joinButton.addEventListener("click", async () => {
  const userName = nameInput.value.trim();
  const roomId = roomInput.value.trim();

  if (!userName || !/^\d{4,12}$/.test(roomId)) {
    statusText.textContent = "Enter your name and a 4–12 digit room code.";
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    statusText.textContent = "Camera needs localhost or an HTTPS website.";
    return;
  }

  if (typeof SimplePeer === "undefined") {
    statusText.textContent = "Call library did not load. Check your internet.";
    return;
  }

  joinButton.disabled = true;
  statusText.textContent = "Requesting camera and microphone permission...";

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    localVideo.srcObject = localStream;

    socket.emit("join-room", { roomId, userName }, (result) => {
      if (!result?.ok) {
        stopCall();
        joinButton.disabled = false;
        statusText.textContent = result?.error || "Could not join the room.";
        return;
      }

      joined = true;
      leaveButton.disabled = false;
      statusText.textContent = `Joined room ${roomId}. Waiting for the other person...`;
    });
  } catch (error) {
    console.error(error);
    stopCall();
    joinButton.disabled = false;
    statusText.textContent = "Camera/mic permission failed. Allow access and try again.";
  }
});

// The person already in the room starts the connection.
socket.on("peer-joined", ({ userId, userName }) => {
  if (peer || !localStream) return;

  statusText.textContent = `${userName} joined. Connecting...`;
  makePeer(true, userId);
});

// The joining person receives the first signal and responds.
socket.on("signal", ({ from, signal }) => {
  if (!peer) makePeer(false, from);
  peer.signal(signal);
});

socket.on("peer-left", () => {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  remoteVideo.srcObject = null;
  statusText.textContent = "The other person left the call.";
});

function stopCall() {
  if (peer) {
    peer.destroy();
    peer = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
}

leaveButton.addEventListener("click", () => {
  if (joined) socket.emit("leave-room");
  joined = false;
  stopCall();

  leaveButton.disabled = true;
  joinButton.disabled = false;
  statusText.textContent = "Call ended.";
});
