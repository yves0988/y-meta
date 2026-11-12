
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>My Messaging App</title>

  <link rel="stylesheet" href="style.css">
</head>
<body>

  <div class="container">

    <!-- LOGIN SCREEN -->
    <section id="authScreen" class="auth-box">

      <h1>My Chat App</h1>
      <p>Connect with your friends</p>

      <input
        id="username"
        placeholder="Username"
        autocomplete="username"
      >

      <input
        id="password"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
      >

      <button id="loginBtn">Login</button>

      <button id="registerBtn">
        Create Account
      </button>

      <p id="authError"></p>

    </section>

    <!-- CHAT SCREEN -->
    <section id="chatScreen" hidden>

      <header>
        <h2>My Chat App</h2>
        <button id="logoutBtn">Logout</button>
      </header>

      <div class="chat-layout">

        <aside>
          <h3>Users</h3>
          <div id="usersList"></div>
        </aside>

        <main>

          <h3 id="chatTitle">
            Select a user to chat
          </h3>

          <div id="messages"></div>

          <form id="messageForm">
            <input
              id="messageInput"
              placeholder="Type your message..."
              autocomplete="off"
              maxlength="2000"
              required
            >

            <button type="submit">Send</button>
          </form>

          <p id="chatError"></p>

        </main>

      </div>

    </section>

  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script src="app.js"></script>

</body>
</html>
