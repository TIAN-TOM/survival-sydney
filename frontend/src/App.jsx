// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// application shell, route wiring, navigation, and cross-subsystem layout.
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import GlobalHeader from './components/GlobalHeader.jsx';
import Login from './components/Login.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Register from './components/Register.jsx';
import AdminPage from './pages/AdminPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';

function App() {
  const location = useLocation();
  const path = location.pathname;
  const fullBleedShell =
    ['/quiz', '/register', '/admin/login', '/admin', '/history'].includes(path) ||
    path.startsWith('/review/');

  return (
    <div className={`app-shell${fullBleedShell ? ' app-shell--quiz-fullscreen' : ''}`}>
      {!fullBleedShell ? (
        <div className="quiz-flow-scope app-shell-global-nav">
          <GlobalHeader />
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Navigate to="/quiz" replace />} />
        <Route path="/login" element={<Navigate to="/quiz" replace state={{ openAuth: true }} />} />
        <Route path="/admin/login" element={<Login adminMode />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route
          path="/history"
          element={(
            <ProtectedRoute blockAdmin>
              <HistoryPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/leaderboard"
          element={(
            <ProtectedRoute blockAdmin>
              <Leaderboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/review/:attemptId"
          element={(
            <ProtectedRoute blockAdmin>
              <ReviewPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/quiz" replace />} />
      </Routes>
    </div>
  );
}

export default App;
