import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api/api.js';
import QuizFramedPanel from './quiz/QuizFramedPanel.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/quiz/leaderboard');
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load leaderboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    navigate(-1);
  };

  return (
    <div className="quiz-flow-scope leaderboard-v7-root">
      <div className="leaderboard-v7-overlay" onClick={close} role="presentation">
        <QuizFramedPanel
          className="leaderboard-v7-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lb-v7-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="leaderboard-v7-close" onClick={close} aria-label="Close">
            ✕
          </button>
          <h1 id="lb-v7-title" className="leaderboard-v7-title">
            🏆 Leaderboard
          </h1>
          <p className="leaderboard-v7-sub">Best attempt per player · Highest score first</p>
          <p className="leaderboard-v7-note">✦ Sydney Survival Quiz — All Players</p>

          {loading ? <p className="leaderboard-v7-status">Loading…</p> : null}
          {error ? <p className="leaderboard-v7-error">{error}</p> : null}

          {!loading && !error ? (
            <div className="leaderboard-v7-list">
              {rows.length === 0 ? (
                <p className="leaderboard-v7-empty">No scores yet. Be the first.</p>
              ) : (
                rows.map((row, i) => {
                  const isMe = user?.username && row.username === user.username;
                  return (
                    <div key={`${row.username}-${i}`} className={`leaderboard-v7-row${isMe ? ' me' : ''}`}>
                      <span className="leaderboard-v7-rank">{i + 1}</span>
                      <span className="leaderboard-v7-medal" aria-hidden="true">
                        {MEDALS[i] || ''}
                      </span>
                      <span className="leaderboard-v7-name">{row.username}</span>
                      <span className="leaderboard-v7-score">
                        {row.bestScore}
                        <span>/10</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </QuizFramedPanel>
      </div>
    </div>
  );
}
