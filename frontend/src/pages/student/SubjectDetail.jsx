import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { ChevronLeft, Download, BookOpen, User, Award } from "lucide-react";

export default function StudentSubjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [s, setS] = useState(null);

  useEffect(() => {
    client.get(`/student/subjects/${id}`).then((r) => setS(r.data.data));
  }, [id]);

  if (!s) return <Loader full />;

  const downloadSyllabus = () => {
    window.open(`/api/student/subjects/${id}/syllabus`, "_blank");
  };

  return (
    <div className="stack pb-20">
      <button className="btn btn-ghost sm mb-2 w-fit" onClick={() => nav(-1)}>
        <ChevronLeft size={18} /> Back
      </button>
      
      <div className="card text-center py-8">
        <div className="icon-box bg-indigo-50 text-indigo-600 mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center">
          <BookOpen size={32} />
        </div>
        <h2 className="m-0 text-2xl font-bold">{s.subjectName}</h2>
        <p className="muted mt-1">{s.subjectCode} · {s.branch} · Sem {s.semester}</p>
        
        <div className="flex justify-center gap-3 mt-4">
          <span className="meta-badge bg-gray-100 text-gray-700"><Award size={14}/> {s.credits} Credits</span>
          <span className="meta-badge bg-gray-100 text-gray-700 capitalize">{s.type}</span>
        </div>
      </div>

      <div className="card flex items-center gap-4">
        <div className="icon-box bg-emerald-50 text-emerald-600 rounded-full w-12 h-12 flex items-center justify-center">
          <User size={20} />
        </div>
        <div>
          <p className="small muted m-0">Faculty</p>
          <strong className="text-gray-800">{s.faculty?.name || "—"}</strong>
        </div>
      </div>

      {s.syllabus?.available && (
        <button className="btn btn-primary mt-2 shadow-lg hover:scale-[1.02] transition-transform" onClick={downloadSyllabus}>
          <Download size={18} /> Download Syllabus PDF
        </button>
      )}
    </div>
  );
}