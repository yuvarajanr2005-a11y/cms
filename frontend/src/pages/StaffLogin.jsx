import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wrench,
  CheckCircle2,
  Clock,
  Building2,
  Shield,
  Award
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const StaffLogin = () => {
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
      } else if (user.role === "naac") {
        navigate("/naac/inspection");
      } else if (user.role === "staff") {
        navigate("/staff/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Staff login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStaffLogin = (demoEmail, demoPass) => {
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

      {/* Cinematic Dark/Light Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/95 via-slate-800/90 to-blue-950/85 backdrop-blur-[3px]" />
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-900/40 to-slate-950/95" />

      {/* Ambient Animated Glow Lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Staff Console Highlights */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 text-white pr-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md self-start shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span>Faculty, Maintenance, Admin &amp; NAAC Portal</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Institutional Authority &amp; <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                NAAC Quality Inspection
              </span>{" "}
              Console
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Dedicated operations portal for all college staff: Electrical, Plumbing, IT Systems, Civil Facilities, Department Heads, Chief Warden, and the NAAC Quality Audit Committee.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">NAAC Inspection Protocol</h3>
              <p className="text-[11px] text-slate-300 leading-snug">
                On-site physical inspection logs and official executive Action Confirmation Slips.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
                <Wrench className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Technician Work Orders</h3>
              <p className="text-[11px] text-slate-300 leading-snug">
                Workload-balanced ticket queues with photo verification and SLA timers.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Escalation Tier Controls</h3>
              <p className="text-[11px] text-slate-300 leading-snug">
                Level 1 Department Head and Level 2 Chief Warden automatic intervention.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Campus Heatmap Analytics</h3>
              <p className="text-[11px] text-slate-300 leading-snug">
                Live density tracking across Hostel Blocks, Academic Floors and Labs.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 pt-2 border-t border-white/15 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Staff Department Coverage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Automated SLA Cron Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Socket Telemetry Sync</span>
            </div>
          </div>
        </div>

        {/* Right Column: Staff Login Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-5">
          {/* Mobile Header */}
          <div className="text-center lg:hidden space-y-1">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Staff &amp; NAAC Portal</h2>
            <p className="text-xs text-slate-300">Official college authority consoles</p>
          </div>

          {/* Form Card */}
          <div className="backdrop-blur-2xl bg-white/95 border border-white/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 tracking-tight">Staff Sign In</h2>
                  <p className="text-[11px] text-neutral-500">College Staff, Faculty &amp; NAAC Console</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Staff Secure
              </span>
            </div>

            {/* Quick Staff Fast Logins */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-neutral-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-neutral-800 font-semibold text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Staff Presets</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-normal">Tap to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin("naac.officer@college.edu", "Naac@Password123")}
                  className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs font-semibold col-span-2"
                >
                  <span className="text-sm">🏛️</span>
                  <div className="truncate">
                    <span className="block leading-tight font-bold">NAAC Quality Officer (Dr. Radhakrishnan)</span>
                    <span className="text-[9px] text-amber-700 font-normal">On-site Inspection &amp; Action Confirmation</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin("admin@college.edu", "Admin@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>👑</span>
                  <span className="font-semibold truncate">System Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin("chief.warden@college.edu", "Warden@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🛡️</span>
                  <span className="font-semibold truncate">Chief Warden</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin("elec.head@college.edu", "Staff@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>⚡</span>
                  <span className="font-semibold truncate">Electrical HOD</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin("elec.tech@college.edu", "Staff@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>💡</span>
                  <span className="font-semibold truncate">Electrician Tech</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin("plumb.tech@college.edu", "Staff@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🚰</span>
                  <span className="font-semibold truncate">Plumber Tech</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin("it.tech@college.edu", "Staff@Password123")}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-left transition text-[11px] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🌐</span>
                  <span className="font-semibold truncate">IT Network Eng</span>
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
                  Staff / Faculty Name or Official Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. Prof. Vikram Sarabhai or elec.head@college.edu"
                    required
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
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
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Login to Staff / NAAC Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Switch to Student Portal */}
            <div className="pt-3 border-t border-neutral-100">
              <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-between text-neutral-700 text-xs">
                <span className="text-[11px] font-medium">Are you a College Student?</span>
                <Link
                  to="/student/login"
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  Student Login <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Security / Status Footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Staff Security Gateway v2.0 • 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
