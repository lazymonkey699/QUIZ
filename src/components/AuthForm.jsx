import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { handleAuth } from "../services/authService";
import "./CSS/AuthForm.css";
import image from './assets/images.jpg';

const AuthForm = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        faculty_id: "",  // Add faculty_id to formData
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Updated handleSubmit function
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
    
        try {
            const { username, email, password, faculty_id } = formData;
    
            const loginData = await handleAuth(
                username,
                email,
                password,
                isSignup,
                faculty_id // Pass faculty_id as part of signup
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
    
                // Check for the role and log it
                const role = decodedToken.role || decodedToken.userRole || decodedToken.user_role;
                console.log("Detected role:", role); // Debug log
                
                // Handle admin redirection (role 3)
                if (role === 3) {
                    console.log("Superadmin role detected. Redirecting to admin dashboard.");
                    navigate("/admin-dashboard");  // Ensure this happens after setting the state/token
                } 
                // Handle non-admin (e.g., student) redirection
                else if (role === 1 || role === "1" || role === "student") {
                    // Ensure faculty_id exists for non-admin users
                    const facultyId = decodedToken.faculty || decodedToken.faculty_id;
                    if (facultyId) {
                        localStorage.setItem("facultyId", facultyId);
                        console.log("Faculty ID stored:", facultyId); // Debug log
                        navigate("/student-dashboard");
                    } else {
                        console.error("Faculty ID is required for non-admin users.");
                        throw new Error("Faculty ID is required for student users.");
                    }
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
        <div className="outer-container">
            <div className="auth-wrapper">
                <div className="image-placeholder">
                    <img src={image} alt="Welcome" />
                </div>
                <div className="auth-box">
                    <div className="welcome-message">
                        <h1>Welcome to the App</h1>
                        <p>Please log in or create an account to continue.</p>
                    </div>
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
                            <>
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
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="faculty_id"
                                        placeholder="Faculty ID"
                                        value={formData.faculty_id}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </>
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
        </div>
    );
};


export default AuthForm;
