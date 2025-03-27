import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  setQuestions,
  setFacultyId,
  setSelectedAnswer,
  setCurrentIndex,
  incrementIndex,
  decrementIndex,
  setIsSubmitting,
  setTimeLeft,
  setError,
} from "./redux/quizSlice";
import "./CSS/Quiz.css";

const Quiz = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    questions,
    currentIndex,
    selectedAnswers,
    facultyId,
    timeLeft,
    isSubmitting,
    error,
  } = useSelector((state) => state.quiz);

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [visited, setVisited] = useState(new Set());
  const token = localStorage.getItem("authToken");

  // Set facultyId
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
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      dispatch(setError(true));
      navigate("/login");
    }
  }, [dispatch, navigate, token]);

  // Fetch questions
  useEffect(() => {
    if (!facultyId || questions?.length > 0) return;
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/practisetest/questions?faculty_id=${facultyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch questions");
        const data = await response.json();
        const allQuestions = Object.entries(data.questions).flatMap(([_, chapters]) =>
          chapters.flatMap((chapter) =>
            (chapter.subchapters || []).map((q) => {
              console.log("Raw level for question:", q.id, q.level); // Debug raw level
              return {
                id: q.id,
                question: q.question,
                options: Object.values(q.options || {}),
                correctAnswer: q.correct_answer,
                level: q.level !== undefined ? q.level : 1, // Ensure level is set
              };
            })
          )
        );
        console.log("Mapped Questions:", allQuestions);
        dispatch(setQuestions(allQuestions));
        dispatch(setTimeLeft(1800));
      } catch (err) {
        console.error("[ERROR] Fetching questions:", err);
        dispatch(setError(true));
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [dispatch, facultyId, questions, token]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) {
      setIsQuizStarted(true);
      return;
    }
    const countdownTimer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(countdownTimer);
  }, [countdown]);

  // Timer
  useEffect(() => {
    if (!isQuizStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      dispatch(setTimeLeft(timeLeft - 1));
      if (timeLeft <= 1) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, dispatch, isQuizStarted]);

  // Submit answer
  const submitAnswer = async (questionIndex, answerIndex) => {
    if (!facultyId || !token) return;
    try {
      const response = await fetch("/practisetest/answer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: questions[questionIndex].id,
          answer_index: answerIndex,
          level: questions[questionIndex].level,
        }),
      });
      if (!response.ok) throw new Error("Failed to submit answer");
    } catch (error) {
      console.error("Submit Error:", error);
      dispatch(setError(true));
    }
  };

  // Handlers
  const handleNext = () => {
    if (selectedAnswers[currentIndex] === undefined) return;
    dispatch(setIsSubmitting(true));
    submitAnswer(currentIndex, selectedAnswers[currentIndex]);
    setVisited(prev => new Set(prev).add(currentIndex));
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        dispatch(incrementIndex());
      }
      dispatch(setIsSubmitting(false));
    }, 500);
  };

  const handleSkip = () => {
    dispatch(setSelectedAnswer({ index: currentIndex, answer: 0 }));
    submitAnswer(currentIndex, 0);
    setVisited(prev => new Set(prev).add(currentIndex));
    if (currentIndex < questions.length - 1) {
      dispatch(incrementIndex());
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !isSubmitting) dispatch(decrementIndex());
  };

  const handleAnswerSelection = (answerValue) => {
    if (!isQuizStarted) return;
    dispatch(setSelectedAnswer({ index: currentIndex, answer: answerValue }));
  };

  const handleSubmit = async () => {
    for (let i = 0; i < questions.length; i++) {
      const answer = selectedAnswers[i] !== undefined ? selectedAnswers[i] : 0;
      await submitAnswer(i, answer);
    }
    try {
      const response = await fetch("/practisetest/score", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch score");
      const scoreData = await response.json();
      localStorage.setItem("quizScoreData", JSON.stringify(scoreData));
      navigate("/score");
    } catch (error) {
      console.error("Score Error:", error);
      dispatch(setError(true));
    }
  };

  const questionNavButtons = useMemo(() => {
    return questions.map((q, index) => {
      const isSkipped = selectedAnswers[index] === 0;
      const isAttempted = selectedAnswers[index] !== undefined && selectedAnswers[index] !== 0;
      const isActive = index === currentIndex;
      return (
        <button
          key={index}
          className={`question-nav-btn ${isActive ? "active" : ""} ${isAttempted ? "attempted" : ""} ${isSkipped ? "skipped" : ""} level-${q.level}`}
          onClick={() => dispatch(setCurrentIndex(index))}
          aria-label={`Go to question ${index + 1}, Level ${q.level}`}
        >
          {index + 1}
        </button>
      );
    });
  }, [questions, currentIndex, selectedAnswers, dispatch]);

  // Check if all questions have been answered or skipped
  const allQuestionsProcessed = questions.every((_, index) => selectedAnswers[index] !== undefined);

  if (error) return <div className="error-message">Error occurred. Please try again or log in.</div>;
  if (isLoading || !questions || questions.length === 0) return <div className="loading-message">Loading...</div>;
  if (!isQuizStarted) {
    return (
      <div className="countdown-container">
        <h1>Engineering Practice Test</h1>
        <div className="countdown">Starting in {countdown}...</div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>Engineering Practice Test</h1>
        <div className="timer-section">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      </div>
      <div className="quiz-layout">
        <div className="question-section card">
          <h3 className="question-title">
            Q{currentIndex + 1}/{questions.length}: {questions[currentIndex].question}
            <span className={`level-marker level-${questions[currentIndex].level}`}>
              Level {questions[currentIndex].level}
            </span>
          </h3>
          <ul className="options-list">
            {[1, 2, 3, 4].map((value) => (
              <li key={value}>
                <button
                  className={`option-btn ${selectedAnswers[currentIndex] === value ? "selected" : ""}`}
                  onClick={() => handleAnswerSelection(value)}
                  disabled={isSubmitting}
                >
                  {questions[currentIndex].options[value - 1]}
                </button>
              </li>
            ))}
          </ul>
          <div className="quiz-buttons">
            {currentIndex > 0 && (
              <button onClick={handlePrevious} disabled={isSubmitting} className="nav-btn">
                Previous
              </button>
            )}
            <button onClick={handleSkip} disabled={isSubmitting} className="nav-btn skip-btn">
              Skip
            </button>
            {currentIndex < questions.length - 1 && (
              <button
                onClick={handleNext}
                disabled={isSubmitting || selectedAnswers[currentIndex] === undefined}
                className="nav-btn next-btn"
              >
                Next
              </button>
            )}
          </div>
        </div>
        <div className="question-nav-bar card">
          <div className="legend">
            <span className="attempted-box">Attempted</span>
            <span className="skipped-box">Skipped</span>
            <span className="not-attempted-box">Not Attempted</span>
          </div>
          <div className="question-nav">{questionNavButtons}</div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !allQuestionsProcessed}
            className="nav-btn submit-btn"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;