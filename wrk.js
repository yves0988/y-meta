
 currentUser = ;
 selectedUser = ;
 socket = ;

 authScreen = document.getElementById("authScreen");
 chatScreen = document.getElementById("chatScreen");

 usernameInput = document.getElementById("username");
 passwordInput = document.getElementById("password");

 authError = document.getElementById("authError");
 chatError = document.getElementById("chatError");

 usersList = document.getElementById("usersList");
 messagesBox = document.getElementById("messages");
 chatTitle = document.getElementById("chatTitle");

 messageInput = document.getElementById("messageInput");

// Send requests to our backend
 api(url, options = {}) {
   response =  fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

   data =  response.json();

   (!response.ok) {
      Error(data.error || "Something went wrong");
  }

   data;
}

// LOGIN
document.getElementById("loginBtn").onclick =  () => {
   {
    authError.textContent = "";

     api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });

     startChat();

  }  (error) {
    authError.textContent = error.message;
  }
};

// REGISTER
document.getElementById("registerBtn").onclick =  () => {
   {
    authError.textContent = "";

     api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });

     startChat();

  }  (error) {
    authError.textContent = error.message;
  }
};

// START THE CHAT APPLICATION
 startChat() {
  currentUser =  api("/api/me");

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
     (
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

   loadUsers();
}

// LOAD USERS
 loadUsers() {
   users =  api("/api/users");

  usersList.replaceChildren();

  users.forEach(user => {
     button = document.createElement("button");

    button.className = "user";
    button.textContent = user.username;

    button.onclick = () => selectUser(user, button);

    usersList.appendChild(button);
  });
}

// SELECT A USER
 selectUser(user, button) {
  selectedUser = user;

  document.querySelectorAll(".user").forEach(item => {
    item.classList.remove("active");
  });

  button.classList.add("active");

  chatTitle.textContent = "Chat with " + user.username;
  messagesBox.replaceChildren();
  chatError.textContent = "";

   {
     history =  api(
      "/api/messages/" + encodeURIComponent(user.id)
    );

    // Ignore an old request if another conversation was selected
     (selectedUser.id !== user.id) ;

    history.forEach(displayMessage);

  }  (error) {
    chatError.textContent = error.message;
  }
}

// DISPLAY A MESSAGE
 displayMessage(message) {
   div = document.createElement("div");

  div.className = "message";

   (message.sender_id === currentUser.id) {
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

   (!selectedUser || !socket?.connected) {
    chatError.textContent = "Select a user and connect first.";
    ;
  }

   message = messageInput.value.trim();

   (!message) ;

  chatError.textContent = "";

  socket.emit("send_message", {
    receiverId: selectedUser.id,
    message: message
  }, (result) => {
     (result?.error) {
      chatError.textContent = result.error;
    }  {
      messageInput.value = "";
      messageInput.focus();
    }
  });
};

// LOGOUT
document.getElementById("logoutBtn").onclick =  () => {
   {
     api("/api/logout", {
      method: "POST"
    });

     (socket) socket.disconnect();

    currentUser = ;
    selectedUser = ;

    chatScreen.hidden = true;
    authScreen.hidden = false;

    usernameInput.value = "";
    passwordInput.value = "";
    usersList.replaceChildren();
    messagesBox.replaceChildren();

  }  (error) {
    chatError.textContent = error.message;
  }
};

// CHECK IF USER IS ALREADY LOGGED IN
  checkLogin() {
   {
     api("/api/me");
     startChat();
  }  (error) {
    authScreen.hidden = false;
    chatScreen.hidden = true;
  }
}

checkLogin();
