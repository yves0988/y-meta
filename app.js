
const socket = io();

const nameInput = document.getElementById("userName");
const connectButton = document.getElementById("connectButton");
const loginSection = document.getElementById("loginSection");
const callSection = document.getElementById("callSection");

const usersList = document.getElementById("usersList");
const statusText = document.getElementById("status");
const myIdText = document.getElementById("myId");

const incomingCall = document.getElementById("incomingCall");
const callerName = document.getElementById("callerName");

const acceptButton = document.getElementById("acceptButton");
const rejectButton = document.getElementById("rejectButton");
const endButton = document.getElementById("endButton");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let myId = null;
let currentCall = null;
let pendingCall = null;
let peer = null;
let localStream = null;
let remoteDescriptionSet = false;
let queuedCandidates = [];

let onlineUsers = [];

const rtcConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }

    // Add your TURN server credentials here
    // for reliable connections across restrictive networks.
  ]
};

// CONNECT WITHOUT PASSWORD OR LOGIN

connectButton.addEventListener("click", () => {

  const name = nameInput.value.trim();

  if (!name) {
    statusText.textContent = "Please enter your name.";
    return;
  }

  connectButton.disabled = true;

  socket.emit("register", name, (result) => {

    connectButton.disabled = false;

    if (!result?.ok) {
      statusText.textContent =
        result?.error || "Connection failed.";
      return;
    }

    myId = result.id;

    myIdText.textContent = myId;

    loginSection.hidden = true;
    callSection.hidden = false;

    statusText.textContent =
      "Connected. You can now call people online.";

  });

});

socket.on("connect", () => {
  if (myId) {
    statusText.textContent =
      "Connection interrupted. Please reconnect.";
  }
});

socket.on("disconnect", () => {
  if (myId) {
    statusText.textContent =
      "Disconnected from server.";
    cleanup();
  }
});

// DISPLAY ONLINE USERS

socket.on("online-users", (users) => {

  onlineUsers = users;

  usersList.replaceChildren();

  const others = users.filter(user => user.id !== myId);

  if (others.length === 0) {
    usersList.textContent = "No other users online.";
    return;
  }

  others.forEach(user => {

    const item = document.createElement("div");
    item.className = "userItem";

    const name = document.createElement("span");
    name.textContent = user.name;

    const button = document.createElement("button");
    button.textContent = "Call";

    button.addEventListener("click", () => {
      startCall(user.id);
    });

    item.append(name, button);
    usersList.appendChild(item);

  });

});

// CAMERA AND MICROPHONE

async function getCamera() {

  if (localStream) {
    return localStream;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Camera requires HTTPS or localhost."
    );
  }

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;

  return localStream;
}

// CREATE WEBRTC CONNECTION

function createPeer(targetId) {

  if (peer) {
    peer.close();
  }

  queuedCandidates = [];
  remoteDescriptionSet = false;

  peer = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  peer.ontrack = async (event) => {

    remoteVideo.srcObject = event.streams[0];

    try {
      await remoteVideo.play();
    } catch (error) {
      console.log("Remote video playback needs user interaction.");
    }

    statusText.textContent = "Video call connected.";

  };

  peer.onicecandidate = (event) => {

    if (event.candidate && currentCall === targetId) {

      socket.emit("signal", {
        targetId,
        signal: {
          candidate: event.candidate
        }
      });

    }

  };

  peer.onconnectionstatechange = () => {

    if (!peer) return;

    const state = peer.connectionState;

    if (state === "connected") {
      statusText.textContent = "Call connected successfully.";
    }

    if (state === "failed") {
      statusText.textContent =
        "Connection failed. A TURN server may be required.";
    }

    if (state === "disconnected") {
      statusText.textContent = "Connection interrupted.";
    }

  };

  return peer;
}

// START A CALL

async function startCall(targetId) {

  if (currentCall || pendingCall) {
    statusText.textContent = "Finish your current call first.";
    return;
  }

  try {

    statusText.textContent = "Preparing camera and microphone...";

    await getCamera();

    currentCall = targetId;

    statusText.textContent = "Calling...";

    socket.emit("call-user", { targetId }, (result) => {

      if (!result?.ok) {

        statusText.textContent =
          result?.error || "Unable to call this person.";

        cleanup();
        return;

      }

      endButton.disabled = false;

    });

  } catch (error) {

    statusText.textContent = error.message;
    cleanup();

  }

}

