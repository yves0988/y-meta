
let currentUser = null;
let selectedUser = null;
let socket = null;

const authScreen = document.getElementById("authScreen");
const chatScreen = document.getElementById("chatScreen");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const authError = document.getElementById("authError");
const chatError = document.getElementById("chatError");

const usersList = document.getElementById("usersList");
const messagesBox = document.getElementById("messages");
const chatTitle = document.getElementById("chatTitle");

const messageInput = document.getElementById("messageInput");

// Send requests to our backend
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

// LOGIN
document.getElementById("loginBtn").onclick = async () => {
  try {
    authError.textContent = "";

    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });

    await startChat();

  } catch (error) {
    authError.textContent = error.message;
  }
};

// REGISTER
document.getElementById("registerBtn").onclick = async () => {
  try {
    authError.textContent = "";

    await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });

    await startChat();

  } catch (error) {
    authError.textContent = error.message;
  }
};

// START THE CHAT APPLICATION
async function startChat() {
  currentUser = await api("/api/me");

  authScreen.hidden = true;
  chatScreen.hidden = false;

  socket = io();

  socket.on("connect_error", () => {
    chatError.textContent = "Connection problem. Refresh and try again.";
  });

  socket.on("connect", () => {
    chatError.textContent = "";
  });

  // Receive new messages
  socket.on("new_message", (message) => {
    if (
      selectedUser &&
      (
        (message.sender_id === selectedUser.id &&
         message.receiver_id === currentUser.id) ||
        (message.sender_id === currentUser.id &&
         message.receiver_id === selectedUser.id)
      )
    ) {
      displayMessage(message);
    }
  });

  await loadUsers();
}

// LOAD USERS
async function loadUsers() {
  const users = await api("/api/users");

  usersList.replaceChildren();

  users.forEach(user => {
    const button = document.createElement("button");

    button.className = "user";
    button.textContent = user.username;

    button.onclick = () => selectUser(user, button);

    usersList.appendChild(button);
  });
}

// SELECT A USER
async function selectUser(user, button) {
  selectedUser = user;

  document.querySelectorAll(".user").forEach(item => {
    item.classList.remove("active");
  });

  button.classList.add("active");

  chatTitle.textContent = "Chat with " + user.username;
  messagesBox.replaceChildren();
  chatError.textContent = "";

  try {
    const history = await api(
      "/api/messages/" + encodeURIComponent(user.id)
    );

    // Ignore an old request if another conversation was selected
    if (selectedUser.id !== user.id) return;

    history.forEach(displayMessage);

  } catch (error) {
    chatError.textContent = error.message;
  }
}

// DISPLAY A MESSAGE
function displayMessage(message) {
  const div = document.createElement("div");

  div.className = "message";

  if (message.sender_id === currentUser.id) {
    div.classList.add("mine");
  }

  // textContent prevents HTML from being executed
  div.textContent = message.message;

  messagesBox.appendChild(div);

  messagesBox.scrollTop = messagesBox.scrollHeight;
}

// SEND MESSAGE
document.getElementById("messageForm").onsubmit = (event) => {
  event.preventDefault();

  if (!selectedUser || !socket?.connected) {
    chatError.textContent = "Select a user and connect first.";
    return;
  }

  const message = messageInput.value.trim();

  if (!message) return;

  chatError.textContent = "";

  socket.emit("send_message", {
    receiverId: selectedUser.id,
    message: message
  }, (result) => {
    if (result?.error) {
      chatError.textContent = result.error;
    } else {
      messageInput.value = "";
      messageInput.focus();
    }
  });
};

// LOGOUT
document.getElementById("logoutBtn").onclick = async () => {
  try {
    await api("/api/logout", {
      method: "POST"
    });

    if (socket) socket.disconnect();

    currentUser = null;
    selectedUser = null;

    chatScreen.hidden = true;
    authScreen.hidden = false;

    usernameInput.value = "";
    passwordInput.value = "";
    usersList.replaceChildren();
    messagesBox.replaceChildren();

  } catch (error) {
    chatError.textContent = error.message;
  }
};

// CHECK IF USER IS ALREADY LOGGED IN
async function checkLogin() {
  try {
    await api("/api/me");
    await startChat();
  } catch (error) {
    authScreen.hidden = false;
    chatScreen.hidden = true;
  }
}

checkLogin();
