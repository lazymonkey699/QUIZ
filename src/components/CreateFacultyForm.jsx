import React, { useState } from "react";
import axios from "axios";
import "./CSS/Admin.css";

const CreateFacultyForm = ({ updateFaculties }) => {
  const [facultyName, setFacultyName] = useState("");
  const [facultyDescription, setFacultyDescription] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFacultySubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!facultyName || !facultyDescription) {
      setError("Faculty name and description are required.");
      return;
    }

    setIsLoading(true);

    axios
      .post(
        "/faculty",
        {
          faculty_name: facultyName,
          description: facultyDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      )
      .then((response) => {
        setSuccessMessage("Faculty created successfully.");
        setFacultyName("");
        setFacultyDescription("");
        if (updateFaculties) updateFaculties();
      })
      .catch((err) => {
        setError(
          "Error creating faculty: " +
            (err.response ? err.response.data : err.message)
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="create-faculty-form">
      <h3>Create Faculty</h3>
      <form onSubmit={handleFacultySubmit}>
        <div>
          <input
            type="text"
            placeholder="Faculty Name"
            value={facultyName}
            onChange={(e) => setFacultyName(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Faculty Description"
            value={facultyDescription}
            onChange={(e) => setFacultyDescription(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Faculty"}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default CreateFacultyForm;
