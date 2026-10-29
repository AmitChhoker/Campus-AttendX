import { useEffect, useState } from "react";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Upload, FileText } from "lucide-react";

export default function FacultySubjects() {
  const { success, error } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    subjectName: "", subjectCode: "", course: "B.TECH",
    branch: "CE", semester: 1, credits: 4, type: "theory"
  });
  const [file, setFile] = useState(null);

  const loadSubjects = () => {
    client.get("/subjects/my-submissions").then(r => setSubjects(r.data.data || []));
  };

  useEffect(() => { loadSubjects(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return error("Please select a syllabus PDF");
    
    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    formData.append("syllabus", file);

    try {
      await client.post("/subjects", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      success("Subject submitted for Admin approval!");
      setShowForm(false);
      loadSubjects();
    } catch (err) {
      error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h2>My Subjects</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Submit New Subject"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="card form grid-2">
          <label className="field"><span>Subject Name</span>
            <input required value={form.subjectName} onChange={e => setForm({...form, subjectName: e.target.value})} />
          </label>
          <label className="field"><span>Subject Code</span>
            <input required value={form.subjectCode} onChange={e => setForm({...form, subjectCode: e.target.value})} />
          </label>
          <label className="field"><span>Branch</span>
            <select value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}>
              <option>CE</option><option>AI/ML</option><option>ECE</option><option>ME</option>
            </select>
          </label>
          <label className="field"><span>Semester</span>
            <input type="number" min="1" max="8" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} />
          </label>
          <label className="field span-2"><span>Syllabus PDF</span>
            <input type="file" accept="application/pdf" required onChange={e => setFile(e.target.files[0])} />
          </label>
          <button className="btn btn-primary span-2" disabled={loading}>
            {loading ? "Uploading..." : "Submit for Approval"}
          </button>
        </form>
      )}

      <div className="grid grid-2">
        {subjects.length === 0 && <p className="muted">No subjects submitted yet.</p>}
        {subjects.map(sub => (
          <div key={sub._id} className="card">
            <div className="row-between">
              <h3 className="m-0">{sub.subjectName}</h3>
              <span className={`pill pill-${sub.status}`}>{sub.status}</span>
            </div>
            <p className="small muted mt">{sub.subjectCode} · {sub.branch} · Sem {sub.semester}</p>
            {sub.status === "rejected" && (
              <p className="small text-red-500 mt">Reason: {sub.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}