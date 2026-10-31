import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { ChevronLeft, Plus, ChevronDown, ChevronUp, Play, Trash, History } from "lucide-react";

export default function FacultyCourses() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [activeSemesterTab, setActiveSemesterTab] = useState({});

  const [form, setForm] = useState({
    subjectName: "", subjectCode: "", course: "B.TECH",
    branch: "CE", semester: 1, credits: 3, type: "theory", totalPlannedClasses: 40
  });
  const [file, setFile] = useState(null);

  const loadSubjects = () => {
    client.get("/subjects/my-submissions")
      .then(r => setSubjects(r.data?.data || []))
      .catch(err => error("Failed to load subjects"));
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
      await client.post("/subjects", formData, { headers: { "Content-Type": "multipart/form-data" } });
      success("Subject submitted!");
      setShowForm(false);
      loadSubjects(); 
    } catch (err) {
      error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (subjectId) => {
    try {
      const res = await client.post("/attendance-sessions", { subjectId });
      success("Session started!");
      navigate(`/faculty/session/${res.data.data.session._id}`);
    } catch (err) {
      error(err.response?.data?.message || "Failed to start session");
    }
  };

  // Grouping
  const groupedSubjects = subjects.reduce((acc, sub) => {
    const courseKey = `${sub.course} - ${sub.branch}`;
    if (!acc[courseKey]) acc[courseKey] = {};
    if (!acc[courseKey][sub.semester]) acc[courseKey][sub.semester] = [];
    acc[courseKey][sub.semester].push(sub);
    return acc;
  }, {});

  const toggleCourse = (key) => {
    setExpandedCourse(expandedCourse === key ? null : key);
    if (expandedCourse !== key) {
      const semesters = Object.keys(groupedSubjects[key]);
      if (semesters.length > 0) setActiveSemesterTab({ ...activeSemesterTab, [key]: semesters[0] });
    }
  };

  return (
    <div className="stack pb-20">
      <div className="row-between mb-4">
        <button className="btn btn-ghost sm" onClick={() => navigate("/faculty")}>
          <ChevronLeft size={18} /> Back
        </button>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : <><Plus size={16} /> Upload Subject</>}
        </button>
      </div>

      <h2 className="page-title">My Courses</h2>

      {showForm && (
        <form onSubmit={handleUpload} className="card form grid-2 mb-4 animate-fade-in">
          <label className="field"><span>Course</span>
            <select value={form.course} onChange={e => setForm({...form, course: e.target.value})}>
              <option value="B.TECH">B.TECH</option><option value="BCA">BCA</option><option value="DIPLOMA">DIPLOMA</option>
            </select>
          </label>
          <label className="field"><span>Branch</span>
            <select value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}>
              <option value="CE">Computer Engineering (CE)</option><option value="AI/ML">AI/ML</option><option value="ECE">ECE</option><option value="ME">ME</option>
            </select>
          </label>
          <label className="field"><span>Semester</span><input type="number" min="1" max="8" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} /></label>
          <label className="field"><span>Subject Name</span><input required value={form.subjectName} onChange={e => setForm({...form, subjectName: e.target.value})} /></label>
          <label className="field"><span>Subject Code</span><input required value={form.subjectCode} onChange={e => setForm({...form, subjectCode: e.target.value})} /></label>
          <label className="field"><span>Type</span>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="theory">Theory</option><option value="lab">Practical</option>
            </select>
          </label>
          <label className="field span-2"><span>Syllabus PDF</span><input type="file" accept="application/pdf" required onChange={e => setFile(e.target.files[0])} /></label>
          <button className="btn btn-primary span-2" disabled={loading}>{loading ? "Uploading..." : "Submit for Approval"}</button>
        </form>
      )}

      <div className="stack">
        {Object.entries(groupedSubjects).map(([courseKey, semesters]) => {
          const isExpanded = expandedCourse === courseKey;
          const semesterKeys = Object.keys(semesters).sort((a,b) => b - a);
          const currentTab = activeSemesterTab[courseKey] || semesterKeys[0];
          
          return (
            <div key={courseKey} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div 
                className="row-between cursor-pointer p-4" 
                style={{ background: isExpanded ? "var(--surface-2)" : "white" }}
                onClick={() => toggleCourse(courseKey)}
              >
                <div>
                  <h3 className="m-0 flex items-center gap-2">🎓 {courseKey}</h3>
                  <p className="muted small mt-1">{Object.values(semesters).flat().length} Subjects</p>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {isExpanded && (
                <div className="p-4 border-t">
                  <div className="tabs mb-4">
                    {semesterKeys.map(sem => (
                      <button key={sem} className={`tab ${currentTab === sem ? "active" : ""}`} onClick={() => setActiveSemesterTab({ ...activeSemesterTab, [courseKey]: sem })}>
                        Semester {sem}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-2">
                    {semesters[currentTab].map(sub => (
                      <div key={sub._id} className="card" style={{ background: "var(--bg)", boxShadow: "none" }}>
                        <div className="row-between">
                          <h4 className="m-0">📘 {sub.subjectName}</h4>
                          <span className={`pill pill-${sub.status}`}>{sub.status}</span>
                        </div>
                        <p className="small muted mt">{sub.subjectCode} · {sub.type} · {sub.credits} credits</p>
                        <div className="row-gap mt-2">
                          {sub.status === "approved" && (
                            <button onClick={() => handleStartSession(sub._id)} className="btn btn-primary sm"><Play size={14}/> Play</button>
                          )}
                          <Link to={`/faculty/courses/${sub._id}`} className="btn btn-ghost sm"><History size={14}/> History</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}