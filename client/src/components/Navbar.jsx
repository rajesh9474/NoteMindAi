import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">🧠</span>
          <span className="brand-text">NoteMind<span className="brand-highlight">AI</span></span>
        </Link>

        <div className="navbar-right">
          {/* Theme toggle — always visible */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            id="theme-toggle"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Desktop links — hidden on mobile */}
          <div className="navbar-links-desktop">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link" id="nav-dashboard">Dashboard</Link>
                <span className="nav-user-name">{user?.name}</span>
                <button onClick={handleLogout} className="btn btn-ghost" id="nav-logout">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" id="nav-login">Login</Link>
                <Link to="/signup" className="btn btn-primary btn-sm" id="nav-signup">Get Started</Link>
              </>
            )}
          </div>

          {/* Hamburger button — only on mobile */}
          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            id="hamburger-btn"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu">
          {isAuthenticated ? (
            <>
              <span className="mobile-menu-user">👤 {user?.name}</span>
              <Link to="/dashboard" className="mobile-menu-link" onClick={closeMenu} id="mobile-nav-dashboard">
                📊 Dashboard
              </Link>
              <button onClick={handleLogout} className="mobile-menu-link" id="mobile-nav-logout">
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-menu-link" onClick={closeMenu} id="mobile-nav-login">
                🔑 Login
              </Link>
              <Link to="/signup" className="mobile-menu-link" onClick={closeMenu} id="mobile-nav-signup">
                🚀 Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
