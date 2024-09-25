// src/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken
        });
        const newToken = response.data.access;
        localStorage.setItem('access_token', newToken);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
        setToken(newToken);
        setIsLoggedIn(true);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          logout();
        }
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      const intervalId = setInterval(refreshToken, REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    } else {
      setIsLoggedIn(false);
    }
  }, [token, refreshToken]);

  const login = useCallback((accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);