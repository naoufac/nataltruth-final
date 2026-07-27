import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { ReadingModeProvider } from "@/context/ReadingModeContext";
import { loadOneSignal } from "@/lib/onesignal";

// Public pages — eager-loaded so the marketing surface and auth routes
// have zero bundle-fetch latency on first paint.
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import PricingPage from "@/pages/PricingPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PublicChartPage from "@/pages/PublicChartPage";
import ZodiacLandingPage from "@/pages/ZodiacLandingPage";
import HoroscopeTodayPage from "@/pages/HoroscopeTodayPage";
import ReadingThanksPage from "@/pages/ReadingThanksPage";

// Authed pages — code-split. The marketing entry doesn't need any of
// this in its initial bundle.
const Dashboard          = lazy(() => import("@/pages/Dashboard"));
const ChatPage           = lazy(() => import("@/pages/ChatPage"));
const FriendPage         = lazy(() => import("@/pages/FriendPage"));
const ChartPage          = lazy(() => import("@/pages/ChartPage"));
const TransitsPage       = lazy(() => import("@/pages/TransitsPage"));
const SettingsPage       = lazy(() => import("@/pages/SettingsPage"));
const ShareChartPage     = lazy(() => import("@/pages/ShareChartPage"));
const AdminPage          = lazy(() => import("@/pages/AdminPage"));
const CompatibilityPage  = lazy(() => import("@/pages/CompatibilityPage"));
const NumerologyPage     = lazy(() => import("@/pages/NumerologyPage"));
const GematriaPage       = lazy(() => import("@/pages/GematriaPage"));

const RouteFallback = () => (
  <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
    <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
  </div>
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("gab44_token"));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("gab44_token");
    setToken(null);
    setUser(null);
  };

  // Global Axios interceptor: auto-logout when any API call returns 401
  // (e.g. JWT expired mid-session). Runs once on mount.
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const currentToken = localStorage.getItem("gab44_token");
          // Only trigger if the user was actually logged in (avoid loop on the
          // /auth/login or /auth/me calls that fire before session is set)
          if (currentToken) {
            localStorage.removeItem("gab44_token");
            setToken(null);
            setUser(null);
            import("sonner").then(({ toast }) => {
              toast.error("Your session has expired. Please sign in again.");
            });
            // Redirect to auth after a brief delay so the toast is visible first
            setTimeout(() => {
              if (!window.location.pathname.startsWith("/auth")) {
                window.location.href = "/auth";
              }
            }, 1500);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("gab44_token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  // Lazy-load the OneSignal SDK only after the user is authed. Public
  // marketing surfaces (LandingPage, /zodiac/*, /horoscope/today,
  // /pricing) never pay the SDK download cost.
  useEffect(() => {
    if (user) loadOneSignal();
  }, [user]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("gab44_token", access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    const { access_token, user: newUser } = response.data;
    localStorage.setItem("gab44_token", access_token);
    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/40" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/40" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};


// 404 Not Found Page Component
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a 
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
    <ReadingModeProvider>
      <AuthProvider>
        <div className="App min-h-screen bg-background theme-transition">
          <div className="noise-overlay" />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/chart/public/:token" element={<PublicChartPage />} />
              <Route path="/zodiac/:sign" element={<ZodiacLandingPage />} />
              <Route path="/horoscope/today" element={<HoroscopeTodayPage />} />
              <Route path="/reading-thanks" element={<ReadingThanksPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/friend" 
                element={
                  <ProtectedRoute>
                    <FriendPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chart" 
                element={
                  <ProtectedRoute>
                    <ChartPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transits" 
                element={
                  <ProtectedRoute>
                    <TransitsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/share" 
                element={
                  <ProtectedRoute>
                    <ShareChartPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/compatibility" 
                element={
                  <ProtectedRoute>
                    <CompatibilityPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/numerology" 
                element={
                  <ProtectedRoute>
                    <NumerologyPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gematria" 
                element={
                  <ProtectedRoute>
                    <GematriaPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                } 
              />
            </Routes>
            <Route path="*" element={<NotFoundPage />} />
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </ReadingModeProvider>
    </ThemeProvider>
  );
}

export default App;
