import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Server, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  const queryParams = new URLSearchParams(window.location.search);
  const error = queryParams.get('error');

  if (loading || user) return (
    <div className="gateway-loader">
      <div className="loading-core">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full" />
        <div className="loading-text mt-4 text-cyan-400 tracking-[0.3em] uppercase text-xs font-bold">Authenticating...</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative z-10 w-full">
      <motion.div 
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 md:p-12 text-center relative overflow-hidden"
        style={{ 
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '32px', 
          border: '1px solid rgba(34,211,238,0.2)', 
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 0 60px rgba(34,211,238,0.05)' 
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
        
        <div className="mx-auto w-24 h-24 rounded-full border border-cyan-400/30 flex items-center justify-center mb-8 bg-black/40 relative shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          <ShieldCheck size={40} className="text-cyan-400" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute inset-[-10px] border border-dashed border-cyan-400/30 rounded-full"></motion.div>
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute inset-[-20px] border border-cyan-500/10 rounded-full"></motion.div>
        </div>

        <h1 className="text-5xl font-black italic text-white mb-2 tracking-tighter" style={{ textShadow: '0 0 20px rgba(34,211,238,0.5)' }}>
          KSAEKVAT
        </h1>
        <p className="text-xs font-bold text-gray-400 tracking-[0.3em] uppercase mb-10">Secure Access Portal</p>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm text-left">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">Authentication voided. Discord handshake failed or was cancelled by user.</p>
          </motion.div>
        )}

        <button 
          onClick={login}
          className="w-full relative group overflow-hidden bg-[#5865F2]/20 border border-[#5865F2]/50 text-white rounded-2xl p-4 flex items-center justify-center gap-4 font-black uppercase tracking-widest transition-all duration-300 hover:bg-[#5865F2]/40 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(88,101,242,0.4)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
          <LogIn size={20} />
          <span>Discord Handshake</span>
        </button>

        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <Server size={14} className="text-cyan-500/50" /> Encrypted Neural Connection
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <Sparkles size={14} className="text-purple-500/50" /> Syncing Biological Data
          </div>
        </div>
      </motion.div>
    </div>
  );
}
