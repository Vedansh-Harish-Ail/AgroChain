import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider, useWallet } from './context/WalletContext';
import { ToastProvider } from './context/ToastContext';
import { 
  Sprout, Wallet, LogOut, LogIn, UserPlus, LayoutDashboard, 
  FileCheck, ShieldAlert, Cpu, LineChart, Award, Eye, Sun, Moon, Menu, X
} from 'lucide-react';

// Import Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import FarmerRegistration from './pages/FarmerRegistration';
import QualityTesting from './pages/QualityTesting';
import ProductRegistration from './pages/ProductRegistration';
import FundingPage from './pages/FundingPage';
import ConsumerTracking from './pages/ConsumerTracking';
import BlockchainExplorer from './pages/BlockchainExplorer';
import AdminDashboard from './pages/AdminDashboard';
import CropHistory from './pages/CropHistory';
import SubmittedLOIs from './pages/SubmittedLOIs';
import TermsPage from './pages/TermsPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && user && roles && !roles.includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate, roles]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return user ? children : null;
};

// Navbar Component
const Navbar = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleWalletConnect = async () => {
    await connectWallet();
  };

  return (
    <nav className="sticky top-4 z-40 mx-auto mt-4 w-[calc(100%-2rem)] max-w-[95%] border border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 rounded-2xl shadow-md">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <Sprout className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              <span>Agro<span className="text-emerald-600 dark:text-emerald-400">Chain</span></span>
            </Link>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {!isAuthPage && (
                <>
                  <Link to="/explorer" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400">
                    <Cpu className="h-4 w-4" /> Explorer
                  </Link>
                  <Link to="/consumer/track" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400">
                    <Eye className="h-4 w-4" /> Traceability
                  </Link>
                </>
              )}
              {user && (
                <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Wallet Connect */}
            {user && ['ADMIN', 'INSPECTOR', 'TESTER'].includes(user.role) && (
              <button
                onClick={handleWalletConnect}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-300 ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                }`}
              >
                <Wallet className="h-4 w-4" />
                {isConnected
                  ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                  : 'Connect Wallet'}
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Hi, {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  <UserPlus className="h-4 w-4" /> Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 space-y-3">
          {!isAuthPage && (
            <>
              <Link
                to="/explorer"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Blockchain Explorer
              </Link>
              <Link
                to="/consumer/track"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Traceability Portal
              </Link>
            </>
          )}
          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Dashboard
            </Link>
          )}
          
          {user && ['ADMIN', 'INSPECTOR', 'TESTER'].includes(user.role) && (
            <button
              onClick={() => { handleWalletConnect(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold dark:bg-emerald-600"
            >
              <Wallet className="h-4 w-4" />
              {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
            </button>
          )}

          {user ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/30"
            >
              Sign Out
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex justify-center items-center gap-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex justify-center items-center gap-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            {/* Warning/Alert Icon */}
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 animate-pulse">
              <LogOut className="h-6 w-6" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Confirm Sign Out</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to sign out of your AgroChain account?
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate('/');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-md shadow-rose-600/20 hover:shadow-lg transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

const MainLayout = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isExplorer = location.pathname === '/explorer';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Only show the app Navbar on non-landing pages */}
      {!isLanding && <Navbar theme={theme} toggleTheme={toggleTheme} />}

      {isLanding ? (
        /* Landing page gets full-width, no padding */
        <Routes>
          <Route path="/" element={<LandingPage theme={theme} toggleTheme={toggleTheme} />} />
        </Routes>
      ) : (
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[95%]">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/explorer" element={<BlockchainExplorer />} />
            <Route path="/consumer/track" element={<ConsumerTracking />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/farmer/register" element={
              <ProtectedRoute roles={['FARMER', 'ADMIN']}><FarmerRegistration /></ProtectedRoute>
            } />
            <Route path="/farmer/crops" element={
              <ProtectedRoute roles={['FARMER', 'ADMIN']}><CropHistory /></ProtectedRoute>
            } />
            <Route path="/investor/lois" element={
              <ProtectedRoute roles={['INVESTOR', 'ADMIN']}><SubmittedLOIs /></ProtectedRoute>
            } />
            <Route path="/tester/approve" element={
              <ProtectedRoute roles={['INSPECTOR', 'TESTER', 'ADMIN']}><QualityTesting /></ProtectedRoute>
            } />
            <Route path="/tester/product" element={
              <ProtectedRoute roles={['TESTER', 'ADMIN']}><ProductRegistration /></ProtectedRoute>
            } />
            <Route path="/finance" element={
              <ProtectedRoute><FundingPage /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
              <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
            } />
          </Routes>
        </main>
      )}


    </div>
  );
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <AuthProvider>
      <WalletProvider>
        <ToastProvider>
          <MainLayout theme={theme} toggleTheme={toggleTheme} />
        </ToastProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
