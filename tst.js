 testBackend() {
     {
         response =  fetch(`${API_URL}/api/status`);

         (!response.ok) {
            Error("Backend request failed");
        }

         data =  response.json();

        console.log("Y-META connected:", data.message);

    }  (error) {
        console.error("Y-META connection error:", error);
    }
}

testBackend();
