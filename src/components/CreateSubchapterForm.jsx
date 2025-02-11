import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/Admin.css";

const CreateSubchapterForm = () => {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterCode, setSelectedChapterCode] = useState("");
  const [subchapterName, setSubchapterName] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch chapters from /allchapters endpoint when the component mounts
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authorization token is missing.");
      return;
    }
    axios
      .get("/allchapters", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setChapters(response.data))
      .catch((err) => {
        setError(
          "Error fetching chapters: " +
            (err.response ? JSON.stringify(err.response.data) : err.message)
        );
      });
  }, []);

  const handleSubchapterSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validate that a chapter is selected and a subchapter name is provided
    if (!selectedChapterCode || !subchapterName) {
      setError("Please select a chapter and enter a subchapter name.");
      return;
    }

    // Convert the selected chapter code to a number
    const chapterCodeInt = parseInt(selectedChapterCode, 10);
    if (isNaN(chapterCodeInt)) {
      setError("Invalid chapter code selected.");
      return;
    }

    setIsLoading(true);

    axios
      .post(
        "/subchapter",
        {
          chapter_code: chapterCodeInt,
          subchapter: subchapterName,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
      )
      .then((response) => {
        setSuccessMessage("Subchapter created successfully.");
        setSelectedChapterCode("");
        setSubchapterName("");
      })
      .catch((err) => {
        // Log and display detailed error information
        const errMsg =
          err.response && err.response.data
            ? JSON.stringify(err.response.data)
            : err.message;
        setError("Error creating subchapter: " + errMsg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="create-subchapter-form">
      <h3>Create Subchapter</h3>
      <form onSubmit={handleSubchapterSubmit}>
        {/* Chapter Selection Dropdown */}
        <div>
          <select
            value={selectedChapterCode}
            onChange={(e) => setSelectedChapterCode(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select Chapter</option>
            {chapters.map((chapter) => (
              <option key={chapter.chapter_code} value={chapter.chapter_code}>
                {chapter.chapter} (Code: {chapter.chapter_code})
              </option>
            ))}
          </select>
        </div>

        {/* Subchapter Name Input */}
        <div>
          <input
            type="text"
            placeholder="Subchapter Name"
            value={subchapterName}
            onChange={(e) => setSubchapterName(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Subchapter"}
        </button>
      </form>

      {/* Display errors or success messages */}
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default CreateSubchapterForm;
