// Receive online user updates
socket.on("online_users", (userIds) => {

  // Save online user IDs
  onlineUserIds = new Set(userIds);

  // Update the user list
  renderUsers();

});
