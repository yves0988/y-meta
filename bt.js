
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #eef2f7;
  color: #222;
}

.container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 15px;
}

.auth-box {
  background: white;
  max-width: 400px;
  margin: 60px auto;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 4px 20px #0001;
}

input {
  width: 100%;
  padding: 13px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
}

button {
  padding: 12px 18px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 5px;
}

button:hover {
  background: #1d4ed8;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px;
  border-radius: 10px;
}

.chat-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 15px;
  margin-top: 15px;
}

aside, main {
  background: white;
  border-radius: 10px;
  padding: 15px;
  min-width: 0;
}

#usersList {
  display: flex;
  flex-direction: column;
}

.user {
  padding: 13px;
  margin: 5px 0;
  background: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
}

.user.active {
  background: #dbeafe;
}

#messages {
  height: 400px;
  overflow-y: auto;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  padding: 10px;
  border-radius: 10px;
  max-width: 75%;
  background: #e2e8f0;
  overflow-wrap: anywhere;
}

.message.mine {
  background: #2563eb;
  color: white;
  align-self: flex-end;
}

#messageForm {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

#messageForm input {
  flex: 1;
  min-width: 0;
}

#authError, #chatError {
  color: #dc2626;
}

[hidden] {
  display: none !important;
}

@media (max-width: 650px) {
  .container {
    margin: 5px auto;
    padding: 5px;
  }

  .chat-layout {
    grid-template-columns: 1fr;
  }

  #messages {
    height: 350px;
  }
}
