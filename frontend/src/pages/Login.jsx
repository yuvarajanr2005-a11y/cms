import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Lock,
  Mail,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wrench,
  Clock,
  CheckCircle2,
  Activity,
  Building2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(email.trim(), password);
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "staff") {
        navigate("/staff/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden">
      {/* Background Smart Campus Theme Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/images/smart_campus_bg.jpg')"
        }}
      />

      {/* Cinematic White / Light Translucent Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-100/95 via-white/90 to-slate-200/80 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-100/50 to-white/95" />

      {/* Ambient Animated Glow Lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-neutral-300/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-neutral-300/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Project Theme & Highlights (Visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 text-neutral-900 pr-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-semibold backdrop-blur-md self-start shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Activity className="w-3.5 h-3.5 text-white" />
            <span>Smart College Infrastructure Management</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-neutral-950">
              Next-Gen Campus <br />
              <span className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                Grievance & Resolution
              </span>{" "}
              Platform
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
              Experience seamless incident dispatch, algorithmic SLA deadline enforcement, and cryptographically verified photographic proof of work across all campus departments.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center border border-neutral-200">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">Dynamic SLA Engine</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Automated escalation to Department Heads and Chief Warden upon timeline breach.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center border border-neutral-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">Dual Proof Verification</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Technician resolution photo upload paired with 4-digit student OTP verification.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center border border-neutral-200">
                <Wrench className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">Multi-Dept Auto-Routing</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Instant workload-balanced dispatch to Electrical, Plumbing, IT & Civil units.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center border border-neutral-200">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">Live Socket Telemetry</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Zero-latency ticket updates across student, technician, and admin dashboards.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 pt-2 border-t border-neutral-200 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>98.6% SLA Compliance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-800" />
              <span>&lt; 45m Avg Response</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>4 Active Zones</span>
            </div>
          </div>
        </div>

        {/* Right Column: Modern White Login Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-5">
          {/* Mobile Header (visible only on sm/md) */}
          <div className="text-center lg:hidden space-y-1">
            <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center text-white mx-auto shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">SmartCMS Portal</h2>
            <p className="text-xs text-neutral-500">Smart College Grievance & SLA Management</p>
          </div>

          {/* Form Card */}
          <div className="backdrop-blur-2xl bg-white/95 border border-neutral-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-neutral-200/50 space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 tracking-tight">Sign In</h2>
                  <p className="text-[11px] text-neutral-500">Access campus portal consoles</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {/* Demo Fast Login Switcher */}
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-neutral-800 font-semibold text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Demo Accounts</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-normal">Tap to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin@college.edu", "Admin@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>👑</span>
                  <span className="font-semibold truncate">Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("alex.student@college.edu", "Student@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🎒</span>
                  <span className="font-semibold truncate">Student (Alex)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("elec.tech@college.edu", "Staff@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>⚡</span>
                  <span className="font-semibold truncate">Electrician</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("civil.tech@college.edu", "Staff@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🏗️</span>
                  <span className="font-semibold truncate">Civil Staff</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  College Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. alex.student@college.edu"
                    required
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white transition flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-xs text-neutral-500 pt-3 border-t border-neutral-100">
              Are you a new student?{" "}
              <Link to="/register" className="text-neutral-900 font-bold hover:underline">
                Register here
              </Link>
            </div>
          </div>

          {/* Bottom Security / Status Footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-neutral-900" />
            <span>SmartCMS Gateway v2.0 • 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

