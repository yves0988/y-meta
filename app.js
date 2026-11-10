
const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");
const cameraBtn = document.getElementById("cameraBtn");
const micBtn = document.getElementById("micBtn");

const joinScreen = document.getElementById("joinScreen");
const callScreen = document.getElementById("callScreen");

const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

const status = document.getElementById("status");
const callStatus = document.getElementById("callStatus");

let room = null;
let cameraOn = true;
let micOn = true;

const API_URL = "http://localhost:3000";

joinBtn.addEventListener("click", joinCall);
leaveBtn.addEventListener("click", leaveCall);

async function joinCall() {
  const username =
    document.getElementById("username").value.trim();

  const roomName =
    document.getElementById("roomName").value.trim();

  if (!username || !roomName) {
    status.textContent = "Enter your name and call room.";
    return;
  }

  joinBtn.disabled = true;
  status.textContent = "Connecting...";

  try {
    const response = await fetch(`${API_URL}/get-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identity: username,
        room: roomName
      })
    });

    if (!response.ok) {
      throw new Error("Unable to get call access.");
    }

    const data = await response.json();

    const { Room, RoomEvent, Track } = LivekitClient;

    room = new Room({
      adaptiveStream: true,
      dynacast: true
    });

    room.on(RoomEvent.TrackSubscribed,
      (track, publication, participant) => {
        const element = track.attach();

        if (track.kind === Track.Kind.Video) {
          element.dataset.participant = participant.identity;
          remoteVideos.appendChild(element);
        } else if (track.kind === Track.Kind.Audio) {
          document.body.appendChild(element);
        }
      }
    );

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach(element => element.remove());
    });

    room.on(RoomEvent.Disconnected, () => {
      callStatus.textContent = "Call disconnected.";
    });

    await room.connect(data.serverUrl, data.token);

    await room.localParticipant.enableCameraAndMicrophone();

    const publications =
      room.localParticipant.videoTrackPublications;

    publications.forEach(publication => {
      if (publication.track) {
        localVideo.srcObject =
          new MediaStream(publication.track.mediaStreamTrack);
      }
    });

    joinScreen.classList.add("hidden");
    callScreen.classList.remove("hidden");

    callStatus.textContent = "Connected! Waiting for your friend...";

    room.on(RoomEvent.ParticipantConnected, participant => {
      callStatus.textContent =
        participant.identity + " joined the call!";
    });

    room.on(RoomEvent.ParticipantDisconnected, participant => {
      callStatus.textContent =
        participant.identity + " left the call.";
    });

  } catch (error) {
    console.error(error);
    status.textContent = error.message;
    if (room) {
      await room.disconnect();
      room = null;
    }
  } finally {
    joinBtn.disabled = false;
  }
}

cameraBtn.addEventListener("click", async () => {
  if (!room) return;

  cameraOn = !cameraOn;

  await room.localParticipant.setCameraEnabled(cameraOn);

  cameraBtn.textContent = cameraOn
    ? "Turn Camera Off"
    : "Turn Camera On";
});

micBtn.addEventListener("click", async () => {
  if (!room) return;

  micOn = !micOn;

  await room.localParticipant.setMicrophoneEnabled(micOn);

  micBtn.textContent = micOn
    ? "Mute Microphone"
    : "Unmute Microphone";
});

async function leaveCall() {
  if (room) {
    await room.disconnect();
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
