import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Play, CheckCircle, AlertCircle, Info, BookOpen 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

export default function Calendar() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [date, setDate] = useState(new Date());
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, rRes] = await Promise.all([
          api.get('/tests'),
          api.get('/exam/result/all').catch(() => ({ data: { results: [] } }))
        ]);
        setTests(tRes.data.tests || tRes.data || []);
        setResults(rRes.data.results || []);
      } catch (err) {
        console.error('Failed to fetch calendar data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedIds = new Set(results.map(r => r.test?._id || r.test));

  const month = date.getMonth();
  const year = date.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDate(new Date(year, month + 1, 1));

  const monthName = date.toLocaleString('default', { month: 'long' });

  const getTestsForDay = (day) => {
    return tests.filter(t => {
      if (!t.scheduledDate) return false;
      const d = new Date(t.scheduledDate);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const getDayStatus = (dayTests) => {
    if (dayTests.length === 0) return null;
    const now = new Date();
    
    let hasLive = false;
    let hasUpcoming = false;
    let hasCompleted = false;

    dayTests.forEach(t => {
      if (completedIds.has(t._id)) {
        hasCompleted = true;
      } else {
        const sched = new Date(t.scheduledDate);
        const deadline = new Date(sched.getTime() + (t.duration || 60) * 60 * 1000);
        if (now >= sched && now <= deadline) hasLive = true;
        else if (now < sched) hasUpcoming = true;
      }
    });

    if (hasLive) return 'live';
    if (hasUpcoming) return 'upcoming';
    if (hasCompleted) return 'completed';
    return 'missed';
  };

  const startTest = async (testId) => {
    try {
      const { data } = await api.post(`/exam/start/${testId}`);
      navigate(`/exam/${testId}/${data.session._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start test');
    }
  };

  const calendarDays = [];
  // Fill empty days before first of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-transparent" />);
  }

  // Fill days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTests = getTestsForDay(d);
    const status = getDayStatus(dayTests);
    const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

    calendarDays.push(
      <div 
        key={d} 
        onClick={() => dayTests.length > 0 && setSelectedDay({ day: d, tests: dayTests })}
        className={`h-24 md:h-32 border p-2 flex flex-col transition-all cursor-default relative overflow-hidden group
          ${isDark ? 'border-gray-800' : 'border-gray-100'} 
          ${dayTests.length > 0 ? 'cursor-pointer hover:bg-primary-500/5' : ''}
          ${isToday ? (isDark ? 'bg-primary-600/10' : 'bg-primary-50') : ''}
        `}
      >
        <div className="flex items-center justify-between z-10">
          <span className={`text-sm font-black ${isToday ? 'text-primary-500' : isDark ? 'text-gray-400' : 'text-slate-900'} ${isToday ? 'scale-125' : ''} transition-transform`}>
            {d}
          </span>
          {isToday && (
            <span className="text-[8px] font-black uppercase text-primary-500 tracking-tighter">Today</span>
          )}
        </div>

        <div className="mt-1 space-y-1 overflow-hidden">
          {dayTests.slice(0, 3).map(t => {
            const isDone = completedIds.has(t._id);
            return (
              <div 
                key={t._id} 
                className={`text-[8px] md:text-[10px] truncate px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight
                  ${isDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'}
                `}
              >
                {t.title}
              </div>
            );
          })}
          {dayTests.length > 3 && (
            <div className={`text-[8px] pl-1 font-black ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              + {dayTests.length - 3} more
            </div>
          )}
        </div>

        {/* Status Dot */}
        {status && (
          <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full shadow-[0_0_8px] 
            ${status === 'live' ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : 
              status === 'upcoming' ? 'bg-primary-500 shadow-primary-500/50' : 
              status === 'completed' ? 'bg-indigo-500 shadow-indigo-500/50' : 
              'bg-red-500 shadow-red-500/50'}
          `} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 p-4 md:p-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Exam Schedule</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <CalendarIcon className="w-3 h-3 text-primary-500" /> Planned Academic Roadmap
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5">
          <button onClick={prevMonth} className={`p-2.5 rounded-xl transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-50 text-slate-600'}`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className={`px-4 min-w-[140px] text-center font-black uppercase tracking-widest text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {monthName} {year}
          </div>
          <button onClick={nextMonth} className={`p-2.5 rounded-xl transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-50 text-slate-600'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-7 gap-px rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-pulse">
           {Array.from({ length: 35 }).map((_, i) => (
             <div key={i} className="h-32 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800" />
           ))}
        </div>
      ) : (
        <div className="glass rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl">
          <div className="grid grid-cols-7 bg-white/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {calendarDays}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 md:gap-8 justify-center py-4">
        {[
          { label: 'Today', color: 'bg-primary-500/20 border-primary-500' },
          { label: 'Live Exam', color: 'bg-emerald-500' },
          { label: 'Upcoming', color: 'bg-primary-500' },
          { label: 'Completed', color: 'bg-indigo-500' },
          { label: 'Missed', color: 'bg-red-500' }
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${l.color} ${l.label === 'Today' ? 'border' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedDay.day} {monthName}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Day Exams ({selectedDay.tests.length})</p>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-slate-500'}`}
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {selectedDay.tests.map(t => {
                const isDone = completedIds.has(t._id);
                const sched = new Date(t.scheduledDate);
                const now = new Date();
                const deadline = new Date(sched.getTime() + (t.duration || 60) * 60 * 1000);
                const isLive = now >= sched && now <= deadline;
                const isUpcoming = now < sched;

                return (
                  <div key={t._id} className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h4>
                        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-[2px]">{t.subject || 'General'}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                        isDone ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        isLive ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {isDone ? 'Finished' : isLive ? 'Live Now' : isUpcoming ? 'Scheduled' : 'Expired'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        {sched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-primary-500" />
                        {t.duration}m
                      </div>
                    </div>

                    {isDone ? (
                      <button onClick={() => navigate(`/results/${t._id}`)} className="btn-secondary w-full py-3 flex items-center justify-center gap-2 group">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="group-hover:translate-x-1 transition-transform uppercase text-[10px] font-black tracking-widest">Report Card</span>
                      </button>
                    ) : isLive ? (
                      <button onClick={() => startTest(t._id)} className="btn-primary w-full py-3 flex items-center justify-center gap-2 group shadow-xl shadow-primary-500/20">
                        <Play className="w-4 h-4 fill-current" />
                        <span className="group-hover:translate-x-1 transition-transform uppercase text-[10px] font-black tracking-widest text-white">Enter Exam Room</span>
                      </button>
                    ) : isUpcoming ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-500" /> Wait for start time
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-red-500/20 bg-red-500/5 text-red-400 font-bold text-[10px] uppercase tracking-widest">
                        <AlertCircle className="w-3.5 h-3.5" /> Exam Expired
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`p-8 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800`}>
              <button 
                onClick={() => setSelectedDay(null)}
                className="w-full py-4 rounded-3xl bg-white dark:bg-gray-800 text-[10px] font-black uppercase tracking-[3px] shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
