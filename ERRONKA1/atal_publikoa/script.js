const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("GET-email");
const passInput = document.getElementById("GET-password");

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault(); 

    const payload = {
        email: emailInput.value,
        pasahitza: passInput.value
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/alokaziosistema/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Errorea: ${response.status}`);
        }

        const data = await response.json();
        console.log("Saioa ondo hasi da:", data);

    } catch (error) {
        console.error("Errorea login egitean:", error);
    }
});