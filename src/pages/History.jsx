import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { History as HistoryIcon, Clock, Award, Eye, BarChart3, Trash2, AlertTriangle, FileText } from 'lucide-react';
import api from '../api';

export default function History() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [groupedTests, setGroupedTests] = useState([]);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    api.get('/exam/result/all')
      .then(({ data }) => {
        const results = data.results || [];
        const groups = {};
        
        results.forEach(res => {
          const tid = res.test?._id || res.test;
          if (!groups[tid]) {
            groups[tid] = {
              test: res.test,
              results: [],
              bestScore: 0,
              totalAttempts: 0
            };
          }
          groups[tid].results.push(res);
          groups[tid].totalAttempts += 1;
          if (res.percentage > groups[tid].bestScore) {
            groups[tid].bestScore = res.percentage;
          }
        });

        setGroupedTests(Object.values(groups).sort((a, b) => 
          new Date(b.results[0].createdAt) - new Date(a.results[0].createdAt)
        ));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const clearHistory = async () => {
    setClearing(true);
    try {
      await api.delete('/exam/result/all');
      setGroupedTests([]);
      setShowConfirm(false);
    } catch (err) {
      alert('Failed to clear history: ' + (err.response?.data?.message || err.message));
    }
    setClearing(false);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <HistoryIcon className="w-12 h-12 text-primary-500 mx-auto mb-3 animate-spin duration-1000" />
        <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading your journey...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isDark ? 'bg-gray-900 border-gray-800 shadow-none' : 'bg-white border-gray-100 shadow-xl'}`}>
            <HistoryIcon className="w-7 h-7 text-primary-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Examination History</h1>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Your performance track record</p>
          </div>
        </div>
        
        {groupedTests.length > 0 && (
          <button 
            onClick={() => setShowConfirm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all font-bold uppercase tracking-widest text-[10px] active:scale-95 group shadow-md shadow-red-500/5 hover:shadow-red-500/20"
          >
            <Trash2 className="w-4 h-4 transition-transform group-hover:rotate-12" />
            Clear All History
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`card max-w-sm w-full p-8 shadow-2xl transition-all scale-in-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Wipe History?</h2>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                This will permanently delete all your exam results and reset your attempt counts. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={clearing} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={clearHistory} disabled={clearing} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 text-sm uppercase tracking-widest">
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {groupedTests.length === 0 ? (
        <div className={`card p-16 text-center border-dashed border-2 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-6 opacity-50" />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No history yet</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">Complete your first exam to see your journey and analytical growth here.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-8 px-10">Go to Dashboard</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groupedTests.map((group, idx) => {
            const t = group.test;
            const latest = group.results[0];
            return (
              <div key={idx} className={`glass rounded-2xl p-5 border transition-all group hover:shadow-xl ${isDark ? 'border-gray-800 hover:border-primary-500/30' : 'border-gray-100 hover:border-primary-500/10 shadow-lg shadow-slate-200/40'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-slate-500'}`}>
                        {t?.subject || 'General'}
                      </span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-primary-500/10 text-primary-600 border border-primary-500/20`}>
                        {group.totalAttempts} {group.totalAttempts === 1 ? 'Attempt' : 'Attempts'}
                      </span>
                    </div>
                    <h3 className={`text-xl font-black mb-1 group-hover:text-primary-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {t?.title || 'Unknown Test'}
                    </h3>
                    <p className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      Last Attempt: {new Date(latest.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>

                  <div className={`flex items-center gap-4 md:gap-6 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 transition-colors ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="text-center min-w-[72px]">
                      <p className={`text-2xl font-black ${group.bestScore >= (t?.passmark || 0) ? 'text-emerald-500' : 'text-red-500'}`}>
                        {group.bestScore}%
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Best Score</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/results/${t?._id || latest.test}`)}
                        className={`h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-widest ${
                          isDark ? 'bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white' : 'bg-gray-50 text-slate-500 hover:bg-primary-600 hover:text-white shadow-inner'
                        }`}
                      >
                        <Eye className="w-4 h-4" /> Summary
                      </button>

                      <button
                        onClick={() => navigate(`/results/${t?._id || latest.test}/${latest._id}/review`)}
                        className="h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20"
                      >
                        <FileText className="w-4 h-4" /> Review
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
