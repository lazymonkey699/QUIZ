import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { setQuestions, setFacultyId } from "./redux/quizSlice";
import Sidebar from "./sidebar";
import userStats from "./data/userStats.json";
import "./CSS/StudentDashboard.css";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const facultyId = useSelector((state) => state.quiz.facultyId);

  const [username, setUsername] = useState("Guest");
  const [dateTime, setDateTime] = useState(new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }));
  const [location, setLocation] = useState({ city: "Loading...", province: "Loading..." });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [practiceCount, setPracticeCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [totalTests, setTotalTests] = useState(0);

  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("http://ip-api.com/json/");
        const data = await res.json();
        setLocation({ city: data.city || "Unknown", province: data.regionName || "Unknown" });
      } catch {
        setLocation({ city: "Unknown", province: "Unknown" });
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    const updateDateTime = () => setDateTime(new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }));
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode(authToken);
      setUsername(decoded.sub || "Guest");
      dispatch(setFacultyId(decoded.faculty || null));
      loadUserData();
    } catch (err) {
      console.error("[ERROR] Invalid token:", err);
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  }, [authToken, dispatch, navigate]);

  const loadUserData = useCallback(() => {
    try {
      setTestHistory(userStats.testHistory || []);
      setPracticeCount(userStats.practiceCount || 0);
      setAverageScore(userStats.averageScore || 0);
      setTotalTests(userStats.totalTestsCompleted || 0);
    } catch (err) {
      console.error("[ERROR] Loading JSON data:", err);
      setTestHistory([
        { id: 1, date: "2025-03-20", score: 92, skipped: 1, totalQuestions: 20, timeTaken: "18:45" },
        { id: 2, date: "2025-03-18", score: 87, skipped: 3, totalQuestions: 25, timeTaken: "22:10" },
      ]);
      setPracticeCount(5);
      setAverageScore(89.5);
      setTotalTests(10);
    }
  }, []);

  const handleResize = useCallback(() => setIsSidebarOpen(window.innerWidth > 768), []);
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const startQuiz = useCallback(async () => {
    if (!facultyId) {
      console.error("[ERROR] Faculty ID missing");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/practisetest/questions?faculty_id=${facultyId}`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      if (!data.questions || !Object.keys(data.questions).length) throw new Error("No questions found");

      const allQuestions = Object.entries(data.questions).flatMap(([_, chapters]) =>
        chapters.flatMap((chapter) =>
          (chapter.subchapters || []).map((q) => ({
            id: q.id,
            question: q.question,
            options: Object.values(q.options || {}),
            correctAnswer: q.correct_answer,
          }))
        )
      );

      dispatch(setQuestions(allQuestions));
      navigate("/quiz");
    } catch (err) {
      console.error("[ERROR] Failed to start quiz:", err);
      alert(`Failed to load quiz: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [facultyId, authToken, dispatch, navigate]);

  return (
    <div className="dashboard-container">
      <Sidebar setSidebarOpen={setIsSidebarOpen} />
      <main className={`dashboard-content ${isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dashboard-header">
          <h1 className="fade-in">Welcome back, {username}!</h1>
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-label">Location</span>
              <span className="stat-value">{location.city}, {location.province}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">{averageScore.toFixed(1)} marks</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tests Completed</span>
              <span className="stat-value">{totalTests}</span>
            </div>
          </div>
          <div className="datetime">{dateTime}</div>
        </header>
        <section className="dashboard-grid">
          <div className="card test-history">
            <h2>Recent Test History</h2>
            {testHistory.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Skipped</th>
                    <th>Total</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {testHistory.map((test) => (
                    <tr key={test.id}>
                      <td>{test.date}</td>
                      <td>{test.score}</td>
                      <td>{test.skipped}</td>
                      <td>{test.totalQuestions}</td>
                      <td>{test.timeTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">No recent tests available.</p>
            )}
          </div>
          <div className="card practice-section">
            <h2>Practice Activity</h2>
            <div className="counter-metric">
              <span className="counter-value">{practiceCount}</span>
              <span className="counter-label">Practice Tests Taken</span>
            </div>
            <button className="start-quiz-btn" onClick={startQuiz} disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner">Loading...</span>
              ) : (
                "Start Practice Test"
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;