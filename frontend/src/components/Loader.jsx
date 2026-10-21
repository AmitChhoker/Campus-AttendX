export default function Loader({ full, label = "Loading…" }) {
  return (
    <div className={full ? "loader-full" : "loader-inline"}>
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}