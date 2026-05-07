import { useTheme } from './contexts/ThemeContext.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">COMP5347/4347</p>
          <h1>Quiz Game</h1>
        </div>
        <button type="button" onClick={toggleTheme}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </header>
      <Home />
    </main>
  );
}
