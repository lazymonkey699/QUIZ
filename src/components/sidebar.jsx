import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaBook, FaClipboard, FaSignOutAlt, FaChevronLeft } from "react-icons/fa";
import "./CSS/sidebar.css";

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

  const handleResize = useCallback(() => {
    const shouldOpen = window.innerWidth > 768;
    setIsOpen(shouldOpen);
    setSidebarOpen(shouldOpen);
  }, [setSidebarOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSidebarOpen((prev) => !prev);
  }, [setSidebarOpen]);

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
      <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{isOpen ? "QuizMaster" : "QM"}</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className={location.pathname.startsWith(item.path) ? "active" : ""} onClick={() => navigate(item.path)}>
                <item.icon className="sidebar-icon" />
                {isOpen && <span className="sidebar-text">{item.text}</span>}
              </li>
            ))}
            <li className="logout" onClick={handleLogout}>
              <FaSignOutAlt className="sidebar-icon" />
              {isOpen && <span className="sidebar-text">Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      <button className={`sidebar-toggle ${isOpen ? "open" : ""}`} onClick={toggleSidebar} aria-label={isOpen ? "Close sidebar" : "Open sidebar"}>
        <FaChevronLeft className={`toggle-icon ${isOpen ? "" : "rotated"}`} />
      </button>

      {showConfirm && (
        <div className="modal" onClick={handleCloseModal} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to log out?</p>
            <button className="confirm-btn" onClick={() => { localStorage.removeItem("authToken"); navigate("/login"); window.location.reload(); }}>Yes</button>
            <button className="cancel-btn" onClick={() => setShowConfirm(false)}>No</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;