import { Github, Twitter, MessageSquare } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-v3 mt-auto">
      <div className="divider" style={{ opacity: 0.1 }} />
      <div className="wrap py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center text-purple-light font-bold border border-purple/20">
                ✦
              </div>
              <span className="text-xl font-black tracking-tighter">KsaeKvat</span>
            </div>
            <p className="text-sm text-text-3 max-w-xs text-center md:text-left">
              The ultimate Discord companion for gamers. Track your progress, collect characters, and dominate.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-6">
              <a href="#" className="text-text-dim hover:text-purple-light transition-colors"><MessageSquare size={20} /></a>
              <a href="#" className="text-text-dim hover:text-purple-light transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-text-dim hover:text-purple-light transition-colors"><Github size={20} /></a>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-text-dim">
              © {currentYear} KsaeKvat · Created by <span className="text-purple-light hover:underline cursor-pointer">@_callme_.mo</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim/50">
          <div className="flex items-center gap-4">
            <span>Read-only Mode</span>
            <span className="w-1 h-1 rounded-full bg-green" />
            <span>Refreshes every 30s</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-text-dim cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-text-dim cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-v3 {
          background: rgba(3, 4, 11, 0.5);
        }
        .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
        .mt-12 { margin-top: 3rem; }
        .mt-auto { margin-top: auto; }
      `}</style>
    </footer>
  );
}
