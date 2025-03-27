import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./sidebar"; // Importing the Sidebar component
import "./CSS/Chapterwise.css"; // Ensure this CSS file exists

const Chapterwise = () => {
  const [username, setUsername] = useState("Guest");
  const [facultyId, setFacultyId] = useState(null);
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState({ city: "Loading...", province: "Loading..." });
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const navigate = useNavigate();

  // Fetch location using IP-API
  useEffect(() => {
    fetch("http://ip-api.com/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setLocation({
            city: data.city || "Unknown",
            province: data.regionName || "Unknown",
          });
        } else {
          setLocation({ city: "Unknown", province: "Unknown" });
        }
      })
      .catch(() => setLocation({ city: "Unknown", province: "Unknown" }));
  }, []);

  // Real-time Date & Time
  useEffect(() => {
    const updateDateTime = () => {
      setDateTime(new Intl.DateTimeFormat("en-US", { 
        dateStyle: "full", 
        timeStyle: "short", 
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      }).format(new Date()));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle authentication & extract user info
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.sub || "Guest");
        setFacultyId(decoded.faculty);
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  // Fetch chapters from API
  useEffect(() => {
    const fetchChapters = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error("❌ No authToken found");
        alert("You must be logged in to view chapters.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("/allchapters", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch chapters");

        const data = await response.json();
        setChapters(data);
      } catch (error) {
        console.error("❌ Error fetching chapters:", error);
      }
    };

    fetchChapters();
  }, [navigate]);

  // Handle chapter selection and start the test
  const handleStartTest = async () => {
    if (!selectedChapter) {
      alert("Please select a chapter before starting the test.");
      return;
    }

    sessionStorage.setItem("chapter_id", selectedChapter);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/practise/chapters/${selectedChapter}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch questions");

      const questions = await response.json();
      sessionStorage.setItem("questions", JSON.stringify(questions)); // Store fetched questions

      navigate("/chapterquiz"); // Navigate to the quiz page
    } catch (error) {
      console.error("❌ Error fetching questions:", error);
      alert("Failed to load questions. Please try again.");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar /> {/* Sidebar Component */}

      <main className="dashboard-content">
        <h1>Welcome, {username}!</h1>

        {/* User Info */}
        <div className="user-info">
          <div className="info-box"><strong>Province:</strong> {location.province}</div>
          <div className="info-box"><strong>City:</strong> {location.city}</div>
          <div className="info-box"><strong>Date & Time:</strong> {dateTime}</div>
        </div>

        {/* Chapter Selection */}
        <div className="chapter-selection">
          <h2>Select a Chapter</h2>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
          >
            <option value="">-- Select a Chapter --</option>
            {chapters.map((chapter) =>
  chapter.id ? (
    <option key={chapter.id} value={chapter.id}>
      {chapter.name}
    </option>
  ) : null
)}
          </select>
          <button onClick={handleStartTest} disabled={!selectedChapter}>
            Start Test
          </button>
        </div>

        {/* Test History */}
        <div className="test-history">
          <h2>Test History</h2>
          <table>
            <thead>
              <tr>
                <th>S.N</th>
                <th>Score</th>
                <th>Skipped Questions</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>85</td><td>2</td></tr>
              <tr><td>2</td><td>90</td><td>1</td></tr>
              <tr><td>3</td><td>75</td><td>3</td></tr>
            </tbody>
          </table>
        </div>

        {/* Practice Test Counter */}
        <div className="practice-counter">
          <h2>Practice Test Counter</h2>
          <p><strong>5 Times Taken</strong></p>
        </div>
      </main>
    </div>
  );
};

export default Chapterwise;
