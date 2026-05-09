import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api.js';

function HistoryPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get('/quiz/history');
        setHistory(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <p>Loading history...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <main>
      <section className="admin-section">
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

              <p>Score: {attempt.score}</p>

              <p>Date: {new Date(attempt.createdAt).toLocaleString()}</p>

              <button
                type="button"
                onClick={() => navigate(`/review/${attempt._id}`)}
              >
                View Review
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default HistoryPage;