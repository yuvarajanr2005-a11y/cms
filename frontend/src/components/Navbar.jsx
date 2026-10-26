import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Wrench,
  GraduationCap,
  CheckCheck,
  Award
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export const Navbar = () => {
  const { user, logout, isStudent, isStaff, isAdmin, isNaac } = useAuth();
  const { notifications, clearAllNotifications } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-neutral-200 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-md shadow-black/10 group-hover:scale-105 transition">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-neutral-900 tracking-tight flex items-center gap-1.5">
              SmartCMS <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">v2.0</span>
            </span>
            <span className="text-[11px] text-neutral-500 block -mt-1 font-medium">
              College Grievance Engine
            </span>
          </div>
        </Link>

        {/* User Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-neutral-600 hover:text-black hover:bg-neutral-100 transition relative"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Notifications ({notifications.length})
                  </h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-neutral-700 hover:text-black font-semibold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Clear all
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-neutral-400 py-6">
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs hover:bg-neutral-100/80 transition"
                      >
                        <p className="font-semibold text-neutral-900">{n.title}</p>
                        <p className="text-neutral-600 text-[11px] mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-neutral-400 mt-1 block">
                          {n.receivedAt ? new Date(n.receivedAt).toLocaleTimeString() : "Just now"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Badge & Profile */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-bold text-neutral-900 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {user.email}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isNaac ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 font-semibold shadow-sm border border-amber-600/50">
                    <Award className="w-3 h-3 text-amber-400" /> NAAC Committee
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-neutral-900 text-white font-semibold shadow-sm">
                    <Shield className="w-3 h-3 text-red-400" /> Admin
                  </span>
                ) : isStaff ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-neutral-900 text-white font-semibold shadow-sm">
                    <Wrench className="w-3 h-3 text-purple-400" /> Staff
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-neutral-900 text-white font-semibold shadow-sm">
                    <GraduationCap className="w-3 h-3 text-emerald-400" /> Student
                  </span>
                )}

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50 transition ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
