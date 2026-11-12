
import React, { useState } from "react";
import "./App.css";

const people = [
  { id: 1, name: "Alex Morgan", avatar: "A" },
  { id: 2, name: "Sarah James", avatar: "S" },
  { id: 3, name: "David Kim", avatar: "D" },
  { id: 4, name: "Emma Wilson", avatar: "E" }
];

const sections = [
  ["home", "Home", "⌂"],
  ["messages", "Messages", "✉"],
  ["calls", "Calls", "☎"],
  ["friends", "Friends", "♧"],
  ["notifications", "Notifications", "♧"],
  ["profile", "Profile", "◎"],
  ["settings", "Settings", "⚙"]
];

export default function App() {
  const [page, setPage] = useState("home");
  const [dark, setDark] = useState(true);
  const [name, setName] = useState("Y Meta User");
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "Alex Morgan",
      text: "Welcome to Y Meta! Let's connect. 💜",
      likes: 12
    }
  ]);

  const [friends, setFriends] = useState([1, 2]);
  const [messages, setMessages] = useState({});
  const [selected, setSelected] = useState(1);
  const [draft, setDraft] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([
    "Welcome to Y Meta!",
    "Alex Morgan joined Y Meta."
  ]);
  const [call, setCall] = useState(null);

  function publish() {
    if (!draft.trim()) return;

    setPosts([{
      id: Date.now(),
      author: name,
      text: draft,
      likes: 0
    }, ...posts]);

    setDraft("");
    setNotifications([
      "Your new post was published.",
      ...notifications
    ]);
  }

  function send() {
    if (!newMessage.trim()) return;

    setMessages({
      ...messages,
      [selected]: [
        ...(messages[selected] || []),
        { text: newMessage, own: true }
      ]
    });

    setNewMessage("");
  }

  function addFriend(id) {
    if (!friends.includes(id)) {
      setFriends([...friends, id]);
      setNotifications([
        `You connected with ${people.find(p => p.id === id).name}.`,
        ...notifications
      ]);
    }
  }

  const person = people.find(p => p.id === selected);

  return (
    <div className={dark ? "ymeta dark" : "ymeta light"}>

      <aside className="sidebar">
        <h1>💜 Y META</h1>

        {sections.map(([id, label, icon]) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => setPage(id)}
          >
            {icon} {label}
          </button>
        ))}

        <button onClick={() => setDark(!dark)}>
          {dark ? "☀ Light mode" : "☾ Dark mode"}
        </button>
      </aside>

      <main className="content">

        <header className="header">
          <strong>Y META</strong>
          <span>{name}</span>
        </header>

        {page === "home" && (
          <section>
            <h1>Welcome to your world 💜</h1>
            <p>Share your thoughts with your community.</p>

            <div className="card">
              <textarea
                placeholder="What's happening today?"
                value={draft}
                onChange={e => setDraft(e.target.value)}
              />
              <button onClick={publish}>Publish post</button>
            </div>

            <h2>Community feed</h2>

            {posts.map(post => (
              <div className="card" key={post.id}>
                <strong>{post.author}</strong>
                <p>{post.text}</p>
                <button onClick={() => {
                  setPosts(posts.map(p =>
                    p.id === post.id
                      ? { ...p, likes: p.likes + 1 }
                      : p
                  ));
                }}>
                  ♥ {post.likes} Like
                </button>
              </div>
            ))}
          </section>
        )}

        {page === "messages" && (
          <section>
            <h1>Messages</h1>

            {people.filter(p => friends.includes(p.id)).map(p => (
              <button
                className="friend"
                key={p.id}
                onClick={() => setSelected(p.id)}
              >
                {p.avatar} {p.name}
              </button>
            ))}

            <div className="card">
              <h3>{person?.name || "Select a friend"}</h3>

              <div className="chat-area">
                {(messages[selected] || []).map((m, i) => (
                  <p key={i} className={m.own ? "own" : ""}>
                    {m.text}
                  </p>
                ))}
              </div>

              <input
                placeholder="Write a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
              />

              <button onClick={send}>Send message</button>
            </div>
          </section>
        )}

        {page === "calls" && (
          <section>
            <h1>Voice and video calls</h1>
            <p>Connect with friends wherever they are.</p>

            {people.filter(p => friends.includes(p.id)).map(p => (
              <div className="card" key={p.id}>
                <strong>{p.name}</strong>
                <button onClick={() => setCall(p)}>
                  Start video call
                </button>
              </div>
            ))}
          </section>
        )}

        {page === "friends" && (
          <section>
            <h1>Find friends</h1>

            <input
              placeholder="Search people..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {people.filter(p =>
              p.name.toLowerCase().includes(search.toLowerCase())
            ).map(p => (
              <div className="card" key={p.id}>
                <strong>{p.avatar} {p.name}</strong>

                <button
                  disabled={friends.includes(p.id)}
                  onClick={() => addFriend(p.id)}
                >
                  {friends.includes(p.id) ? "Connected" : "Add friend"}
                </button>
              </div>
            ))}
          </section>
        )}

        {page === "notifications" && (
          <section>
            <h1>Notifications</h1>

            {notifications.map((n, i) => (
              <div className="card" key={i}>{n}</div>
            ))}

            <button onClick={() => setNotifications([])}>
              Clear notifications
            </button>
          </section>
        )}

        {page === "profile" && (
          <section>
            <h1>My profile</h1>

            <div className="card">
              <div className="avatar">Y</div>
              <h2>{name}</h2>
              <p>Welcome to my Y Meta profile.</p>

              <button onClick={() => {
                const n = prompt("Your display name", name);
                if (n?.trim()) setName(n.trim());
              }}>
                Edit profile
              </button>
            </div>

            <div className="card">
              <p>Friends: {friends.length}</p>
              <p>Posts: {posts.length}</p>
            </div>
          </section>
        )}

        {page === "settings" && (
          <section>
            <h1>Settings</h1>

            <div className="card">
              <button onClick={() => setDark(!dark)}>
                Change appearance: {dark ? "Dark" : "Light"}
              </button>

              <button onClick={() => setPage("profile")}>
                Edit account
              </button>

              <button onClick={() => setNotifications([])}>
                Clear notifications
              </button>
            </div>
          </section>
        )}
      </main>

      {call && (
        <div className="overlay">
          <div className="card">
            <h2>Y Meta video call</h2>
            <h3>Calling {call.name}</h3>
            <p>This is a demonstration. Connect LiveKit to enable real calls.</p>
            <button onClick={() => setCall(null)}>
              End call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
