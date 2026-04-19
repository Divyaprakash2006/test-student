import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, CheckCircle, Play, Eye, Calendar, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const DEMO_TESTS = {
  upcoming: [{ _id: 'demo1', title: 'Physics Midterm', subject: 'Physics', duration: 60, questions: [1,2,3,4,5], scheduledDate: new Date(Date.now() + 3600000*24).toISOString() }],
  ongoing: [],
  completed: [],
};

function StatCard({ label, count, icon: Icon, color, bg, isDark }) {
  return (
    <div className="glass rounded-2xl p-4 md:p-6 group hover:shadow-md transition-all duration-200">
      <div className="flex items-center md:items-start gap-4">
        <div className={`stat-icon-box shrink-0 ${bg}`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color}`} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
             <span className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
}

function TestTable({ tests, type, title, onStart, navigate, isDark }) {
  if (tests.length === 0) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Flexible';
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-4 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {tests.map(test => {
          const isLocked = type === 'upcoming' || type === 'missed';
          const isCompleted = type === 'completed';
          
          return (
            <div key={test._id} className={`glass rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border transition-all duration-500 hover:shadow-2xl group relative overflow-hidden ${isDark ? 'border-gray-800 hover:border-primary-500/50' : 'border-gray-200 hover:border-primary-500/30'}`}>
               {/* Accent Gradient */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent blur-2xl -mr-16 -mt-16" />
               
               <div className="flex justify-between items-start mb-6">
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    type === 'ongoing' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                    type === 'upcoming' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                    type === 'missed' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {type === 'ongoing' ? 'Live Now' : type === 'upcoming' ? 'Upcoming' : type === 'missed' ? 'Expired' : 'Completed'}
                  </div>
                  {isCompleted && (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                      test.passed ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}>
                      {test.passed ? `Score: ${test.percentage}%` : `Fail: ${test.percentage}%`}
                    </span>
                  )}
               </div>

               <div className="mb-8">
                  <h3 className={`text-xl font-black leading-tight mb-2 transition-colors ${isDark ? 'text-white group-hover:text-primary-400' : 'text-slate-900 group-hover:text-primary-600'}`}>
                    {test.title}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {test.subject || 'General Studies'}
                  </p>
               </div>

               <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-bold">
                    <Calendar className="w-4 h-4 text-primary-400" />
                    {fmtDate(test.scheduledDate)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-bold">
                    <Clock className="w-4 h-4 text-primary-400" />
                    {test.duration} Minutes
                  </div>
               </div>

               <div className={`pt-6 border-t ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
                  {isCompleted ? (
                    <button onClick={() => navigate(`/results/${test._id}`)}
                      className={`w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                      <Eye className="w-4 h-4" /> View Results
                    </button>
                  ) : (
                    <button onClick={() => !isLocked && onStart(test._id)} disabled={isLocked}
                      className={`w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
                        isLocked 
                          ? (isDark ? 'bg-gray-800/50 text-gray-500 border border-gray-800' : 'bg-gray-50 text-gray-400 border border-gray-100')
                          : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-primary-600/20 active:scale-[0.98]'
                      }`}>
                      {isLocked ? <AlertCircle className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      {type === 'ongoing' ? 'Continue Test' : type === 'upcoming' ? 'Test Locked' : 'Test Expired'}
                    </button>
                  )}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [myTests, setMyTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    Promise.all([
      api.get('/tests'), 
      api.get('/exam/result/all').catch(() => ({ data: { results: [] } }))
    ])
      .then(([t, r]) => { 
        setMyTests(t.data.tests || t.data || []); 
        setResults(r.data.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startTest = async (testId) => {
    try {
      const { data } = await api.post(`/exam/start/${testId}`);
      navigate(`/exam/${testId}/${data.session._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start test');
    }
  };

  const completedIds = new Set(results.map(r => r.test?._id || r.test));
  const now = new Date();

  const upcoming = [];
  const ongoing = [];
  const missed = [];

  myTests.forEach(t => {
    if (completedIds.has(t._id)) return;
    
    const sched = t.scheduledDate ? new Date(t.scheduledDate) : null;
    const deadline = sched ? new Date(sched.getTime() + (t.duration || 60) * 60 * 1000) : null;

    if (!sched || sched > now) {
      upcoming.push(t);
    } else if (now < deadline) {
      ongoing.push(t);
    } else {
      missed.push(t);
    }
  });

  const completed = results.map(r => ({ ...(r.test || {}), passed: r.passed, percentage: r.percentage, _id: r.test?._id || r.test })).filter(Boolean);

  const avgScore = results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length) : 0;
  const passRate = results.length > 0 ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-12 md:pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">


      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 px-4">
        <StatCard isDark={isDark} label="Enrolled Tests" count={myTests.length} icon={BookOpen} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard isDark={isDark} label="Active Tests" count={ongoing.length} icon={Play} color="text-purple-600" bg="bg-purple-50" />
        <StatCard isDark={isDark} label="Avg Score" count={`${avgScore}%`} icon={CheckCircle} color="text-teal-600" bg="bg-teal-50" />
        <StatCard isDark={isDark} label="Pass Rate" count={`${passRate}%`} icon={Calendar} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {loading ? (
        <div className="space-y-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="glass rounded-[2rem] h-64 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-16 px-4">
          {ongoing.length === 0 && upcoming.length === 0 && completed.length === 0 && missed.length === 0 ? (
            <div className={`glass rounded-[3rem] border-dashed border-2 p-20 text-center relative overflow-hidden shadow-2xl ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
               {/* Background Decorative Element */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[120px]" />
               
               <div className="relative z-10">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-black/5 rotate-3 hover:rotate-0 transition-transform duration-500 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className={`text-3xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No tests assigned yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-bold text-lg leading-relaxed">
                  When your administrator assigns you an exam, it will appear here. Stay focused!
                </p>
               </div>
            </div>
          ) : (
            <>
              <TestTable title="Active Examinations" tests={ongoing} type="ongoing" onStart={startTest} navigate={navigate} isDark={isDark} />
              <TestTable title="Scheduled Tests" tests={upcoming} type="upcoming" onStart={startTest} navigate={navigate} isDark={isDark} />
              <TestTable title="Past Results" tests={completed} type="completed" onStart={startTest} navigate={navigate} isDark={isDark} />
              <TestTable title="Missed Deadlines" tests={missed} type="missed" onStart={startTest} navigate={navigate} isDark={isDark} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
