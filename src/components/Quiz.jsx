import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Adjust import if needed
import "./CSS/Quiz.css";

const Quiz = ({ questions, setQuizState }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes timer
  const [facultyId, setFacultyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Use all questions (or limit if needed, e.g. questions.slice(0,10))
  const limitedQuestions = questions;

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

  if (!limitedQuestions[questionIndex]?.id) {
    console.error("❌ Question ID is missing for question index:", questionIndex);
    return;
  }

  // Fix: Send 1 for the first option, and 2-4 for other options
  const adjustedAnswerIndex = answerIndex === 0 ? 1 : answerIndex + 1; // 0 -> 1 (for first option), else answerIndex + 1

  // Debug log to verify what is being sent
  console.log(
    `📡 Debug: Sending answer for Question ${questionIndex + 1}`,
    `| Selected Index: ${answerIndex}`,
    `| Adjusted Index Sent: ${adjustedAnswerIndex}`
  );

  try {
    const response = await fetch("/practisetest/answer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question_id: limitedQuestions[questionIndex].id,
        answer_index: adjustedAnswerIndex, // Send the corrected 1-based index
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

  // Handle Next button (only allowed if an answer is selected)
  const handleNext = () => {
    if (selectedAnswers[currentIndex] === undefined) {
      // Prevent proceeding if no answer is selected
      return;
    }
    setIsSubmitting(true);
    submitAnswer(currentIndex, selectedAnswers[currentIndex]);
    setTimeout(() => {
      if (currentIndex < limitedQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      setIsSubmitting(false);
    }, 1000); // 1-second delay
  };

  // Handle Skip button (always sends answer_index: 0)
  const handleSkip = () => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: 0, // Mark as skipped
    }));
    setIsSubmitting(true);
    submitAnswer(currentIndex, 0);
    setTimeout(() => {
      if (currentIndex < limitedQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      setIsSubmitting(false);
    }, 1000); // 1-second delay
  };

  // Handle Previous button (simply navigates back; no API call)
  const handlePrevious = () => {
    if (currentIndex > 0 && !isSubmitting) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle answer selection (overwrites any previous answer for the question)
  const handleAnswerSelection = (index) => {
    console.log(`🟢 Selected Option: ${index} (0-based)`);
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: index }));
  };
  

  // Submit quiz and navigate to score page
  const handleSubmit = async () => {
    // Optionally, you might want to check if the last question has an answer
    if (selectedAnswers[currentIndex] === undefined) {
      // Optionally, you can force the user to select an answer on the last question
      console.error("❌ Please select an answer before submitting.");
      return;
    }
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

  // Check if questions exist before rendering
  if (!limitedQuestions || limitedQuestions.length === 0) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="quiz-container">
      <div className="timer">
        ⏳ Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
      </div>

      <div className="question-box">
        <h3>
          Q{currentIndex + 1}: {limitedQuestions[currentIndex].question}
        </h3>
        <ul className="options-list">
          {Object.entries(limitedQuestions[currentIndex].options).map(([index, option]) => (
            <li key={index}>
              <button
                className={`option-btn ${selectedAnswers[currentIndex] === parseInt(index) ? "selected" : ""}`}
                onClick={() => handleAnswerSelection(parseInt(index))}
                disabled={isSubmitting}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="quiz-buttons">
        {/* Previous button shown if not on the first question */}
        {currentIndex > 0 && (
          <button className="quiz-btn" onClick={handlePrevious} disabled={isSubmitting}>
            Previous
          </button>
        )}

        {/* For questions before the last, show Skip and Next buttons */}
        {currentIndex < limitedQuestions.length - 1 ? (
          <>
            <button className="quiz-btn" onClick={handleSkip} disabled={isSubmitting}>
              Skip
            </button>
            <button
              className="quiz-btn"
              onClick={handleNext}
              disabled={isSubmitting || selectedAnswers[currentIndex] === undefined}
            >
              Next
            </button>
          </>
        ) : (
          // On the last question, only show the Submit button.
          <button
            className="quiz-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedAnswers[currentIndex] === undefined}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
