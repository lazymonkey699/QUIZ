import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./sidebar";
import "./CSS/mock.css";

// Import mock data for leaderboard
import mockData from "./data/mockData.json"; // Adjust path based on your project structure

// Custom Hooks
const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "", facultyId: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("authToken");
        navigate("/login", { replace: true });
        return;
      }
      setUser({ username: decoded.sub || "User", facultyId: decoded.faculty });
    } catch (err) {
      console.error("Invalid token", err);
      localStorage.removeItem("authToken");
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  return { ...user, loading };
};

const useLocation = () => {
  const [location, setLocation] = useState({ city: "Loading...", province: "Loading..." });

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

  return location;
};

const useDateTime = () => {
  const [dateTime, setDateTime] = useState("");

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

  return dateTime;
};

// Custom Hook for Leaderboard Data from JSON
const useLeaderboardData = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboard(mockData.leaderboard || []);
      } catch (err) {
        console.error("Error loading leaderboard data:", err);
        setError("Failed to load leaderboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return { leaderboard, loading, error };
};

// Static Test History
const TEST_HISTORY = [
  { score: 85, skipped: 2 },
  { score: 78, skipped: 1 },
  { score: 92, skipped: 0 },
];

// Components
const InfoCard = ({ label, value }) => (
  <div className="info-card">
    <span className="info-label">{label}</span>
    <span>{value}</span>
  </div>
);

const TestHistoryTable = ({ data }) => (
  <div className="card test-history">
    <h2>Last Test History</h2>
    {data.length === 0 ? (
      <p>No test history available.</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>S.N</th>
            <th>Score</th>
            <th>Skipped Questions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((test, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{test.score}</td>
              <td>{test.skipped}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const LeaderboardTable = ({ data, loading, error, onStartQuiz }) => {
  if (loading) return <div className="card">Loading leaderboard...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="card">
      <h2>Leaderboard</h2>
      {data.length === 0 ? (
        <p>No leaderboard data available.</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((player, index) => (
              <tr key={index}>
                <td>{player.name}</td>
                <td>{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="start-quiz-btn" onClick={onStartQuiz}>
        Start Test
      </button>
    </div>
  );
};

// Main Component
const Mock = ({ setQuestions, setQuizState }) => {
  const { username, facultyId, loading: authLoading } = useAuth();
  const location = useLocation();
  const dateTime = useDateTime();
  const { leaderboard, loading: leaderboardLoading, error: leaderboardError } = useLeaderboardData();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Renamed to match Sidebar expectation

  // Fetch questions and start quiz
  const startQuiz = useCallback(async () => {
    if (authLoading || !facultyId) {
      setError("Authentication in progress or faculty ID missing.");
      return;
    }

    setError(null);
    setFetching(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/mockexam/questions?faculty_id=${facultyId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        setError("Access denied. Please log in again.");
        localStorage.removeItem("authToken");
        navigate("/login", { replace: true });
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
    } finally {
      setFetching(false);
    }
  }, [authLoading, facultyId, navigate, setQuestions, setQuizState]);

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <Sidebar isOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? "Close" : "Menu"}
          </button>
          <h1>Welcome, {username}!</h1>
          <div className="user-info">
            <InfoCard label="Province" value={location.province} />
            <InfoCard label="City" value={location.city} />
            <InfoCard label="Date & Time" value={dateTime} />
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        {fetching && <div className="loading-message">Fetching questions...</div>}
        <div className="dashboard-grid">
          <TestHistoryTable data={TEST_HISTORY} />
          <LeaderboardTable
            data={leaderboard}
            loading={leaderboardLoading}
            error={leaderboardError}
            onStartQuiz={startQuiz}
          />
        </div>
      </main>
    </div>
  );
};

export default Mock;