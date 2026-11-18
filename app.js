const socket = io();

const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");
const cameraBtn = document.getElementById("cameraBtn");
const micBtn = document.getElementById("micBtn");

const joinScreen = document.getElementById("joinScreen");
const callScreen = document.getElementById("callScreen");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusEl = document.getElementById("status");
const callStatus = document.getElementById("callStatus");
const callHistory = document.getElementById("callHistory");
const feed = document.getElementById("feed");

const callNameInput = document.getElementById("callName");
const callRoomInput = document.getElementById("callRoom");
const messageNameInput = document.getElementById("messageName");
const messageText = document.getElementById("messageText");

let localStream = null;
const peers = {};
let currentRoom = null;
let myName = "";
let cameraOn = true;
let micOn = true;
let joining = false;

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => page.classList.add("hidden"));
  document.getElementById(pageId)?.classList.remove("hidden");
}

function publishPost() {
  const input = document.getElementById("postText");
  const text = input.value.trim();
  if (!text) return;

  const item = document.createElement("div");
  item.className = "feed-item";
  const author = document.createElement("strong");
  author.textContent = "You";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  item.append(author, paragraph);
  feed.prepend(item);
  input.value = "";
}

function sendMessage() {
  const name = messageNameInput.value.trim();
  const text = messageText.value.trim();
  if (!name || !text) return;

  const result = document.createElement("div");
  result.className = "message-item";
  const author = document.createElement("strong");
  author.textContent = name;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  result.append(author, paragraph);
  document.getElementById("messageResults").appendChild(result);
  messageNameInput.value = "";
  messageText.value = "";
}

function importContacts() {
  const contacts = [
    { name: "Aline", email: "aline@example.com", phone: "+250788000001" },
    { name: "Eric", email: "eric@example.com", phone: "+250788000002" },
    { name: "Maya", email: "maya@example.com", phone: "+250788000003" }
  ];

  const container = document.getElementById("contactResults");
  container.replaceChildren();
  contacts.forEach((person) => {
    const card = document.createElement("div");
    card.className = "contact-card";
    const name = document.createElement("strong");
    name.textContent = person.name;
    const email = document.createElement("p");
    email.textContent = person.email;
    const phone = document.createElement("p");
    phone.textContent = person.phone;
    card.append(name, email, phone);
    container.appendChild(card);
  });
}

function searchFriend() {
  const query = document.getElementById("friendSearch").value.trim().toLowerCase();
  document.querySelectorAll(".contact-card").forEach((card) => {
    card.style.display = card.textContent.toLowerCase().includes(query) ? "block" : "none";
  });
}

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const status = document.getElementById("profileStatus");
  status.textContent = name && email
    ? `Profile saved for ${name} (${email})`
    : "Please enter your name and email.";
}

function addCallToHistory(name) {
  const item = document.createElement("div");
  item.className = "call-item";
  item.textContent = `${new Date().toLocaleTimeString()} - ${name}`;
  callHistory.prepend(item);
}

async function startLocalCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    statusEl.textContent = "Camera/microphone require HTTPS or localhost.";
    return false;
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    await localVideo.play();
    statusEl.textContent = "Camera and microphone are ready.";
    return true;
  } catch (error) {
    console.error("Could not access camera or microphone:", error);
    statusEl.textContent = "Allow camera and microphone access, then try again.";
    return false;
  }
}

function createPeer(remoteUserId, initiator) {
  const peer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    }
  });

  peer.on("signal", (signal) => {
    socket.emit("signal", { targetId: remoteUserId, signal });
  });

  peer.on("stream", (stream) => {
    remoteVideo.srcObject = stream;
    remoteVideo.play().catch((error) => console.error("Remote video playback failed:", error));
    callStatus.textContent = "Connected face to face.";
  });

  peer.on("error", (error) => {
    console.error("WebRTC error:", error);
    callStatus.textContent = "Call connection failed. Check your network and try again.";
  });

  peer.on("close", () => {
    delete peers[remoteUserId];
  });

  return peer;
}

async function joinCall() {
  if (joining) return;
  joining = true;
  joinBtn.disabled = true;

  myName = callNameInput.value.trim();
  currentRoom = callRoomInput.value.trim();
  if (!myName || !currentRoom) {
    statusEl.textContent = "Please enter your name and room.";
    joining = false;
    joinBtn.disabled = false;
    return;
  }

  if (!socket.connected) {
    statusEl.textContent = "Connecting to the call server...";
    joining = false;
    joinBtn.disabled = false;
    return;
  }

  const cameraReady = await startLocalCamera();
  if (!cameraReady) {
    joining = false;
    joinBtn.disabled = false;
    return;
  }

  joinScreen.classList.add("hidden");
  callScreen.classList.remove("hidden");
  statusEl.textContent = "Joining call room...";
  callStatus.textContent = "Waiting for another person to join the same room...";
  socket.emit("join-room", { roomId: currentRoom, userName: myName });
  joining = false;
}

function leaveCall() {
  if (currentRoom) socket.emit("leave-room");
  Object.values(peers).forEach((peer) => peer.destroy());
  Object.keys(peers).forEach((id) => delete peers[id]);

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  currentRoom = null;
  cameraOn = true;
  micOn = true;
  cameraBtn.textContent = "Turn Camera Off";
  micBtn.textContent = "Mute Microphone";
  joinBtn.disabled = false;
  callScreen.classList.add("hidden");
  joinScreen.classList.remove("hidden");
  statusEl.textContent = "Call ended";
  callStatus.textContent = "Call ended";
}

joinBtn.addEventListener("click", joinCall);
leaveBtn.addEventListener("click", leaveCall);

cameraBtn.addEventListener("click", () => {
  const track = localStream?.getVideoTracks()[0];
  if (!track) return;
  cameraOn = !cameraOn;
  track.enabled = cameraOn;
  cameraBtn.textContent = cameraOn ? "Turn Camera Off" : "Turn Camera On";
});

micBtn.addEventListener("click", () => {
  const track = localStream?.getAudioTracks()[0];
  if (!track) return;
  micOn = !micOn;
  track.enabled = micOn;
  micBtn.textContent = micOn ? "Mute Microphone" : "Unmute Microphone";
});

socket.on("connect", () => {
  console.log("Connected to call server:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Call server connection failed:", error);
  statusEl.textContent = "Could not connect to the call server. Start server.js and reload.";
});

socket.on("room-joined", ({ roomId, userName }) => {
  statusEl.textContent = `Connected to room: ${roomId}`;
  callStatus.textContent = `You joined as ${userName}. Waiting for another person...`;
  addCallToHistory(userName);
});

socket.on("user-connected", ({ userId, userName }) => {
  if (!peers[userId] && localStream) peers[userId] = createPeer(userId, true);
  callStatus.textContent = `${userName} joined. Connecting call...`;
});

socket.on("signal", ({ from, signal }) => {
  if (!peers[from] && localStream) peers[from] = createPeer(from, false);
  if (peers[from]) peers[from].signal(signal);
});

socket.on("user-disconnected", ({ userId }) => {
  if (peers[userId]) {
    peers[userId].destroy();
    delete peers[userId];
  }
  remoteVideo.srcObject = null;
  callStatus.textContent = "The other participant left the call.";
});

socket.on("call-error", (message) => {
  statusEl.textContent = message;
});

showPage("home");
