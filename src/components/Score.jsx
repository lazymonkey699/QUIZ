import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Score.css";

const Score = () => {
    const navigate = useNavigate();
    const [scoreData, setScoreData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScore = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                navigate("/student-dashboard");
                return;
            }

            try {
                const response = await fetch("/practisetest/score", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch score data");
                }

                const data = await response.json();
                console.log("Full API response:", JSON.stringify(data, null, 2));
                console.log("Number of questions in questions array:", data.score.questions.length);
                setScoreData(data);
            } catch (error) {
                console.error("Error fetching score:", error);
                navigate("/student-dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchScore();
    }, [navigate]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading Assessment Results...</p>
            </div>
        );
    }

    if (!scoreData || !scoreData.score || !scoreData.score.questions) {
        return (
            <div className="error-container">
                <p>No assessment data available. Please contact your instructor.</p>
            </div>
        );
    }

    const totalQuestions = scoreData.score.questions.length;

    return (
        <div className="score-dashboard">
            <header className="score-header">
                <h1>Engineering Assessment Results</h1>
                <div className="score-summary">
                    <span>Total Score: {scoreData.score.total_score}</span>
                    <span>Total Questions: {totalQuestions}</span>
                    <span>Completion Date: {new Date().toLocaleDateString()}</span>
                </div>
            </header>

            <main className="results-container">
                {scoreData.score.questions.map((q, index) => {
                    let status;
                    if (q.user_answer === null || q.user_answer === undefined) {
                        status = "Skipped";
                    } else if (q.answer_status) {
                        status = "Correct";
                    } else {
                        status = "Incorrect";
                    }

                    return (
                        <div key={index} className="question-card">
                            <div className="question-header">
                                <h3>Problem {index + 1} {q.level && `(Level ${q.level})`}</h3>
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
                                    const isUserAnswer = parseInt(optIndex) === q.user_answer;
                                    return (
                                        <div
                                            key={optIndex}
                                            className={`option-item ${
                                                isCorrect
                                                    ? "correct"
                                                    : isUserAnswer
                                                    ? "incorrect"
                                                    : ""
                                            }`}
                                        >
                                            <span className="option-letter">
                                                {String.fromCharCode(65 + parseInt(optIndex))}.
                                            </span>
                                            <span className="option-text">{option}</span>
                                            {isCorrect && <span className="check">✓</span>}
                                            {isUserAnswer && !isCorrect && (
                                                <span className="cross">✗</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </main>

            <footer className="score-footer">
                <button
                    className="dashboard-btn"
                    onClick={() => navigate("/student-dashboard")}
                >
                    Return to Engineering Dashboard
                </button>
            </footer>
        </div>
    );
};

export default Score;