import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

    if (loading) return <div>Loading...</div>;
    if (!scoreData) return <div>No score data available.</div>;

    return (
        <div>
            <h2>Quiz Results</h2>
            <h3>Total Score: {scoreData.score.total_score}</h3>

            {scoreData.score.questions.map((q, index) => (
                <div key={index} style={{ border: "1px solid #ddd", padding: "10px", margin: "10px 0" }}>
                    <h4>Q{index + 1}: {q.question}</h4>

                    <ul style={{ listStyleType: "none", padding: 0 }}>
                        {Object.entries(q.options).map(([optIndex, option]) => (
                            <li key={optIndex} 
                                style={{
                                    padding: "5px",
                                    background: parseInt(optIndex) === q.correct_answer 
                                        ? "#d4edda" // Green for correct answer
                                        : parseInt(optIndex) === q.user_answer
                                            ? "#f8d7da" // Red for user's wrong answer
                                            : "#f8f9fa", // Default background
                                    fontWeight: parseInt(optIndex) === q.correct_answer || parseInt(optIndex) === q.user_answer
                                        ? "bold"
                                        : "normal"
                                }}
                            >
                                {option} {parseInt(optIndex) === q.correct_answer ? "✅" : ""}
                                {parseInt(optIndex) === q.user_answer && parseInt(optIndex) !== q.correct_answer ? "❌" : ""}
                            </li>
                        ))}
                    </ul>

                    <p><strong>Status:</strong> {q.answer_status}</p>
                </div>
            ))}

            <button onClick={() => navigate("/student-dashboard")}>Finish Test</button>
        </div>
    );
};

export default Score;
