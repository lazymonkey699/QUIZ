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
  const [countdown, setCountdown] = useState(3); // Countdown starts at 3 seconds
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const token = localStorage.getItem("authToken");

  // Initialize quiz state and fetch questions if needed
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

    if (!questions || questions.length === 0) {
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
              (chapter.subchapters || []).map((q) => ({
                id: q.id,
                question: q.question,
                options: Object.values(q.options || {}),
                correctAnswer: q.correct_answer,
              }))
            )
          );
          dispatch(setQuestions(allQuestions));
          dispatch(setTimeLeft(1800)); // Initialize timer to 10 minutes
        } catch (err) {
          console.error("[ERROR] Fetching questions:", err);
          dispatch(setError(true));
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [dispatch, navigate, facultyId, questions, token]);

  // Countdown logic before starting the quiz
  useEffect(() => {
    if (countdown <= 0) {
      setIsQuizStarted(true);
      return;
    }

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [countdown]);

  // Timer logic (runs only after quiz starts)
  useEffect(() => {
    if (!isQuizStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      dispatch(setTimeLeft(timeLeft - 1));
      if (timeLeft <= 0) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, dispatch, isQuizStarted]);

  // Submit answer to backend
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
        }),
      });

      if (!response.ok) throw new Error("Failed to submit answer");
    } catch (error) {
      console.error("Error submitting answer:", error);
      dispatch(setError(true));
    }
  };

  // Handle navigation and submission
  const handleNext = () => {
    if (selectedAnswers[currentIndex] === undefined) return;
    dispatch(setIsSubmitting(true));
    submitAnswer(currentIndex, selectedAnswers[currentIndex]);
    setTimeout(() => {
      dispatch(incrementIndex());
      dispatch(setIsSubmitting(false));
    }, 1000);
  };

  const handleSkip = () => {
    dispatch(setSelectedAnswer({ index: currentIndex, answer: 0 }));
    submitAnswer(currentIndex, 0);
    dispatch(incrementIndex());
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !isSubmitting) {
      dispatch(decrementIndex());
    }
  };

  const handleAnswerSelection = (answerValue) => {
    if (!isQuizStarted) return; // Prevent answer selection before quiz starts
    dispatch(setSelectedAnswer({ index: currentIndex, answer: answerValue }));
  };

  const handleSubmit = async () => {
    if (selectedAnswers[currentIndex] === undefined) return;

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
      console.error("Error fetching score:", error);
      dispatch(setError(true));
    }
  };

  // Optimize question navigation rendering with useMemo
  const questionNavButtons = useMemo(() => {
    return questions.map((_, index) => {
      const isSkipped = selectedAnswers[index] === 0;
      const isAttempted = selectedAnswers[index] !== undefined && selectedAnswers[index] !== 0;
      const isActive = index === currentIndex;

      return (
        <button
          key={index}
          className={`question-nav-btn ${isActive ? "active" : ""} ${isAttempted ? "attempted" : ""} ${isSkipped ? "skipped" : ""}`}
          onClick={() => dispatch(setCurrentIndex(index))}
          aria-label={`Go to question ${index + 1}`}
        >
          {index + 1}
        </button>
      );
    });
  }, [questions, currentIndex, selectedAnswers, dispatch]);

  if (error) {
    return <div className="error-message">An error occurred. Please try again or log in.</div>;
  }

  if (isLoading || !questions || questions.length === 0) {
    return <div className="loading-message">Loading questions...</div>;
  }

  if (!isQuizStarted) {
    return (
      <div className="countdown-container">
        <h1 className="fade-in">Engineering Licensing Practice Test</h1>
        <div className="countdown">
          Exam starts in {countdown}...
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1 className="fade-in">Engineering Licensing Practice Test</h1>
        <div className="timer-section">
          <div className="timer" aria-live="polite">
            Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="quiz-layout">
        {/* Main Question Section */}
        <div className="question-section card">
          <h3 className="question-title">
            Q{currentIndex + 1}: {questions[currentIndex].question}
          </h3>
          <ul className="options-list">
            {[1, 2, 3, 4].map((value) => (
              <li key={value}>
                <button
                  className={`option-btn ${selectedAnswers[currentIndex] === value ? "selected" : ""}`}
                  onClick={() => handleAnswerSelection(value)}
                  disabled={isSubmitting}
                  aria-label={`Select option ${value}`}
                  aria-pressed={selectedAnswers[currentIndex] === value}
                >
                  {questions[currentIndex].options[value - 1]}
                </button>
              </li>
            ))}
          </ul>

          <div className="quiz-buttons">
            {currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="nav-btn"
                aria-label="Go to previous question"
              >
                Previous
              </button>
            )}
            {currentIndex < questions.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="nav-btn skip-btn"
                  aria-label="Skip this question"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSubmitting || selectedAnswers[currentIndex] === undefined}
                  className="nav-btn next-btn"
                  aria-label="Go to next question"
                >
                  Next
                </button>
              </>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedAnswers[currentIndex] === undefined}
                className="nav-btn submit-btn"
                aria-label="Submit quiz"
              >
                Submit
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation Bar at Bottom */}
        <div className="question-nav-bar card">
          <div className="legend">
            <p className="attempted-box">Attempted</p>
            <p className="skipped-box">Skipped</p>
            <p className="not-attempted-box">Not Attempted</p>
          </div>
          <div className="question-nav">{questionNavButtons}</div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;