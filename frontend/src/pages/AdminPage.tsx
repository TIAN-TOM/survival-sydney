import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

import api from '../api/api.ts';
import type { AdminQuestion, BulkImportResult, QuestionPayload } from '../types.ts';
import BulkImport from '../components/BulkImport.tsx';
import QuestionForm from '../components/QuestionForm.tsx';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const getQuestionSearchText = (question: AdminQuestion) => {
  const correctIndex = Number(question.correctAnswer);
  const correctOption = Number.isInteger(correctIndex) ? question.options?.[correctIndex] : null;

  // Search covers visible question content plus metadata, so admins can find by text, answer, topic, or status.
  return [
    question.questionText,
    ...(question.options || []),
    correctOption,
    question.explanation,
    question.topic,
    question.active ? 'active' : 'inactive',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const renderHighlightedText = (value: string | null | undefined, query: string): ReactNode => {
  const text = String(value ?? '');

  if (!query) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lowerText.indexOf(query);

  // Split text around case-insensitive matches so the UI can highlight exactly what the search found.
  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex));
    }

    const matchEnd = matchIndex + query.length;
    parts.push(
      <mark className="admin-search-highlight" key={`${matchIndex}-${matchEnd}`}>
        {text.slice(matchIndex, matchEnd)}
      </mark>
    );

    cursor = matchEnd;
    matchIndex = lowerText.indexOf(query, cursor);
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
};

