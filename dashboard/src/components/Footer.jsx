import { Github, Twitter, MessageSquare, Terminal } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-container">
      <div className="footer-glow" />
      
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand-section">
            <div className="footer-brand">
              <div className="footer-logo">✦</div>
              <span className="footer-name">KsaeKvat</span>
            </div>
            <p className="footer-desc">
              The ultimate Discord companion for gamers. Track your progress, collect characters, and dominate the global leaderboards.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-link" aria-label="Discord">
                <MessageSquare size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Github">
                <Github size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-link-group">
              <h4 className="footer-link-title">Navigation</h4>
              <a href="/" className="footer-link">Home</a>
              <a href="/leaderboard" className="footer-link">Leaderboard</a>
              <a href="/characters" className="footer-link">Characters</a>
            </div>
            
            <div className="footer-link-group">
              <h4 className="footer-link-title">Resources</h4>
              <a href="#" className="footer-link">Commands Guide</a>
              <a href="#" className="footer-link">Support Server</a>
              <a href="#" className="footer-link">Bot Invite</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-status">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">All Systems Operational</span>
            </div>
            <div className="status-terminal">
              <Terminal size={14} />
              <span>v3.0.0-stable</span>
            </div>
          </div>
          
          <div className="footer-legal">
            <span className="footer-copyright">
              © {currentYear} KsaeKvat. Created by <span className="creator-tag">@_callme_.mo</span>
            </span>
            <div className="footer-legal-links">
              <a href="#">Privacy Policy</a>
              <span className="separator">•</span>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
