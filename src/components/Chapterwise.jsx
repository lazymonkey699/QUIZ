import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./sidebar"; // Ensure correct path
import chapterStats from "./data/chapterStats.json"; // Adjust path as needed
import "./CSS/Chapterwise.css";

const Chapterwise = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("Guest");
  const [facultyId, setFacultyId] = useState(null);
  const [dateTime, setDateTime] = useState(new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }));
  const [location, setLocation] = useState({ city: "Loading...", province: "Loading..." });
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
  const [testHistory, setTestHistory] = useState([]);
  const [practiceCount, setPracticeCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [totalTests, setTotalTests] = useState(0);

  const authToken = localStorage.getItem("authToken");

  // Fetch location from existing endpoint
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

  // Update date and time
  useEffect(() => {
    const updateDateTime = () => setDateTime(new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }));
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle authentication & extract user info
  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode(authToken);
      setUsername(decoded.sub || "Guest");
      setFacultyId(decoded.faculty || null);
      loadUserData();
    } catch (err) {
      console.error("[ERROR] Invalid token:", err);
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  }, [authToken, navigate]);

  // Load data from JSON
  const loadUserData = useCallback(() => {
    try {
      setTestHistory(chapterStats.testHistory || []);
      setPracticeCount(chapterStats.practiceCount || 0);
      setAverageScore(chapterStats.averageScore || 0);
      setTotalTests(chapterStats.totalTestsCompleted || 0);
    } catch (err) {
      console.error("[ERROR] Loading JSON data:", err);
      setTestHistory([
        { id: 1, chapter: "Engineering Mathematics", date: "2025-03-22", score: 88, skipped: 2, totalQuestions: 15, timeTaken: "16:20" },
        { id: 2, chapter: "Statics and Dynamics", date: "2025-03-19", score: 92, skipped: 1, totalQuestions: 20, timeTaken: "19:10" },
      ]);
      setPracticeCount(5);
      setAverageScore(90);
      setTotalTests(8);
    }
  }, []);

  // Fetch chapters from existing endpoint
  useEffect(() => {
    const fetchChapters = async () => {
      if (!authToken) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("/allchapters", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch chapters");

        const data = await response.json();
        console.log("[DEBUG] Fetched chapters from /allchapters:", data); // Debug line to confirm chapter names

        // Map the API response to match the expected structure (id and name)
        const mappedChapters = data.map(chapter => ({
          id: chapter.Chapter_id,
          name: chapter.chapter
        }));
        setChapters(mappedChapters);
      } catch (error) {
        console.error("[ERROR] Fetching chapters:", error);
        alert("Failed to load chapters. Please try again later.");
      }
    };

    fetchChapters();
  }, [authToken, navigate]);

  // Handle chapter selection and start the test
  const handleStartTest = useCallback(() => {
    if (!selectedChapter) {
      alert("Please select a chapter before starting the test.");
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem("chapter_id", selectedChapter); // Store Chapter_id for fetching questions
    navigate("/chapterquiz");
    setIsLoading(false);
  }, [selectedChapter, navigate]);

  // Resize handler for sidebar
  const handleResize = useCallback(() => setIsSidebarOpen(window.innerWidth > 768), []);
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

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
              <span className="stat-value">{averageScore.toFixed(1)} marks </span>
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
                    <th>Chapter</th>
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
                      <td>{test.chapter}</td>
                      <td>{test.date}</td>
                      <td>{test.score} </td>
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
            <h2>Engineering Chapter Practice</h2>
            <div className="chapter-selection">
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
              >
                <option value="">-- Select a Chapter --</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="counter-metric">
              <span className="counter-value">{practiceCount}</span>
              <span className="counter-label">Practice Tests Taken</span>
            </div>
            <button className="start-quiz-btn" onClick={handleStartTest} disabled={isLoading || !selectedChapter}>
              {isLoading ? (
                <span className="loading-spinner">Loading...</span>
              ) : (
                "Start Chapter Test"
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Chapterwise;