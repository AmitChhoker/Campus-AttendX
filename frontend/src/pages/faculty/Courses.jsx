import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { 
  ChevronLeft, Plus, ChevronDown, ChevronUp, Play, History, 
  GraduationCap, BookOpen, Clock, Award 
} from "lucide-react";

export default function FacultyCourses() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [activeSemesterTab, setActiveSemesterTab] = useState({});

  // Form State
  const [form, setForm] = useState({
    subjectName: "", subjectCode: "", course: "B.TECH",
    branch: "CE", semester: 1, credits: 3, type: "theory", 
    totalPlannedClasses: 40, sessionYear: "2023-2027", hoursPerClass: 1
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

  // Grouping Logic
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
      {/* Top Navigation & Action */}
      <div className="row-between mb-6">
        <button className="btn btn-ghost sm hover-lift" onClick={() => navigate("/faculty")}>
          <ChevronLeft size={18} /> Back
        </button>
        <button 
          className={`btn ${showForm ? 'btn-danger' : 'btn-primary'} hover-lift`} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel Upload" : <><Plus size={16} /> Upload New Subject</>}
        </button>
      </div>

      <div className="page-head mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Courses</h2>
        <p className="muted mt-1">Manage your subjects, syllabus, and sessions.</p>
      </div>

      {/* Modern Upload Form */}
      {showForm && (
        <form onSubmit={handleUpload} className="card glass-panel form grid-2 mb-8 animate-fade-in border-indigo-100 shadow-xl">
          <div className="span-2 border-b pb-2 mb-2">
            <h3 className="text-indigo-900 font-bold">Upload New Subject</h3>
          </div>
          
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
          <label className="field"><span>Session Year (e.g. 2023-27)</span>
            <input required value={form.sessionYear} onChange={e => setForm({...form, sessionYear: e.target.value})} />
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
              <option value="lab">Practical / Lab</option>
              <option value="project">Project</option>
            </select>
          </label>
          <label className="field"><span>Hours per Class (Attendance Count)</span>
            <select value={form.hoursPerClass} onChange={e => setForm({...form, hoursPerClass: e.target.value})}>
              <option value="1">1 Hour (Counts as 1)</option>
              <option value="2">2 Hours (Counts as 2)</option>
              <option value="3">3 Hours (Counts as 3)</option>
            </select>
          </label>
          <label className="field"><span>Total Planned Classes</span>
            <input type="number" min="1" value={form.totalPlannedClasses} onChange={e => setForm({...form, totalPlannedClasses: e.target.value})} />
          </label>
          <label className="field span-2"><span>Syllabus PDF</span>
            <input type="file" accept="application/pdf" required onChange={e => setFile(e.target.files[0])} className="p-2 border rounded-lg bg-white" />
          </label>
          <button className="btn btn-primary span-2 mt-4" disabled={loading}>
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      )}

      {/* Modern Accordion List */}
      <div className="stack gap-4">
        {Object.keys(groupedSubjects).length === 0 && !showForm && (
          <div className="card center-text py-12 bg-gray-50 border-dashed">
            <GraduationCap size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-gray-600">No Subjects Found</h3>
            <p className="muted">Click "Upload New Subject" to add your first course.</p>
          </div>
        )}

        {Object.entries(groupedSubjects).map(([courseKey, semesters]) => {
          const isExpanded = expandedCourse === courseKey;
          const semesterKeys = Object.keys(semesters).sort((a,b) => b - a);
          const currentTab = activeSemesterTab[courseKey] || semesterKeys[0];
          
          return (
            <div key={courseKey} className={`course-accordion ${isExpanded ? 'active' : ''}`}>
              
              {/* Accordion Header */}
              <div 
                className="course-header-modern" 
                onClick={() => toggleCourse(courseKey)}
              >
                <div className="flex items-center gap-4">
                  <div className="icon-box bg-indigo-100 text-indigo-600">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="course-title">{courseKey}</h3>
                    <p className="course-subtitle">{Object.values(semesters).flat().length} Subjects Enrolled</p>
                  </div>
                </div>
                <div className={`chevron-box ${isExpanded ? 'rotated' : ''}`}>
                  <ChevronDown size={20} />
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="course-body animate-fade-in">
                  
                  {/* Semester Tabs */}
                  <div className="modern-tabs">
                    {semesterKeys.map(sem => (
                      <button 
                        key={sem} 
                        className={`modern-tab ${currentTab === sem ? "active" : ""}`} 
                        onClick={() => setActiveSemesterTab({ ...activeSemesterTab, [courseKey]: sem })}
                      >
                        Semester {sem}
                      </button>
                    ))}
                  </div>

                  {/* Subject Cards Grid */}
                  <div className="grid grid-2 gap-4 mt-6">
                    {semesters[currentTab].map(sub => (
                      <div key={sub._id} className="subject-card-modern">
                        
                        {/* Card Top: Name & Status */}
                        <div className="row-between items-start mb-2">
                          <h4 className="subject-name">
                            <BookOpen size={16} className="text-indigo-400" /> {sub.subjectName}
                          </h4>
                          <span className={`status-badge status-${sub.status}`}>
                            {sub.status}
                          </span>
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="meta-badge"><Clock size={12}/> {sub.subjectCode}</span>
                          <span className="meta-badge"><Award size={12}/> {sub.credits} Credits</span>
                          <span className="meta-badge capitalize">{sub.type}</span>
                          <span className="meta-badge">{sub.hoursPerClass || 1} hr/class</span>
                        </div>

                        <p className="text-xs text-gray-500 mb-4">Session: {sub.sessionYear || 'N/A'}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                          {sub.status === "approved" ? (
                            <button onClick={() => handleStartSession(sub._id)} className="btn btn-primary sm flex-1">
                              <Play size={14} fill="currentColor"/> Start Session
                            </button>
                          ) : (
                            <button className="btn btn-ghost sm flex-1 cursor-not-allowed opacity-50">
                              Pending Approval
                            </button>
                          )}
                          <Link to={`/faculty/courses/${sub._id}`} className="btn btn-ghost sm border-gray-200">
                            <History size={14}/> History
                          </Link>
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