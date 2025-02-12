import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./CSS/Dashboard.css";

const Dashboard = ({ setQuestions, setQuizState }) => {
  const [username, setUsername] = useState("");
  const [facultyId, setFacultyId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const navigate = useNavigate();

  // Decode JWT Token on Load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("[ERROR] No auth token found");
      return;
    }

    console.log("[DEBUG] Using Token:", token);

    try {
      const decoded = jwtDecode(token);
      console.log("[DEBUG] Decoded Token:", decoded);
      setUsername(decoded.sub);
      setFacultyId(decoded.faculty);
    } catch (err) {
      console.error("[ERROR] Invalid token:", err);
    }
  }, []);

  // Update Time Every Second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Chapters from /allchapters
  useEffect(() => {
    const fetchChapters = async () => {
      console.log("[DEBUG] Fetching chapters from /allchapters...");
  
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("[ERROR] No auth token found");
          return;
        }
  
        const response = await fetch("/allchapters", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!response.ok) {
          throw new Error(`Error fetching chapters: ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log("[DEBUG] Full API Response:", data);
  
        // Ensure response has expected structure
        if (!Array.isArray(data)) {
          console.error("[ERROR] Unexpected response format, expected an array.");
          return;
        }
  
        if (data.length === 0) {
          console.warn("[WARNING] No chapters found in response.");
        } else {
          console.log("[DEBUG] Successfully fetched chapters:", data);
        }
  
        // Ensure proper mapping (Chapter_id → id)
        const formattedChapters = data.map((chapter) => ({
          id: chapter.Chapter_id, // Fixing ID naming inconsistency
          name: chapter.chapter,
        }));
  
        console.log("[DEBUG] Formatted Chapters:", formattedChapters);
        setChapters(formattedChapters);
      } catch (err) {
        console.error("[ERROR] Fetching chapters failed:", err);
      }
    };
  
    fetchChapters();
  }, []);
  

  // Function to Start Quiz (Handles Both Practice, Mock & Chapter-wise)
  const startQuiz = async (type, chapterId = null) => {
    console.log(`[DEBUG] Start Quiz triggered. Type: ${type}, Chapter ID: ${chapterId}`);
  
    if (!facultyId) {
      console.error("[ERROR] Faculty ID is missing");
      return;
    }
  
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("[ERROR] No auth token found");
        return;
      }
  
      let apiEndpoint = "";
      let navigateTo = "";
  
      if (type === "practice") {
        apiEndpoint = "/practisetest/questions";
        navigateTo = "/quiz";
      } else if (type === "mock") {
        apiEndpoint = "/mockexam/questions";
        navigateTo = "/mockquiz";
      } else if (type === "chapter") {
        if (!chapterId) {
          console.error("[ERROR] Chapter ID is missing");
          return;
        }
        apiEndpoint = `/practise/chapters?chapter_id=${chapterId}`;
        navigateTo = "/chapterwise";
      }
  
      console.log(`[DEBUG] Fetching questions from: ${apiEndpoint} for Faculty ID: ${facultyId}`);
  
      const response = await fetch(apiEndpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log(`[DEBUG] Response Status: ${response.status}`);
  
      if (!response.ok) {
        throw new Error(`Error fetching questions: ${response.statusText}`);
      }
  
      const questionsData = await response.json();
      console.log("[DEBUG] Fetched Questions:", questionsData);
  
      if (!questionsData.subchapters || questionsData.subchapters.length === 0) {
        console.warn("[WARNING] No questions found in response");
        throw new Error("No questions found in response");
      }
  
      // ✅ Ensure `options` is valid to prevent error
      const formattedQuestions = questionsData.subchapters.flatMap((subchapter) =>
        subchapter.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options ? Object.values(q.options) : [], // 👈 Fix: Ensures `options` exist
          correctAnswer: q.correct_answer,
        }))
      );
  
      console.log("[DEBUG] Processed Questions:", formattedQuestions);
  
      setQuestions(formattedQuestions);
      setQuizState("active");
      navigate(navigateTo);
    } catch (err) {
      console.error("[ERROR] Fetching questions failed:", err);
    }
  };
  

  return (
    <div className="dashboard-container">
      <div className="header">
        <h2>Student Portal</h2>
        <p>Welcome, {username || "Guest"}</p>
        <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</span>
      </div>

      <div className="dashboard-content">
        <div className="quiz-section">
          <h3>Test Your Knowledge</h3>
          <button onClick={() => startQuiz("practice")} className="start-quiz-btn">
            Start Practice Test
          </button>
        </div>

        <div className="chapter-section">
          <h3>Practice Chapter-wise</h3>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
          >
            <option value="">Select a Chapter</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
          <button
            className="start-test-btn"
            onClick={() => selectedChapter && startQuiz("chapter", selectedChapter)}
            disabled={!selectedChapter}
          >
            Start Test
          </button>
        </div>
      </div>

      <div className="mock-leaderboard-section">
        <div className="mock-section">
          <h3>Scheduled Mock Test</h3>
          <ul>
            <li>Mock Test 1 - Feb 20, 2025</li>
            <li>Mock Test 2 - Mar 5, 2025</li>
          </ul>
          <button onClick={() => startQuiz("mock")} className="start-mock-btn">
            Start Mock Test
          </button>
        </div>

        <div className="leaderboard-section">
          <h3>Leaderboard</h3>
          <ol>
            <li>Alice - 95</li>
            <li>Bob - 92</li>
            <li>Charlie - 89</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
