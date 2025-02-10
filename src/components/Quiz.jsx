import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./CSS/Quiz.css";

const Quiz = ({ questions, setQuizState }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes timer
    const [facultyId, setFacultyId] = useState(null);
    const navigate = useNavigate();

    // ✅ Move limitedQuestions inside the component
    const limitedQuestions = questions.slice(0, 10); // Show only the first 10 questions

    // Decode token to get faculty_id
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken.faculty) {
                    setFacultyId(decodedToken.faculty);
                } else {
                    console.error("❌ Faculty ID missing in token");
                    setQuizState("error");
                }
            } catch (error) {
                console.error("❌ Error decoding token:", error);
                setQuizState("error");
            }
        } else {
            console.error("❌ No token found in localStorage");
            setQuizState("error");
        }
    }, [setQuizState]);

    // Timer countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Function to submit answer to API
    const submitAnswer = async (questionIndex, answerIndex) => {
        if (!facultyId) {
            console.error("❌ Faculty ID is missing.");
            return;
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
            console.error("❌ No token found.");
            return;
        }

        // Validate question_id exists
        if (!limitedQuestions[questionIndex]?.id) {
            console.error("❌ Question ID is missing for question index:", questionIndex);
            return;
        }

        try {
            console.log(`📡 Submitting answer for Question ${questionIndex + 1}...`);

            const response = await fetch("/practisetest/answer", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question_id: limitedQuestions[questionIndex].id,
                    answer_index: Number(answerIndex),
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error("❌ Failed to submit answer:", errorMessage);
            } else {
                console.log("✅ Answer submitted successfully!");
            }
        } catch (error) {
            console.error("❌ Error submitting answer:", error);
            setQuizState("error");
        }
    };

    // Handle Next button
    const handleNext = () => {
        if (selectedAnswers.hasOwnProperty(currentIndex)) {
            submitAnswer(currentIndex, selectedAnswers[currentIndex]);
        } else {
            submitAnswer(currentIndex, 0); // Default answer (if skipped)
        }

        if (currentIndex < limitedQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Handle Skip button (sends answer_index: 0)
    const handleSkip = () => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [currentIndex]: 0, // Mark as skipped
        }));
        submitAnswer(currentIndex, 0); // Submit skipped answer
        handleNext();
    };

    // Handle answer selection
    const handleAnswerSelection = (index) => {
        setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: index }));
    };

    // Submit quiz and navigate to score page
    const handleSubmit = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return console.error("❌ No token found.");

        try {
            console.log("📡 Fetching final score...");

            const scoreResponse = await fetch(`/practisetest/score`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!scoreResponse.ok) {
                console.error("❌ Error fetching score.");
                setQuizState("error");
                return;
            }

            const scoreData = await scoreResponse.json();
            localStorage.setItem("quizScoreData", JSON.stringify(scoreData)); // Store score in localStorage
            console.log("✅ Score data saved!");
            navigate("/score"); // Redirect to score page
        } catch (error) {
            console.error("❌ Error fetching score:", error);
            setQuizState("error");
        }
    };

    // ✅ Check if limitedQuestions exists before rendering
    if (!limitedQuestions || limitedQuestions.length === 0) return <div>Loading questions...</div>;

    return (
        <div>
            <h2>
                Time Left: {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
            </h2>
            <h3>Q{currentIndex + 1}: {limitedQuestions[currentIndex].question}</h3>

            <ul>
                {Object.entries(limitedQuestions[currentIndex].options).map(([index, option]) => (
                    <li key={index}>
                        <button
                            style={{
                                background: selectedAnswers[currentIndex] === parseInt(index) ? "lightblue" : "white",
                            }}
                            onClick={() => handleAnswerSelection(parseInt(index))}
                        >
                            {option}
                        </button>
                    </li>
                ))}
            </ul>

            <button onClick={handleSkip}>Skip</button>
            {currentIndex === limitedQuestions.length - 1 ? (
                <button onClick={handleSubmit}>Submit</button>
            ) : (
                <button onClick={handleNext}>Next</button>
            )}
        </div>
    );
};

export default Quiz;
