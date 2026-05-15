import ThemeFloatingToggle from './ThemeFloatingToggle.jsx';

/**
 * Full-viewport academy gate: parchment backdrop, optional readability variant, theme only in chrome.
 * Used by AuthPageShell for /login and /register (no app navbar — theme lives here).
 */
export default function AuthScreenLayout({ children, variant = 'readable' }) {
  const rootClass = ['quiz-flow-scope', 'qf-screen', 'start-screen', 'auth-start-screen', 'auth-immersive'];
  if (variant === 'readable') {
    rootClass.push('auth-start-screen--readable');
  }

  return (
    <div className={rootClass.join(' ')}>
      <div className="auth-immersive__theme" role="region" aria-label="Appearance">
        <ThemeFloatingToggle />
      </div>
      <div className="start-screen__bg-stack hero-background" aria-hidden="true">
        <div className="start-screen__bg-pane start-screen__bg-pane--night hero-background__pane" />
        <div className="start-screen__bg-pane start-screen__bg-pane--day hero-background__pane" />
        <div className="start-screen__bg-veil start-screen__bg-veil--night" />
        <div className="start-screen__bg-veil start-screen__bg-veil--day" />
        <div className="hero-overlay" aria-hidden="true" />
      </div>
      <div className="start-screen__inner auth-start-screen__inner auth-immersive__content hero-content">
        <div className="auth-start-screen__body quiz-auth-card-host auth-immersive__card-host">
          <div className="auth-start-sheet">{children}</div>
        </div>
      </div>
    </div>
  );
}
