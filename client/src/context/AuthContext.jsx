import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fr_token') || null);
  const [stats, setStats] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load user profile on boot
  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const refreshProfile = async () => {
    try {
      if (!token) return;
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        setStats(data.stats);
        setUnreadNotifications(data.unreadNotifications || 0);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    const data = await api.login(email, password, role);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('fr_token', data.token);
    await refreshProfile();
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('fr_token', data.token);
    await refreshProfile();
    return data.user;
  };

  const quickLogin = async (role) => {
    try {
      const data = await api.quickLogin(role);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('fr_token', data.token);
      await refreshProfile();
      return data.user;
    } catch (err) {
      console.error('Quick login failed:', err);
      alert(err.message || 'Quick login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStats(null);
    setUnreadNotifications(0);
    localStorage.removeItem('fr_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        stats,
        unreadNotifications,
        loading,
        login,
        register,
        quickLogin,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

