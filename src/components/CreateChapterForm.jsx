import React, { useState } from "react";
import axios from "axios";
import "./CSS/Admin.css";

const CreateChapterForm = ({ faculties, updateChapters }) => {
  const [chapterName, setChapterName] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChapterSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!chapterName || !chapterDescription || !selectedFaculty) {
      setError("Chapter name, description, and faculty are required.");
      return;
    }

    setIsLoading(true);

    axios
      .post(
        "/chapter",
        {
          chapter: chapterName,
          description: chapterDescription,
          faculty_id: parseInt(selectedFaculty, 10),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }
      )
      .then((response) => {
        setSuccessMessage("Chapter created successfully.");
        setChapterName("");
        setChapterDescription("");
        setSelectedFaculty("");
        if (updateChapters) updateChapters();
      })
      .catch((err) => {
        setError(
          "Error creating chapter: " +
            (err.response ? err.response.data : err.message)
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="create-chapter-form">
      <h3>Create Chapter</h3>
      <form onSubmit={handleChapterSubmit}>
        <div>
          <input
            type="text"
            placeholder="Chapter Name"
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Chapter Description"
            value={chapterDescription}
            onChange={(e) => setChapterDescription(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="input-field"
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
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Chapter"}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default CreateChapterForm;
