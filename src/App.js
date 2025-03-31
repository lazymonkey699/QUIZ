import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AuthForm from "./components/AuthForm";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Quiz from "./components/Quiz";
import Score from "./components/Score";
import Mock from "./components/mock";
import MockQuiz from "./components/mockquiz";
import Chapterwise from "./components/Chapterwise";
import ChapterQuiz from "./components/ChapterQuiz";
import ChapterScore from "./components/ChapterScore";
import { QuizProvider } from "./QuizContext"; // Updated to named import

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("authToken");

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setRole(decodedToken.role);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error decoding token:", error);
                setIsAuthenticated(false);
            }
        }
    }, []);

    return (
        <QuizProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/student-dashboard" /> : <AuthForm />} />
                    <Route
                        path="/student-dashboard"
                        element={isAuthenticated && role === 1 ? <StudentDashboard /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin-dashboard"
                        element={isAuthenticated && role === 3 ? <AdminDashboard /> : <Navigate to="/login" />}
                    />
                    <Route path="/mock" element={isAuthenticated ? <Mock /> : <Navigate to="/login" />} />
                    <Route path="/quiz" element={isAuthenticated ? <Quiz /> : <Navigate to="/login" />} />
                    <Route path="/mockquiz" element={isAuthenticated ? <MockQuiz /> : <Navigate to="/login" />} />
                    <Route path="/chapterwise" element={isAuthenticated ? <Chapterwise /> : <Navigate to="/login" />} />
                    <Route path="/chapterquiz" element={isAuthenticated ? <ChapterQuiz /> : <Navigate to="/login" />} />
<Route path="/chapter-score" element={<ChapterScore />} />
                    <Route path="/score" element={<Score />} />
                    <Route path="/login" element={<AuthForm />} />
                    <Route path="/" element={<Navigate to={isAuthenticated ? "/student-dashboard" : "/login"} />} />
                </Routes>
            </Router>
        </QuizProvider>
    );
};

export default App;