export default function AdminPage() {
  const { hash } = useLocation();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
  };

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<AdminQuestion[]>('/admin/questions');
      setQuestions(data || []);
    } catch (err) {
      showMessage('error', (err instanceof Error && err.message) || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useLayoutEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    if (!id) return;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash]);

  const activeCount = useMemo(() => questions.filter((q) => q.active).length, [questions]);
  const questionBankIndexById = useMemo(() => {
    const indexById = new Map<string, number>();
    questions.forEach((question, index) => {
      indexById.set(question._id, index + 1);
    });
    return indexById;
  }, [questions]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredQuestions = useMemo(() => {
    if (!normalizedSearchQuery) {
      return questions;
    }

    return questions.filter(question => getQuestionSearchText(question).includes(normalizedSearchQuery));
  }, [normalizedSearchQuery, questions]);
  const hasSearchQuery = normalizedSearchQuery.length > 0;
  // Pagination is applied after filtering, so page counts always match the visible result set.
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredQuestions.length);
  const displayStartIndex = filteredQuestions.length === 0 ? 0 : startIndex + 1;
  const visibleQuestions = useMemo(
    () => filteredQuestions.slice(startIndex, endIndex),
    [endIndex, filteredQuestions, startIndex]
  );

  useEffect(() => {
    setCurrentPage(1);
    setPendingDeleteId(null);
  }, [normalizedSearchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setPendingDeleteId(null);
  }, [currentPage, pageSize]);

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCreateClick = () => {
    setEditingQuestion(null);
    setShowForm(true);
    setMessage(null);
  };

  const handleEditClick = (question: AdminQuestion) => {
    setEditingQuestion(question);
    setShowForm(true);
    setMessage(null);
  };

  const handleCancelForm = () => {
    setEditingQuestion(null);
    setShowForm(false);
  };

  const handleSubmitQuestion = async (payload: QuestionPayload) => {
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
      showMessage('error', (err instanceof Error && err.message) || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    // Guard against a double-click firing a second DELETE, whose 404 would look like a failure.
    if (rowBusyId) return;
    setRowBusyId(questionId);
    try {
      await api.delete(`/admin/questions/${questionId}`);
      showMessage('success', 'Question deleted successfully.');
      setPendingDeleteId(null);
      await fetchQuestions();
    } catch (err) {
      showMessage('error', (err instanceof Error && err.message) || 'Failed to delete question.');
    } finally {
      setRowBusyId(null);
    }
  };

  const handleToggleQuestion = async (questionId: string) => {
    if (rowBusyId) return;
    setRowBusyId(questionId);
    try {
      await api.patch(`/admin/questions/${questionId}/toggle`);
      showMessage('success', 'Question status updated successfully.');
      await fetchQuestions();
    } catch (err) {
      showMessage('error', (err instanceof Error && err.message) || 'Failed to update question status.');
    } finally {
      setRowBusyId(null);
    }
  };

  const handleBulkImportSuccess = async (result: BulkImportResult) => {
    const insertedCount = result?.insertedCount ?? 0;
    showMessage('success', `Bulk import completed. ${insertedCount} question(s) inserted.`);
    await fetchQuestions();
  };

  return (
    <div className="quiz-flow-scope admin-cms-shell quiz-review-shell admin-layout">
      <main className="review-page quiz-review-page admin-dashboard-page">
        <section className="admin-section review-attempt-header review-attempt-panel review-attempt-panel--framed">
          <h1 className="admin-page-title">Question bank</h1>

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
            Add entries from the question list header, or use <strong>Bulk Import</strong> below for a JSON array.
          </p>

          {message && !showForm ? (
            <p className={message.type === 'error' ? 'error-message' : 'success-message'}>{message.text}</p>
          ) : null}
        </section>

        {showForm ? (
          <div className="admin-qa-overlay motion-modal-overlay" role="presentation" onClick={handleCancelForm}>
            <div
              className="admin-qa-modal quiz-flow-scope motion-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-question-dialog-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="admin-qa-close" onClick={handleCancelForm} aria-label="Close dialog">
                ×
              </button>
              <header className="admin-qa-modal__head">
                <h2 className="admin-qa-modal__title" id="admin-question-dialog-title">
                  {editingQuestion ? 'Edit Question' : 'Create Question'}
                </h2>
                <p className="admin-qa-modal__meta">
                  {editingQuestion
                    ? `Editing bank entry · ${editingQuestion._id}`
                    : 'New bank entry · save to publish'}
                </p>
              </header>

              {message && showForm ? (
                <p className={`admin-qa-modal__alert ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
                  {message.text}
                </p>
              ) : null}

              <div className="admin-qa-modal__body">
                <QuestionForm
                  initialQuestion={editingQuestion}
                  isSubmitting={submitting}
                  onCancel={handleCancelForm}
                  onSubmit={handleSubmitQuestion}
                />
              </div>
            </div>
          </div>
        ) : null}

        <section id="admin-bulk-import" className="admin-section review-attempt-panel review-attempt-panel--framed">
          <h2 className="review-attempt-card__title admin-dashboard-section-title">Bulk Import</h2>
          <p className="review-attempt-hint admin-dashboard-section-lead">
            Paste a JSON array of questions, or an object with a <code>questions</code> array. Same shape as the
            question model (four options, 0–3 correct index, optional explanation for Review Mode).
          </p>
          <BulkImport onImportSuccess={handleBulkImportSuccess} />
        </section>

        <section id="admin-question-list" className="admin-section review-attempt-list review-attempt-panel review-attempt-panel--framed">
          <div className="admin-list-header admin-toolbar">
            <h2 className="review-attempt-card__title admin-dashboard-section-title admin-list-header__title">Question list</h2>
            <button type="button" className="admin-btn-add" onClick={handleCreateClick}>
              + Add question
            </button>
          </div>

          {loading ? (
            <p className="loading-state">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="review-attempt-hint">No questions found. Add one or run a bulk import.</p>
          ) : (
            <div className="admin-question-list admin-table admin-data-table">
              <div className="admin-question-list__toolbar" aria-label="Question bank list controls">
                <p aria-live="polite">
                  {hasSearchQuery
                    ? `Showing ${displayStartIndex}-${endIndex} of ${filteredQuestions.length} matching questions (${questions.length} total)`
                    : `Showing ${displayStartIndex}-${endIndex} of ${questions.length} questions`}
                </p>
                <label className="admin-question-list__search">
                  Search questions
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Question, option, explanation, status"
                    aria-label="Search question bank"
                  />
                </label>
                <label>
                  Questions per page
                  <select value={pageSize} onChange={handlePageSizeChange}>
                    {PAGE_SIZE_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredQuestions.length === 0 ? (
                <p className="review-attempt-hint admin-question-list__empty">
                  No questions match your search. Clear the search box to return to the full bank.
                </p>
              ) : null}

              <div className="admin-qbank admin-qbank--cards" role="list" aria-label="Question list">
                <div className="admin-qbank__body">
                  {visibleQuestions.map((question) => (
                    <article key={question._id} className="admin-qbank-card" role="listitem">
                      <div className="admin-qbank-card__top">
                        <div
                          className="admin-qbank-card__number"
                          aria-label={`Bank question number ${questionBankIndexById.get(question._id)}`}
                        >
                          Bank No. {questionBankIndexById.get(question._id)}
                        </div>
                        <div className="admin-qbank-card__content">
                          <h3 className="admin-q-title">
                            {renderHighlightedText(question.questionText, normalizedSearchQuery)}
                          </h3>
                          <ol className="admin-q-opts" type="A">
                            {question.options.map((option, index) => (
                              <li key={`${question._id}-${index}`}>
                                {renderHighlightedText(option, normalizedSearchQuery)}
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="admin-qbank-card__actions">
                          <div className="admin-row-actions">
                            {pendingDeleteId === question._id ? (
                              <>
                                <button
                                  type="button"
                                  className="admin-row-btn admin-row-btn--confirm-delete"
                                  onClick={() => handleDeleteQuestion(question._id)}
                                  disabled={rowBusyId === question._id}
                                >
                                  {rowBusyId === question._id ? 'Deleting…' : 'Confirm delete'}
                                </button>

                                <button
                                  type="button"
                                  className="admin-row-btn admin-row-btn--cancel-delete"
                                  onClick={() => setPendingDeleteId(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="admin-row-btn admin-row-btn--edit"
                                  onClick={() => handleEditClick(question)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="admin-row-btn admin-row-btn--toggle"
                                  onClick={() => handleToggleQuestion(question._id)}
                                  disabled={rowBusyId === question._id}
                                >
                                  {question.active ? 'Deactivate' : 'Activate'}
                                </button>

                                <button
                                  type="button"
                                  className="admin-row-btn admin-row-btn--delete"
                                  onClick={() => setPendingDeleteId(question._id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <footer className="admin-qbank-card__meta" aria-label="Question metadata">
                        <div className="admin-qbank-meta">
                          <span className="admin-qbank-meta__label">Correct</span>
                          <span className="admin-qbank-meta__value">
                            Option {String.fromCharCode(65 + Number(question.correctAnswer))}
                          </span>
                        </div>

                        <div className="admin-qbank-meta">
                          <span className="admin-qbank-meta__label">Status</span>
                          <span className="admin-qbank-meta__value">
                            <span
                              className={
                                question.active
                                  ? 'admin-status-pill admin-status-pill--active'
                                  : 'admin-status-pill admin-status-pill--inactive'
                              }
                            >
                              {renderHighlightedText(question.active ? 'Active' : 'Inactive', normalizedSearchQuery)}
                            </span>
                          </span>
                        </div>

                        <div className="admin-qbank-meta admin-qbank-meta--explain">
                          <span className="admin-qbank-meta__label">Explanation</span>
                          <span
                            className="admin-qbank-meta__explain admin-explain-clamp"
                            title={
                              question.explanation && question.explanation.trim()
                                ? question.explanation
                                : undefined
                            }
                          >
                            {question.explanation
                              ? renderHighlightedText(question.explanation, normalizedSearchQuery)
                              : '—'}
                          </span>
                        </div>
                      </footer>
                    </article>
                  ))}
                </div>
              </div>

              <nav className="admin-pagination" aria-label="Question bank pagination">
                <button
                  type="button"
                  className="admin-pagination__btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button
                  type="button"
                  className="admin-pagination__btn"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="admin-pagination__status" aria-live="polite">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="admin-pagination__btn"
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button
                  type="button"
                  className="admin-pagination__btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </nav>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
