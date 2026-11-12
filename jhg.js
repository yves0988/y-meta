document.addEventListener("DOMContentLoaded", () => {
  const messagesBtn =
    document.getElementById("messagesBtn");

  messagesBtn.addEventListener("click", () => {
    document.getElementById("messageArea")
      .style.display = "block";
  });
});
