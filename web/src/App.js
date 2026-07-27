import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { ReadingModeProvider } from "@/context/ReadingModeContext";
import { loadOneSignal } from "@/lib/onesignal";
import { BACKEND_URL, API_BASE } from "@/lib/apiConfig";
import {
  loadLocalProfile,
  saveLocalProfile,
  clearLocalProfile,
} from "@/lib/nataltruth";

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

/** Calc API base: https://api.nataltruth.com (no /api prefix). */
export const API = API_BASE;
export { BACKEND_URL };

const SESSION_KEY = "nataltruth_session";

// Auth Context — session is local until an auth API exists.
// Chart/name calculations hit api.nataltruth.com only.
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

function profileToUser(profile) {
  if (!profile) return null;
  const email = (profile.email || "").toLowerCase();
  const plan = profile.plan || profile.subscription_tier || "free";
  const isFounder = email === "nchobah@gmail.com";
  return {
    id: profile.id || "local",
    email: profile.email || "",
    name: profile.name || profile.birth_name || "",
    birth_name: profile.birth_name || profile.name || "",
    birth_date: profile.birth_date || "",
    birth_time: profile.birth_time || "",
    birth_place: profile.birth_place || "",
    latitude: profile.latitude,
    longitude: profile.longitude,
    utc_offset: profile.utc_offset || profile.utcOffset || null,
    timezone: profile.timezone || profile.timeZoneId || null,
    is_admin: !!(profile.is_admin || isFounder),
    is_guest: false,
    tier: plan,
    plan,
    subscription_tier: plan,
    engineDefault: profile.engineDefault || (plan === "ultra" ? "swiss" : "moshier"),
  };
}

async function hydrateEntitlement(profile) {
  if (!profile?.email) return profile;
  try {
    const { fetchEntitlement } = await import("@/lib/nataltruth");
    const ent = await fetchEntitlement(profile.email);
    if (!ent) return profile;
    const next = {
      ...profile,
      plan: ent.plan,
      subscription_tier: ent.plan,
      engineDefault: ent.engineDefault,
    };
    saveLocalProfile(next);
    if (ent.engineDefault) {
      localStorage.setItem("nataltruth_engine", ent.engineDefault);
    }
    return next;
  } catch {
    return profile;
  }
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(SESSION_KEY));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    clearLocalProfile();
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    // Restore local session + birth profile; hydrate plan from API entitlements
    (async () => {
      const session = localStorage.getItem(SESSION_KEY);
      let profile = loadLocalProfile();
      if (profile?.email) {
        profile = await hydrateEntitlement(profile);
      }
      if (session && profile) {
        setToken(session);
        setUser(profileToUser(profile));
      } else if (profile?.birth_date || profile?.email) {
        const sid = "local-session";
        localStorage.setItem(SESSION_KEY, sid);
        setToken(sid);
        setUser(profileToUser(profile));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (user) loadOneSignal();
  }, [user]);

  /**
   * Local session only — api.nataltruth.com does not provide login.
   * Accepts email/password fields for UI compatibility; stores profile locally.
   */
  const login = async (email, password) => {
    let profile = loadLocalProfile() || {
      email,
      name: email?.split("@")[0] || "User",
      birth_name: "",
      birth_date: "",
      birth_time: "",
      birth_place: "",
    };
    profile.email = email || profile.email;
    profile = await hydrateEntitlement(profile);
    saveLocalProfile(profile);
    const sid = `local-${Date.now()}`;
    localStorage.setItem(SESSION_KEY, sid);
    setToken(sid);
    const u = profileToUser(profile);
    setUser(u);
    return u;
  };

  /**
   * Register = save birth profile locally and open session.
   * Chart calc uses this profile against api.nataltruth.com.
   */
  const register = async (userData) => {
    let profile = {
      id: `local-${Date.now()}`,
      email: userData.email || "",
      name: userData.name || "",
      birth_name: userData.birth_name || userData.name || "",
      birth_date: userData.birth_date || "",
      birth_time: userData.birth_time || "",
      birth_place: userData.birth_place || "",
      latitude: userData.latitude != null ? Number(userData.latitude) : undefined,
      longitude: userData.longitude != null ? Number(userData.longitude) : undefined,
      utc_offset: userData.utc_offset || userData.utcOffset || null,
      timezone: userData.timezone || userData.timeZoneId || null,
    };
    profile = await hydrateEntitlement(profile);
    saveLocalProfile(profile);
    const sid = `local-${Date.now()}`;
    localStorage.setItem(SESSION_KEY, sid);
    setToken(sid);
    const u = profileToUser(profile);
    setUser(u);
    return u;
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      const profile = loadLocalProfile() || {};
      saveLocalProfile({
        ...profile,
        ...updatedData,
        name: next.name,
        birth_name: next.birth_name,
        birth_date: next.birth_date,
        birth_time: next.birth_time,
        birth_place: next.birth_place,
        latitude: next.latitude,
        longitude: next.longitude,
        utc_offset: next.utc_offset,
        timezone: next.timezone,
        email: next.email,
      });
      return next;
    });
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
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
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
