import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./sidebar";
import "./CSS/mock.css";

const Mock = ({ setQuestions, setQuizState }) => {
  const [username, setUsername] = useState("");
  const [facultyId, setFacultyId] = useState(null);
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState({ city: "Loading...", province: "Loading..." });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();

  const testHistory = [
    { score: 85, skipped: 2 },
    { score: 78, skipped: 1 },
    { score: 92, skipped: 0 },
  ];

  const leaderboard = [
    { name: "Sujan Rai", score: 85 },
    { name: "Pradeep Thapa", score: 78 },
    { name: "Anjali Shah", score: 92 },
    { name: "Manoj Bhandari", score: 80 },
    { name: "Kiran Gurung", score: 75 },
    { name: "Dipesh KC", score: 88 },
  ];

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setShouldRedirect(true);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          localStorage.removeItem("authToken");
          setShouldRedirect(true);
          return;
        }

        setUsername(decoded.sub || "User");
        setFacultyId(decoded.faculty);
        setLoading(false);
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("authToken");
        setShouldRedirect(true);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/login");
    }
  }, [shouldRedirect, navigate]);

  useEffect(() => {
    fetch("http://ip-api.com/json/")
      .then((res) => res.json())
      .then((data) => {
        setLocation({
          city: data.city || "Unknown",
          province: data.regionName || "Unknown",
        });
      })
      .catch(() => {
        setLocation({ city: "Unknown", province: "Unknown" });
      });
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      setDateTime(
        new Intl.DateTimeFormat("en-US", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }).format(new Date())
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const startQuiz = async () => {
    if (loading) return;
    if (!facultyId) {
      setError("Faculty ID is missing. Please log in again.");
      return;
    }

    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:8000/mockexam/questions?faculty_id=${facultyId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        setError("Access denied. Please log in again.");
        localStorage.removeItem("authToken");
        setShouldRedirect(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const questionsData = await response.json();
      if (!questionsData.questions || Object.keys(questionsData.questions).length === 0) {
        throw new Error("No questions found");
      }

      const availableLevel = Object.keys(questionsData.questions).find(
        (level) => questionsData.questions[level].length > 0
      );

      if (availableLevel) {
        const levelQuestions = questionsData.questions[availableLevel];
        const formattedQuestions = levelQuestions.flatMap((chapter) =>
          chapter.subchapters.map((q) => ({
            id: q.id,
            question: q.question,
            options: Object.values(q.options),
            correctAnswer: q.correct_answer,
          }))
        );

        setQuestions(formattedQuestions);
        setQuizState("active");
        navigate("/mockquiz");
      } else {
        setError("No questions available for this level.");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err.message || "Failed to fetch questions. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar /> {/* Assuming sidebar is styled separately */}
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome, {username}!</h1>
          <div className="user-info">
            <div className="info-card">
              <span className="info-label">Province</span>
              <span>{location.province}</span>
            </div>
            <div className="info-card">
              <span className="info-label">City</span>
              <span>{location.city}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Date & Time</span>
              <span>{dateTime}</span>
            </div>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="dashboard-grid">
          <div className="card test-history">
            <h2>Last Test History</h2>
            <table>
              <thead>
                <tr>
                  <th>S.N</th>
                  <th>Score</th>
                  <th>Skipped Questions</th>
                </tr>
              </thead>
              <tbody>
                {testHistory.map((test, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{test.score}</td>
                    <td>{test.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2>Leaderboard</h2>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr key={index}>
                    <td>{player.name}</td>
                    <td>{player.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="start-quiz-btn" onClick={startQuiz} disabled={loading}>
              Start Test
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Mock;