import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card center-text">
        <h1>404</h1>
        <p className="muted">Page not found</p>
        <Link to="/" className="btn btn-primary mt">Go Home</Link>
      </div>
    </div>
  );
}