import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Home, Play } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

// No grades, purely percentage based

export default function Results() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [results, setResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/exam/result/${testId}`)
      .then(({ data }) => {
        setResults(data.results || [data.result]);
        setSelectedResultIndex(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return (
    <div className={`min-h-[60vh] flex items-center justify-center`}>
      <div className="text-center">
        <Award className="w-12 h-12 text-primary-500 mx-auto mb-3 animate-[bounce_2s_infinite]" />
        <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Analyzing your performance...</p>
      </div>
    </div>
  );

  if (!results || results.length === 0) return (
    <div className={`min-h-[60vh] flex items-center justify-center`}>
      <div className={`card text-center p-10 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-xl'}`}>
        <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No results found for this selection</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6 px-10">Return to Dashboard</button>
      </div>
    </div>
  );

  const result = results[selectedResultIndex];
  const isGradeMode = result?.test?.gradingMode === 'grade-point';

  const timeFmt = (s) => s ? `${Math.floor(s / 60)}m ${s % 60}s` : '—';
  const markFmt = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : '0.0';
  };
  const percentFmt = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : '0.0';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Score Summary */}
      <div className={`rounded-2xl p-5 md:p-7 text-center relative overflow-hidden border transition-colors ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-2xl shadow-slate-200/50'
      }`}>
        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity ${isDark ? 'from-primary-600/5 to-indigo-600/5 opacity-100' : 'from-primary-600/[0.02] to-indigo-600/[0.02] opacity-50'}`} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4 bg-primary-600/10 border-2 border-primary-500/20 shadow-xl shadow-primary-500/10">
            <Award className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className={`text-2xl md:text-3xl font-black mb-1 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.test?.title}</h1>
          <p className="text-primary-500 font-black uppercase tracking-[0.25em] text-[10px] mb-4">{result.test?.subject}</p>

          {results.length > 1 && (
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">Submission History</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedResultIndex(i)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedResultIndex === i
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105'
                        : isDark ? 'bg-gray-800 text-gray-500 hover:bg-gray-700' : 'bg-gray-50 text-slate-400 hover:bg-gray-100'
                    }`}
                  >
                    Attempt {r.attemptNumber || results.length - i}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 py-4 md:py-6 border-y transition-colors ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="space-y-1">
              <p className={`text-3xl md:text-4xl font-black ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>{percentFmt(result.percentage)}%</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Percentage</p>
            </div>
            <div className={`space-y-1 md:border-x transition-colors ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <p className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isGradeMode ? markFmt(result.gradePoint) : `${markFmt(result.score)}/${markFmt(result.totalMarks)}`}
              </p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{isGradeMode ? 'Grade Point' : 'Total Marks'}</p>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{timeFmt(result.timeTaken)}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Time Spent</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-5 md:mt-6 grid grid-cols-3 gap-2 md:gap-3">
            <div className={`rounded-xl p-2.5 md:p-3.5 border transition-colors ${isDark ? 'bg-gray-800/20 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <p className="text-lg md:text-xl font-black text-emerald-500">{result.questionAnalysis?.filter(q => q.isCorrect).length || 0}</p>
              <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Correct</p>
            </div>
            <div className={`rounded-xl p-2.5 md:p-3.5 border transition-colors ${isDark ? 'bg-gray-800/20 border-red-500/10' : 'bg-red-50/50 border-red-100'}`}>
              <p className="text-lg md:text-xl font-black text-red-500">{result.questionAnalysis?.filter(q => !q.isCorrect).length || 0}</p>
              <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Incorrect</p>
            </div>
            <div className={`rounded-xl p-2.5 md:p-3.5 border transition-colors ${isDark ? 'bg-gray-800/20 border-gray-700' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`text-lg md:text-xl font-black ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{result.questionAnalysis?.length || 0}</p>
              <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Questions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 flex flex-col md:flex-row gap-3">
        {(() => {
          const t = result.test;
          if (!t) return null;
          
          const now = new Date();
          const sched = t.scheduledDate ? new Date(t.scheduledDate) : null;
          const expiry = t.expiryDate ? new Date(t.expiryDate) : (sched ? new Date(sched.getTime() + (t.duration || 60) * 60 * 1000) : null);
          const isLive = (!sched || now >= sched) && (!expiry || now < expiry);
          const hasAttemptsLeft = t.unlimitedAttempts || results.length < (t.maxAttempts || 1);
          
          if (!isLive || !hasAttemptsLeft) return null;

          return (
            <button onClick={async () => {
              try {
                const { data } = await api.post(`/exam/start/${testId}`);
                navigate(`/exam/${testId}/${data.session._id}`);
              } catch (err) {
                alert(err.response?.data?.message || 'Could not start test');
              }
            }} 
              className="flex-1 h-13 min-h-[52px] rounded-xl flex items-center justify-center gap-2.5 font-black uppercase tracking-wider text-sm transition-all transform active:scale-[0.98] bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-xl shadow-primary-500/20 px-5">
              <Play className="w-5 h-5 fill-current" /> Retake Examination
            </button>
          );
        })()}
        
        <button onClick={() => navigate('/')} 
          className={`flex-1 h-13 min-h-[52px] rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-all transform active:scale-[0.98] border shadow-xl px-5 ${
            isDark ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800 shadow-black/40' : 'bg-white border-gray-100 text-slate-700 hover:bg-slate-50 shadow-slate-200/50'
          }`}>
          <Home className="w-5 h-5 text-primary-500" /> Return to My Overview
        </button>
      </div>
    </div>
  );
}
