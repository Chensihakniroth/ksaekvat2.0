import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Activity } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactLenis } from '@studio-freight/react-lenis';

// Layout Components (Loaded Immediately)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GlobalTicker from './components/GlobalTicker';
import { AuthProvider } from './context/AuthContext';

// Page Components (Lazy Loaded for Performance) 
const HomePage = lazy(() => import('./pages/HomePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CharactersPage = lazy(() => import('./pages/CharactersPage'));
const ZooPage = lazy(() => import('./pages/ZooPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

/**
 * HIGH-END LOADING GATEWAY
 * Shown while lazy-loaded chunks are being synchronized.
 */
function LoadingGateway() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-deep)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: '60px', height: '60px', background: 'var(--cyber-yellow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '2rem', boxShadow: '0 0 30px var(--cyber-yellow)', marginBottom: '30px' }}
      >
        ✦
      </motion.div>
      <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.4em', color: 'var(--cyber-cyan)', textTransform: 'uppercase', textShadow: '0 0 10px rgba(0, 243, 255, 0.5)' }}>
        ESTABLISHING UPLINK...
      </div>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '200px' }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ height: '1px', background: 'var(--cyber-cyan)', marginTop: '20px', boxShadow: '0 0 10px var(--cyber-cyan)' }}
      />
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isProfile = location.pathname.startsWith('/profile/');
  
  // Setup Parallax Background
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  console.log('[App] Initializing High-End Dashboard OS...');

  return (
    <div className="app-wrapper">
      {!isProfile && (
        <>
          <div className="cyber-grid" />
          <motion.div className="bg-ambience" style={{ y: yBg }}>
            <div style={{ position: 'absolute', top: '-15%', left: 0, right: 0, bottom: '-15%', height: '130vh', width: '100vw', backgroundImage: 'url("/bg-cyberpunk.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2, zIndex: -1 }} />
          </motion.div>
          <header className="fixed-top-section">
            <Navbar />
          </header>
        </>
      )}

      <main className={`app-main-content ${isProfile ? 'profile-main' : ''}`}>
        <Suspense fallback={<LoadingGateway />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/characters" element={<ShopPage />} />
            <Route path="/zoo" element={<ShopPage />} />
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
