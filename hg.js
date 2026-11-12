const joinBtn = document.getElementById("joinBtn");

if (joinBtn) {
    joinBtn.addEventListener("click", () => {
        console.log("Join button clicked!");

        // Add your video call joining code here
    });
} else {
    console.error("joinBtn was not found in index.html");
}
