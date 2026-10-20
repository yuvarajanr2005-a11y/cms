import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Search, Shield, Wrench, GraduationCap, Loader2, Check, X, Lock } from "lucide-react";
import api from "../../api/axios";

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    staffType: "maintenance",
    department: "",
    phone: ""
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);

      const [usersRes, deptsRes] = await Promise.all([
        api.get(`/admin/users?${params.toString()}`),
        api.get("/admin/departments")
      ]);

      if (usersRes.data?.success) setUsers(usersRes.data.data.users);
      if (deptsRes.data?.success) setDepartments(deptsRes.data.data.departments || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert("Failed to update user status.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await api.post("/admin/users", {
        ...formData,
        department: formData.role === "staff" && formData.department ? formData.department : null,
        staffType: formData.role === "staff" ? formData.staffType : null
      });

      if (res.data?.success) {
        setShowCreateModal(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "staff",
          staffType: "maintenance",
          department: "",
          phone: ""
        });
        fetchUsers();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-900" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Campus User Management
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage students, technicians, department heads, and system administrators.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs p-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
          <span className="text-xs text-neutral-600">Loading user accounts...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/90 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role & Sub-Type</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Active Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-neutral-900">{u.name}</p>
                      <p className="text-[11px] text-neutral-500 font-mono">{u.email}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-black text-white font-semibold">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : u.role === "staff" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 font-semibold">
                          <Wrench className="w-3 h-3 text-neutral-600" /> Staff ({u.staffType || "maintenance"})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 font-semibold">
                          <GraduationCap className="w-3 h-3 text-neutral-600" /> Student
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-700">
                      {u.department ? `${u.department.name} (${u.department.code})` : "—"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.isActive ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-medium flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(u._id, u.isActive)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          u.isActive
                            ? "bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300"
                            : "bg-black hover:bg-neutral-800 text-white"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-4">Provision New Account</h3>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Ramesh Patel"
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="e.g. ramesh.staff@college.edu"
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Administrator</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                {formData.role === "staff" && (
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                      Staff Sub-Type *
                    </label>
                    <select
                      value={formData.staffType}
                      onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="department_head">Department Head</option>
                    </select>
                  </div>
                )}
              </div>

              {formData.role === "staff" && (
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:text-neutral-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
