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
let peers = {};
let currentRoom = null;
let myName = "";
let cameraOn = true;
let micOn = true;

function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => {
    page.classList.add("hidden");
  });

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.remove("hidden");
  }
}

function publishPost() {
  const text = document.getElementById("postText").value.trim();
  if (!text) return;

  const item = document.createElement("div");
  item.className = "feed-item";
  item.innerHTML = `<strong>You</strong><p>${text}</p>`;
  feed.prepend(item);

  document.getElementById("postText").value = "";
}

function sendMessage() {
  const name = messageNameInput.value.trim();
  const text = messageText.value.trim();

  if (!name || !text) return;

  const result = document.createElement("div");
  result.className = "message-item";
  result.innerHTML = `<strong>${name}</strong><p>${text}</p>`;
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
  container.innerHTML = "";

  contacts.forEach((person) => {
    const card = document.createElement("div");
    card.className = "contact-card";
    card.innerHTML = `
      <strong>${person.name}</strong>
      <p>${person.email}</p>
      <p>${person.phone}</p>
    `;
    container.appendChild(card);
  });
}

function searchFriend() {
  const query = document.getElementById("friendSearch").value.trim().toLowerCase();
  const contacts = document.querySelectorAll(".contact-card");
  contacts.forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) || !query ? "block" : "none";
  });
}

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const status = document.getElementById("profileStatus");

  if (!name || !email) {
    status.textContent = "Please enter your name and email.";
    return;
  }

  status.textContent = `Profile saved for ${name} (${email})`;
}

function addCallToHistory(name) {
  const item = document.createElement("div");
  item.className = "call-item";
  item.textContent = `${new Date().toLocaleTimeString()} - ${name}`;
  callHistory.prepend(item);
}

async function startLocalCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.srcObject = localStream;
    localVideo.play();
    statusEl.textContent = "Camera ready";
  } catch (error) {
    console.error("Could not access camera:", error);
    statusEl.textContent = "Camera access denied. Please allow camera/mic.";
  }
}

function createPeer(remoteUserId, initiator) {
  const peer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream
  });

  peer.on("signal", (signal) => {
    socket.emit("signal", {
      targetId: remoteUserId,
      signal
    });
  });

  peer.on("stream", (stream) => {
    remoteVideo.srcObject = stream;
    remoteVideo.play();
  });

  peer.on("close", () => {
    console.log("Peer closed:", remoteUserId);
  });

  return peer;
}

joinBtn.addEventListener("click", async () => {
  myName = callNameInput.value.trim();
  currentRoom = callRoomInput.value.trim();

  if (!myName || !currentRoom) {
    statusEl.textContent = "Please enter your name and room.";
    return;
  }

  await startLocalCamera();

  joinScreen.classList.add("hidden");
  callScreen.classList.remove("hidden");

  statusEl.textContent = "Connecting...";
  socket.emit("join-room", {
    roomId: currentRoom,
    userName: myName
  });
});

leaveBtn.addEventListener("click", () => {
  Object.values(peers).forEach((peer) => peer.destroy());
  peers = {};

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  callScreen.classList.add("hidden");
  joinScreen.classList.remove("hidden");
  statusEl.textContent = "Call ended";
  callStatus.textContent = "Call ended";
});

cameraBtn.addEventListener("click", () => {
  if (!localStream) return;

  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  cameraOn = !cameraOn;
  videoTrack.enabled = cameraOn;

  cameraBtn.textContent = cameraOn ? "Turn Camera Off" : "Turn Camera On";
});

micBtn.addEventListener("click", () => {
  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  micOn = !micOn;
  audioTrack.enabled = micOn;

  micBtn.textContent = micOn ? "Mute Microphone" : "Unmute Microphone";
});

socket.on("room-joined", ({ roomId, userId, userName }) => {
  statusEl.textContent = `Connected to room: ${roomId}`;
  callStatus.textContent = `You joined as ${userName}`;
  addCallToHistory(userName);
});

socket.on("user-connected", ({ userId, userName }) => {
  if (!peers[userId]) {
    peers[userId] = createPeer(userId, true);
  }

  callStatus.textContent = `${userName} joined the room`;
});

socket.on("signal", ({ from, signal }) => {
  if (!peers[from]) {
    peers[from] = createPeer(from, false);
  }

  peers[from].signal(signal);
});

socket.on("user-disconnected", ({ userId }) => {
  if (peers[userId]) {
    peers[userId].destroy();
    delete peers[userId];
  }

  callStatus.textContent = "A participant left the call";
});

showPage("home");
