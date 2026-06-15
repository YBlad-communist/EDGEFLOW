import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('edgeflow_token');
    if (token) {
      api.get('/profile/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('edgeflow_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('edgeflow_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('edgeflow_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('edgeflow_token');
    setUser(null);
    window.location.href = '/';
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/profile/me');
    setUser(res.data);
    return res.data;
  }, []);

  const isTeacher = user?.role === 'teacher';
  const hasTeacherProfile = isTeacher && user?.teacherProfile?.isComplete;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isTeacher, hasTeacherProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
