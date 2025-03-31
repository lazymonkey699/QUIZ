import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setError, resetChapterQuiz } from "./redux/chapterQuizSlice";
import "./CSS/Score.css"; // Reuse Score.css for consistent styling

const ChapterScore = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScoreData = () => {
      const storedScore = localStorage.getItem("chapterQuizScoreData");
      const token = localStorage.getItem("authToken");

      if (!token) {
        dispatch(setError("No authentication token found"));
        navigate("/chapterwise", { replace: true });
        return;
      }

      if (!storedScore) {
        dispatch(setError("No score data found"));
        navigate("/chapterwise", { replace: true });
        return;
      }

      try {
        const parsedScore = JSON.parse(storedScore);
        console.log("Loaded score data:", JSON.stringify(parsedScore, null, 2));
        console.log("Number of questions:", parsedScore.questions.length);
        setScoreData(parsedScore);
      } catch (error) {
        console.error("Error parsing score data:", error);
        dispatch(setError("Invalid score data"));
        navigate("/chapterwise", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadScoreData();
  }, [dispatch, navigate]);

  // Handle return to chapter selection
  const handleReturn = () => {
    localStorage.removeItem("chapterQuizScoreData");
    dispatch(resetChapterQuiz());
    navigate("/chapterwise", { replace: true });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Chapter Assessment Results...</p>
      </div>
    );
  }

  if (!scoreData || !scoreData.questions) {
    return (
      <div className="error-container">
        <p>No assessment data available. Please try again or contact support.</p>
      </div>
    );
  }

  const totalQuestions = scoreData.questions.length;

  return (
    <div className="score-dashboard">
      <header className="score-header">
        <h1>Chapter Assessment Results</h1>
        <div className="score-summary">
          <span>Total Score: {scoreData.total_score}</span>
          <span>Total Questions: {totalQuestions}</span>
          <span>Completion Date: {scoreData.day}</span>
          <span>Time: {scoreData.start_time} - {scoreData.end_time}</span>
        </div>
      </header>

      <main className="results-container">
        {scoreData.questions.map((q, index) => {
          let status;
          if (q.user_answer === "Not Attempted" || q.user_answer === null || q.user_answer === undefined) {
            status = "Skipped";
          } else if (q.answer_status === "Correct") {
            status = "Correct";
          } else if (q.answer_status === "Incorrect") {
            status = "Incorrect";
          } else {
            status = "Skipped"; // Default to Skipped if status is unclear
          }

          return (
            <div key={index} className="question-card">
              <div className="question-header">
                <h3>
                  Problem {index + 1} {q.level && `(Level ${q.level})`}
                </h3>
                <span
                  className={`status-badge ${
                    status.toLowerCase() === "correct"
                      ? "correct"
                      : status.toLowerCase() === "incorrect"
                      ? "incorrect"
                      : "skipped"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="question-text">{q.question}</p>

              <div className="options-container">
                {Object.entries(q.options).map(([optIndex, option]) => {
                  const isCorrect = parseInt(optIndex) === q.correct_answer;
                  const isUserAnswer =
                    q.user_answer !== "Not Attempted" && parseInt(optIndex) === q.user_answer;
                  return (
                    <div
                      key={optIndex}
                      className={`option-item ${
                        isCorrect ? "correct" : isUserAnswer ? "incorrect" : ""
                      }`}
                    >
                      <span className="option-letter">
                        {String.fromCharCode(65 + parseInt(optIndex - 1))}.
                      </span>
                      <span className="option-text">{option}</span>
                      {isCorrect && <span className="check">✓</span>}
                      {isUserAnswer && !isCorrect && <span className="cross">✗</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      <footer className="score-footer">
        <button className="dashboard-btn" onClick={handleReturn}>
          Return to Chapter Selection
        </button>
      </footer>
    </div>
  );
};

export default ChapterScore;