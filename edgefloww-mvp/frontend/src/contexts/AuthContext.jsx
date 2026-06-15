import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("eftoken");
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const res = await api("/api/auth/me");
      setUser(res);
    } catch {
      localStorage.removeItem("eftoken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = (token, userData) => {
    localStorage.setItem("eftoken", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("eftoken");
    setUser(null);
  };

  const updateUser = (updates) => setUser((prev) => (prev ? { ...prev, ...updates } : prev));

  const updateMode = async (mode) => {
    try {
      await api("/api/profile/mode", { method: "POST", body: JSON.stringify({ mode }) });
      updateUser({ mode });
    } catch (err) { console.error("Failed to update mode:", err); }
  };

  const updateTeacherProfile = (profile) => updateUser({ teacherProfile: profile });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        updateMode,
        updateTeacherProfile,
        isTeacher: user?.role === "teacher",
        isAdmin: user?.isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
