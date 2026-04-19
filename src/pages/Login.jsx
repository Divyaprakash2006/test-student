import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';

export default function Login() {
  const { loginWithRollNo } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ rollNo: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await loginWithRollNo(form.rollNo.trim(), form.password);
    setLoading(false);
    if (res.success) navigate('/');
    else setError(res.message);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Background Effects */}
      <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-opacity duration-1000 ${isDark ? 'bg-blue-600/10 opacity-50' : 'bg-blue-500/10 opacity-30'}`} />
      <div className={`absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-opacity duration-1000 ${isDark ? 'bg-indigo-600/10 opacity-50' : 'bg-indigo-500/10 opacity-30'}`} />

      <div className="relative w-full max-w-sm flex flex-col gap-10 md:gap-0">

        {/* Branding - Responsive Position */}
        <div className="md:absolute md:-top-24 md:left-0 flex items-center gap-3 z-50 self-center md:self-start mb-4 md:mb-0">
          <div className={`w-12 h-12 rounded-2xl glass flex items-center justify-center shadow-xl overflow-hidden border transition-all duration-500 ${isDark ? 'bg-white/10 border-white/20' : 'bg-white border-white'}`}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Test</span>
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-emerald-400">Zen</span>
            </div>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none">Student Portal</p>
          </div>
        </div>

        {/* Login Card */}
        <div className={`glass rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-500 border ${
          isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/90 border-white'
        }`}>
          <div className="relative mb-6">
            <h2 className={`text-xl font-black transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sign In</h2>
            <div className="w-10 h-1 bg-[#2563eb] rounded-full mt-2" />
          </div>

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-3 text-[10px] font-bold animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 relative">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Roll Number</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#2563eb]">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className={`w-full h-11 border rounded-xl pl-11 pr-4 transition-all font-bold text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
                    isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-700 focus:border-[#2563eb]/50' 
                    : 'bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 focus:border-[#2563eb]/50 focus:bg-white shadow-inner'
                  }`}
                 placeholder="••••••••"
                  value={form.rollNo}
                  onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#2563eb]">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  className={`w-full h-11 border rounded-xl pl-11 pr-4 transition-all font-bold text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
                    isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-700 focus:border-[#2563eb]/50' 
                    : 'bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 focus:border-[#2563eb]/50 focus:bg-white shadow-inner'
                  }`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sign In Access"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
