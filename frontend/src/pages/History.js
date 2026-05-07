import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api';

function History() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  // =========================
  // Fetch history
  // =========================
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/quiz/history');

        setHistory(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            'Failed to load history'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // =========================
  // Loading / Error
  // =========================
  if (loading) {
    return <p>Loading history...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Quiz History</h1>

      {history.length === 0 ? (
        <p>No quiz attempts yet.</p>
      ) : (
        history.map((attempt, index) => (
          <div
            key={attempt._id}
            style={{
              border: '1px solid #ccc',
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '8px',
            }}
          >
            <h3>Attempt #{history.length - index}</h3>

            <p>
              Score: {attempt.score}
            </p>

            <p>
              Date:{' '}
              {new Date(
                attempt.createdAt
              ).toLocaleString()}
            </p>

            {/* =========================
                View review
            ========================= */}
            <button
              onClick={() =>
                navigate(`/history/${attempt._id}`)
              }
            >
              View Review
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default History;