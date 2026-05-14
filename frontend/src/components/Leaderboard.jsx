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
            Hall of Merit
          </h1>
          <p className="leaderboard-v7-sub">Best attempt per scholar · highest score first</p>
          <p className="leaderboard-v7-note">Sydney Survival Quiz — all players</p>

          {loading ? <p className="leaderboard-v7-status">Loading…</p> : null}
          {error ? <p className="leaderboard-v7-error">{error}</p> : null}

          {!loading && !error ? (
            <div className="leaderboard-v7-scroll">
              {rows.length === 0 ? (
                <p className="leaderboard-v7-empty">No scores yet. Be the first.</p>
              ) : (
                <table className="leaderboard-v7-table">
                  <thead>
                    <tr>
                      <th className="lb-col-rank" scope="col">
                        Rank
                      </th>
                      <th className="lb-col-medal" scope="col">
                        Award
                      </th>
                      <th scope="col">Name</th>
                      <th className="lb-col-score" scope="col">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const isMe = user?.username && row.username === user.username;
                      return (
                        <tr key={`${row.username}-${i}`} className={isMe ? 'me' : undefined}>
                          <td className="lb-col-rank">{i + 1}</td>
                          <td className="lb-col-medal" aria-hidden="true">
                            {MEDALS[i] || '·'}
                          </td>
                          <td className="lb-col-name">{row.username}</td>
                          <td className="lb-col-score">
                            {row.bestScore}
                            <span> / 10</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}
        </QuizFramedPanel>
      </div>
    </div>
  );
}
