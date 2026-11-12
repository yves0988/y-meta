
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #101323;
  color: white;
}

.app {
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.logo {
  color: #7c8cff;
  font-size: 30px;
  font-weight: 900;
  margin-bottom: 30px;
}

h1 {
  font-size: 30px;
}

input {
  width: 100%;
  max-width: 350px;
  padding: 16px;
  border: 1px solid #444;
  border-radius: 12px;
  margin: 15px;
  font-size: 16px;
}

button {
  padding: 15px 25px;
  background: #536dfe;
  border: none;
  color: white;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  margin: 10px;
}

button:disabled {
  opacity: 0.6;
}

.invitation {
  margin-top: 25px;
  overflow-wrap: anywhere;
}

.error {
  color: #ff7373;
}
