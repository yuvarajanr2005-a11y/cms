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
  CheckCircle2,
  Clock,
  KeyRound,
  Building2,
  UserCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const StudentLogin = () => {
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
      } else if (user.role === "naac") {
        navigate("/naac/inspection");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Student login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStudentLogin = (demoEmail, demoPass) => {
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

      {/* Cinematic Light Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-100/95 via-white/90 to-blue-50/80 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-100/50 to-white/95" />

      {/* Ambient Animated Glow Lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-200/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Student Portal Highlights */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 text-neutral-900 pr-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold backdrop-blur-md self-start shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <GraduationCap className="w-3.5 h-3.5 text-white" />
            <span>Central Student Grievance Portal • All College Students</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-neutral-950">
              Student Grievance &amp; <br />
              <span className="bg-gradient-to-r from-emerald-700 via-teal-800 to-neutral-800 bg-clip-text text-transparent">
                NAAC Accreditation
              </span>{" "}
              Resolution Desk
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
              Common login for all college students across Engineering, Arts &amp; Sciences, Computer Science, Mechanical, Civil, and Hostels. Raise tickets, track live SLAs, and trigger NAAC on-site inspection for severe campus hazards.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">Total Student Access</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Unified for all undergraduate, postgraduate, and hostel resident students.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">Live SLA Deadlines</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Transparent countdowns: 6h emergency, 24h standard with auto-escalation.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">NAAC Inspection Cell</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Severe grievances are audited on-site by NAAC and confirmed with official slips.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 border border-neutral-200/90 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">4-Digit OTP Closure</h3>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Technicians cannot close your ticket without your cryptographic OTP.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 pt-2 border-t border-neutral-200 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Student Body Coverage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-800" />
              <span>Real-time Status Tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>NAAC Criterion V Compliant</span>
            </div>
          </div>
        </div>

        {/* Right Column: Student Login Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-5">
          {/* Mobile Header */}
          <div className="text-center lg:hidden space-y-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Student Login Portal</h2>
            <p className="text-xs text-neutral-500">Common portal for all college students</p>
          </div>

          {/* Form Card */}
          <div className="backdrop-blur-2xl bg-white/95 border border-neutral-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-neutral-200/50 space-y-5">
            {/* Card Header with Portal Switcher Link */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 tracking-tight">Student Sign In</h2>
                  <p className="text-[11px] text-neutral-500">All College Students Common Login</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Student Portal
              </span>
            </div>

            {/* Department Quick Student Logins */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-neutral-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-neutral-800 font-semibold text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Student Fast Logins</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-normal">Tap to test</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickStudentLogin("alex.student@college.edu", "Student@Password123")}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 hover:text-emerald-800 border border-neutral-200 hover:border-emerald-300 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs group"
                >
                  <span className="text-sm">💻</span>
                  <div className="truncate">
                    <span className="font-semibold block leading-tight">Alex (CSE)</span>
                    <span className="text-[9px] text-neutral-400 group-hover:text-emerald-600">Comp Science</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStudentLogin("priya.student@college.edu", "Student@Password123")}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 hover:text-emerald-800 border border-neutral-200 hover:border-emerald-300 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs group"
                >
                  <span className="text-sm">⚡</span>
                  <div className="truncate">
                    <span className="font-semibold block leading-tight">Priya (ECE)</span>
                    <span className="text-[9px] text-neutral-400 group-hover:text-emerald-600">Electronics</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStudentLogin("rahul.student@college.edu", "Student@Password123")}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 hover:text-emerald-800 border border-neutral-200 hover:border-emerald-300 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs group"
                >
                  <span className="text-sm">⚙️</span>
                  <div className="truncate">
                    <span className="font-semibold block leading-tight">Rahul (MECH)</span>
                    <span className="text-[9px] text-neutral-400 group-hover:text-emerald-600">Mechanical</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStudentLogin("sneha.student@college.edu", "Student@Password123")}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 hover:text-emerald-800 border border-neutral-200 hover:border-emerald-300 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs group"
                >
                  <span className="text-sm">🏗️</span>
                  <div className="truncate">
                    <span className="font-semibold block leading-tight">Sneha (CIVIL)</span>
                    <span className="text-[9px] text-neutral-400 group-hover:text-emerald-600">Civil Eng</span>
                  </div>
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
                  Student Name or College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. Alex Johnson or alex.student@college.edu"
                    required
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
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
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Login as College Student</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Registration and Switch to Staff Portal */}
            <div className="space-y-2.5 pt-3 border-t border-neutral-100 text-center text-xs">
              <div className="text-neutral-500">
                Are you a new student?{" "}
                <Link to="/register" className="text-emerald-700 font-bold hover:underline">
                  Register student account
                </Link>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-between text-neutral-700">
                <span className="text-[11px] font-medium">Are you a Staff / NAAC Member?</span>
                <Link
                  to="/staff/login"
                  className="text-[11px] font-bold text-neutral-950 hover:text-blue-700 flex items-center gap-1"
                >
                  Staff Login <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Security / Status Footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Central Student Gateway • 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
