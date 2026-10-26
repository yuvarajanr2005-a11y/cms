import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Building2,
  Shield,
  Award,
  Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("role") === "staff" ? "staff" : "student";
  const [activeTab, setActiveTab] = useState(initialTab); // "student" or "staff"

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
      } else if (user.role === "naac") {
        navigate("/naac/inspection");
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

  const isStudentTab = activeTab === "student";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden">
      {/* Background Smart Campus Theme Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/images/smart_campus_bg.jpg')"
        }}
      />

      {/* Overlays dependent on selected tab */}
      <div
        className={`absolute inset-0 transition-colors duration-500 backdrop-blur-[2px] ${
          isStudentTab
            ? "bg-gradient-to-tr from-slate-100/95 via-white/90 to-emerald-50/80"
            : "bg-gradient-to-tr from-slate-900/95 via-slate-800/90 to-blue-950/85"
        }`}
      />
      <div
        className={`absolute inset-0 ${
          isStudentTab
            ? "bg-radial-at-c from-transparent via-slate-100/50 to-white/95"
            : "bg-radial-at-c from-transparent via-slate-900/40 to-slate-950/95"
        }`}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Role Information */}
        <div
          className={`hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 pr-4 transition-colors duration-500 ${
            isStudentTab ? "text-neutral-900" : "text-white"
          }`}
        >
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md self-start shadow-sm ${
              isStudentTab
                ? "bg-emerald-600 text-white"
                : "bg-blue-600/40 text-blue-200 border border-blue-400/30"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            {isStudentTab ? (
              <>
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Total College Student Grievance System</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>College Staff &amp; NAAC Inspection Authority</span>
              </>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
              {isStudentTab ? (
                <>
                  Campus Student Portal &amp; <br />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-700 to-neutral-800 bg-clip-text text-transparent">
                    Grievance Resolution
                  </span>{" "}
                  Platform
                </>
              ) : (
                <>
                  Campus Staff, Faculty &amp; <br />
                  <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                    NAAC Inspection Action
                  </span>{" "}
                  Console
                </>
              )}
            </h1>
            <p
              className={`text-sm leading-relaxed max-w-xl ${
                isStudentTab ? "text-neutral-600" : "text-slate-300"
              }`}
            >
              {isStudentTab
                ? "Unified login for all students across departments. File maintenance grievances, track real-time SLA countdowns, and request on-site NAAC inspections for severe campus hazards."
                : "Operations console for Department Heads, Maintenance Technicians, Administrators, and the NAAC Quality Audit Committee. Conduct physical inspection visits and confirm official action slips."}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div
              className={`p-3.5 rounded-2xl backdrop-blur-md space-y-1.5 shadow-sm border ${
                isStudentTab
                  ? "bg-white/90 border-neutral-200/90 text-neutral-900"
                  : "bg-white/10 border-white/15 text-white"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isStudentTab
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-500/20 text-blue-300 border-blue-400/30"
                }`}
              >
                {isStudentTab ? <Users className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
              </div>
              <h3 className="text-xs font-bold">
                {isStudentTab ? "Common Student Access" : "Staff Department Queues"}
              </h3>
              <p
                className={`text-[11px] leading-snug ${
                  isStudentTab ? "text-neutral-500" : "text-slate-300"
                }`}
              >
                {isStudentTab
                  ? "Open for all students in all college departments and residential hostel blocks."
                  : "Balanced ticket queues for Electrical, Plumbing, IT & Network, and Civil units."}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-2xl backdrop-blur-md space-y-1.5 shadow-sm border ${
                isStudentTab
                  ? "bg-white/90 border-neutral-200/90 text-neutral-900"
                  : "bg-white/10 border-white/15 text-white"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isStudentTab
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}
              >
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold">NAAC Inspection Protocol</h3>
              <p
                className={`text-[11px] leading-snug ${
                  isStudentTab ? "text-neutral-500" : "text-slate-300"
                }`}
              >
                {isStudentTab
                  ? "Severe complaints trigger NAAC Committee visits and official verified action slips."
                  : "On-site visit logging, severity validation, and official NAAC Action Confirmation Slips."}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div
            className={`flex items-center gap-6 pt-2 border-t text-xs ${
              isStudentTab
                ? "border-neutral-200 text-neutral-600"
                : "border-white/15 text-slate-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>98.6% SLA Compliance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>&lt; 45m Avg Response</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Cryptographic Proof Closure</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Form Card with Tab Switcher */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-4">
          {/* Main Card */}
          <div className="backdrop-blur-2xl bg-white/95 border border-neutral-200/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            {/* Dual Role Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-2xl border border-neutral-200 gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("student");
                  setError("");
                }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  isStudentTab
                    ? "bg-white text-emerald-700 shadow-sm border border-neutral-200/80"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Portal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("staff");
                  setError("");
                }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  !isStudentTab
                    ? "bg-white text-blue-700 shadow-sm border border-neutral-200/80"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Staff &amp; NAAC</span>
              </button>
            </div>

            {/* Sub-header info */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                  {isStudentTab ? "Student Sign In" : "Staff &amp; NAAC Sign In"}
                </h2>
                <p className="text-[11px] text-neutral-500">
                  {isStudentTab
                    ? "Common login for all college students"
                    : "Faculty, Technicians, Admin &amp; NAAC Cell"}
                </p>
              </div>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 border ${
                  isStudentTab
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isStudentTab ? "bg-emerald-500" : "bg-blue-600"
                  }`}
                />
                {isStudentTab ? "Student Access" : "Staff Access"}
              </span>
            </div>

            {/* 1-Click Fast Logins for current tab */}
            {isStudentTab ? (
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-800 font-semibold text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Student Test Accounts</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Tap to fill</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("alex.student@college.edu", "Student@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>💻</span>
                    <span className="font-semibold truncate">Alex (CSE)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("priya.student@college.edu", "Student@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>⚡</span>
                    <span className="font-semibold truncate">Priya (ECE)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("rahul.student@college.edu", "Student@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>⚙️</span>
                    <span className="font-semibold truncate">Rahul (MECH)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("sneha.student@college.edu", "Student@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>🏗️</span>
                    <span className="font-semibold truncate">Sneha (CIVIL)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-800 font-semibold text-[11px]">
                  <div className="flex items-center gap-1.5 text-blue-950">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Staff &amp; NAAC Presets</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Tap to fill</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("naac.officer@college.edu", "Naac@Password123")}
                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs col-span-2 font-semibold"
                  >
                    <span>🏛️</span>
                    <span className="truncate">NAAC Officer (Dr. Radhakrishnan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin@college.edu", "Admin@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>👑</span>
                    <span className="font-semibold truncate">System Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("chief.warden@college.edu", "Warden@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>🛡️</span>
                    <span className="font-semibold truncate">Chief Warden</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("elec.tech@college.edu", "Staff@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>⚡</span>
                    <span className="font-semibold truncate">Electrician Tech</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("plumb.tech@college.edu", "Staff@Password123")}
                    className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>🚰</span>
                    <span className="font-semibold truncate">Plumbing Tech</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {isStudentTab ? "Student Name or College Email" : "Staff / Faculty Name or Official Email"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      isStudentTab
                        ? "e.g. Alex Johnson or alex.student@college.edu"
                        : "e.g. Prof. Vikram Sarabhai or elec.head@college.edu"
                    }
                    required
                    className={`w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 transition ${
                      isStudentTab
                        ? "focus:border-emerald-600 focus:ring-emerald-600"
                        : "focus:border-blue-600 focus:ring-blue-600"
                    }`}
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
                    className={`w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 transition ${
                      isStudentTab
                        ? "focus:border-emerald-600 focus:ring-emerald-600"
                        : "focus:border-blue-600 focus:ring-blue-600"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50 ${
                  isStudentTab
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {isStudentTab ? "Sign In as College Student" : "Sign In to Staff / NAAC Console"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-xs text-neutral-500 pt-2 border-t border-neutral-100 flex items-center justify-between">
              {isStudentTab ? (
                <>
                  <span>New student?</span>
                  <Link to="/register" className="text-emerald-700 font-bold hover:underline">
                    Register student account
                  </Link>
                </>
              ) : (
                <>
                  <span>Looking for student portal?</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("student")}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Switch to Student Login
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Links for direct pages */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-neutral-500">
            <Link to="/student/login" className="hover:text-emerald-600 transition underline">
              Direct Student Login URL
            </Link>
            <span>•</span>
            <Link to="/staff/login" className="hover:text-blue-600 transition underline">
              Direct Staff Login URL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
