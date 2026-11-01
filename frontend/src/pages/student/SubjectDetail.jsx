import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { ChevronLeft, Download, BookOpen, User, Clock } from "lucide-react";

export default function SubjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/student/subjects/${id}`)
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        console.error("Subject fetch error:", err);
        alert(err.response?.data?.message || "Failed to load subject details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader full />;
  if (!data) return <div className="error-box">Subject data not found</div>;

  // 🔥 SMART FIX: Agar backend purana format bhej raha hai, toh usko adjust karo
  const subjectInfo = data.subject || data; 
  const attendanceInfo = data.attendance || { 
    percentage: 0, 
    present: 0, 
    totalClasses: 0, 
    neededToReach75: 0 
  };
  const historyInfo = data.history || [];

  const isRisk = attendanceInfo.percentage < 75;

  // 1. Syllabus Download
  const downloadSyllabus = () => {
    window.open(`/api/student/subjects/${id}/syllabus`, "_blank");
  };

  // 2. CSV Download
  const downloadCSV = () => {
    if (!historyInfo || historyInfo.length === 0) return alert("No history to download");
    
    const headers = ["Date", "Time", "Faculty", "Type", "Status"];
    const rows = historyInfo.map(h => {
      const dateObj = new Date(h.date);
      const dateStr = dateObj.toLocaleDateString();
      const timeStr = dateObj.toLocaleTimeString();
      return [dateStr, timeStr, h.faculty, h.type, h.status];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${subjectInfo.code || subjectInfo.subjectCode}_attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="stack pb-20">
      {/* Back Button */}
      <div className="row-between mb-2">
        <button className="btn btn-ghost sm" onClick={() => nav(-1)}>
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      {/* Subject Info Card */}
      <div className="card bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="m-0 text-2xl font-bold text-indigo-900">
              {subjectInfo.name || subjectInfo.subjectName}
            </h2>
            <p className="muted mt-1">
              {subjectInfo.code || subjectInfo.subjectCode} · {subjectInfo.course} · {subjectInfo.branch} · Sem {subjectInfo.semester}
            </p>
            <div className="flex gap-2 mt-3">
              <span className="meta-badge bg-indigo-100 text-indigo-700">
                <User size={14}/> {subjectInfo.faculty?.name || subjectInfo.faculty || "N/A"}
              </span>
              <span className="meta-badge bg-purple-100 text-purple-700 capitalize">
                {subjectInfo.type} · {subjectInfo.credits} credits
              </span>
            </div>
          </div>
          <div className="icon-box bg-indigo-50 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
        </div>
        
        {/* Syllabus Download Button */}
        {subjectInfo.syllabus?.fileId && (
          <button className="btn btn-outline-primary mt-4 w-full sm:w-auto" onClick={downloadSyllabus}>
            <Download size={16} /> Download Syllabus PDF
          </button>
        )}
      </div>

      {/* Attendance Stats */}
      <div className={`card text-center ${isRisk ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
        <div className="flex flex-col items-center justify-center">
          <div className={`text-5xl font-extrabold ${isRisk ? 'text-red-500' : 'text-emerald-500'}`}>
            {attendanceInfo.percentage}%
          </div>
          <p className="font-bold text-gray-700 mt-2">
            {attendanceInfo.present} / {attendanceInfo.totalClasses} classes attended
          </p>
          <div className="progress mt-4 mx-auto" style={{ maxWidth: '300px', height: '8px' }}>
            <div 
              className="progress-bar" 
              style={{ 
                width: `${attendanceInfo.percentage}%`, 
                background: isRisk ? 'var(--red)' : 'var(--emerald)' 
              }}
            ></div>
          </div>
          {isRisk && (
            <p className="mt-3 text-red-600 font-bold text-sm">
              ⚠ Need {attendanceInfo.neededToReach75} more classes to reach 75%
            </p>
          )}
        </div>
      </div>

      {/* Session History Timeline */}
      <div className="card">
        <div className="row-between border-b pb-4 mb-4">
          <h3 className="card-title m-0">Session History</h3>
          
          {/* CSV Export Button */}
          {historyInfo.length > 0 && (
            <button className="btn btn-ghost sm" onClick={downloadCSV}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
        
        {historyInfo.length === 0 && <p className="muted center-text py-8">No sessions conducted yet.</p>}
        
        {/* 🔥 NEW MODERN HISTORY LIST */}
        <div className="stack gap-3">
          {historyInfo.map((h, i) => {
            const dateObj = new Date(h.date);
            const dateStr = dateObj.toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
            const isPresent = h.status === "present";

            return (
              <div 
                key={i} 
                className={`history-card ${isPresent ? 'history-present' : 'history-absent'}`}
              >
                {/* Left: Date & Time */}
                <div className="history-datetime">
                  <span className="history-date">{dateStr}</span>
                  <span className="history-time"><Clock size={12}/> {timeStr}</span>
                </div>

                {/* Middle: Type & Faculty */}
                <div className="history-info">
                  <span className="history-type capitalize">{h.type || "Theory"}</span>
                  <span className="history-faculty"><User size={12}/> {h.faculty || "Unknown"}</span>
                </div>

                {/* Right: Status Badge */}
                <div className="history-status">
                  <span className={`status-pill ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}