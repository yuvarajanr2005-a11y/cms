import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Lock, Mail, User, Phone, Loader2, Check, X as XIcon, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEmailValid = /^[a-zA-Z0-9._%+-]+@college\.edu$/i.test(formData.email.trim());

  const passwordValidation = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[@$!%*?&#^()_-]/.test(formData.password)
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailValid) {
      setError("Registration is open strictly to official @college.edu email addresses.");
      return;
    }
    if (!isPasswordValid) {
      setError("Please ensure your password fulfills all security requirements.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim()
      });
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden">
      {/* Background Smart Campus Theme Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
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

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Student Registration
          </h2>
          <p className="text-xs text-neutral-500">
            Create an official student account using your college email
          </p>
        </div>

        <div className="backdrop-blur-2xl bg-white/95 border border-neutral-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-neutral-200/50">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  required
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                College Email (@college.edu only) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.name@college.edu"
                  required
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
              {formData.email && (
                <div className="mt-1 text-[11px] flex items-center gap-1">
                  {isEmailValid ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Valid college email domain
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <XIcon className="w-3 h-3" /> Must end in @college.edu
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {formData.password && (
                <div className="mt-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] grid grid-cols-2 gap-1 text-neutral-500">
                  <span className={passwordValidation.length ? "text-neutral-950 font-semibold" : ""}>
                    • 8+ characters
                  </span>
                  <span className={passwordValidation.upper ? "text-neutral-950 font-semibold" : ""}>
                    • 1 uppercase letter
                  </span>
                  <span className={passwordValidation.lower ? "text-neutral-950 font-semibold" : ""}>
                    • 1 lowercase letter
                  </span>
                  <span className={passwordValidation.number ? "text-neutral-950 font-semibold" : ""}>
                    • 1 number
                  </span>
                  <span className={passwordValidation.special ? "text-neutral-950 font-semibold" : ""}>
                    • 1 special symbol
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Contact Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isEmailValid || !isPasswordValid}
              className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Student Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-neutral-500 pt-4 border-t border-neutral-100">
            Already have an account?{" "}
            <Link to="/login" className="text-neutral-950 font-bold hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
