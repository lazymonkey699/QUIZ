import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './CSS/Score.css';

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
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    console.error("❌ Error fetching score data");
                    navigate("/student-dashboard");
                    return;
                }

                const data = await response.json();
                setScoreData(data);
            } catch (error) {
                console.error("❌ Error fetching score:", error);
                navigate("/student-dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchScore();
    }, [navigate]);

    if (loading) return <div className="loading-message">Loading...</div>;
    if (!scoreData) return <div className="error-message">No score data available.</div>;

    return (
        <div className="score-container">
            <div className="result-box">
                <h2>Quiz Results</h2>
                <h3>Total Score: {scoreData.score.total_score}</h3>

                {scoreData.score.questions.map((q, index) => (
                    <div key={index} className="question-box">
                        <h4>Q{index + 1}: {q.question}</h4>

                        <ul className="options-list">
                            {Object.entries(q.options).map(([optIndex, option]) => (
                                <li
                                    key={optIndex}
                                    className={`option ${
                                        parseInt(optIndex) === q.correct_answer
                                            ? "correct"
                                            : parseInt(optIndex) === q.user_answer
                                            ? "wrong"
                                            : ""
                                    }`}
                                >
                                    {option}{" "}
                                    {parseInt(optIndex) === q.correct_answer ? "✅" : ""}
                                    {parseInt(optIndex) === q.user_answer &&
                                    parseInt(optIndex) !== q.correct_answer
                                        ? "❌"
                                        : ""}
                                </li>
                            ))}
                        </ul>

                        <p><strong>Status:</strong> {q.answer_status}</p>
                    </div>
                ))}
            </div>

            <button className="finish-btn" onClick={() => navigate("/dashboard")}>
                Finish Test
            </button>
        </div>
    );
};

export default Score;
