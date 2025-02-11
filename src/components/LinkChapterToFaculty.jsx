import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/Admin.css";

const LinkChapterToFaculty = () => {
  const [faculties, setFaculties] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch faculties and chapters on component mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authorization token is missing.");
      return;
    }
    // Fetch faculties
    axios
      .get("/faculty", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setFaculties(response.data);
      })
      .catch((error) => {
        setError("Error fetching faculties: " + error.message);
      });

    // Fetch chapters
    axios
      .get("/allchapters", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setChapters(response.data);
      })
      .catch((error) => {
        setError("Error fetching chapters: " + error.message);
      });
  }, []);

  const handleLinkSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedFaculty || !selectedChapter) {
      setError("Please select both a faculty and a chapter.");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authorization token is missing.");
      return;
    }

    axios
      .post(
        "/faculty-chapters",
        {
          faculty_id: parseInt(selectedFaculty, 10),
          chapter_code: parseInt(selectedChapter, 10),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setSuccessMessage("Chapter linked to faculty successfully.");
      })
      .catch((err) => {
        setError("Error linking chapter to faculty: " + err.message);
      });
  };

  return (
    <div className="link-chapter-to-faculty">
      <h3>Link Chapter to Faculty</h3>
      <form onSubmit={handleLinkSubmit}>
        <div>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            required
          >
            <option value="">Select Faculty</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.faculty_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            required
          >
            <option value="">Select Chapter</option>
            {chapters.map((chapter) => (
              <option key={chapter.chapter_code} value={chapter.chapter_code}>
                {chapter.chapter}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Link Chapter</button>
      </form>
      {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}
      {successMessage && <p className="success-message" style={{ color: "green" }}>{successMessage}</p>}
    </div>
  );
};

export default LinkChapterToFaculty;
