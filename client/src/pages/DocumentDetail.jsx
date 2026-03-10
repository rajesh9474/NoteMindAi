import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function DocumentDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessMsg, setReprocessMsg] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data.document);
      setSummary(res.data.summary || '');
      setQuiz(res.data.quiz || []);
      setFlashcards(res.data.flashcards || []);
    } catch (err) {
      console.error('Failed to fetch document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (qIndex, option) => {
    if (showResults) return;
    setSelectedAnswers({ ...selectedAnswers, [qIndex]: option });
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  const toggleFlashcard = (index) => {
    setFlippedCards({ ...flippedCards, [index]: !flippedCards[index] });
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAnswer('');

    try {
      const res = await api.post(`/documents/${id}/ask`, { question });
      setAnswer(res.data.answer);
    } catch (err) {
      setAnswer('Failed to get an answer. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    setReprocessMsg('Reprocessing... This may take 30-60 seconds.');
    try {
      const res = await api.post(`/documents/${id}/reprocess`);
      setSummary(res.data.summary || '');
      setQuiz(res.data.quiz || []);
      setFlashcards(res.data.flashcards || []);
      setReprocessMsg('✅ Reprocessed successfully!');
    } catch (err) {
      setReprocessMsg('❌ Reprocessing failed: ' + (err.response?.data?.details || err.message));
    } finally {
      setReprocessing(false);
    }
  };

  const getScore = () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct_answer) correct++;
    });
    return correct;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="error-screen">
        <h2>Document not found</h2>
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="document-page">
      <div className="container">
        {/* Header */}
        <div className="doc-header">
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
          <div className="doc-header-row">
            <h1>{doc.file_name}</h1>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleReprocess}
              disabled={reprocessing}
              id="reprocess-btn"
            >
              {reprocessing ? '⏳ Processing...' : '🔄 Reprocess'}
            </button>
          </div>
          {reprocessMsg && <div className={`alert ${reprocessMsg.includes('✅') ? 'alert-success' : reprocessMsg.includes('❌') ? 'alert-error' : 'alert-info'}`}>{reprocessMsg}</div>}
        </div>

        {/* Show prominent reprocess banner if all content is empty */}
        {!summary && quiz.length === 0 && flashcards.length === 0 && !reprocessing && (
          <div className="reprocess-banner glass-card">
            <div className="reprocess-banner-icon">🤖</div>
            <h3>No AI content generated yet</h3>
            <p>This document was uploaded but AI processing didn't complete. Click below to generate summaries, quizzes, and flashcards.</p>
            <button className="btn btn-primary" onClick={handleReprocess} id="reprocess-banner-btn">
              Generate AI Study Content
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" id="doc-tabs">
          <button
            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
            id="tab-summary"
          >
            📝 Summary
          </button>
          <button
            className={`tab ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
            id="tab-quiz"
          >
            ❓ Quiz ({quiz.length})
          </button>
          <button
            className={`tab ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
            id="tab-flashcards"
          >
            🃏 Flashcards ({flashcards.length})
          </button>
          <button
            className={`tab ${activeTab === 'ask' ? 'active' : ''}`}
            onClick={() => setActiveTab('ask')}
            id="tab-ask"
          >
            💬 Ask AI
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="summary-content glass-card" id="summary-section">
              {summary ? (
                <div className="summary-text" dangerouslySetInnerHTML={{
                  __html: summary
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/^\* (.*$)/gm, '<li>$1</li>')
                    .replace(/^- (.*$)/gm, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>)/gm, '<ul>$1</ul>')
                    .replace(/<\/ul>\s*<ul>/g, '')
                    .replace(/\n/g, '<br />')
                }} />
              ) : (
                <p className="empty-msg">No summary generated yet.</p>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="quiz-content" id="quiz-section">
              {quiz.length === 0 ? (
                <div className="glass-card"><p className="empty-msg">No quiz generated yet.</p></div>
              ) : (
                <>
                  {showResults && (
                    <div className="quiz-score glass-card">
                      <h2>Score: {getScore()} / {quiz.length}</h2>
                      <p>{getScore() === quiz.length ? '🎉 Perfect score!' : getScore() >= quiz.length / 2 ? '👍 Good job!' : '📖 Keep studying!'}</p>
                    </div>
                  )}
                  {quiz.map((q, qIndex) => (
                    <div key={q.id || qIndex} className="quiz-question glass-card">
                      <h3><span className="q-num">Q{qIndex + 1}.</span> {q.question}</h3>
                      <div className="quiz-options">
                        {(q.options || []).map((option, oIndex) => {
                          let optionClass = 'quiz-option';
                          if (showResults) {
                            if (option === q.correct_answer) optionClass += ' correct';
                            else if (selectedAnswers[qIndex] === option) optionClass += ' incorrect';
                          } else if (selectedAnswers[qIndex] === option) {
                            optionClass += ' selected';
                          }
                          return (
                            <button
                              key={oIndex}
                              className={optionClass}
                              onClick={() => handleAnswerSelect(qIndex, option)}
                              id={`q${qIndex}-o${oIndex}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="quiz-actions">
                    {!showResults ? (
                      <button className="btn btn-primary" onClick={handleSubmitQuiz} id="submit-quiz">
                        Submit Quiz
                      </button>
                    ) : (
                      <button className="btn btn-outline" onClick={handleResetQuiz} id="reset-quiz">
                        Try Again
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && (
            <div className="flashcards-content" id="flashcards-section">
              {flashcards.length === 0 ? (
                <div className="glass-card"><p className="empty-msg">No flashcards generated yet.</p></div>
              ) : (
                <div className="flashcards-grid">
                  {flashcards.map((card, index) => (
                    <div
                      key={card.id || index}
                      className={`flashcard ${flippedCards[index] ? 'flipped' : ''}`}
                      onClick={() => toggleFlashcard(index)}
                      id={`flashcard-${index}`}
                    >
                      <div className="flashcard-inner">
                        <div className="flashcard-front">
                          <span className="flashcard-label">Question</span>
                          <p>{card.question}</p>
                          <span className="flashcard-hint">Click to reveal answer</span>
                        </div>
                        <div className="flashcard-back">
                          <span className="flashcard-label">Answer</span>
                          <p>{card.answer}</p>
                          <span className="flashcard-hint">Click to see question</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ask AI Tab */}
          {activeTab === 'ask' && (
            <div className="ask-content glass-card" id="ask-section">
              <h2>Ask AI About This Document</h2>
              <p className="ask-desc">Type any question and AI will answer using only the content from your uploaded document.</p>
              <form onSubmit={handleAskQuestion} className="ask-form">
                <div className="ask-input-row">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. What are the main themes discussed?"
                    id="ask-input"
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={asking} id="ask-submit">
                    {asking ? '...' : 'Ask'}
                  </button>
                </div>
              </form>
              {answer && (
                <div className="ask-answer">
                  <h3>Answer</h3>
                  <div className="answer-text">{answer}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
