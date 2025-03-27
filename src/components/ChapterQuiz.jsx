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
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (hasRedirected) {
      console.log("Already redirected in ChapterQuiz, skipping token check");
      return;
    }

    if (!token) {
      console.error("No token found in ChapterQuiz");
      dispatch(setError(true));
      setHasRedirected(true);
      navigate("/login", { replace: true });
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      console.log("Decoded Token in ChapterQuiz:", decodedToken);
      if (decodedToken.faculty) {
        dispatch(setFacultyId(decodedToken.faculty));
      } else {
        console.error("Faculty ID missing in token in ChapterQuiz");
        dispatch(setError(true));
        setHasRedirected(true);
        navigate("/login", { replace: true });
        return;
      }

      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        console.error("Token expired in ChapterQuiz");
        localStorage.removeItem("authToken");
        dispatch(setError(true));
        setHasRedirected(true);
        navigate("/login", { replace: true });
        return;
      }
    } catch (error) {
      console.error("Error decoding token in ChapterQuiz:", error);
      dispatch(setError(true));
      setHasRedirected(true);
      navigate("/login", { replace: true });
      return;
    }

    if (!chapterQuestions || chapterQuestions.length === 0) {
      const fetchChapterQuestions = async () => {
        setIsLoading(true);
        try {
          const chapterId = sessionStorage.getItem("chapter_id");
          if (!chapterId) {
            console.error("Chapter ID missing in sessionStorage in ChapterQuiz");
            dispatch(setError(true));
            setHasRedirected(true);
            navigate("/chapterwise", { replace: true });
            return;
          }

          const mockQuestionsData = {
            questions: {
              level1: [
                {
                  subchapters: [
                    {
                      questions: [
                        {
                          id: "1",
                          question: `What is 2 + 2? (Chapter ${chapterId})`,
                          options: { a: "1", b: "2", c: "3", d: "4" },
                          correct_answer: "4",
                        },
                        {
                          id: "2",
                          question: `What is 3 + 3? (Chapter ${chapterId})`,
                          options: { a: "1", b: "2", c: "3", d: "6" },
                          correct_answer: "6",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          };

          console.log("Mock API Response:", mockQuestionsData);
          const allQuestions = Object.entries(mockQuestionsData.questions)
            .flatMap(([_, chapters]) =>
              chapters.flatMap((chapter) =>
                (chapter.subchapters || []).map((subchapter) =>
                  (subchapter.questions || []).map((q) => ({
                    id: q.id,
                    question: q.question,
                    options: Object.values(q.options || {}),
                    correctAnswer: q.correct_answer,
                  }))
                )
              )
            )
            .flat();
          console.log("Transformed chapterQuestions:", allQuestions);
          dispatch(setChapterQuestions(allQuestions));
          dispatch(setChapterTimeLeft(1800));
        } catch (err) {
          console.error("[ERROR] Fetching chapter questions in ChapterQuiz:", err);
          dispatch(setError(true));
        } finally {
          setIsLoading(false);
        }
      };
      fetchChapterQuestions();
    }
  }, [dispatch, navigate, facultyId, chapterQuestions, token, hasRedirected]);

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

  useEffect(() => {
    if (!isQuizStarted || chapterTimeLeft <= 0) return;

    const timer = setInterval(() => {
      dispatch(setChapterTimeLeft(chapterTimeLeft - 1));
      if (chapterTimeLeft <= 0) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [chapterTimeLeft, dispatch, isQuizStarted]);

  const submitAnswer = async (questionIndex, answerIndex) => {
    if (!facultyId || !token || hasRedirected) {
      console.log("Skipping submitAnswer due to missing facultyId, token, or redirect");
      return;
    }

    try {
      const response = await fetch("/chapterquiz/answer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: chapterQuestions[questionIndex].id,
          answer_index: answerIndex,
        }),
      });
      if (response.status === 403) {
        console.error("Access denied: Invalid permissions for submitting answer in ChapterQuiz");
        localStorage.removeItem("authToken");
        dispatch(setError(true));
        setHasRedirected(true);
        navigate("/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("Failed to submit answer");
    } catch (error) {
      console.error("Error submitting answer in ChapterQuiz:", error);
      dispatch(setError(true));
    }
  };

  const handleNext = () => {
    if (selectedChapterAnswers[currentChapterIndex] === undefined) return;
    dispatch(setIsChapterSubmitting(true));
    submitAnswer(currentChapterIndex, selectedChapterAnswers[currentChapterIndex]);
    setTimeout(() => {
      dispatch(incrementChapterIndex());
      dispatch(setIsChapterSubmitting(false));
    }, 1000);
  };

  const handleSkip = () => {
    dispatch(setSelectedChapterAnswer({ index: currentChapterIndex, answer: 0 }));
    submitAnswer(currentChapterIndex, 0);
    dispatch(incrementChapterIndex());
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
    if (selectedChapterAnswers[currentChapterIndex] === undefined || hasRedirected) {
      console.log("Skipping handleSubmit due to unselected answer or redirect");
      return;
    }

    try {
      const response = await fetch("/chapterquiz/score", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 403) {
        console.error("Access denied: Invalid permissions for fetching score in ChapterQuiz");
        localStorage.removeItem("authToken");
        dispatch(setError(true));
        setHasRedirected(true);
        navigate("/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch score");
      const scoreData = await response.json();
      localStorage.setItem("chapterQuizScoreData", JSON.stringify(scoreData));
      navigate("/chapter-score", { replace: true });
    } catch (error) {
      console.error("Error fetching score in ChapterQuiz:", error);
      dispatch(setError(true));
    }
  };

  const questionNavButtons = useMemo(() => {
    return chapterQuestions.map((_, index) => {
      const isSkipped = selectedChapterAnswers[index] === 0;
      const isAttempted = selectedChapterAnswers[index] !== undefined && selectedChapterAnswers[index] !== 0;
      const isActive = index === currentChapterIndex;

      return (
        <button
          key={index}
          className={`question-nav-btn ${isActive ? "active" : ""} ${isAttempted ? "attempted" : ""} ${isSkipped ? "skipped" : ""}`}
          onClick={() => dispatch(setCurrentChapterIndex(index))}
          aria-label={`Go to question ${index + 1}`}
        >
          {index + 1}
        </button>
      );
    });
  }, [chapterQuestions, currentChapterIndex, selectedChapterAnswers, dispatch]);

  if (error) {
    return <div className="error-message">An error occurred. Please try again or log in.</div>;
  }

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
            Q{currentChapterIndex + 1}: {chapterQuestions[currentChapterIndex].question}
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
            {currentChapterIndex < chapterQuestions.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  disabled={isChapterSubmitting}
                  className="nav-btn skip-btn"
                  aria-label="Skip this question"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={isChapterSubmitting || selectedChapterAnswers[currentChapterIndex] === undefined}
                  className="nav-btn next-btn"
                  aria-label="Go to next question"
                >
                  Next
                </button>
              </>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isChapterSubmitting || selectedChapterAnswers[currentChapterIndex] === undefined}
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