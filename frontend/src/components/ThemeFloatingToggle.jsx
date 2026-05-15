import { useTheme } from '../contexts/ThemeContext.jsx';

/** Compact day/night control for floating corners (landing, auth immersive, public strip). */
export default function ThemeFloatingToggle({ className = '' }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const rowClass = ['mode-row', 'mode-row--toolbar', className].filter(Boolean).join(' ');

  return (
    <div className={rowClass}>
      <span className="sr-only">{isDarkMode ? 'Night mode' : 'Day mode'}</span>
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
  );
}
