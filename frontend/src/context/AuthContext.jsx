import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success && res.data.data?.user) {
        setUser(res.data.data.user);
      } else {
        setUser(null);
      }
    } catch (_err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.success && res.data.data?.user) {
      if (res.data.data.accessToken) {
        localStorage.setItem("smartcms_token", res.data.data.accessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.data.accessToken}`;
      }
      setUser(res.data.data.user);
      return res.data.data.user;
    }
    throw new Error(res.data?.message || "Login failed");
  };

  const register = async (data) => {
    const res = await api.post("/auth/register", data);
    if (res.data?.success && res.data.data?.user) {
      if (res.data.data.accessToken) {
        localStorage.setItem("smartcms_token", res.data.data.accessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.data.accessToken}`;
      }
      setUser(res.data.data.user);
      return res.data.data.user;
    }
    throw new Error(res.data?.message || "Registration failed");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("smartcms_token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  const isStudent = user?.role === "student";
  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        isStudent,
        isStaff,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
