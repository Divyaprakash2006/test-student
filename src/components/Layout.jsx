import { useState } from 'react';
import { Navigate, Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Home, User, Sun, Moon, ChevronDown, BarChart3, Calendar, History as HistoryIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';

  return (
    <nav className={`top-nav border-b px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between sticky top-0 z-50 transition-colors`}>
      <div className="flex items-center gap-2 md:gap-2.5">
        <div className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm border ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`font-black text-xs md:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Test</span>
          <span className="font-black text-xs md:text-sm bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-emerald-400">Zen</span>
          <span className="text-[8px] md:text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-tighter">Student</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1">
        <NavLink to="/" end className={({ isActive }) =>
          `px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${isActive ? 'bg-primary-600/10 text-primary-600 border-primary-600/20 shadow-lg shadow-primary-600/5' : isDark ? 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800' : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'}`}>
          <span className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"><Home className="w-4 h-4" /> My Tests</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) =>
          `px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${isActive ? 'bg-primary-600/10 text-primary-600 border-primary-600/20 shadow-lg shadow-primary-600/5' : isDark ? 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800' : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'}`}>
          <span className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"><Calendar className="w-4 h-4" /> Calendar</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) =>
          `px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${isActive ? 'bg-primary-600/10 text-primary-600 border-primary-600/20 shadow-lg shadow-primary-600/5' : isDark ? 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800' : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'}`}>
          <span className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"><HistoryIcon className="w-4 h-4" /> History</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile Theme Toggle - moved from dropdown for better access */}
        <button onClick={toggle} className={`md:hidden p-2 rounded-xl border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-amber-400' : 'bg-white border-gray-200 text-slate-500'}`}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        
        <NotificationBell />

        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 md:gap-3 p-1 md:p-1.5 rounded-2xl transition-all duration-200 border ${isOpen ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'border-transparent md:hover:bg-gray-50 dark:md:hover:bg-gray-900/50'}`}
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs md:text-sm shadow-lg shadow-primary-500/20">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="text-left hidden md:block">
              <p className={`text-xs font-black leading-none truncate max-w-[120px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
              <p className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Student Account</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Backdrop for closing */}
          {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-60 md:w-64 glass rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-black/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="p-3 space-y-1">
                <button 
                  onClick={() => { navigate('/profile'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20">
                    <User className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-sm font-bold">View Profile</span>
                </button>

                <button 
                  onClick={toggle}
                  className="hidden md:flex w-full items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20">
                    {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-bold">{isDark ? 'Light' : 'Dark'} Mode</span>
                    <div className={`w-8 h-4 rounded-full p-1 transition-colors ${isDark ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <div className={`w-2 h-2 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2" />

                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20">
                    <LogOut className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-sm font-bold">Sign Out</span>
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MEC Test Management</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function BottomNav() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass border rounded-[2rem] p-2 flex items-center justify-around z-[100] shadow-2xl backdrop-blur-xl transition-all duration-500 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
      <NavLink to="/" end className={({ isActive }) =>
        `mobile-nav-item flex-1 ${isActive ? 'text-primary-500 scale-110' : 'text-gray-400 hover:text-gray-200'}`}>
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[8px]">Tests</span>
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) =>
        `mobile-nav-item flex-1 ${isActive ? 'text-primary-500 scale-110' : 'text-gray-400 hover:text-gray-200'}`}>
        <Calendar className="w-5 h-5 mb-0.5" />
        <span className="text-[8px]">Schedule</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) =>
        `mobile-nav-item flex-1 ${isActive ? 'text-primary-500 scale-110' : 'text-gray-400 hover:text-gray-200'}`}>
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-[8px]">Profile</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) =>
        `mobile-nav-item flex-1 ${isActive ? 'text-primary-500 scale-110' : 'text-gray-400 hover:text-gray-200'}`}>
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span className="text-[8px]">History</span>
      </NavLink>
    </div>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  
  if (!user) return <Navigate to="/login" replace />;

  const isExam = location.pathname.includes('/exam/') || location.pathname.includes('/results/');

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {!isExam && <Navbar />}
      <main className={`flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full ${!isExam ? 'pb-28 md:pb-6' : 'p-0 md:p-0 max-w-none'}`}>
        <Outlet />
      </main>
      {!isExam && <BottomNav />}
    </div>
  );
}
