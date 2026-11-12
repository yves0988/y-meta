
<!DOCTYPE html>
<html>
<head>
  <title>Y Meta Video Call</title>
  <script src="https://meet.jit.si/external_api.js"></script>
</head>
<body>

<h2>Y Meta Video Calling</h2>

<input
  id="phone"
  type="tel"
  placeholder="Enter phone number"
/>

<button onclick="startCall()">
  Start Video Call
</button>

<div id="video" style="width:100%;height:600px"></div>

<script>
function startCall() {

  const phone = document.getElementById("phone").value;

  if (!phone) {
    alert("Enter a phone number");
    return;
  }

  // Create a unique video room
  const room = "YMeta-" +
    Math.random().toString(36).substring(2, 12);

  // Create invitation link
  const link = "https://meet.jit.si/" + room;

  // Start video call for the caller
  const api = new JitsiMeetExternalAPI(
    "meet.jit.si",
    {
      roomName: room,
      parentNode: document.querySelector("#video"),
      width: "100%",
      height: 600
    }
  );

  // Prepare SMS invitation
  const message =
    "Join my Y Meta video call: " + link;

  const sms =
    "sms:" + phone +
    "?body=" + encodeURIComponent(message);

  // Open phone messaging app
  window.location.href = sms;
}
</script>

</body>
</html>
