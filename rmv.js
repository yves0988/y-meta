
 React, { useState } from "react";

 App() {
   [page, setPage] = useState("home");

   navigation = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "calls", label: "Calls", icon: "📞" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "contacts", label: "Contacts", icon: "👥" },
    { id: "profile", label: "Profile", icon: "👤" }
  ];

   (
    <div className="ymeta-app">

      <header>
        <h2>Y META</h2>
        <p>Your world, your connection.</p>
      </header>

      <main>
        {page === "home" && (
          <section>
            <h1>Welcome to Y META</h1>
            <p>Your communication starts here.</p>
          </section>
        )}

        {page === "calls" && (
          <section>
            <h1>📞 Your Calls</h1>
            <p>Your call history will appear here.</p>
            <button onClick={() => alert("Calling feature coming soon!")}>
              Start a Call
            </button>
          </section>
        )}

        {page === "messages" && (
          <section>
            <h1>💬 Your Messages</h1>
            <p>Your conversations will appear here.</p>
            <button onClick={() => alert("Messaging feature coming soon!")}>
              New Message
            </button>
          </section>
        )}

        {page === "contacts" && (
          <section>
            <h1>👥 Your Contacts</h1>
            <p>Your contacts will appear here.</p>
            <button onClick={() => alert("Contact feature coming soon!")}>
              Add Contact
            </button>
          </section>
        )}

        {page === "profile" && (
          <section>
            <h1>👤 Your Profile</h1>
            <p>Welcome to your Y META profile.</p>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={page === item.id ? "active" : ""}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}

 App;
