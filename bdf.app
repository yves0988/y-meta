
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.ymeta {
  min-height: 100vh;
  display: flex;
  --bg: #0b0d1d;
  --card: #181b32;
  --text: #fff;
  --muted: #a6a9c0;
  --accent: #9273ff;
  background: var(--bg);
  color: var(--text);
}

.ymeta.light {
  --bg: #f5f4fc;
  --card: #fff;
  --text: #17162b;
  --muted: #77768a;
  --accent: #7052dc;
}

.sidebar {
  width: 240px;
  padding: 25px 15px;
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar h1 {
  color: var(--accent);
  margin-bottom: 35px;
}

button {
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  padding: 12px;
  background: var(--accent);
  color: white;
  margin: 5px 0;
}

.sidebar button {
  text-align: left;
  background: transparent;
  color: var(--muted);
}

.sidebar button.active {
  background: #9273ff25;
  color: var(--accent);
}

.content {
  flex: 1;
  padding: 25px;
  max-width: 1100px;
  margin: auto;
  min-width: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #7773;
  margin-bottom: 25px;
}

.card {
  background: var(--card);
  padding: 20px;
  border-radius: 16px;
  margin: 15px 0;
  border: 1px solid #8882;
}

textarea, input {
  width: 100%;
  padding: 14px;
  margin: 8px 0;
  border-radius: 10px;
  border: 1px solid #8885;
  background: var(--bg);
  color: var(--text);
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.friend {
  margin: 5px;
}

.chat-area {
  min-height: 150px;
  padding: 12px;
  background: var(--bg);
  border-radius: 12px;
}

.own {
  text-align: right;
  color: var(--accent);
}

.avatar {
  background: var(--accent);
  color: white;
  border-radius: 50%;
  padding: 20px;
  width: fit-content;
}

.overlay {
  position: fixed;
  inset: 0;
  background: #000b;
  display: grid;
  place-items: center;
  padding: 20px;
}

.overlay .card {
  width: min(400px, 100%);
  text-align: center;
}

@media(max-width:650px) {
  .ymeta {
    display: block;
    padding-bottom: 15px;
  }

  .sidebar {
    width: 100%;
    padding: 8px;
    position: sticky;
    top: 0;
    z-index: 5;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .sidebar h1 {
    width: 100%;
    text-align: center;
    margin: 5px;
  }

  .sidebar button {
    font-size: 11px;
    padding: 8px;
  }

  .content {
    padding: 12px;
  }
}
