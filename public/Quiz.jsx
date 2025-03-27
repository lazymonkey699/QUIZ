import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  setSelectedAnswer, 
  incrementIndex, 
  decrementIndex,
  setFacultyId as setReduxFacultyId,
  setIsSubmitting as setReduxIsSubmitting
} from "./redux/quizSlice";
import { jwtDecode } from "jwt-decode";
import { PropagateLoader } from 'react-spinners';
import "./CSS/Quiz.css";

const Quiz = ({ questions, setQuizState }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentIndex = useSelector((state) => state.quiz.currentIndex);
  const selectedAnswers = useSelector((state) => state.quiz.selectedAnswers);
  const [timeLeft, setTimeLeft] = useState(3600); // 60-minute timer
  const [facultyId, setFacultyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Decoding token on mount to get facultyId
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.faculty) {
          setFacultyId(decodedToken.faculty);
          dispatch(setReduxFacultyId(decodedToken.faculty));
        } else {
          console.error("❌ Faculty ID missing in token");
          setQuizState("error");
        }
      } catch (error) {
        console.error("❌ Error decoding token:", error);
        setQuizState("error");
      }
    } else {
      console.error("❌ No token found");
      setQuizState("error");
    }
  }, [setQuizState, dispatch]);

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

  // Function to submit the answer for a question
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

    const questionId = questions[questionIndex]?.id;
    if (!questionId) {
      console.error("❌ Missing Question ID for index:", questionIndex);
      return;
    }

    // Fix: Adjust answer index to be 1-based instead of 0-based
    // If answerIndex is 0 (for skip), keep it as 1, else add 1 to the index
    const adjustedAnswerIndex = answerIndex === 0 ? 1 : answerIndex;

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
          question_id: questionId,
          answer_index: adjustedAnswerIndex,
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

  // Handlers for navigating between questions and submitting answers
  const handleNext = () => {
    if (selectedAnswers[currentIndex] === undefined) return;
    
    setIsSubmitting(true);
    dispatch(setReduxIsSubmitting(true));
    
    submitAnswer(currentIndex, selectedAnswers[currentIndex]);
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        dispatch(incrementIndex());
      }
      setIsSubmitting(false);
      dispatch(setReduxIsSubmitting(false));
    }, 1000);
  };

  const handleSkip = () => {
    dispatch(setSelectedAnswer({ index: currentIndex, answer: 0 })); // Mark as skipped with 0
    
    setIsSubmitting(true);
    dispatch(setReduxIsSubmitting(true));
    
    submitAnswer(currentIndex, 0);
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        dispatch(incrementIndex());
      }
      setIsSubmitting(false);
      dispatch(setReduxIsSubmitting(false));
    }, 1000);
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !isSubmitting) {
      dispatch(decrementIndex());
    }
  };

  const handleAnswerSelection = (index) => {
    console.log(`🟢 Selected Option: ${index + 1} (1-based)`);
    dispatch(setSelectedAnswer({ index: currentIndex, answer: index + 1 }));
  };

  // Submit function that sends the final score
  const handleSubmit = async () => {
    // Optionally, check if the last question has an answer
    if (selectedAnswers[currentIndex] === undefined) {
      console.error("❌ Please select an answer before submitting.");
      return;
    }
    
    const token = localStorage.getItem("authToken");
    if (!token) return console.error("❌ No token found.");

    try {
      console.log("📡 Fetching final score...");
      const scoreResponse = await fetch(`/practisetest/score`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!scoreResponse.ok) {
        console.error("❌ Error fetching score.");
        setQuizState("error");
        return;
      }

      const scoreData = await scoreResponse.json();
      localStorage.setItem("quizScoreData", JSON.stringify(scoreData));
      console.log("✅ Score data saved!");
      navigate("/score");
    } catch (error) {
      console.error("❌ Error fetching score:", error);
      setQuizState("error");
    }
  };

  const jumpToQuestion = (index) => {
    if (!isSubmitting) {
      // Calculate difference between current and target index
      const diff = index - currentIndex;
      
      // Use incrementIndex or decrementIndex multiple times to get to the desired index
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          dispatch(incrementIndex());
        }
      } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
          dispatch(decrementIndex());
        }
      }
    }
  };

  if (!questions || questions.length === 0) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="quiz-container">
      <div className="timer">⏳ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</div>

      <div className="progress-bar">
        {questions.map((_, index) => (
          <button
            key={index}
            className={`progress-btn ${index === currentIndex ? "active" : ""}`}
            onClick={() => jumpToQuestion(index)}
            disabled={isSubmitting}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="question-box">
        <h3>Q{currentIndex + 1}: {questions[currentIndex].question}</h3>
        <ul className="options-list">
          {Object.entries(questions[currentIndex].options).map(([optionIndex, option]) => (
            <li key={optionIndex}>
              <button
                className={`option-btn ${selectedAnswers[currentIndex] === parseInt(optionIndex) + 1 ? "selected" : ""}`}
                onClick={() => handleAnswerSelection(parseInt(optionIndex))}
                disabled={isSubmitting}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="quiz-buttons">
        {currentIndex > 0 && (
          <button className="quiz-btn" onClick={handlePrevious} disabled={isSubmitting}>
            Previous
          </button>
        )}
        
        {currentIndex < questions.length - 1 ? (
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