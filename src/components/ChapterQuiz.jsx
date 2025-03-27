import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  setChapterQuestions,
  setFacultyId,
  setSelectedChapterAnswer,
  setCurrentChapterIndex,
  incrementChapterIndex,
  decrementChapterIndex,
  setIsChapterSubmitting,
  setChapterTimeLeft,
  setError,
} from "./redux/chapterQuizSlice";
import "./CSS/ChapterQuiz.css";

const ChapterQuiz = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    chapterQuestions,
    currentChapterIndex,
    selectedChapterAnswers,
    facultyId,
    chapterTimeLeft,
    isChapterSubmitting,
    error,
  } = useSelector((state) => state.chapterQuiz);

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [visited, setVisited] = useState(new Set());
  const token = localStorage.getItem("authToken");

  // Token validation
  useEffect(() => {
    if (hasRedirected) return;
    if (!token) {
      dispatch(setError("No authentication token found"));
      setHasRedirected(true);
      navigate("/login", { replace: true });
      return;
    }
    try {
      const decodedToken = jwtDecode(token);
      if (!decodedToken.faculty) {
        dispatch(setError("Faculty ID missing in token"));
        setHasRedirected(true);
        navigate("/login", { replace: true });
        return;
      }
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        localStorage.removeItem("authToken");
        dispatch(setError("Session expired"));
        setHasRedirected(true);
        navigate("/login", { replace: true });
        return;
      }
      dispatch(setFacultyId(decodedToken.faculty));
    } catch (error) {
      dispatch(setError("Invalid token"));
      setHasRedirected(true);
      navigate("/login", { replace: true });
    }
  }, [dispatch, navigate, token, hasRedirected]);

  // Fetch chapter questions
  useEffect(() => {
    if (!facultyId || chapterQuestions.length > 0 || hasRedirected) return;

    const fetchChapterQuestions = async () => {
      setIsLoading(true);
      try {
        const chapterId = sessionStorage.getItem("chapter_id");
        if (!chapterId) {
          dispatch(setError("No chapter selected"));
          setHasRedirected(true);
          navigate("/chapterwise", { replace: true });
          return;
        }

        const response = await fetch(`/practise/chapters?chapter_id=${chapterId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            localStorage.removeItem("authToken");
            throw new Error("Unauthorized access to chapter questions");
          }
          throw new Error("Failed to fetch chapter questions");
        }

        const data = await response.json();
        const allQuestions = data.subchapters.flatMap(subchapter =>
          subchapter.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: Object.values(q.options),
            correctAnswer: q.correct_answer,
            level: q.level,
          }))
        );

        dispatch(setChapterQuestions(allQuestions));
        dispatch(setChapterTimeLeft(1800));
      } catch (err) {
        console.error("[ERROR] Fetching chapter questions:", err.message);
        dispatch(setError(err.message));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapterQuestions();
  }, [dispatch, navigate, facultyId, token, hasRedirected]);

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
    if (!isQuizStarted || chapterTimeLeft <= 0) return;
    const timer = setInterval(() => {
      dispatch(setChapterTimeLeft(chapterTimeLeft - 1));
      if (chapterTimeLeft <= 1) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [chapterTimeLeft, dispatch, isQuizStarted]);

  // Submit all answers sequentially
  const submitAllAnswers = async () => {
    if (!facultyId || !token || hasRedirected) return;
    try {
      const chapterId = sessionStorage.getItem("chapter_id");
      if (!chapterId) {
        throw new Error("No chapter ID found");
      }

      // Submit each answer sequentially
      for (let i = 0; i < chapterQuestions.length; i++) {
        const answer = {
          chapter_id: parseInt(chapterId),
          question_id: chapterQuestions[i].id,
          answer_index: selectedChapterAnswers[i] !== undefined ? selectedChapterAnswers[i] : 0,
        };

        const response = await fetch("/practise/chapteranswer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(answer),
        });

        if (!response.ok) {
          if (response.status === 403) {
            localStorage.removeItem("authToken");
            throw new Error("Unauthorized access to submit answers");
          }
          throw new Error(`Failed to submit answer for question ${chapterQuestions[i].id}`);
        }
      }
    } catch (error) {
      console.error("Error submitting answers:", error.message);
      dispatch(setError(error.message));
    }
  };

  // Handlers
  const handleNext = () => {
    if (selectedChapterAnswers[currentChapterIndex] === undefined) return;
    dispatch(setIsChapterSubmitting(true));
    setVisited(prev => new Set(prev).add(currentChapterIndex));
    setTimeout(() => {
      if (currentChapterIndex < chapterQuestions.length - 1) {
        dispatch(incrementChapterIndex());
      } else {
        handleSubmit(); // Auto-submit on last question
      }
      dispatch(setIsChapterSubmitting(false));
    }, 500);
  };

  const handleSkip = () => {
    dispatch(setSelectedChapterAnswer({ index: currentChapterIndex, answer: 0 }));
    setVisited(prev => new Set(prev).add(currentChapterIndex));
    setTimeout(() => {
      if (currentChapterIndex < chapterQuestions.length - 1) {
        dispatch(incrementChapterIndex());
      } else {
        handleSubmit(); // Auto-submit on last question
      }
    }, 500);
  };

  const handlePrevious = () => {
    if (currentChapterIndex > 0 && !isChapterSubmitting) {
      dispatch(decrementChapterIndex());
    }
  };

  const handleAnswerSelection = (answerValue) => {
    if (!isQuizStarted) return;
    dispatch(setSelectedChapterAnswer({ index: currentChapterIndex, answer: answerValue }));
  };

  const handleSubmit = async () => {
    if (hasRedirected) return;

    dispatch(setIsChapterSubmitting(true));
    try {
      // Submit all answers sequentially
      await submitAllAnswers();

      // Fetch the score
      const chapterId = sessionStorage.getItem("chapter_id");
      const response = await fetch(`/practise/chapterscore?chapter_id=${chapterId}`, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          localStorage.removeItem("authToken");
          throw new Error("Unauthorized access to fetch score");
        }
        throw new Error("Failed to fetch score");
      }

      const scoreData = await response.json();
      localStorage.setItem("chapterQuizScoreData", JSON.stringify(scoreData));
      navigate("/chapter-score", { replace: true });
    } catch (error) {
      console.error("Error in submission:", error.message);
      dispatch(setError(error.message));
    } finally {
      dispatch(setIsChapterSubmitting(false));
    }
  };

  // Memoized navigation buttons
  const questionNavButtons = useMemo(() => {
    return chapterQuestions.map((q, index) => {
      const isSkipped = selectedChapterAnswers[index] === 0;
      const isAttempted = selectedChapterAnswers[index] !== undefined && selectedChapterAnswers[index] !== 0;
      const isActive = index === currentChapterIndex;
      return (
        <button
          key={q.id}
          className={`question-nav-btn ${isActive ? "active" : ""} ${isAttempted ? "attempted" : ""} ${isSkipped ? "skipped" : ""} level-${q.level}`}
          onClick={() => dispatch(setCurrentChapterIndex(index))}
          aria-label={`Go to question ${index + 1}, Level ${q.level}`}
        >
          {index + 1}
        </button>
      );
    });
  }, [chapterQuestions, currentChapterIndex, selectedChapterAnswers, dispatch]);

  // Check if all questions are processed
  const allQuestionsProcessed = chapterQuestions.every((_, index) => selectedChapterAnswers[index] !== undefined);

  // Render states
  if (error) return <div className="error-message">Error: {error}</div>;
  if (isLoading || !chapterQuestions || chapterQuestions.length === 0) {
    return <div className="loading-message">Loading chapter questions...</div>;
  }
  if (!isQuizStarted) {
    return (
      <div className="countdown-container">
        <h1 className="fade-in">Chapter-wise Quiz</h1>
        <div className="countdown">Exam starts in {countdown}...</div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1 className="fade-in">Chapter-wise Quiz</h1>
        <div className="timer-section">
          <div className="timer" aria-live="polite">
            Time Left: {Math.floor(chapterTimeLeft / 60)}:{(chapterTimeLeft % 60).toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="quiz-layout">
        <div className="question-section card">
          <h3 className="question-title">
            Q{currentChapterIndex + 1}/{chapterQuestions.length}: {chapterQuestions[currentChapterIndex].question}
            <span className={`level-marker level-${chapterQuestions[currentChapterIndex].level}`}>
              Level {chapterQuestions[currentChapterIndex].level}
            </span>
          </h3>
          <ul className="options-list">
            {[1, 2, 3, 4].map((value) => (
              <li key={value}>
                <button
                  className={`option-btn ${selectedChapterAnswers[currentChapterIndex] === value ? "selected" : ""}`}
                  onClick={() => handleAnswerSelection(value)}
                  disabled={isChapterSubmitting}
                  aria-label={`Select option ${value}`}
                  aria-pressed={selectedChapterAnswers[currentChapterIndex] === value}
                >
                  {chapterQuestions[currentChapterIndex].options[value - 1]}
                </button>
              </li>
            ))}
          </ul>

          <div className="quiz-buttons">
            {currentChapterIndex > 0 && (
              <button
                onClick={handlePrevious}
                disabled={isChapterSubmitting}
                className="nav-btn"
                aria-label="Go to previous question"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleSkip}
              disabled={isChapterSubmitting}
              className="nav-btn skip-btn"
              aria-label="Skip this question"
            >
              Skip
            </button>
            {currentChapterIndex < chapterQuestions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isChapterSubmitting || selectedChapterAnswers[currentChapterIndex] === undefined}
                className="nav-btn next-btn"
                aria-label="Go to next question"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isChapterSubmitting || !allQuestionsProcessed}
                className="nav-btn submit-btn"
                aria-label="Submit quiz"
              >
                Submit
              </button>
            )}
          </div>
        </div>

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

export default ChapterQuiz;