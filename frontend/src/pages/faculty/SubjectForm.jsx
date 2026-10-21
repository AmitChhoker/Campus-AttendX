import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";

export default function FacultySubjectForm() {
  const nav = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState({
    subjectName: "", subjectCode: "", course: "B.TECH",
    branch: "CE", semester: 1, credits: 4, type: "theory"
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return error("Please select a syllabus PDF");
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("syllabus", file);
    try {
      await client.post("/subjects", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      success("Subject submitted for approval");
      nav("/faculty/subjects");
    } catch (err) {
      error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Submit New Subject</h2>
      </div>
      <form onSubmit={submit} className="card form grid-2">
        <label className="field"><span>Subject Name</span>
          <input required value={form.subjectName}
            onChange={(e) => setForm({ ...form, subjectName: e.target.value })} />
        </label>
        <label className="field"><span>Subject Code</span>
          <input required value={form.subjectCode}
            onChange={(e) => setForm({ ...form, subjectCode: e.target.value })} />
        </label>
        <label className="field"><span>Course</span>
          <select value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })}>
            <option>B.TECH</option><option>BCA</option><option>DIPLOMA</option>
          </select>
        </label>
        <label className="field"><span>Branch</span>
          <select value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}>
            <option>CE</option><option>AI/ML</option><option>ECE</option><option>ME</option>
          </select>
        </label>
        <label className="field"><span>Semester</span>
          <input type="number" min="1" max="8" value={form.semester}
            onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
        </label>
        <label className="field"><span>Credits</span>
          <input type="number" min="0" value={form.credits}
            onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
        </label>
        <label className="field"><span>Type</span>
          <select value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
            <option value="elective">Elective</option>
          </select>
        </label>
        <label className="field"><span>Syllabus PDF</span>
          <input type="file" accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <div className="span-2">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Submitting…" : "Submit Subject"}
          </button>
        </div>
      </form>
    </div>
  );
}