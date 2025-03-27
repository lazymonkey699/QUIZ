import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { handleAuth } from "../services/authService";
import "./CSS/AuthForm.css";
import backgroundImage from './assets/background.jpg';

const AuthForm = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        faculty_id: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Optional: Override background through inline style if needed
    const containerStyle = {
        backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)), url(${backgroundImage})`,
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error when user starts typing
        if (error) setError("");
    };

    const validateForm = () => {
        const { username, email, password, faculty_id } = formData;
        
        if (!username || username.length < 3) {
            setError("Username must be at least 3 characters");
            return false;
        }
        
        if (isSignup) {
            if (!email || !/\S+@\S+\.\S+/.test(email)) {
                setError("Please enter a valid email address");
                return false;
            }
            
            if (!faculty_id) {
                setError("Faculty ID is required");
                return false;
            }
        }
        
        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!validateForm()) return;
        
        setIsLoading(true);
    
        try {
            const { username, email, password, faculty_id } = formData;
    
            const loginData = await handleAuth(
                username,
                email,
                password,
                isSignup,
                faculty_id
            );
    
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication failed. Please try again.");
    
            const decodedToken = jwtDecode(token);
            const role = decodedToken.role || decodedToken.userRole || decodedToken.user_role;
    
            if (role === 3) {
                navigate("/admin-dashboard", { replace: true });
            } else if (role === 1) {
                const facultyId = decodedToken.faculty || decodedToken.faculty_id;
                if (facultyId) {
                    localStorage.setItem("facultyId", facultyId);
                    navigate("/student-dashboard", { replace: true });
                } else {
                    throw new Error("Faculty ID is required for student users.");
                }
            } else {
                throw new Error("Invalid account type. Please contact support.");
            }
        } catch (err) {
            setError(err.message || "Authentication failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="outer-container" style={containerStyle}>
            <div className="auth-box">
                <h1>Welcome to the App</h1>
                <p>Please log in or create an account to continue.</p>
                <h2>{isSignup ? "Create Account" : "Login"}</h2>
                {error && <div className="error-message" role="alert">{error}</div>}
    
                <form onSubmit={handleSubmit} noValidate>
                    <div className="input-group">
                        <label htmlFor="username" className="visually-hidden">Username</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            aria-required="true"
                        />
                    </div>
                    {isSignup && (
                        <>
                            <div className="input-group">
                                <label htmlFor="email" className="visually-hidden">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    aria-required="true"
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="faculty_id" className="visually-hidden">Faculty ID</label>
                                <input
                                    id="faculty_id"
                                    type="text"
                                    name="faculty_id"
                                    placeholder="Faculty ID"
                                    value={formData.faculty_id}
                                    onChange={handleChange}
                                    required
                                    aria-required="true"
                                />
                            </div>
                        </>
                    )}
                    <div className="input-group">
                        <label htmlFor="password" className="visually-hidden">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            aria-required="true"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : (isSignup ? "Sign Up" : "Login")}
                    </button>
                </form>
    
                <p 
                    className="toggle-text" 
                    onClick={() => setIsSignup(!isSignup)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            setIsSignup(!isSignup);
                        }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSignup}
                >
                    {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up"}
                </p>
            </div>
        </div>
    );
};

export default AuthForm;