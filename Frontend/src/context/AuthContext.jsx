import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  validateTestCredentials, 
  createTestUserObject, 
  findTestRole, 
  recordTestSessionEntry, 
  clearTestSession, 
  TEST_USER_KEY 
} from '../utils/testSessionManager';

const AuthContext = createContext(null);

const getConnectionError = (err, defaultMsg) => {
  if (!err.response && err.request) {
    return 'Connection Error: Failed to reach the server. Please check if a VPN is turned on and blocking local network traffic.';
  }
  return err.response?.data?.message || defaultMsg;
};

// Configure axios base defaults
axios.defaults.baseURL = ''; // Powered by Vite Proxy in local development

// ---------------------------------------------------------------------------
// Client-Side Axios Interceptor for Database Protection & Session Entry Limits
// ---------------------------------------------------------------------------
// Intercepts state-modifying requests from test accounts, records entries in
// sessionStorage (enforcing max 5, alert at 4, FIFO deletion on 6th), and
// prevents dummy test data from ever touching the production database.
// ---------------------------------------------------------------------------
axios.interceptors.request.use(async (config) => {
  const isTestUser = sessionStorage.getItem(TEST_USER_KEY) === 'true';
  const method = config.method?.toLowerCase();
  const url = config.url || '';

  // Intercept write operations for test sessions (excluding login/otp)
  if (isTestUser && ['post', 'put', 'delete'].includes(method) && !url.includes('/api/auth/login')) {
    let moduleName = 'General Record';
    let entryTitle = 'Test Session Record';

    if (url.includes('/api/farmer/register')) {
      moduleName = 'Farmer Crop Registration';
      entryTitle = config.data?.crop_type 
        ? `Crop: ${config.data.crop_type} (${config.data.farm_size || 'Farm'})` 
        : 'Registered New Crop';
    } else if (url.includes('/api/farmer/update-timeline')) {
      moduleName = 'Farmer Crop Timeline';
      entryTitle = `Timeline Status: ${config.data?.timeline_status || 'Stage Update'}`;
    } else if (url.includes('/api/farmer/notify-delay')) {
      moduleName = 'Farmer Harvest Delay';
      entryTitle = 'Harvest Delay Notification';
    } else if (url.includes('/api/finance/invest')) {
      moduleName = 'Agro Financing / LOI';
      entryTitle = `Investment LOI Proposal ($${config.data?.amount || '5,000'})`;
    } else if (url.includes('/api/finance/cancel')) {
      moduleName = 'Agro Financing';
      entryTitle = 'Cancelled Investment LOI';
    } else if (url.includes('/api/quality/approve')) {
      moduleName = 'Quality Testing & Inspection';
      entryTitle = 'Crop Batch Approved by Quality Inspector';
    } else if (url.includes('/api/quality/reject')) {
      moduleName = 'Quality Testing';
      entryTitle = 'Crop Batch Rejected by Quality Inspector';
    } else if (url.includes('/api/quality/save-notes')) {
      moduleName = 'Quality Testing Notes';
      entryTitle = 'Inspector / Quality Lab Notes';
    } else if (url.includes('/api/product/register')) {
      moduleName = 'Product Registration';
      entryTitle = `Product Batch: ${config.data?.product_name || 'Agro Product Lot'}`;
    } else if (url.includes('/api/rating/add')) {
      moduleName = 'Consumer Rating';
      entryTitle = `Product Rating: ${config.data?.rating || 5} Stars`;
    } else if (url.includes('/api/admin/create-')) {
      moduleName = 'Admin Role Assignment';
      entryTitle = `Assigned New Official (${config.data?.role || 'Staff'})`;
    } else if (url.includes('/api/auth/upload')) {
      config.adapter = async () => ({
        data: { 
          success: true, 
          url: 'https://agrochain-demo.s3.amazonaws.com/test-evidence-mock.pdf', 
          message: 'Test document uploaded successfully.' 
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      });
      return config;
    }

    // Record into session manager (handles max 5, alert on 4, FIFO delete on 6th)
    const result = recordTestSessionEntry({
      module: moduleName,
      action: method.toUpperCase(),
      title: entryTitle,
      data: config.data
    }, { useNativeAlert: false });

    // Mock successful adapter response - completely prevents call to production DB
    config.adapter = async () => ({
      data: {
        success: true,
        message: result.alertMessage || 'Entry recorded successfully in test session (Production DB Protected).',
        id: result.entry.id,
        entry: result.entry,
        entriesCount: result.count
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    });
  }

  return config;
});

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

      // Check if current token belongs to a test account
      if (token.startsWith('test-token-')) {
        const roleId = token.replace('test-token-', '');
        const roleObj = findTestRole(roleId);
        if (roleObj) {
          const testUser = createTestUserObject(roleObj);
          setUser(testUser);
          sessionStorage.setItem(TEST_USER_KEY, 'true');
          setLoading(false);
          return;
        }
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

  const login = async (emailOrUsername, password) => {
    // 1. Check for test account credentials first
    const testRole = validateTestCredentials(emailOrUsername, password);
    if (testRole) {
      const testUser = createTestUserObject(testRole);
      const testToken = `test-token-${testRole.id}`;
      localStorage.setItem('token', testToken);
      sessionStorage.setItem(TEST_USER_KEY, 'true');
      setToken(testToken);
      setUser(testUser);
      return { success: true, user: testUser, isTest: true };
    }

    // 2. Otherwise proceed with standard backend authentication
    try {
      const res = await axios.post('/api/auth/login', { email: emailOrUsername, password });
      const { token: userToken, user: userData } = res.data;
      localStorage.setItem('token', userToken);
      sessionStorage.removeItem(TEST_USER_KEY);
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

  const register = async (name, email, password, role, walletAddress, phoneNumber, emailOtp, smsOtp, locationData = {}, otpMethod = 'email') => {
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
        otp_method: otpMethod,
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

  const sendLoginOtp = async (email) => {
    try {
      const res = await axios.post('/api/auth/send-login-otp', { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: getConnectionError(err, 'Failed to send login OTP.')
      };
    }
  };

  const loginWithOtp = async (email, otpCode) => {
    try {
      const res = await axios.post('/api/auth/login-with-otp', { email, otp_code: otpCode });
      const { token: userToken, user: userData } = res.data;
      localStorage.setItem('token', userToken);
      sessionStorage.removeItem(TEST_USER_KEY);
      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: getConnectionError(err, 'Failed to verify login OTP.')
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    clearTestSession();
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, linkWallet, sendSmsOtp, sendEmailOtp, changePassword, sendLoginOtp, loginWithOtp }}>
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
