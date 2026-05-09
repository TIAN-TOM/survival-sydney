import { useCallback, useEffect, useState } from 'react';
import api from '../api/api.js';
import QuestionForm from '../components/QuestionForm.jsx';
import BulkImport from '../components/BulkImport.jsx';

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

  const handleDeleteQuestion = async questionId => {
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

  const handleToggleQuestion = async questionId => {
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
    <main>
      <section className="admin-section">
        <div className="button-row">
          <div>
            <h1>Admin Question Management</h1>
            <p>
              Create, edit, delete, activate/deactivate, and bulk import quiz questions.
            </p>
          </div>

          <button type="button" onClick={handleCreateClick}>
            Add Question
          </button>
        </div>

        {message && (
          <p className={message.type === 'error' ? 'error-message' : 'success-message'}>
            {message.text}
          </p>
        )}
      </section>

      {showForm && (
        <section className="admin-section">
          <h2>{editingQuestion ? 'Edit Question' : 'Create Question'}</h2>

          <QuestionForm
            initialQuestion={editingQuestion}
            isSubmitting={submitting}
            onCancel={handleCancelForm}
            onSubmit={handleSubmitQuestion}
          />
        </section>
      )}

      <section className="admin-section">
        <h2>Bulk Import</h2>
        <BulkImport onImportSuccess={handleBulkImportSuccess} />
      </section>

      <section className="admin-section">
        <h2>Question List</h2>

        {loading ? (
          <p>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p>No questions found.</p>
        ) : (
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

                  <td>
                    Option {String.fromCharCode(65 + Number(question.correctAnswer))}
                  </td>

                  <td>{question.active ? 'Active' : 'Inactive'}</td>

                  <td>{question.explanation || '-'}</td>

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
        )}
      </section>
    </main>
  );
}