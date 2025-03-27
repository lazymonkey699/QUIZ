import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./sidebar";
import mockData from "./data/mockData.json";
import "./CSS/mock.css";

const Mock = ({ setQuestions, setQuizState }) => {
  const [username, setUsername] = useState("");
  const [facultyId, setFacultyId] = useState(null);
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState({ city: "Loading...", province: "Loading..." });
  const [testHistory, setTestHistory] = useState(mockData.testHistory);
  const [leaderboard, setLeaderboard] = useState(mockData.leaderboard);
  const [error, setError] = useState(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasRedirected) {
      console.log("Already redirected, skipping token check");
      return;
    }

    const token = localStorage.getItem("authToken");
    console.log("Token in Mock:", token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded Token in Mock:", decoded);
        setUsername(decoded.sub || "User");
        setFacultyId(decoded.faculty);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          console.error("Token expired");
          localStorage.removeItem("authToken");
          setHasRedirected(true);
          navigate("/login", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Invalid token", err);
        setHasRedirected(true);
        navigate("/login", { replace: true });
      }
    } else {
      console.error("No token found");
      setHasRedirected(true);
      navigate("/login", { replace: true });
    }
  }, [navigate, hasRedirected]);

  useEffect(() => {
    fetch("http://ip-api.com/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setLocation({
            city: data.city || "Unknown",
            province: data.regionName || "Unknown",
          });
        } else {
          setLocation({ city: "Unknown", province: "Unknown" });
        }
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

  useEffect(() => {
    if (hasRedirected) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const fetchTestHistory = async () => {
      try {
        const response = await fetch("/mockexam/test-history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 403) {
          console.error("Access denied: Invalid permissions for test history");
          localStorage.removeItem("authToken");
          setHasRedirected(true);
          navigate("/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch test history");
        const data = await response.json();
        setTestHistory(data.testHistory || mockData.testHistory);
      } catch (err) {
        console.error("[ERROR] Fetching test history:", err);
        setTestHistory(mockData.testHistory);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/mockexam/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 403) {
          console.error("Access denied: Invalid permissions for leaderboard");
          localStorage.removeItem("authToken");
          setHasRedirected(true);
          navigate("/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch leaderboard");
        const data = await response.json();
        setLeaderboard(data.leaderboard || mockData.leaderboard);
      } catch (err) {
        console.error("[ERROR] Fetching leaderboard:", err);
        setLeaderboard(mockData.leaderboard);
      }
    };

    fetchTestHistory();
    fetchLeaderboard();
  }, [navigate, hasRedirected]);

  const startQuiz = async () => {
    if (hasRedirected) return;

    if (!facultyId) {
      console.error("Faculty ID is missing");
      setError("Faculty ID is missing. Please log in again.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        setError("Authentication token missing. Please log in.");
        return;
      }

      const questionsResponse = await fetch(`/mockexam/questions?faculty_id=${facultyId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (questionsResponse.status === 403) {
        console.error("Access denied: Invalid permissions");
        localStorage.removeItem("authToken");
        setHasRedirected(true);
        setError("Access denied. Please log in again.");
        navigate("/login", { replace: true });
        return;
      }

      if (!questionsResponse.ok) {
        throw new Error("Error fetching questions");
      }

      const questionsData = await questionsResponse.json();
      console.log("Questions Data:", questionsData);
      if (!questionsData.questions || Object.keys(questionsData.questions).length === 0) {
        throw new Error("No questions found");
      }

      const availableLevel = Object.keys(questionsData.questions).find(
        (level) => questionsData.questions[level]
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

        console.log("Formatted Questions:", formattedQuestions);
        setQuestions(formattedQuestions);
        setQuizState("active");
        navigate("/mockquiz", { replace: true });
      } else {
        setError("No questions available for this level.");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to fetch questions. Please try again.");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Welcome, {username}!</h1>
          <div className="user-info">
            <div className="info-card">
              <span className="info-label">Province:</span>
              <span>{location.province}</span>
            </div>
            <div className="info-card">
              <span className="info-label">City:</span>
              <span>{location.city}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Date & Time:</span>
              <span>{dateTime}</span>
            </div>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-sections">
          <section className="dashboard-section test-history">
            <h2>Recent Mock Exam History</h2>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>S.N</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Total Questions</th>
                    <th>Correct</th>
                    <th>Incorrect</th>
                    <th>Skipped</th>
                  </tr>
                </thead>
                <tbody>
                  {testHistory.map((test, index) => (
                    <tr key={test.id}>
                      <td>{index + 1}</td>
                      <td>{test.date}</td>
                      <td>{test.score}</td>
                      <td>{test.totalQuestions}</td>
                      <td>{test.correct}</td>
                      <td>{test.incorrect}</td>
                      <td>{test.skipped}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-section leaderboard">
            <h2>Mock Exam Leaderboard</h2>
            <div className="card">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Highest Score</th>
                    <th>Tests Taken</th>
                    <th>Average Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr key={player.id}>
                      <td>{index + 1}</td>
                      <td>{player.name}</td>
                      <td>{player.score}</td>
                      <td>{player.testsTaken}</td>
                      <td>{player.averageScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <button className="start-quiz-btn" onClick={startQuiz}>
          Start Mock Exam
        </button>
      </main>
    </div>
  );
};

export default Mock;