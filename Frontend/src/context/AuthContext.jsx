import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const getConnectionError = (err, defaultMsg) => {
  if (!err.response && err.request) {
    return 'Connection Error: Failed to reach the server. Please check if a VPN is turned on and blocking local network traffic.';
  }
  return err.response?.data?.message || defaultMsg;
};

// Configure axios base defaults
axios.defaults.baseURL = ''; // Powered by Vite Proxy in local development

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Set default authorization header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Load user profile on mount or token change
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/api/auth/profile');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: getConnectionError(err, 'Login failed. Please check your credentials.') 
      };
    }
  };

  const register = async (name, email, password, role, walletAddress, phoneNumber, emailOtp, smsOtp, locationData = {}) => {
    try {
      const res = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        role,
        wallet_address: walletAddress || null,
        phone_number: phoneNumber,
        email_otp: emailOtp,
        sms_otp: smsOtp,
        ...locationData
      });
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: getConnectionError(err, 'Registration failed. Please try again.')
      };
    }
  };

  const sendSmsOtp = async (phoneNumber) => {
    try {
      const res = await axios.post('/api/auth/send-otp', {
        phone_number: phoneNumber
      });
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        message: getConnectionError(err, 'Failed to send SMS OTP. Please check the phone number.')
      };
    }
  };

  const sendEmailOtp = async (email) => {
    try {
      const res = await axios.post('/api/auth/send-email-otp', {
        email: email
      });
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        message: getConnectionError(err, 'Failed to send email OTP. Please check the email address.')
      };
    }
  };


  const changePassword = async (newPassword) => {
    try {
      const res = await axios.post('/api/auth/change-password', {
        new_password: newPassword
      });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: getConnectionError(err, 'Failed to change password.')
      };
    }
  };

  const linkWallet = async (walletAddress, message = null, signature = null) => {
    try {
      const res = await axios.post('/api/auth/link-wallet', {
        wallet_address: walletAddress,
        message,
        signature
      });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: getConnectionError(err, 'Failed to link wallet.')
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, linkWallet, sendSmsOtp, sendEmailOtp, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
