import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Radio,
  Wrench,
  BarChart3,
  Users,
  Building2,
  FileClock,
  Sparkles,
  ClipboardList,
  Award,
  QrCode
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar = () => {
  const { isStudent, isStaff, isAdmin, isNaac } = useAuth();

  const getNavLinks = () => {
    if (isNaac) {
      return [
        { to: "/naac/inspection", label: "NAAC Severe Inspection", icon: Award },
        { to: "/scan", label: "Scan Room QR", icon: QrCode },
        { to: "/student/feed", label: "Campus Live Feed", icon: Radio }
      ];
    }

    if (isAdmin) {
      return [
        { to: "/admin/dashboard", label: "Analytics Overview", icon: BarChart3 },
        { to: "/admin/complaints", label: "All Complaints", icon: ClipboardList },
        { to: "/qr-generator", label: "QR Placard Generator", icon: QrCode },
        { to: "/scan", label: "Scan Room QR", icon: QrCode },
        { to: "/admin/users", label: "Users & Staff", icon: Users },
        { to: "/admin/departments", label: "Departments", icon: Building2 },
        { to: "/admin/audit-logs", label: "Audit Logs", icon: FileClock },
        { to: "/naac/inspection", label: "NAAC Severe Inspection", icon: Award },
        { to: "/student/feed", label: "Campus Live Feed", icon: Radio }
      ];
    }

    if (isStaff) {
      return [
        { to: "/staff/dashboard", label: "Assigned Work Queue", icon: Wrench },
        { to: "/scan", label: "Scan Room QR", icon: QrCode },
        { to: "/qr-generator", label: "QR Placard Generator", icon: QrCode },
        { to: "/staff/performance", label: "My Scorecard", icon: Sparkles },
        { to: "/naac/inspection", label: "NAAC Severe Inspection", icon: Award },
        { to: "/student/feed", label: "Campus Live Feed", icon: Radio }
      ];
    }

    // Default: Student
    return [
      { to: "/student/dashboard", label: "My Complaints", icon: LayoutDashboard },
      { to: "/scan", label: "Scan Room QR", icon: QrCode },
      { to: "/student/new", label: "File New Complaint", icon: PlusCircle },
      { to: "/student/feed", label: "Public Campus Feed", icon: Radio },
      { to: "/naac/inspection", label: "NAAC Severe Oversight", icon: Award }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-white border-r border-neutral-200 p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1.5">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
