import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { Search, UserPlus } from "lucide-react";

const TABS = [
  { key: "students", label: "Students" },
  { key: "faculty", label: "Faculty" },
  { key: "admins", label: "Admins" }
];

export default function AdminUsers() {
  const { success, error } = useToast();
  const [tab, setTab] = useState("students");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    role: "student", firstName: "", lastName: "",
    emailId: "", password: "", phone: "",
    registrationNumber: "", department: "SFET",
    course: "B.TECH", branch: "CE", batch: 2022, semester: 1,
    adminBranch: "ALL"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/admin/users/${tab}`, {
        params: search ? { search } : {}
      });
      const payload = res.data.data;
      setRows(payload.students || payload.faculty || payload.admins || []);
    } catch (e) {
      error(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await client.post("/admin/users", form);
      success("User created");
      setShowAdd(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Create failed");
    }
  };

  const toggleActive = async (u) => {
    try {
      await client.patch(`/admin/users/${u._id}/${u.isActive ? "deactivate" : "activate"}`);
      success(`User ${u.isActive ? "deactivated" : "activated"}`);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Users</h2>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="searchbar">
        <Search size={16} />
        <input
          placeholder="Search by name, email or roll number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
        />
        <button className="btn btn-ghost" onClick={fetchData}>Search</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>{tab === "students" ? "Roll No" : tab === "faculty" ? "Branch" : "Branch"}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u._id}>
                  <td>
                    <Link to={`/admin/users/${u._id}?type=${tab}`}>
                      {u.firstName} {u.lastName}
                    </Link>
                  </td>
                  <td className="muted small">{u.emailId}</td>
                  <td>{u.registrationNumber || u.branch || u.adminBranch}</td>
                  <td>
                    <span className={`pill ${u.isActive ? "pill-approved" : "pill-rejected"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="muted center">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New User">
        <form onSubmit={create} className="form grid-2">
          <label className="field"><span>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="field"><span>First Name</span>
            <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </label>
          <label className="field"><span>Last Name</span>
            <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </label>
          <label className="field"><span>Email</span>
            <input required type="email" value={form.emailId} onChange={(e) => setForm({ ...form, emailId: e.target.value })} />
          </label>
          <label className="field"><span>Password</span>
            <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <label className="field"><span>Phone</span>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>

          {form.role !== "admin" && (
            <>
              <label className="field"><span>Department</span>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </label>
              <label className="field"><span>Course</span>
                <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                  <option>B.TECH</option><option>BCA</option><option>DIPLOMA</option>
                </select>
              </label>
              <label className="field"><span>Branch</span>
                <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  <option>CE</option><option>AI/ML</option><option>ECE</option><option>ME</option>
                </select>
              </label>
            </>
          )}

          {form.role === "student" && (
            <>
              <label className="field"><span>Roll No</span>
                <input required value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
              </label>
              <label className="field"><span>Batch</span>
                <input type="number" value={form.batch} onChange={(e) => setForm({ ...form, batch: Number(e.target.value) })} />
              </label>
              <label className="field"><span>Semester</span>
                <input type="number" min="1" max="8" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
              </label>
            </>
          )}

          {form.role === "admin" && (
            <label className="field"><span>Admin Branch</span>
              <select value={form.adminBranch} onChange={(e) => setForm({ ...form, adminBranch: e.target.value })}>
                <option>ALL</option><option>CE</option><option>AI/ML</option>
                <option>ECE</option><option>ME</option><option>BCA</option><option>DIPLOMA CE</option>
              </select>
            </label>
          )}

          <div className="modal-actions span-2">
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary">Create User</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}