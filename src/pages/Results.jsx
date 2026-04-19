import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, XCircle, Clock, BarChart3, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

// No grades, purely percentage based

export default function Results() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get(`/exam/result/${testId}`)
      .then(({ data }) => setResult(data.result))
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

  if (!result) return (
    <div className={`min-h-[60vh] flex items-center justify-center`}>
      <div className={`card text-center p-10 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-xl'}`}>
        <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No results found for this selection</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6 px-10">Return to Dashboard</button>
      </div>
    </div>
  );

  const timeFmt = (s) => s ? `${Math.floor(s / 60)}m ${s % 60}s` : '—';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Score Summary */}
      <div className={`rounded-3xl p-8 md:p-12 text-center relative overflow-hidden border transition-colors ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-2xl shadow-slate-200/50'
      }`}>
        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity ${isDark ? 'from-primary-600/5 to-indigo-600/5 opacity-100' : 'from-primary-600/[0.02] to-indigo-600/[0.02] opacity-50'}`} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mx-auto mb-6 bg-primary-600/10 border-2 border-primary-500/20 shadow-2xl shadow-primary-500/10">
            <Award className="w-12 h-12 text-primary-500" />
          </div>
          <h1 className={`text-3xl md:text-5xl font-black mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.test?.title}</h1>
          <p className="text-primary-500 font-black uppercase tracking-[0.3em] text-[10px] mb-10">{result.test?.subject}</p>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 py-6 md:py-10 border-y transition-colors ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="space-y-1">
              <p className={`text-4xl md:text-5xl font-black ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>{result.percentage}%</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Final Accuracy</p>
            </div>
            <div className={`space-y-1 md:border-x transition-colors ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <p className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.score}/{result.totalMarks}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Total Marks</p>
            </div>
            <div className="space-y-1">
              <p className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{timeFmt(result.timeTaken)}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Time Spent</p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center">
            <div className={`text-xl font-black px-10 py-3 rounded-2xl shadow-xl flex items-center gap-3 transition-colors ${
              result.passed 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-red-500/10'
            }`}>
              {result.passed ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {result.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 md:mt-12 grid grid-cols-3 gap-3 md:gap-4">
            <div className={`rounded-xl md:rounded-2xl p-3 md:p-5 border transition-colors ${isDark ? 'bg-gray-800/20 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <p className="text-xl md:text-2xl font-black text-emerald-500">{result.questionAnalysis?.filter(q => q.isCorrect).length || 0}</p>
              <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Correct</p>
            </div>
            <div className={`rounded-xl md:rounded-2xl p-3 md:p-5 border transition-colors ${isDark ? 'bg-gray-800/20 border-red-500/10' : 'bg-red-50/50 border-red-100'}`}>
              <p className="text-xl md:text-2xl font-black text-red-500">{result.questionAnalysis?.filter(q => !q.isCorrect).length || 0}</p>
              <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Incorrect</p>
            </div>
            <div className={`rounded-xl md:rounded-2xl p-3 md:p-5 border transition-colors ${isDark ? 'bg-gray-800/20 border-gray-700' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`text-xl md:text-2xl font-black ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{result.questionAnalysis?.length || 0}</p>
              <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Review */}
      {result.questionAnalysis && result.questionAnalysis.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4 px-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-lg'}`}>
              <BarChart3 className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Detailed Review</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Question-by-question breakdown</p>
            </div>
          </div>

          <div className="space-y-4">
            {result.questionAnalysis.map((qa, i) => {
              const q = qa.question;
              const isExp = expanded === i;
              return (
                <div key={i} className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isDark ? 'bg-gray-900/40 border-gray-800 shadow-none' : 'bg-white border-gray-100 shadow-xl shadow-slate-200/20'
                } ${qa.isCorrect ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'}`}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${qa.isCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {qa.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Question {i + 1}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg transition-colors ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-50 text-slate-500'}`}>
                            {qa.marksAwarded}/{qa.maxMarks} Marks
                          </span>
                        </div>
                        <p className={`font-bold leading-relaxed mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{q?.text || `Problem Definition missing`}</p>
                        
                        <div className="space-y-3">
                          {q?.type === 'coding' ? (
                            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner">
                              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{qa.studentAnswer?.language || 'Code'} Submission</span>
                              </div>
                              <pre className="p-4 bg-gray-900 text-gray-300 text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                {qa.studentAnswer?.code || 'No code submitted'}
                              </pre>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className={`p-4 rounded-xl border flex flex-col gap-1 ${qa.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Your Response</p>
                                <p className={`text-sm font-bold ${qa.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {Array.isArray(qa.studentAnswer) ? qa.studentAnswer.map(ans => ans || '-').join(', ') : qa.studentAnswer || '(No response captured)'}
                                </p>
                              </div>
                              {!qa.isCorrect && (
                                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1">
                                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Correct Solution</p>
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {Array.isArray(qa.correctAnswer) ? qa.correctAnswer.join(', ') : qa.correctAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {q?.explanation && (
                          <div className="mt-4">
                            <button onClick={() => setExpanded(isExp ? null : i)} 
                              className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-primary-500/20">
                              {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {isExp ? 'Hide Analysis' : 'Show Analysis'}
                            </button>
                            {isExp && (
                              <div className="mt-3 p-4 bg-primary-500/5 border border-primary-500/10 rounded-xl text-xs leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                <span className={`font-black mr-2 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>CONCEPT:</span> 
                                <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>{q.explanation}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-8">
        <button onClick={() => navigate('/')} 
          className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all transform active:scale-[0.98] border shadow-2xl ${
            isDark ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800 shadow-black/40' : 'bg-white border-gray-100 text-slate-700 hover:bg-slate-50 shadow-slate-200/50'
          }`}>
          <Home className="w-6 h-6 text-primary-500" /> Return to My Overview
        </button>
      </div>
    </div>
  );
}
