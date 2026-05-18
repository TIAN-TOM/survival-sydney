import ThemeFloatingToggle from '../ThemeFloatingToggle.jsx';

/**
 * Public shell: theme only. No primary navigation links.
 * @param {{ layout?: 'bar' | 'floating' }} [props]
 */
export default function PublicNavbar({ layout = 'bar' }) {
  const headerClass =
    layout === 'floating'
      ? 'quiz-top-navbar public-navbar public-navbar--floating'
      : 'quiz-top-navbar public-navbar';

  return (
    <header className={headerClass} role="banner" aria-label="Theme">
      <div className="quiz-top-right public-navbar__inner">
        <ThemeFloatingToggle />
      </div>
    </header>
  );
}
