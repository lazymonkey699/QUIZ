import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";  // Correct import for jwt-decode
import './CSS/StudentDashboard.css';

const StudentDashboard = ({ setQuestions, setQuizState }) => {
    const [username, setUsername] = useState("");
    const [facultyId, setFacultyId] = useState(null);  // Dynamic facultyId
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        console.log("Token from localStorage:", token);  // Log token retrieved from localStorage
        
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log("Decoded Token:", decoded);  // Log decoded token to check its structure
                setUsername(decoded.sub);
                setFacultyId(decoded.faculty);  // Correctly set facultyId from token
            } catch (err) {
                console.error("Invalid token", err);
            }
        } else {
            console.log("No token found in localStorage");
        }
    }, []);

    const startQuiz = async () => {
        console.log("Faculty ID:", facultyId);  // Log facultyId before making the API request
        
        if (!facultyId) {
            console.error("Faculty ID is missing");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            console.log("Token before API request:", token);  // Log the token before the request
            
            if (!token) {
                console.error("No auth token found");
                return;
            }

            console.log("Making API request to fetch questions...");
            
            const questionsResponse = await fetch(`/practisetest//questions?faculty_id=${facultyId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
            });
    
            if (!questionsResponse.ok) {
                console.error("API request failed:", questionsResponse.statusText);  // Log failure status
                throw new Error(`Error fetching questions: ${questionsResponse.statusText}`);
            }
    
            const questionsData = await questionsResponse.json();
            console.log("Fetched questions data:", questionsData);  // Log full response data

            // Check if questions structure is correct
            if (!questionsData.questions || Object.keys(questionsData.questions).length === 0) {
                console.error("Invalid questions structure:", questionsData.questions);  // Log any issues with structure
                throw new Error("No questions found in response");
            }
    
            // Dynamically check for the first available level
            const availableLevel = Object.keys(questionsData.questions).find(level => questionsData.questions[level]);
            console.log("Available Level:", availableLevel);  // Log the available level for questions
    
            if (availableLevel) {
                const levelQuestions = questionsData.questions[availableLevel];
                console.log("Level Questions:", levelQuestions);  // Log questions for the available level
    
                // Process questions and format them for the quiz
                const formattedQuestions = levelQuestions.flatMap(chapter => 
                    chapter.subchapters.map(q => ({
                        id: q.id,
                        question: q.question,
                        options: Object.values(q.options),  // Convert options object to an array
                        correctAnswer: q.correct_answer,  // Correct answer based on option number
                    }))
                );
    
                console.log("Formatted Questions:", formattedQuestions);  // Log formatted questions
                
                setQuestions(formattedQuestions);  // Pass questions to the parent
                setQuizState("active");  // Set quiz state to active
                navigate("/quiz"); // Navigate to quiz page
            } else {
                console.error("No question levels found in the response");
                throw new Error("No question levels found in response");
            }
    
        } catch (err) {
            console.error("Error fetching questions:", err);  // Log any errors that occur during the fetch
        }
    };

    return (
        <div>
            <h1>Welcome, {username}</h1>
            <button onClick={startQuiz}>Start Quiz</button>
        </div>
    );
};

export default StudentDashboard;
