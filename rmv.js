
import React, { useState } from "react";

export default function App() {
  const [page, setPage] = useState("home");

  const navigation = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "calls", label: "Calls", icon: "📞" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "contacts", label: "Contacts", icon: "👥" },
    { id: "profile", label: "Profile", icon: "👤" }
  ];

  return (
    <div className="ymeta-app">

      <header>
        <h2>Y META</h2>
      </header>

      <nav className="bottom-nav">
        {navigation.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={page === item.id ? "active" : ""}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <main>
        {page === "home" && <h1>Welcome to Y Meta</h1>}
        {page === "calls" && <h1>Your Calls</h1>}
        {page === "messages" && <h1>Your Messages</h1>}
        {page === "contacts" && <h1>Your Contacts</h1>}
        {page === "profile" && <h1>Your Profile</h1>}
      </main>

    </div>
  );
}
