// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// React root bootstrap and provider composition.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { BRAND } from './config/brand.js';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { QuizProvider } from './contexts/QuizContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import './styles/typography-system.css';
import './styles.css';
import './styles/quizflow.css';
import './styles/learning-dashboard.css';
import './styles/premium-ui.css';
import './styles/result-screen-compact.css';
import './styles/quiz-play.css';
import './styles/ssq-global-ui.css';
import './styles/ssq-gothic-manuscript.css';
import './styles/motion-system.css';

// Keep the tab title in sync with the configured brand name (white-label friendly).
document.title = BRAND.name;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ThemeProvider>
        <AuthProvider>
          <QuizProvider>
            <App />
          </QuizProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
