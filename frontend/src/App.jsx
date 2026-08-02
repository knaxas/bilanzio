import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import GroupDetail from "./pages/GroupDetail";
import Invite from "./pages/Invite";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken && storedUser !== "undefined" && storedToken !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Fehler beim Laden der Session:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } else {
      // Aufräumen falls ungültige Strings wie "undefined" im Storage lagen
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData, tokenData) => {
    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0d0e12",
          color: "#d4af37",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        Lade App...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            !token ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !token ? (
              <Register onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route
          path="/home"
          element={
            token ? (
              <Home user={user} token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/group/:groupId"
          element={
            token ? (
              <GroupDetail user={user} token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
  path="/invite/:groupId"
  element={
    token ? (
      <Invite token={token} />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
        <Route
          path="*"
          element={<Navigate to={token ? "/home" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}