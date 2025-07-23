import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './pages/LandingPage.tsx';
import './index.css';

const isApp = window.location.pathname.startsWith('/app');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isApp ? <App /> : <LandingPage />}
  </StrictMode>
);
