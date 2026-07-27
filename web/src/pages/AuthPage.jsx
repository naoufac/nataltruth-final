import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import { parseApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Eye, EyeOff, MapPin, Calendar, Clock, Sun, Moon } from "lucide-react";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isRegister, setIsRegister] = useState(searchParams.get("mode") === "register");
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Progressive registration: step 1 = name/email/password, step 2 = birth details
  const [regStep, setRegStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    birth_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
    // Required by api.nataltruth.com calculate
    latitude: "",
    longitude: "",
    utc_offset: "",
  });

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // No server auth — profile is local only (zero 404).
    await new Promise((r) => setTimeout(r, 200));
    toast.message("Password reset is not available", {
      description: "NatalTruth uses a local profile on this device. Re-register or update Settings — no email reset API.",
    });
    setIsForgot(false);
    setLoading(false);
  };

  // Step 1 submit: validate and advance to step 2
  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setRegStep(2);
  };

  // Step 2: complete setup (with birth details)
  const handleCompleteSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        ...formData,
        birth_name: formData.birth_name || formData.name,
        latitude: formData.latitude === "" ? undefined : Number(formData.latitude),
        longitude: formData.longitude === "" ? undefined : Number(formData.longitude),
      });
      toast.success("Profile saved. Charts use api.nataltruth.com.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: skip birth details — submit with only name/email/password
  const handleSkip = async () => {
    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        birth_name: "",
        birth_date: "",
        birth_time: "",
        birth_place: "",
      });
      toast.success("Welcome to NatalTruth! Check your inbox to verify your email.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success("Welcome back! The stars have been waiting.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background cosmic-page-bg">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => { setIsForgot(false); setRegStep(1); navigate("/"); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="back-to-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors border border-border/50"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-serif text-xl text-foreground">NatalTruth</span>
        </div>

        {/* ── Forgot Password Panel ── */}
        {isForgot && (
          <div className="max-w-sm">
            <h1 className="font-serif text-3xl text-foreground mb-2">Reset Password</h1>
            <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-foreground">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full glow-button bg-primary text-primary-foreground h-12 text-base rounded-xl">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : "Send Reset Link"}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-6 text-center">
              <button onClick={() => setIsForgot(false)} className="text-primary hover:underline font-medium">
                Back to Sign In
              </button>
            </p>
          </div>
        )}

        {/* ── Login Panel ── */}
        {!isForgot && !isRegister && (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Welcome Home</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We've been waiting for you — let's pick up where you left off
            </p>
            <form onSubmit={handleLoginSubmit} className="space-y-5 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                  data-testid="email-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-muted/30 border-border h-12 rounded-xl pr-10 focus-glow"
                    data-testid="password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full glow-button bg-primary text-primary-foreground h-12 text-base rounded-xl"
                disabled={loading}
                data-testid="submit-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : "Sign In"}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-3 text-center max-w-sm">
              <button
                onClick={() => { setIsForgot(true); setForgotEmail(formData.email); }}
                className="text-primary hover:underline font-medium"
              >
                Forgot your password?
              </button>
            </p>
            <p className="text-sm text-muted-foreground mt-4 text-center max-w-sm">
              Don't have an account?{" "}
              <button
                onClick={() => { setIsRegister(true); setRegStep(1); }}
                className="text-primary hover:underline font-medium"
                data-testid="toggle-auth-mode"
              >
                Create One
              </button>
            </p>
          </>
        )}

        {/* ── Register Step 1: Name / Email / Password ── */}
        {!isForgot && isRegister && regStep === 1 && (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Begin Your Journey</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">Create your free account in seconds</p>
            <form onSubmit={handleStep1Submit} className="space-y-5 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                  data-testid="name-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                  data-testid="email-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-muted/30 border-border h-12 rounded-xl pr-10 focus-glow"
                    data-testid="password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Min. 8 characters, must include a letter and a digit or special character.</p>
              </div>
              <Button
                type="submit"
                className="w-full glow-button bg-primary text-primary-foreground h-12 text-base rounded-xl"
                data-testid="submit-btn"
              >
                Create Account & Continue
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-4 text-center max-w-sm">
              Already have an account?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-primary hover:underline font-medium"
                data-testid="toggle-auth-mode"
              >
                Sign In
              </button>
            </p>
          </>
        )}

        {/* ── Register Step 2: Birth Details ── */}
        {!isForgot && isRegister && regStep === 2 && (
          <>
            <div className="mb-6">
              <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
                One last step — unlock your cosmic blueprint
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-sm">
                Your birth details let us calculate your natal chart with astronomical precision.
                Don't have your birth time? No problem — we'll use solar calculations.
              </p>
            </div>
            <form onSubmit={handleCompleteSetup} className="space-y-5 max-w-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date" className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Birth Date *
                  </Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                    data-testid="birth-date-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_time" className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Birth Time
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="birth_time"
                    name="birth_time"
                    type="time"
                    value={formData.birth_time}
                    onChange={handleChange}
                    className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                    data-testid="birth-time-input"
                    placeholder="Don't know? Leave empty"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_place" className="flex items-center gap-2 text-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Birth Place *
                </Label>
                <Input
                  id="birth_place"
                  name="birth_place"
                  type="text"
                  placeholder="City, Country"
                  value={formData.birth_place}
                  onChange={handleChange}
                  className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                  data-testid="birth-place-input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-foreground">Latitude *</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="33.5731"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                    data-testid="latitude-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-foreground">Longitude *</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="-7.5898"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                    data-testid="longitude-input"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="utc_offset" className="text-foreground">
                  UTC offset at birth
                  <span className="text-xs text-muted-foreground font-normal"> (e.g. +01:00)</span>
                </Label>
                <Input
                  id="utc_offset"
                  name="utc_offset"
                  type="text"
                  placeholder="+00:00"
                  value={formData.utc_offset}
                  onChange={handleChange}
                  className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                  data-testid="utc-offset-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_name" className="text-foreground flex items-center gap-2">
                  Legal Birth Name
                  <span className="text-xs text-muted-foreground font-normal">(optional — for numerology accuracy)</span>
                </Label>
                <Input
                  id="birth_name"
                  name="birth_name"
                  type="text"
                  placeholder="As on your birth certificate"
                  value={formData.birth_name}
                  onChange={handleChange}
                  className="bg-muted/30 border-border h-12 rounded-xl focus-glow"
                  data-testid="birth-name-input"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full glow-button bg-primary text-primary-foreground h-12 text-base rounded-xl"
                  disabled={loading}
                  data-testid="complete-setup-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating Your Chart...
                    </span>
                  ) : "Complete Setup →"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-12 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                  onClick={handleSkip}
                  data-testid="skip-setup-btn"
                >
                  Skip for now →
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You can always add your birth details later in Settings.
              </p>
            </form>
          </>
        )}
      </div>

      {/* Right Side - Image */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=1200')` }}
      >
        <div className={`absolute inset-0 ${theme === "dark" ? "bg-gradient-to-r from-background via-background/80 to-transparent" : "bg-gradient-to-r from-background via-background/90 to-background/30"}`} />
        <div className="absolute bottom-12 left-12 right-12">
          <blockquote className="text-lg text-foreground italic leading-relaxed">
            "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."
          </blockquote>
          <p className="text-muted-foreground mt-3">— Carl Sagan</p>
        </div>
      </div>
    </div>
  );
}
