async function testBackend() {
    try {
        const response = await fetch(`${API_URL}/api/status`);

        if (!response.ok) {
            throw new Error("Backend request failed");
        }

        const data = await response.json();

        console.log("Y-META connected:", data.message);

    } catch (error) {
        console.error("Y-META connection error:", error);
    }
}

testBackend();
