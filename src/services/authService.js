const BASE_URL = "http://127.0.0.1:8080";

export const handleAuth = async (username, email, password, facultyId, isSignup = false) => {
    try {
        if (isSignup) {
            // Handle registration
            const registerResponse = await fetch(`${BASE_URL}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password, 
                    faculty_id: parseInt(facultyId) || 1 
                })
            });

            if (!registerResponse.ok) {
                throw new Error("Signup failed. User may already exist.");
            }

            console.log("Signup successful! Now logging in...");
        }

        // Handle login
        const loginResponse = await fetch(`${BASE_URL}/api/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "password",
                username,
                password
            })
        });

        if (!loginResponse.ok) {
            throw new Error("Login failed. Check your credentials.");
        }

        const loginData = await loginResponse.json();
        localStorage.setItem("authToken", loginData.access_token); // Changed to match the key used in AuthForm
        return loginData;
    } catch (error) {
        console.error("Authentication error:", error.message);
        throw error;
    }
};