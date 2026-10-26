import React, { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Users, Shield, Wrench, Loader2, X } from "lucide-react";
import api from "../../api/axios";

const ALL_CATEGORIES = [
  "ragging",
  "misuse",
  "harassment",
  "food_mess",
  "electrical",
  "leakage",
  "plumbing",
  "academic",
  "wifi",
  "hostel",
  "transport",
  "library",
  "sports",
  "furniture",
  "cleaning",
  "painting",
  "other"
];

export const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Department Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["electrical"]);
  const [head, setHead] = useState("");
  const [escalationContact, setEscalationContact] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchDepartments = useCallback(async () => {
    try {
      const [deptRes, usersRes] = await Promise.all([
        api.get("/admin/departments"),
        api.get("/admin/users?limit=100")
      ]);
      if (deptRes.data?.success) setDepartments(deptRes.data.data.departments);
      if (usersRes.data?.success) setUsers(usersRes.data.data.users);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return; // Keep at least one
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    try {
      const res = await api.post("/admin/departments", {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        categoriesHandled: selectedCategories,
        head: head || null,
        escalationContact: escalationContact || null
      });

      if (res.data?.success) {
        setShowModal(false);
        setName("");
        setCode("");
        setSelectedCategories(["electrical"]);
        setHead("");
        setEscalationContact("");
        fetchDepartments();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-neutral-900" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Maintenance Departments & Escalation Contacts
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure grievance category routing, department supervisors, and Chief Warden escalation chains.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Department</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
          <span className="text-xs text-neutral-600">Loading department structure...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900">{dept.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold">
                      {dept.code}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    Staff Team: {dept.staff?.length || 0} technicians assigned
                  </span>
                </div>
              </div>

              {/* Categories Handled */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  Categories Routed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dept.categoriesHandled?.map((cat) => (
                    <span
                      key={cat}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 capitalize border border-neutral-200 font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personnel Info */}
              <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block font-medium">Department Head:</span>
                  <span className="text-neutral-900 font-semibold mt-0.5 block">
                    {dept.head?.name || "None assigned"}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block font-medium">Escalation Contact:</span>
                  <span className="text-neutral-900 font-semibold mt-0.5 block flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-neutral-700" />
                    {dept.escalationContact?.name || "Chief Warden"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-4">Create New Department</h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Campus Fire & Safety"
                  required
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SAFE"
                  maxLength={10}
                  required
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 uppercase focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                  Handled Grievance Categories *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-2 rounded-lg border text-left text-xs capitalize transition ${
                          isChecked
                            ? "bg-black text-white border-black font-semibold shadow-xs"
                            : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Department Supervisor / Head
                </label>
                <select
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                >
                  <option value="">Select Supervisor...</option>
                  {users
                    .filter((u) => u.role === "staff")
                    .map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name} ({st.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:text-neutral-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
