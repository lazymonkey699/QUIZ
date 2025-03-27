import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { setQuestions, setFacultyId, setTimeLeft, setError } from "./redux/quizSlice";
import "./CSS/ChapterQuiz.css";

const ChapterQuiz = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.quiz);
  const [isLoading, setIsLoading] = useState(false);
  const [chapterName, setChapterName] = useState("Loading...");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) {
      dispatch(setError(true));
      navigate("/login");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.faculty) {
        dispatch(setFacultyId(decodedToken.faculty));
      } else {
        console.error("Faculty ID missing in token");
        dispatch(setError(true));
        navigate("/login");
        return;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      dispatch(setError(true));
      navigate("/login");
      return;
    }

    const chapterId = sessionStorage.getItem("chapter_id");
    if (!chapterId) {
      dispatch(setError(true));
      navigate("/chapterwise");
      return;
    }

    const fetchChapterName = async () => {
      console.log("Fetching chapter name for chapterId:", chapterId); // Add logging
      try {
        const response = await fetch(`/chapter/${chapterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch chapter name");
        const data = await response.json();
        setChapterName(data.chapter || "Unknown Chapter");
      } catch (err) {
        console.error("[ERROR] Fetching chapter name:", err);
        setChapterName("Unknown Chapter");
      }
    };

    const fetchQuestions = async () => {
      console.log("Fetching questions for chapterId:", chapterId); // Add logging
      setIsLoading(true);
      try {
        const response = await fetch(`/chapter/questions?chapter_id=${chapterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch questions");
        const data = await response.json();
        console.log("API Response from /chapter/questions:", data); // Add logging

        // Add defensive checks
        if (!data.questions || !Array.isArray(data.questions)) {
          throw new Error("Invalid questions data: Expected an array");
        }

        const chapterQuestions = data.questions.map((q) => {
          if (!q.id || !q.question || !q.correct_answer) {
            console.warn("Invalid question data:", q);
            return null; // Skip invalid questions
          }
          return {
            id: q.id,
            question: q.question,
            options: q.options && typeof q.options === "object" ? Object.values(q.options) : [],
            correctAnswer: q.correct_answer,
          };
        }).filter(q => q !== null); // Remove invalid questions

        console.log("Transformed chapterQuestions:", chapterQuestions); // Add logging
        dispatch(setQuestions(chapterQuestions));
        dispatch(setTimeLeft(3600));
      } catch (err) {
        console.error("[ERROR] Fetching questions:", err);
        dispatch(setError(true));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapterName();
    fetchQuestions();
  }, [dispatch, navigate, token]);

  if (error) {
    return <div className="error-message">An error occurred. Please try again or log in.</div>;
  }

  if (isLoading) {
    return <div className="loading-message">Loading questions...</div>;
  }

  return (
    <div className="chapter-quiz-container">
      <h1>Chapter: {chapterName}</h1>
      <p>Questions loaded successfully!</p>
    </div>
  );
};

export default ChapterQuiz;