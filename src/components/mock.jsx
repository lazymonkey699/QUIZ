import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; // Use default import
import "./CSS/StudentDashboard.css";

const Mock = ({ setQuestions, setQuizState }) => {
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
        setFacultyId(decoded.faculty);
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
      console.log("Token before API request:", token);
      if (!token) {
        console.error("No auth token found");
        return;
      }

      console.log("Making API request to fetch questions...");
      const questionsResponse = await fetch(
        `/mockexam/questions?faculty_id=${facultyId}`,
        {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        }
      );

      if (!questionsResponse.ok) {
        console.error("API request failed:", questionsResponse.statusText);
        throw new Error(
          `Error fetching questions: ${questionsResponse.statusText}`
        );
      }

      const questionsData = await questionsResponse.json();
      console.log("Fetched questions data:", questionsData);

      if (
        !questionsData.questions ||
        Object.keys(questionsData.questions).length === 0
      ) {
        console.error("Invalid questions structure:", questionsData.questions);
        throw new Error("No questions found in response");
      }

      // Find the first available level in the questions data
      const availableLevel = Object.keys(questionsData.questions).find(
        (level) => questionsData.questions[level]
      );
      console.log("Available Level:", availableLevel);

      if (availableLevel) {
        const levelQuestions = questionsData.questions[availableLevel];
        console.log("Level Questions:", levelQuestions);

        // Process and format questions for the quiz
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
        navigate("/mockquiz");
      } else {
        console.error("No question levels found in the response");
        throw new Error("No question levels found in response");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  return (
    <div className="student-dashboard">
      <h1>Welcome, {username}</h1>
      <button onClick={startQuiz}>Start Quiz</button>
    </div>
  );
};

export default Mock;
