import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('unfazed_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.data);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('unfazed_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('unfazed_token', data.token);
      setUser(data.therapist);
      return data.therapist;
    }
    throw new Error(data.message || 'Login failed');
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    if (data.success) {
      localStorage.setItem('unfazed_token', data.token);
      setUser(data.therapist);
      return data.therapist;
    }
    throw new Error(data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('unfazed_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
