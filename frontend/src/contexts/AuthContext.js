import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/user/profile`);
      setUser(res.data);
    } catch (err) {
      console.error('Profile fetch failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const res = await axios.post(`${API}/auth/login`, {
      phone_number: phone,
      password
    });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (phone) => {
    const res = await axios.post(`${API}/auth/register`, { phone_number: phone });
    return res.data;
  };

  const verifyOtp = async (phone, otp) => {
    const res = await axios.post(`${API}/auth/verify-otp`, { phone_number: phone, otp });
    return res.data;
  };

  const createAccount = async (phone, password, name, referralCode) => {
    const res = await axios.post(`${API}/auth/create-password`, {
      phone_number: phone,
      password,
      name,
      referral_code: referralCode || undefined
    });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      verifyOtp,
      createAccount,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
