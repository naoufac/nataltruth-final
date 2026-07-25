import { useEffect, type ReactNode } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import Nav from "./components/Nav";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import ReadingPage from "./pages/ReadingPage";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import Compatibility from "./pages/Compatibility";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyCharts from "./pages/MyCharts";
import SavedChart from "./pages/SavedChart";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container-prose py-24 text-ink-faint">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container-prose py-24 text-ink-faint">Loading…</div>;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="/compatibility" element={<Compatibility />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-charts" element={<Protected><MyCharts /></Protected>} />
          <Route path="/chart/:id" element={<Protected><SavedChart /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="mt-16 border-t border-line">
        <div className="container-prose flex flex-col gap-2 py-10 text-sm text-ink-faint">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/" className="font-serif text-base font-semibold text-ink">NatalTruth</Link>
            <Link to="/reading" className="hover:text-ink">My chart</Link>
            <Link to="/compatibility" className="hover:text-ink">Compatibility</Link>
            <Link to="/blog" className="hover:text-ink">Blog</Link>
            <span className="text-trust">Swiss Ephemeris · Tropical · Placidus</span>
          </div>
          <p>Calculated to the arc-minute. Nothing invented. Made to be read and shared.</p>
        </div>
      </footer>
    </div>
  );
}