// INCOMING CALL

socket.on("incoming-call", ({ from, name }) => {

  if (currentCall || pendingCall) {

    socket.emit("reject-call", { targetId: from });
    return;

  }

  pendingCall = {
    id: from,
    name
  };

  callerName.textContent = name + " is calling you.";

  incomingCall.hidden = false;

  statusText.textContent = "Incoming call from " + name;

  acceptButton.disabled = false;
  rejectButton.disabled = false;

});

// ACCEPT CALL

acceptButton.addEventListener("click", async () => {

  if (!pendingCall) return;

  const caller = pendingCall;

  acceptButton.disabled = true;

  try {

    await getCamera();

    currentCall = caller.id;

    createPeer(caller.id);

    socket.emit("accept-call", {
      targetId: caller.id
    });

    pendingCall = null;
    incomingCall.hidden = true;

    endButton.disabled = false;

    statusText.textContent = "Connecting to caller...";

  } catch (error) {

    socket.emit("reject-call", {
      targetId: caller.id
    });

    statusText.textContent = error.message;

    cleanup();

  } finally {

    acceptButton.disabled = false;

  }

});

// REJECT CALL

rejectButton.addEventListener("click", () => {

  if (!pendingCall) return;

  socket.emit("reject-call", {
    targetId: pendingCall.id
  });

  pendingCall = null;
  incomingCall.hidden = true;

  statusText.textContent = "Call rejected.";

});

// CALL ACCEPTED BY OTHER PERSON

socket.on("call-accepted", async ({ from }) => {

  if (currentCall !== from) return;

  try {

    await getCamera();

    const connection = createPeer(from);

    const offer = await connection.createOffer();

    await connection.setLocalDescription(offer);

    socket.emit("signal", {
      targetId: from,
      signal: {
        description: connection.localDescription
      }
    });

    statusText.textContent = "Connecting video...";

  } catch (error) {

    statusText.textContent = error.message;

    socket.emit("end-call");
    cleanup();

  }

});

// EXCHANGE WEBRTC SIGNALS

socket.on("signal", async ({ from, signal }) => {

  if (!peer || currentCall !== from) return;

  try {

    if (signal.description) {

      await peer.setRemoteDescription(
        signal.description
      );

      remoteDescriptionSet = true;

      if (signal.description.type === "offer") {

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit("signal", {
          targetId: from,
          signal: {
            description: peer.localDescription
          }
        });

      }

      for (const candidate of queuedCandidates) {
        await peer.addIceCandidate(candidate);
      }

      queuedCandidates = [];

    }

    if (signal.candidate) {

      const candidate =
        new RTCIceCandidate(signal.candidate);

      if (remoteDescriptionSet) {
        await peer.addIceCandidate(candidate);
      } else {
        queuedCandidates.push(candidate);
      }

    }

  } catch (error) {

    console.error("WebRTC signaling error:", error);

    statusText.textContent =
      "Could not establish the video connection.";

  }

});

// CALL REJECTED

socket.on("call-rejected", () => {

  cleanup();

  statusText.textContent = "The person rejected your call.";

});

// CALL ENDED

socket.on("call-ended", () => {

  cleanup();

  statusText.textContent = "The other person ended the call.";

});

// END CALL

endButton.addEventListener("click", () => {

  if (currentCall) {
    socket.emit("end-call");
  }

  cleanup();

  statusText.textContent = "You ended the call.";

});

// CLEANUP

function cleanup() {

  if (peer) {
    peer.ontrack = null;
    peer.onicecandidate = null;
    peer.onconnectionstatechange = null;
    peer.close();
    peer = null;
  }

  if (localStream) {

    localStream.getTracks().forEach(track => {
      track.stop();
    });

    localStream = null;

  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  currentCall = null;
  pendingCall = null;

  queuedCandidates = [];
  remoteDescriptionSet = false;

  incomingCall.hidden = true;
  endButton.disabled = true;

}
