
const socket = io();

let myId = null;
let peer = null;
let localStream = null;
let currentCall = null;

const nameInput = document.getElementById("userName");
const targetInput = document.getElementById("targetId");
const statusText = document.getElementById("status");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

document.getElementById("register").onclick = () => {
  socket.emit("register", nameInput.value.trim());
};

socket.on("registered", (data) => {
  myId = data.id;
  document.getElementById("myId").textContent = myId;
  statusText.textContent = "Connected. You can now receive calls.";
});

async function getCamera() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.srcObject = localStream;
  }

  return localStream;
}

function createPeer(targetId, initiator) {
  peer = new RTCPeerConnection(servers);
  currentCall = targetId;

  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  peer.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peer.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("signal", {
        targetId,
        signal: { candidate: event.candidate }
      });
    }
  };

  if (initiator) {
    peer.createOffer()
      .then(offer => peer.setLocalDescription(offer))
      .then(() => {
        socket.emit("signal", {
          targetId,
          signal: { description: peer.localDescription }
        });
      })
      .catch(showError);
  }
}

document.getElementById("call").onclick = async () => {
  const targetId = targetInput.value.trim();

  if (!myId || !targetId || targetId === myId) {
    statusText.textContent = "Register and enter a valid user ID.";
    return;
  }

  try {
    await getCamera();

    currentCall = targetId;

    socket.emit("call-user", { targetId });

    statusText.textContent = "Calling...";
  } catch (error) {
    showError(error);
  }
};

socket.on("incoming-call", async ({ from, name }) => {
  currentCall = from;

  statusText.textContent = name + " is calling you.";

  const accepted = confirm(
    name + " is calling. Do you want to accept?"
  );

  if (!accepted) {
    socket.emit("reject-call", { targetId: from });
    currentCall = null;
    return;
  }

  try {
    await getCamera();

    createPeer(from, false);

    socket.emit("accept-call", { targetId: from });

    statusText.textContent = "Call accepted. Connecting...";
  } catch (error) {
    showError(error);
    socket.emit("end-call", { targetId: from });
  }
});

socket.on("call-accepted", async ({ from }) => {
  try {
    if (from !== currentCall) return;

    await getCamera();

    createPeer(from, true);

    statusText.textContent = "Connecting video call...";
  } catch (error) {
    showError(error);
  }
});

socket.on("signal", async ({ from, signal }) => {
  try {
    if (!peer) return;
    if (from !== currentCall) return;

    if (signal.description) {
      await peer.setRemoteDescription(signal.description);

      if (signal.description.type === "offer") {
        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit("signal", {
          targetId: from,
          signal: { description: peer.localDescription }
        });
      }
    }

    if (signal.candidate) {
      await peer.addIceCandidate(signal.candidate);
    }

  } catch (error) {
    showError(error);
  }
});

socket.on("call-rejected", () => {
  statusText.textContent = "Your call was rejected.";
  cleanup(false);
});

socket.on("call-ended", () => {
  statusText.textContent = "Call ended by the other user.";
  cleanup(false);
});

document.getElementById("end").onclick = () => {
  if (currentCall) {
    socket.emit("end-call", { targetId: currentCall });
  }

  cleanup(true);
  statusText.textContent = "Call ended.";
};

function cleanup(stopCamera = true) {
  if (peer) {
    peer.close();
    peer = null;
  }

  if (stopCamera && localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  currentCall = null;
}

function showError(error) {
  console.error(error);
  statusText.textContent = error.message || "Call failed.";
}
