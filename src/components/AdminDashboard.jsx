import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CreateFacultyForm from "./CreateFacultyForm";
import CreateChapterForm from "./CreateChapterForm";
import CreateSubchapterForm from "./CreateSubchapterForm";
import LinkChapterToFaculty from "./LinkChapterToFaculty";
import "./CSS/Admin.css";

const AdminDashboard = () => {
  const [faculties, setFaculties] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const navigate = useNavigate();

  // Fetch faculties from /faculty endpoint
  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get("/faculty", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFaculties(response.data);
    } catch (error) {
      console.error(
        "Error fetching faculties:",
        error.response ? error.response.data : error.message
      );
    }
  };

  // Fetch chapters from /allchapters endpoint
  const fetchChapters = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get("/allchapters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChapters(response.data);
    } catch (error) {
      console.error(
        "Error fetching chapters:",
        error.response ? error.response.data : error.message
      );
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // (Assuming you have logic to decode and validate the token)
      fetchFaculties();
      fetchChapters();
    } else {
      setIsTokenValid(false);
      navigate("/login");
    }
  }, [navigate]);

  if (!isTokenValid) {
    return <p>Loading...</p>;
  }

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      {/* Pass update functions so child components can refresh data */}
      <CreateFacultyForm updateFaculties={fetchFaculties} />
      <CreateChapterForm faculties={faculties} updateChapters={fetchChapters} />
      <CreateSubchapterForm />
      <LinkChapterToFaculty />
    </div>
  );
};

export default AdminDashboard;
