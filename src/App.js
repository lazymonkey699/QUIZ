import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Correct import
import AuthForm from "./components/AuthForm";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Quiz from "./components/Quiz";
import Score from "./components/Score";
import Mock from "./components/mock";
import MockQuiz from "./components/mockquiz";
import Dashboard from "./components/Dashboard";

const App = () => {
    const token = localStorage.getItem("authToken");

    // Check if user is logged in and has a valid token
    const isAuthenticated = token !== null;

    let role = null;

    // Decode token to get role (if available), handling invalid or missing tokens
    if (isAuthenticated) {
        try {
            const decodedToken = jwtDecode(token);
            role = decodedToken.role;  // Assuming the token contains a role property
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    }

    // State for managing quiz questions and state
    const [questions, setQuestions] = useState([]);
    const [quizState, setQuizState] = useState("inactive"); // Initialize quiz state

    return (
        <Router>
            <Routes>
                {/* Public Route for Login and Signup */}
                <Route path="/login" element={<AuthForm />} />

                {/* Private Route for Student Dashboard */}
                <Route
                    path="/student-dashboard"
                    element={
                        isAuthenticated && role === 1 ? (
                            <StudentDashboard setQuestions={setQuestions} setQuizState={setQuizState} />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route
                    path="/mock"
                    element={
                        isAuthenticated && role === 1 ? (
                            <Mock setQuestions={setQuestions} setQuizState={setQuizState} />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                {/* privated route for dashboard }*/}
                  <Route
                    path="/dashboard"
                    element={
                        isAuthenticated && role === 1 ? (
                            <Dashboard setQuestions={setQuestions} setQuizState={setQuizState} />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
              

                {/* Private Route for Admin Dashboard */}
                <Route
                    path="/admin-dashboard"
                    element={
                        isAuthenticated && role === 3 ? (
                            <AdminDashboard />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                {/* Public Route for Quiz */}
                <Route path="/quiz" element={isAuthenticated ? <Quiz questions={questions} setQuizState={setQuizState} /> : <Navigate to="/auth" />} />
                <Route path="/mockquiz" element={isAuthenticated ? <MockQuiz questions={questions} setQuizState={setQuizState} /> : <Navigate to="/auth" />} />

                {/* Redirect to login page if no match */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/score" element={<Score />} />


            </Routes>
        </Router>
    );
};

export default App;