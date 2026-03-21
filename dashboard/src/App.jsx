import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReactLenis } from '@studio-freight/react-lenis';

// Layout Components (Loaded Immediately)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GlobalTicker from './components/GlobalTicker';
import { AuthProvider } from './context/AuthContext';

// Page Components (Lazy Loaded for Performance) ✂️
const HomePage = lazy(() => import('./pages/HomePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CharactersPage = lazy(() => import('./pages/CharactersPage'));
const ZooPage = lazy(() => import('./pages/ZooPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

/**
 * HIGH-END LOADING GATEWAY
 * Shown while lazy-loaded chunks are being synchronized.
 */
function LoadingGateway() {
  return (
    <div className="gateway-loader">
      <div className="loading-core">
        <div className="scanner-circle">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="ring ring-outer" />
          <div className="core-icon"><Activity size={24} className="animate-pulse" /></div>
        </div>
        <div className="loading-text glitch-text">Syncing_Neural_Data...</div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isProfile = location.pathname.startsWith('/profile/');

  console.log('[App] Initializing High-End Dashboard OS...');

  return (
    <div className="app-wrapper">
      {!isProfile && (
        <>
          <div className="cyber-grid" />
          <div className="bg-ambience">
            <div className="bg-orb-purple" />
            <div className="bg-orb-cyan" />
          </div>
          <header className="fixed-top-section">
            <Navbar />
          </header>
        </>
      )}

      <main className="app-main-content">
        <Suspense fallback={<LoadingGateway />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/zoo" element={<ZooPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Suspense>
      </main>

      {!isProfile && (
        <>
          <Footer />
          <GlobalTicker />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ReactLenis>
  );
}

export default App;
