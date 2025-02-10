import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ element: Element, allowedRole }) => {
    const token = localStorage.getItem("authToken");
    const isAuthenticated = token !== null;
    const role = isAuthenticated ? jwtDecode(token).role : null;

    return isAuthenticated && role === allowedRole ? (
        Element
    ) : (
        <Navigate to="/auth" replace />
    );
};

export default ProtectedRoute;