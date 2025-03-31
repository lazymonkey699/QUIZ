import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaBook, FaClipboard, FaSignOutAlt, FaChevronLeft, FaMoon, FaSun } from "react-icons/fa";
import "./CSS/sidebar.css"; // Assume we'll update this too

const NAV_ITEMS = [
  { path: "/student-dashboard", icon: FaHome, text: "Dashboard" },
  { path: "/chapterwise", icon: FaBook, text: "Chapter-wise" },
  { path: "/mock", icon: FaClipboard, text: "Mock Test" },
];

const Sidebar = ({ setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem("theme") === "dark");

  // Theme toggle handler
  const toggleTheme = useCallback(() => {
    setIsDarkTheme((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      document.body.classList.toggle("dark-theme", newTheme);
      return newTheme;
    });
  }, []);

  // Sidebar resize handler
  const handleResize = useCallback(() => {
    const shouldOpen = window.innerWidth > 768;
    setIsOpen(shouldOpen);
    setSidebarOpen(shouldOpen);
  }, [setSidebarOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize, isDarkTheme]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSidebarOpen((prev) => !prev);
  }, [setSidebarOpen]);

  // Logout handlers
  const handleLogout = useCallback(() => setShowConfirm(true), []);
  const handleCloseModal = useCallback((e) => {
    if (e.key === "Escape" || e.target === e.currentTarget) setShowConfirm(false);
  }, []);

  useEffect(() => {
    if (showConfirm) {
      window.addEventListener("keydown", handleCloseModal);
      return () => window.removeEventListener("keydown", handleCloseModal);
    }
  }, [showConfirm, handleCloseModal]);

  return (
    <>
      <aside className={`sidebar ${isOpen ? "open" : "collapsed"} ${isDarkTheme ? "dark" : "light"}`} aria-label="Navigation Sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">{isOpen ? "MindForge" : "MF"}</h2>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${isDarkTheme ? "light" : "dark"} theme`}>
            {isDarkTheme ? <FaSun /> : <FaMoon />}
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li
                key={item.path}
                className={location.pathname.startsWith(item.path) ? "active" : ""}
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && navigate(item.path)}
              >
                <item.icon className="sidebar-icon" aria-hidden="true" />
                {isOpen && <span className="sidebar-text">{item.text}</span>}
              </li>
            ))}
            <li
              className="logout"
              onClick={handleLogout}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && handleLogout()}
            >
              <FaSignOutAlt className="sidebar-icon" aria-hidden="true" />
              {isOpen && <span className="sidebar-text">Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      <button
        className={`sidebar-toggle ${isOpen ? "open" : ""}`}
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <FaChevronLeft className={`toggle-icon ${isOpen ? "" : "rotated"}`} />
      </button>

      {showConfirm && (
        <div className="modal" onClick={handleCloseModal} role="dialog" aria-modal="true" tabIndex={-1}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to log out?</p>
            <div className="modal-buttons">
              <button
                className="confirm-btn"
                onClick={() => {
                  localStorage.removeItem("authToken");
                  navigate("/login");
                  window.location.reload();
                }}
              >
                Yes
              </button>
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;