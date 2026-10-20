import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { NotificationToast } from "./components/NotificationToast";

// Pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { NewComplaint } from "./pages/student/NewComplaint";
import { PublicFeed } from "./pages/student/PublicFeed";
import { ComplaintDetails } from "./pages/student/ComplaintDetails";
import { StaffDashboard } from "./pages/staff/StaffDashboard";
import { StaffPerformance } from "./pages/staff/StaffPerformance";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminComplaints } from "./pages/admin/AdminComplaints";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminDepartments } from "./pages/admin/AdminDepartments";
import { AdminAuditLogs } from "./pages/admin/AdminAuditLogs";

// Layout wrapper for authenticated pages
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50/70 text-neutral-900 flex flex-col">
      <Navbar />
      <NotificationToast />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-neutral-500 text-xs">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to user's appropriate portal
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "staff") return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Outlet />;
};

// Root redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "staff") return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Authenticated Layout */}
            <Route element={<AppLayout />}>
              {/* Shared Authenticated Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/complaints/:id" element={<ComplaintDetails />} />
                <Route path="/student/feed" element={<PublicFeed />} />
              </Route>

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/new" element={<NewComplaint />} />
              </Route>

              {/* Staff Routes */}
              <Route element={<ProtectedRoute allowedRoles={["staff", "admin"]} />}>
                <Route path="/staff/dashboard" element={<StaffDashboard />} />
                <Route path="/staff/performance" element={<StaffPerformance />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/complaints" element={<AdminComplaints />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/departments" element={<AdminDepartments />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
