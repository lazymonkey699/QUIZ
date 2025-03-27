import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; 
import Sidebar from "./sidebar"; // Importing the Sidebar component
import "./CSS/StudentDashboard.css";

const StudentDashboard = ({ setQuestions, setQuizState }) => {
  // Debug props to verify they are correctly passed
  console.log("[DEBUG] Props received:", {
    setQuestionsType: typeof setQuestions,
    setQuizStateType: typeof setQuizState
  });

  const [username, setUsername] = useState("Guest");
  const [facultyId, setFacultyId] = useState(null);
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState({ city: "Loading...", province: "Loading..." });

  const navigate = useNavigate();

  // Fetch location using IP-API
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
      .catch(() => setLocation({ city: "Unknown", province: "Unknown" }));
  }, []);

  // Real-time Date & Time
  useEffect(() => {
    const updateDateTime = () => {
      setDateTime(new Intl.DateTimeFormat("en-US", { 
        dateStyle: "full", 
        timeStyle: "short", 
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      }).format(new Date()));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle authentication & extract user info
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.sub || "Guest");
        setFacultyId(decoded.faculty);
        console.log("[DEBUG] Decoded token:", { username: decoded.sub, facultyId: decoded.faculty });
      } catch (err) {
        console.error("[ERROR] Invalid token:", err);
      }
    } else {
      console.warn("[WARNING] No auth token found");
    }
  }, []);

  // Start Quiz Function with improved error handling
  const startQuiz = async () => {
    if (!facultyId) {
      console.error("[ERROR] Faculty ID is missing");
      return;
    }

    // Validate that setQuestions and setQuizState are functions
    if (typeof setQuestions !== 'function') {
      console.error("[ERROR] setQuestions is not a function. Type:", typeof setQuestions);
      return;
    }

    if (typeof setQuizState !== 'function') {
      console.error("[ERROR] setQuizState is not a function. Type:", typeof setQuizState);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("[ERROR] No auth token found");
        return;
      }

      console.log(`[DEBUG] Fetching questions for Faculty ID: ${facultyId}`);
      const response = await fetch(`/practisetest/questions?faculty_id=${facultyId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      console.log(`[DEBUG] Response Status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Error fetching questions: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[DEBUG] Received data structure:", Object.keys(data));

      if (!data.questions || Object.keys(data.questions).length === 0) {
        console.warn("[WARNING] No questions found in response");
        throw new Error("No questions found in response");
      }

      // More robust data processing with null checks
      const allQuestions = Object.keys(data.questions || {}).flatMap((level) =>
        (data.questions[level] || []).flatMap((chapter) =>
          (chapter.subchapters || []).map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options ? Object.values(q.options) : [], // Added null check
            correctAnswer: q.correct_answer,
          }))
        )
      );

      console.log(`[DEBUG] Processed ${allQuestions.length} questions`);
      
      // Set state and navigate
      setQuestions(allQuestions);
      setQuizState("active");
      navigate("/quiz");
    } catch (err) {
      console.error("[ERROR] Error fetching questions:", err);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar /> {/* Sidebar Component Here */}

      {/* Main Content */}
      <main className="dashboard-content">
        <h1>Welcome, {username}!</h1>

        {/* User Info */}
        <div className="user-info">
          <div className="info-box"><strong>Province:</strong> {location.province}</div>
          <div className="info-box"><strong>City:</strong> {location.city}</div>
          <div className="info-box"><strong>Date & Time:</strong> {dateTime}</div>
        </div>

        {/* Test History */}
        <div className="test-history">
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
              <tr><td>1</td><td>85</td><td>2</td></tr>
              <tr><td>2</td><td>90</td><td>1</td></tr>
              <tr><td>3</td><td>75</td><td>3</td></tr>
            </tbody>
          </table>
        </div>

        {/* Practice Test Counter */}
        <div className="practice-counter">
          <h2>Practice Test Counter</h2>
          <p><strong>5 Times Taken</strong></p>
        </div>

        {/* Start Quiz Button */}
        <button className="start-quiz-btn" onClick={startQuiz}>Start Test</button>
      </main>
    </div>
  );
};

export default StudentDashboard;