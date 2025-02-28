import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; // Correct import for jwt-decode
import "./CSS/StudentDashboard.css";

const StudentDashboard = ({ setQuestions, setQuizState }) => {
  const [username, setUsername] = useState("");
  const [facultyId, setFacultyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log("Token from localStorage:", token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded Token:", decoded);
        setUsername(decoded.sub);
        setFacultyId(decoded.faculty); // Assumes 'faculty' is numeric or convertible to number
      } catch (err) {
        console.error("Invalid token", err);
      }
    } else {
      console.log("No token found in localStorage");
    }
  }, []);

  const startQuiz = async () => {
    console.log("Faculty ID:", facultyId);
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

      console.log("Making API request to fetch questions...");
      const questionsResponse = await fetch(
        `/practisetest//questions?faculty_id=${facultyId}`,
        {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        }
      );

      if (!questionsResponse.ok) {
        console.error("API request failed:", questionsResponse.statusText);
        throw new Error(`Error fetching questions: ${questionsResponse.statusText}`);
      }

      const questionsData = await questionsResponse.json();
      console.log("Fetched questions data:", questionsData);

      if (!questionsData.questions || Object.keys(questionsData.questions).length === 0) {
        console.error("Invalid questions structure:", questionsData.questions);
        throw new Error("No questions found in response");
      }

      // Process questions from all levels
      const allFormattedQuestions = Object.keys(questionsData.questions).flatMap((level) => {
        const levelQuestions = questionsData.questions[level];
        return levelQuestions.flatMap((chapter) =>
          chapter.subchapters.map((q) => ({
            id: q.id,
            question: q.question,
            options: Object.values(q.options), // Converts options object to array
            correctAnswer: q.correct_answer,
          }))
        );
      });
      console.log("Formatted Questions:", allFormattedQuestions);

      setQuestions(allFormattedQuestions);
      setQuizState("active");
      navigate("/quiz");
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  return (
    <div className="student-dashboard">
      {/* Start Quiz Section */}
      <div className="quiz-section">
        <h1>Welcome, {username ? username : "Guest"}</h1>
        <button className="start-quiz-btn" onClick={startQuiz}>
          Start Quiz
        </button>
      </div>

     </div>
  );
};

export default StudentDashboard;
