import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { handleAuth } from "../services/authService";
import "./CSS/AuthForm.css"

const AuthForm = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const { username, email, password } = formData;
            
            const loginData = await handleAuth(
                username,
                email,
                password,
                isSignup
            );

            console.log("Login response:", loginData); // Debug log

            // Get token from localStorage (where handleAuth stored it)
            const token = localStorage.getItem("authToken");
            console.log("Retrieved token:", token); // Debug log

            if (!token) {
                throw new Error("No token received after login");
            }

            try {
                const decodedToken = jwtDecode(token);
                console.log("Decoded token:", decodedToken); // Debug log

                // Store the facultyId in localStorage
                const facultyId = decodedToken.faculty;
                if (facultyId) {
                    localStorage.setItem("facultyId", facultyId); // Store facultyId in localStorage
                    console.log("Faculty ID stored:", facultyId); // Debug log
                } else {
                    console.error("Faculty ID is missing in token");
                    throw new Error("Faculty ID missing in token");
                }

                // Check role and redirect accordingly
                const role = decodedToken.role || decodedToken.userRole || decodedToken.user_role;
                console.log("Detected role:", role); // Debug log

                if (role === 1 || role === "1" || role === "student") {
                    console.log("Redirecting to student dashboard");
                    navigate("/student-dashboard");
                } else if (role === 3 || role === "3" || role === "admin") {
                    console.log("Redirecting to admin dashboard");
                    navigate("/admin-dashboard");
                } else {
                    console.log("Invalid role detected:", role);
                    throw new Error(`Invalid role: ${role}`);
                }
            } catch (tokenError) {
                console.error("Token decode error:", tokenError);
                throw new Error("Failed to process authentication token");
            }
        } catch (err) {
            console.error("Authentication error:", err);
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isSignup ? "Create Account" : "Login"}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {isSignup && (
                        <div className="input-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="input-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button">
                        {isSignup ? "Sign Up" : "Login"}
                    </button>
                </form>
                <p className="toggle-text" onClick={() => setIsSignup(!isSignup)}>
                    {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up"}
                </p>
            </div>
        </div>
    );
};
    export default AuthForm;
    