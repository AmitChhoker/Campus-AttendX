import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { 
  ChevronLeft, Plus, Calendar, Clock, GraduationCap, BookOpen, 
  ChevronDown, ChevronUp, ChevronRight // 🔥 Ye missing tha
} from "lucide-react";

export default function FacultySessions() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [subjectId, setSubjectId] = useState("");

  // Accordion States
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);

  const load = async () => {
    try {
      const [a, b] = await Promise.all([
        client.get("/attendance-sessions/my-sessions"),
        client.get("/subjects/my-submissions")
      ]);
      setSessions(a.data?.data || []); 
      setSubjects((b.data?.data || []).filter((s) => s.status === "approved"));
    } catch (err) {
      error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startSession = async () => {
    if (!subjectId) return error("Select a subject");
    try {
      const r = await client.post("/attendance-sessions", { subjectId });
      success("Session started!");
      setShowStart(false);
      navigate(`/faculty/session/${r.data.data.session._id}`);
    } catch (err) {
      error(err.response?.data?.message || "Failed to start session");
    }
  };

  // Group by Course -> then Group by Subject
  const groupedData = (sessions || []).reduce((acc, session) => {
    const courseKey = `${session.subject?.course} - ${session.subject?.branch}`;
    const subId = session.subject?._id;
    
    if (!courseKey || !subId) return acc;

    if (!acc[courseKey]) {
      acc[courseKey] = { courseName: courseKey, subjects: {}, totalSessions: 0 };
    }

    if (!acc[courseKey].subjects[subId]) {
      acc[courseKey].subjects[subId] = { subjectInfo: session.subject, sessions: [] };
    }

    acc[courseKey].subjects[subId].sessions.push(session);
    acc[courseKey].totalSessions += 1;

    return acc;
  }, {});

  const toggleCourse = (courseKey) => {
    setExpandedCourse(expandedCourse === courseKey ? null : courseKey);
    setExpandedSubject(null); 
  };

  const toggleSubject = (subjectKey) => {
    setExpandedSubject(expandedSubject === subjectKey ? null : subjectKey);
  };

  if (loading) return <div className="loader-full">Loading Sessions...</div>;

  return (
    <div className="stack pb-20">
      <div className="row-between mb-2">
        <button className="btn btn-ghost sm" onClick={() => navigate("/faculty")}>
          <ChevronLeft size={16} /> Back
        </button>
        <button className="btn btn-primary sm" onClick={() => setShowStart(true)}>
          <Plus size={16} /> Start Session
        </button>
      </div>

      <div className="page-head mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Course-wise Sessions</h2>
      </div>

      {Object.keys(groupedData).length === 0 && (
        <div className="card center-text py-8">
          <Calendar size={48} className="mx-auto text-gray-300 mb-2" />
          <p className="muted">No sessions found.</p>
        </div>
      )}

      <div className="stack gap-3">
        {Object.entries(groupedData).map(([courseKey, courseData]) => {
          const isCourseExpanded = expandedCourse === courseKey;

          return (
            <div key={courseKey} className={`modern-accordion-card compact ${isCourseExpanded ? 'active' : ''}`}>
              
              {/* COURSE HEADER */}
              <div className="accordion-header" onClick={() => toggleCourse(courseKey)}>
                <div className="flex items-center gap-3">
                  <div className="icon-box bg-indigo-50 text-indigo-600">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h3 className="accordion-title">{courseData.courseName}</h3>
                    <p className="accordion-subtitle">{Object.keys(courseData.subjects).length} Subjects · {courseData.totalSessions} Sessions</p>
                  </div>
                </div>
                <div className={`chevron-box ${isCourseExpanded ? 'rotated' : ''}`}>
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* SUBJECTS */}
              {isCourseExpanded && (
                <div className="accordion-body animate-fade-in">
                  <div className="pl-2 border-l-2 border-indigo-100 flex flex-col gap-2">
                    {Object.entries(courseData.subjects).map(([subId, subData]) => {
                      const subjectKey = `${courseKey}-${subId}`;
                      const isSubjectExpanded = expandedSubject === subjectKey;

                      return (
                        <div key={subId} className="subject-accordion-card compact">
                          
                          <div className="subject-header" onClick={() => toggleSubject(subjectKey)}>
                            <div className="flex items-center gap-2">
                              <BookOpen size={16} className="text-gray-400" />
                              <div>
                                <h4 className="subject-title-modern">{subData.subjectInfo.subjectName}</h4>
                                <p className="text-xs text-gray-500 m-0">{subData.subjectInfo.subjectCode} · {subData.sessions.length} Sess</p>
                              </div>
                            </div>
                            {isSubjectExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>

                          {/* SESSIONS */}
                          {isSubjectExpanded && (
                            <div className="subject-body animate-fade-in">
                              <ul className="list">
                                {subData.sessions.map((sess) => (
                                  <li 
                                    key={sess._id} 
                                    className="session-item-modern" 
                                    onClick={() => navigate(`/faculty/session/${sess._id}`)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="icon-circle">
                                        <Calendar size={14} />
                                      </div>
                                      <div>
                                        <strong className="block text-gray-800 text-sm">
                                          {new Date(sess.startedAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                                        </strong>
                                        <p className="text-xs text-gray-500 m-0">
                                          {new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`status-badge text-[10px] status-${sess.status}`}>
                                        {sess.status}
                                      </span>
                                      <ChevronRight size={16} className="text-gray-300" />
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start Session Modal */}
      <Modal open={showStart} onClose={() => setShowStart(false)} title="Start New Session">
        {subjects.length === 0 ? (
          <div className="center-text py-4">
            <p className="muted">You have no approved subjects.</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate("/faculty/courses")}>
              Go to My Courses
            </button>
          </div>
        ) : (
          <>
            <label className="field">
              <span>Select Approved Subject</span>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">— pick a subject —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.course} - {s.subjectName}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary mt-4 full" onClick={startSession}>
              Start Session
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}