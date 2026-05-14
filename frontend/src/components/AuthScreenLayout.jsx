import { useTheme } from '../contexts/ThemeContext.jsx';
import { quizSealLogoSrc } from '../quizBrandAssets.js';

export default function AuthScreenLayout({ children, showBrand = true }) {
  const { isDarkMode, theme, toggleTheme } = useTheme();

  return (
    <div className="quiz-flow-scope qf-screen start-screen auth-start-screen">
      <div className="start-screen__bg-stack" aria-hidden="true">
        <div className="start-screen__bg-pane start-screen__bg-pane--night" />
        <div className="start-screen__bg-pane start-screen__bg-pane--day" />
        <div className="start-screen__bg-veil start-screen__bg-veil--night" />
        <div className="start-screen__bg-veil start-screen__bg-veil--day" />
      </div>
      <div className="start-screen__inner auth-start-screen__inner">
        <header
          className={`quiz-top-navbar auth-start-screen__navbar${showBrand ? '' : ' auth-start-screen__navbar--no-brand'}`}
          aria-label="Auth navigation"
        >
          {showBrand ? (
            <div className="quiz-top-logo auth-start-screen__brand">
              <span className="quiz-top-logo-seal quiz-top-logo-seal--brand">
                <img
                  key={theme}
                  className="quiz-top-logo-seal-img"
                  src={quizSealLogoSrc(isDarkMode)}
                  alt=""
                />
              </span>
              <span>Sydney Survival Quiz</span>
            </div>
          ) : null}
          <div className="auth-start-screen__navbar-spacer" aria-hidden="true" />
          <div className="mode-row">
            <span className="mode-lbl">{isDarkMode ? 'Night' : 'Day'}</span>
            <span className="mode-icon" aria-hidden="true">{isDarkMode ? '🌙' : '☀️'}</span>
            <button
              type="button"
              className="mode-sw"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to day mode' : 'Switch to night mode'}
              aria-pressed={!isDarkMode}
            >
              <span className="mode-kn" />
            </button>
          </div>
        </header>
        <div className="auth-start-screen__body quiz-auth-card-host">
          <div className="auth-start-sheet">{children}</div>
        </div>
      </div>
    </div>
  );
}
