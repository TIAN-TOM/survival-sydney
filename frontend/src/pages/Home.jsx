import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <section className="home-panel">
      <h2>Assignment 2 Scaffold</h2>
      <p>
        This bootstrap shell is ready for the auth, quiz, admin, and integration
        subsystems to be implemented in separate PRs.
      </p>

      {user ? (
        <div className="auth-status">
          <p>
            Signed in as <strong>{user.username}</strong> ({user.role})
          </p>
          <button type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="auth-status">
          <Link to="/quiz" state={{ openAuth: true }}>
            Login
          </Link>
          <span> · </span>
          <Link to="/register">Register</Link>
        </div>
      )}
    </section>
  );
}
