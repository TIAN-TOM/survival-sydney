import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api/api.js';
import QuizFramedPanel from './quiz/QuizFramedPanel.jsx';
import QuizWorldBackground from './quiz/QuizWorldBackground.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];
/** Board denominator for display (quiz length). */
const SCORE_DENOM = 10;

function RankCell({ place }) {
  if (place <= 3) {
    return (
      <td className="lb-col-rank lb-col-rank--medal">
        <span className="lb-rank-medal" aria-hidden="true">
          {MEDALS[place - 1]}
        </span>
        <span className="sr-only">{`Rank ${place}`}</span>
      </td>
    );
  }
  return <td className="lb-col-rank">{place}</td>;
}

export default function Leaderboard() {
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

  return (
    <div className="quiz-flow-scope leaderboard-page">
      <QuizWorldBackground usePhotoBackdrop />
      <div className="leaderboard-page-shell">
        <Link className="leaderboard-back-link" to="/quiz">
          ← Back to quiz
        </Link>
        <QuizFramedPanel className="leaderboard-panel" aria-labelledby="leaderboard-page-title">
          <h1 id="leaderboard-page-title" className="leaderboard-panel__title">
            Hall of Merit
          </h1>
          <p className="leaderboard-panel__sub">
            Best attempt per scholar · highest score first · ties by earliest time at that score
          </p>
          <p className="leaderboard-panel__note">Best attempts · top 50</p>

          {loading ? <p className="leaderboard-panel__status">Loading…</p> : null}
          {error ? <p className="leaderboard-panel__error">{error}</p> : null}

          {!loading && !error ? (
            <div className="leaderboard-panel__scroll">
              {rows.length === 0 ? (
                <p className="leaderboard-panel__empty">No scores yet. Be the first.</p>
              ) : (
                <table className="leaderboard-panel__table">
                  <thead className="leaderboard-panel__thead">
                    <tr>
                      <th className="lb-col-rank lb-th--place" scope="col">
                        Rank
                      </th>
                      <th className="lb-col-name-h" scope="col">
                        <span className="sr-only">Scholar</span>
                      </th>
                      <th className="lb-col-score lb-col-score-h lb-th--totals" scope="col">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const isMe = user?.username && row.username === user.username;
                      const place = i + 1;
                      const podium =
                        place === 1 ? 'lb-row--p1' : place === 2 ? 'lb-row--p2' : place === 3 ? 'lb-row--p3' : '';
                      const rowClass = ['lb-row', podium, isMe ? 'me' : ''].filter(Boolean).join(' ');
                      return (
                        <tr
                          key={`${row.username}-${i}`}
                          className={rowClass || undefined}
                          style={{ '--motion-stagger-index': i }}
                        >
                          <RankCell place={place} />
                          <td className="lb-col-name">{row.username}</td>
                          <td className="lb-col-score">
                            <span className="lb-score-metric">
                              <span className="lb-score-num">{row.bestScore}</span>
                              <span className="lb-score-slash" aria-hidden="true">
                                /
                              </span>
                              <span className="lb-score-den">{SCORE_DENOM}</span>
                            </span>
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
