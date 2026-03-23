import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="hero-bg-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">🚀 AI-Powered Study Assistant</div>
          <h1 className="hero-title">
            Transform Your Notes Into
            <span className="gradient-text"> Smart Study Tools</span>
          </h1>
          <p className="hero-subtitle">
            Upload your study materials and let AI generate summaries, quizzes, flashcards,
            and answer your questions — all in seconds.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg" id="hero-cta">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary btn-lg" id="hero-cta">
                  Start Free →
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg" id="hero-login">
                  I have an account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features-section">
        <div className="container">
          <h2 className="section-title">Everything You Need to <span className="gradient-text">Study Smarter</span></h2>
          <p className="section-subtitle">Powered by advanced AI to help you master any subject faster</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>AI Summaries</h3>
              <p>Get concise, exam-ready bullet-point summaries from your uploaded notes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">❓</div>
              <h3>Smart Quizzes</h3>
              <p>Auto-generated multiple-choice questions to test your understanding.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🃏</div>
              <h3>Flashcards</h3>
              <p>Key concept flashcards with interactive flip animations for revision.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Ask AI</h3>
              <p>Ask questions about your notes and get accurate, context-aware answers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Upload Your Notes</h3>
              <p>Upload any PDF study material to the platform.</p>
            </div>
            <div className="step-connector">→</div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>AI Processes It</h3>
              <p>Our AI analyzes your content and extracts key information.</p>
            </div>
            <div className="step-connector">→</div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Study Smarter</h3>
              <p>Access summaries, quizzes, flashcards, and AI Q&A instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 BrainNova.AI. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
