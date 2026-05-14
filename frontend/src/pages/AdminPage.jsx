import { useCallback, useEffect, useMemo, useState } from 'react';

import api from '../api/api.js';
import BulkImport from '../components/BulkImport.jsx';
import FrameCorners from '../components/FrameCorners.jsx';
import GlobalHeader from '../components/GlobalHeader.jsx';
import QuestionForm from '../components/QuestionForm.jsx';

export default function AdminPage() {
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/questions');
      setQuestions(data || []);
    } catch (err) {
      showMessage('error', err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const activeCount = useMemo(() => questions.filter((q) => q.active).length, [questions]);

  const handleCreateClick = () => {
    setEditingQuestion(null);
    setShowForm(true);
    setMessage(null);
  };

  const handleEditClick = question => {
    setEditingQuestion(question);
    setShowForm(true);
    setMessage(null);
  };

  const handleCancelForm = () => {
    setEditingQuestion(null);
    setShowForm(false);
  };

  const handleSubmitQuestion = async payload => {
    try {
      setSubmitting(true);

      if (editingQuestion?._id) {
        await api.put(`/admin/questions/${editingQuestion._id}`, payload);
        showMessage('success', 'Question updated successfully.');
      } else {
        await api.post('/admin/questions', payload);
        showMessage('success', 'Question created successfully.');
      }

      setEditingQuestion(null);
      setShowForm(false);
      await fetchQuestions();
    } catch (err) {
      showMessage('error', err.message || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm('Are you sure you want to delete this question?');
    if (!confirmed) return;

    try {
      await api.delete(`/admin/questions/${questionId}`);
      showMessage('success', 'Question deleted successfully.');
      await fetchQuestions();
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete question.');
    }
  };

  const handleToggleQuestion = async (questionId) => {
    try {
      await api.patch(`/admin/questions/${questionId}/toggle`);
      showMessage('success', 'Question status updated successfully.');
      await fetchQuestions();
    } catch (err) {
      showMessage('error', err.message || 'Failed to update question status.');
    }
  };

  const handleBulkImportSuccess = async result => {
    const insertedCount = result?.insertedCount ?? 0;
    showMessage('success', `Bulk import completed. ${insertedCount} question(s) inserted.`);
    await fetchQuestions();
  };

  return (
    <div className="quiz-flow-scope quiz-review-shell">
      <div className="sq-world-bg" aria-hidden="true" />

      <GlobalHeader />

      <main className="review-page quiz-review-page admin-dashboard-page">
        <section className="admin-section review-attempt-header review-attempt-panel review-attempt-panel--framed">
          <FrameCorners />
          <h1>Question Management</h1>

          <div className="review-attempt-final" role="status">
            <div className="review-attempt-final__label">Questions in bank</div>
            <div className="review-attempt-final__value">{loading ? '…' : questions.length}</div>
            <p className="review-attempt-final__hint">
              {loading ? 'Loading…' : `${activeCount} active · ${questions.length - activeCount} inactive`}
            </p>
          </div>

          <p className="review-attempt-meta">
            Create, edit, delete, toggle status, and bulk import. Explanations are shown to players in Review Mode.
          </p>

          <p className="review-attempt-hint">
            Use <strong>Add Question</strong> for one entry, or use <strong>Bulk Import</strong> below for a JSON array.
          </p>

          <div className="button-row">
            <button type="button" onClick={handleCreateClick}>
              Add Question
            </button>
          </div>

          {message && !showForm ? (
            <p className={message.type === 'error' ? 'error-message' : 'success-message'}>{message.text}</p>
          ) : null}
        </section>

        {showForm ? (
          <div
            className="admin-form-overlay-root quiz-flow-scope"
            role="dialog"
            aria-modal="true"
            aria-label={editingQuestion ? 'Edit question' : 'Create question'}
          >
            <button
              type="button"
              className="admin-form-overlay-root__backdrop"
              aria-label="Close dialog"
              onClick={handleCancelForm}
            />
            <div className="admin-form-overlay-root__panel quiz-review-page">
              <section className="admin-section review-attempt-panel review-attempt-panel--framed">
                <FrameCorners />
                <div className="button-row admin-dashboard-dialog-head">
                  <h2 className="admin-dashboard-dialog-title">{editingQuestion ? 'Edit Question' : 'Create Question'}</h2>
                  <button type="button" onClick={handleCancelForm}>
                    Close
                  </button>
                </div>

                {message && showForm ? (
                  <p className={message.type === 'error' ? 'error-message' : 'success-message'}>{message.text}</p>
                ) : null}

                <QuestionForm
                  initialQuestion={editingQuestion}
                  isSubmitting={submitting}
                  onCancel={handleCancelForm}
                  onSubmit={handleSubmitQuestion}
                />
              </section>
            </div>
          </div>
        ) : null}

        <section className="admin-section review-attempt-panel review-attempt-panel--framed">
          <FrameCorners />
          <h2 className="review-attempt-card__title admin-dashboard-section-title">Bulk Import</h2>
          <p className="review-attempt-hint admin-dashboard-section-lead">
            Paste a JSON array of questions, or an object with a <code>questions</code> array. Same shape as the
            question model (four options, 0–3 correct index, optional explanation for Review Mode).
          </p>
          <BulkImport onImportSuccess={handleBulkImportSuccess} />
        </section>

        <section className="admin-section review-attempt-list review-attempt-panel review-attempt-panel--framed">
          <FrameCorners />
          <h2 className="review-attempt-card__title admin-dashboard-section-title">Question List</h2>

          {loading ? (
            <p className="loading-state">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="review-attempt-hint">No questions found. Add one or run a bulk import.</p>
          ) : (
            <div className="admin-question-list">
              <table>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Correct</th>
                    <th>Status</th>
                    <th>Explanation</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {questions.map(question => (
                    <tr key={question._id}>
                      <td>
                        <strong>{question.questionText}</strong>
                        <ol type="A">
                          {question.options.map((option, index) => (
                            <li key={`${question._id}-${index}`}>{option}</li>
                          ))}
                        </ol>
                      </td>

                      <td>Option {String.fromCharCode(65 + Number(question.correctAnswer))}</td>

                      <td>{question.active ? 'Active' : 'Inactive'}</td>

                      <td>{question.explanation || '—'}</td>

                      <td>
                        <div className="button-row">
                          <button type="button" onClick={() => handleEditClick(question)}>
                            Edit
                          </button>

                          <button type="button" onClick={() => handleToggleQuestion(question._id)}>
                            {question.active ? 'Deactivate' : 'Activate'}
                          </button>

                          <button type="button" onClick={() => handleDeleteQuestion(question._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
