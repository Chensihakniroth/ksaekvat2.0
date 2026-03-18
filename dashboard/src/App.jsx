import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import GlobalTicker from './components/GlobalTicker';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import CharactersPage from './pages/CharactersPage';
import ZooPage from './pages/ZooPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/zoo" element={<ZooPage />} />
          </Routes>
        </main>
        <GlobalTicker />
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
