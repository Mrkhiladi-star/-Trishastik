import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch status on mount
  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth-status");
      const data = await response.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.error || "Login failed");
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (err) {
      setError("Network error. Please try again.");
      return { success: false, error: "Network error" };
    }
  };

  const register = async (username, email, password, role) => {
    setError(null);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.error || "Registration failed");
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (err) {
      setError("Network error. Please try again.");
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(null);
        return { success: true };
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
    return { success: false };
  };

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error("Error refreshing user profile:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
