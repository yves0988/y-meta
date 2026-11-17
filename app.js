const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");
const cameraBtn = document.getElementById("cameraBtn");
const micBtn = document.getElementById("micBtn");

const joinScreen = document.getElementById("joinScreen");
const callScreen = document.getElementById("callScreen");
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");
const statusEl = document.getElementById("status");
const callStatus = document.getElementById("callStatus");

let room = null;
let cameraOn = true;
let micOn = true;

// Iyi URL ikora gusa niba backend iri kuri computer yawe.
const API_URL = "http://localhost:3000";

if (
  !joinBtn || !leaveBtn || !cameraBtn || !micBtn ||
  !joinScreen || !callScreen || !localVideo || !remoteVideos ||
  !statusEl || !callStatus
) {
  console.error("One or more call-page HTML elements are missing.");
} else {
  joinBtn.addEventListener("click", joinCall);
  leaveBtn.addEventListener("click", leaveCall);

  cameraBtn.addEventListener("click", async () => {
    if (!room) return;

    try {
      cameraOn = !cameraOn;
      await room.localParticipant.setCameraEnabled(cameraOn);
      cameraBtn.textContent = cameraOn ? "Turn Camera Off" : "Turn Camera On";
    } catch (error) {
      console.error("Could not change camera state:", error);
    }
  });

  micBtn.addEventListener("click", async () => {
    if (!room) return;

    try {
      micOn = !micOn;
      await room.localParticipant.setMicrophoneEnabled(micOn);
      micBtn.textContent = micOn ? "Mute Microphone" : "Unmute Microphone";
    } catch (error) {
      console.error("Could not change microphone state:", error);
    }
  });
}

async function joinCall() {
  const username = document.getElementById("username")?.value.trim();
  const roomName = document.getElementById("roomName")?.value.trim();

  if (!username || !roomName) {
    statusEl.textContent = "Enter your name and call room.";
    return;
  }

  if (!window.LivekitClient) {
    statusEl.textContent = "LiveKit client library is not loaded.";
    return;
  }

  joinBtn.disabled = true;
  statusEl.textContent = "Connecting...";

  try {
    const response = await fetch(`${API_URL}/get-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: username, room: roomName })
    });

    if (!response.ok) {
      throw new Error("Unable to get call access. Check the backend.");
    }

    const data = await response.json();
    const { Room, RoomEvent, Track } = window.LivekitClient;

    room = new Room({ adaptiveStream: true, dynacast: true });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      const element = track.attach();

      if (track.kind === Track.Kind.Video) {
        element.dataset.participant = participant.identity;
        remoteVideos.appendChild(element);
      } else if (track.kind === Track.Kind.Audio) {
        document.body.appendChild(element);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((element) => element.remove());
    });

    room.on(RoomEvent.Disconnected, () => {
      callStatus.textContent = "Call disconnected.";
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      callStatus.textContent = `${participant.identity} joined the call!`;
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      callStatus.textContent = `${participant.identity} left the call.`;
    });

    await room.connect(data.serverUrl, data.token);
    await room.localParticipant.enableCameraAndMicrophone();

    room.localParticipant.videoTrackPublications.forEach((publication) => {
      if (publication.track) {
        publication.track.attach(localVideo);
      }
    });

    joinScreen.classList.add("hidden");
    callScreen.classList.remove("hidden");
    callStatus.textContent = "Connected! Waiting for your friend...";
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message || "Could not join the call.";

    if (room) {
      room.disconnect();
      room = null;
    }
  } finally {
    joinBtn.disabled = false;
  }
}

function leaveCall() {
  if (room) {
    room.disconnect();
    room = null;
  }

  localVideo.srcObject = null;
  remoteVideos.innerHTML = "";
  joinScreen.classList.remove("hidden");
  callScreen.classList.add("hidden");

  cameraOn = true;
  micOn = true;
  cameraBtn.textContent = "Turn Camera Off";
  micBtn.textContent = "Mute Microphone";
}
