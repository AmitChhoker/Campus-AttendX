import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

export default function FacultyCourses() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Expanded state for accordions
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [activeSemesterTab, setActiveSemesterTab] = useState({});

  // Form State (Course added)
  const [form, setForm] = useState({
    subjectName: "", subjectCode: "", course: "B.TECH",
    branch: "CE", semester: 1, credits: 3, type: "theory", totalPlannedClasses: 40
  });
  const [file, setFile] = useState(null);

  const loadSubjects = () => {
    client.get("/subjects/my-submissions")
      .then(r => setSubjects(r.data.data || []))
      .catch(err => error(err.response?.data?.message || "Failed to load subjects"));
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
      success("Subject submitted for Admin approval!");
      setShowForm(false);
      loadSubjects(); 
    } catch (err) {
      error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the subject and ALL its attendance records.")) return;
    try {
      await client.delete(`/subjects/${id}`);
      success("Subject deleted successfully");
      loadSubjects();
    } catch (err) {
      error(err.response?.data?.message || "Failed to delete subject");
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

  // ----------------------------------------------------
  // GROUPING LOGIC: Course -> Semester -> Subjects
  // ----------------------------------------------------
  const groupedSubjects = subjects.reduce((acc, sub) => {
    const courseKey = `${sub.course || "Unknown"} - ${sub.branch || "Unknown"}`;
    if (!acc[courseKey]) acc[courseKey] = {};
    
    if (!acc[courseKey][sub.semester]) acc[courseKey][sub.semester] = [];
    
    acc[courseKey][sub.semester].push(sub);
    return acc;
  }, {});

  const toggleCourse = (courseKey) => {
    setExpandedCourse(expandedCourse === courseKey ? null : courseKey);
    // Default semester tab set to first available
    if (expandedCourse !== courseKey) {
      const semesters = Object.keys(groupedSubjects[courseKey]);
      if (semesters.length > 0) {
        setActiveSemesterTab({ ...activeSemesterTab, [courseKey]: semesters[0] });
      }
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h2>My Courses</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : <><Plus size={16} /> Upload New Subject</>}
        </button>
      </div>

      {/* UPLOAD FORM */}
      {showForm && (
        <form onSubmit={handleUpload} className="card form grid-2">
          <label className="field"><span>Course</span>
            <select value={form.course} onChange={e => setForm({...form, course: e.target.value})}>
              <option value="B.TECH">B.TECH</option>
              <option value="BCA">BCA</option>
              <option value="DIPLOMA">DIPLOMA</option>
            </select>
          </label>
          <label className="field"><span>Branch</span>
            <select value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}>
              <option value="CE">Computer Engineering (CE)</option>
              <option value="AI/ML">AI/ML</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
            </select>
          </label>
          <label className="field"><span>Semester</span>
            <input type="number" min="1" max="8" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} />
          </label>
          <label className="field"><span>Subject Name</span>
            <input required value={form.subjectName} onChange={e => setForm({...form, subjectName: e.target.value})} placeholder="e.g. NLP Theory" />
          </label>
          <label className="field"><span>Subject Code</span>
            <input required value={form.subjectCode} onChange={e => setForm({...form, subjectCode: e.target.value})} placeholder="e.g. CS701" />
          </label>
          <label className="field"><span>Subject Type</span>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="theory">Theory</option>
              <option value="lab">Practical</option>
            </select>
          </label>
          <label className="field"><span>Credits</span>
            <input type="decimal" min="1" value={form.credits} onChange={e => setForm({...form, credits: e.target.value})} />
          </label>
          <label className="field"><span>Total Planned Classes</span>
            <input type="number" min="1" value={form.totalPlannedClasses} onChange={e => setForm({...form, totalPlannedClasses: e.target.value})} />
          </label>
          <label className="field span-2"><span>Syllabus PDF</span>
            <input type="file" accept="application/pdf" required onChange={e => setFile(e.target.files[0])} />
          </label>
          <button className="btn btn-primary span-2" disabled={loading}>{loading ? "Uploading..." : "Submit for Approval"}</button>
        </form>
      )}

      {/* GROUPED COURSES LIST */}
      <div className="stack">
        {Object.keys(groupedSubjects).length === 0 && <p className="muted center-text">No subjects uploaded yet.</p>}
        
        {Object.entries(groupedSubjects).map(([courseKey, semesters]) => {
          const isExpanded = expandedCourse === courseKey;
          const semesterKeys = Object.keys(semesters).sort((a,b) => b - a); // Sort high to low
          const currentTab = activeSemesterTab[courseKey] || semesterKeys[0];
          const subjectsInTab = semesters[currentTab] || [];

          return (
            <div key={courseKey} className="card" style={{ padding: 0, overflow: "hidden" }}>
              
              {/* COURSE HEADER (Accordion Toggle) */}
              <div 
                style={{ padding: "1.5rem", background: isExpanded ? "var(--surface-2)" : "var(--surface)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => toggleCourse(courseKey)}
              >
                <div>
                  <h3 className="m-0">🎓 {courseKey}</h3>
                  <p className="muted small mt-1">
                    {Object.values(semesters).flat().length} Subjects Uploaded
                  </p>
                </div>
                <button className="btn btn-ghost">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {/* EXPANDED CONTENT (Semester Tabs & Subjects) */}
              {isExpanded && (
                <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
                  
                  {/* Semester Tabs */}
                  <div className="tabs mb-4">
                    {semesterKeys.map(sem => (
                      <button 
                        key={sem}
                        className={`tab ${currentTab === sem ? "active" : ""}`}
                        onClick={() => setActiveSemesterTab({ ...activeSemesterTab, [courseKey]: sem })}
                      >
                        Semester {sem}
                      </button>
                    ))}
                  </div>

                  {/* Subjects in this Semester */}
                  <div className="grid grid-2">
                    {subjectsInTab.map(sub => (
                      <div key={sub._id} className="card" style={{ background: "var(--bg)", boxShadow: "none", border: "1px solid var(--border)" }}>
                        <div className="row-between">
                          <h4 className="m-0">📘 {sub.subjectName}</h4>
                          <span className={`pill pill-${sub.status}`}>{sub.status}</span>
                        </div>
                        <p className="small muted mt">
                          Code: {sub.subjectCode} <br/>
                          Type: {sub.type} · Credits: {sub.credits}
                        </p>
                        
                        <div className="row-gap mt">
                          {sub.status === "approved" ? (
                            <button onClick={() => handleStartSession(sub._id)} className="btn btn-primary sm">
                              ▶ Play
                            </button>
                          ) : (
                            <button className="btn btn-ghost sm" disabled>⏳ Pending</button>
                          )}
                          
                          <button onClick={() => handleDelete(sub._id)} className="btn btn-danger sm">🗑 Delete</button>
                          <Link to={`/faculty/courses/${sub._id}`} className="btn btn-ghost sm">→ History</Link>
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