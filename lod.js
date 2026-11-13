
 renderUsers() {

  // Clear old user list
  usersList.replaceChildren();

  allUsers.forEach(user => {

    // Create user button
     button = document.createElement("button");

    button.className = "user";

    // Check online status
     isOnline = onlineUserIds.has(user.id);

    // Create status indicator
     indicator = document.createElement("span");

    indicator.className = isOnline
      ? "status-dot online"
      : "status-dot offline";

    // Create username
     name = document.createElement("span");

    name.textContent = user.username;

    // Create status text
     status = document.createElement("span");

    status.className = "status-text";

    status.textContent = isOnline
      ? "Online"
      : "Offline";

    // Add elements to button
    button.appendChild(indicator);
    button.appendChild(name);
    button.appendChild(status);

    // Highlight selected user
     (selectedUser?.id === user.id) {
      button.classList.add("active");
    }

    // Open conversation when clicked
    button.onclick = () => selectUser(user, button);

    usersList.appendChild(button);

  });

}
