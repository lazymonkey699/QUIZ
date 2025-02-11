import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./CSS/Dashboard.css";

const Dashboard = ({ setQuestions, setQuizState }) => {
  const [username, setUsername] = useState("");
  const [facultyId, setFacultyId] = useState(null);
  const [quizType, setQuizType] = useState("practice");
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.sub);
        setFacultyId(decoded.faculty);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startQuiz = async () => {
    if (!facultyId) {
      console.error("Faculty ID is missing");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const apiEndpoint = quizType === "practice" ? "/practisetest/questions" : "/mockexam/questions";
      const navigateTo = quizType === "practice" ? "/quiz" : "/mockquiz";

      const response = await fetch(`${apiEndpoint}?faculty_id=${facultyId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Error fetching questions: ${response.statusText}`);
      }

      const questionsData = await response.json();
      if (!questionsData.questions || Object.keys(questionsData.questions).length === 0) {
        throw new Error("No questions found in response");
      }

      const formattedQuestions = Object.keys(questionsData.questions).flatMap((level) => {
        return questionsData.questions[level].flatMap((chapter) =>
          chapter.subchapters.map((q) => ({
            id: q.id,
            question: q.question,
            options: Object.values(q.options),
            correctAnswer: q.correct_answer,
          }))
        );
      });

      setQuestions(formattedQuestions);
      setQuizState("active");
      navigate(navigateTo);
    } catch (err) {
      console.error("Error fetching questions:", err);
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
          <button onClick={startQuiz} className="start-quiz-btn">Start Quiz</button>
        </div>

        <div className="chapter-section">
          <h3>Practice Chapter-wise</h3>
          <select>
            <option>Computer Engineering</option>
            <option>Mathematics</option>
            <option>Physics</option>
          </select>
          <button className="start-test-btn">Start Test</button>
        </div>
      </div>

      <div className="mock-leaderboard-section">
        <div className="mock-section">
          <h3>Scheduled Mock Test</h3>
          <ul>
            <li>Mock Test 1 - Feb 20, 2025</li>
            <li>Mock Test 2 - Mar 5, 2025</li>
          </ul>
          <button onClick={() => setQuizType("mock")} className="start-mock-btn">Start Mock Test</button>
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
