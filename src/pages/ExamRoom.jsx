import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle, X, Check, BookOpen, Play, Terminal, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const TEMPLATES = {
  javascript: `// Write your code here\nconsole.log("Hello World");`,
  python: `# Write your code here\nimport sys\n# Use sys.stdin.read() or sc.nextInt() style logic\nprint("Hello World")`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your code here\n        System.out.println("Hello World");\n    }\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << "Hello World" << endl;\n    return 0;\n}`
};

const normalizeMultiAnswer = (value) => {
  if (Array.isArray(value)) {
    return value.map(v => String(v || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed.split(/[\n,;|]+/).map(v => v.trim()).filter(Boolean);
  }
  if (value === undefined || value === null) return [];
  const text = String(value).trim();
  return text ? [text] : [];
};

function Timer({ startTime, duration, expiryDate, onExpire }) {
  const [left, setLeft] = useState(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    // Session-based end time (absolute full duration for this specific session)
    const sessionEndTime = new Date(startTime).getTime() + duration * 60 * 1000;
    
    // Absolute hard deadline (Test Expiry) if available
    let endTime = sessionEndTime;
    if (expiryDate) {
      const expTime = new Date(expiryDate).getTime();
      // Use the earlier of session duration or test expiry
      endTime = Math.min(sessionEndTime, expTime);
    }

    const tick = () => {
      const rem = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setLeft(rem);
      if (rem === 0 && !expiredRef.current) { 
        expiredRef.current = true; 
        onExpire(); 
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, duration, expiryDate, onExpire]);

  if (left === null) return null;
  const m = Math.floor(left / 60), s = left % 60;
  const urgent = left < 300;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-colors ${
      urgent 
        ? 'bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse' 
        : 'bg-black/5 dark:bg-gray-800 text-slate-900 dark:text-white border border-gray-100 dark:border-gray-700'
    }`}>
      <Clock className={`w-5 h-5 ${urgent ? 'text-red-600' : 'text-primary-500'}`} />
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}

export default function ExamRoom() {
  const { testId, sessionId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [test, setTest] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [finalSubmitStep, setFinalSubmitStep] = useState(false);
  const [error, setError] = useState('');
  const [runResults, setRunResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);
  const [manualInputText, setManualInputText] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState({});

  const enterFullScreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const releaseFullScreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullScreen(fs);
      if (!fs && hasStarted && !submitting) {
        setExitCount(p => p + 1);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [hasStarted, submitting]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasStarted && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, submitting]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          api.get(`/exam/session/${sessionId}`),
          api.get(`/tests/${testId}`),
        ]);
        setSession(s.data.session);
        setTest(t.data.test);
        const qs = s.data.session.shuffledQuestions || t.data.test.questions || [];
        setQuestions(qs);
        
        // Initialize Shuffled Options Map
        const fullQs = t.data.test.questions || [];
        const newShuffledMap = {};
        fullQs.forEach(question => {
          if ((question.type === 'mcq-single' || question.type === 'mcq-multi') && question.shuffleOptions && question.options) {
            const shuffled = [...question.options].sort(() => Math.random() - 0.5);
            newShuffledMap[question._id] = shuffled;
          }
        });
        setShuffledOptionsMap(newShuffledMap);

        // Restore answers
        const savedAnswers = {};
        const savedFlagged = {};
        const questionTypeMap = new Map(fullQs.map(question => [String(question._id), question.type]));
        (s.data.session.answers || []).forEach(a => {
          const questionId = String(a.question);
          const qType = questionTypeMap.get(questionId);
          savedAnswers[questionId] = qType === 'mcq-multi' ? normalizeMultiAnswer(a.answer) : a.answer;
          if (a.flagged) savedFlagged[questionId] = true;
        });
        setAnswers(savedAnswers);
        setFlagged(savedFlagged);
      } catch (e) { setError('Failed to load exam'); }
      setLoading(false);
    };
    load();
  }, [sessionId, testId]);

  const saveAnswer = useCallback(async (qId, answer, flag) => {
    try {
      await api.post(`/exam/session/${sessionId}/answer`, { questionId: qId, answer, flagged: flag || false });
    } catch {}
  }, [sessionId]);

  const handleAnswer = (qId, answer) => {
    const newAnswers = { ...answers, [qId]: answer };
    setAnswers(newAnswers);
    saveAnswer(qId, answer, flagged[qId]);
  };

  const toggleMultiAnswer = useCallback((qId, option) => {
    setAnswers(prev => {
      const current = normalizeMultiAnswer(prev[qId]);
      const isSelected = current.includes(option);
      const next = isSelected ? current.filter(value => value !== option) : [...current, option];
      saveAnswer(qId, next, flagged[qId]);
      return { ...prev, [qId]: next };
    });
  }, [flagged, saveAnswer]);

  const toggleFlag = (qId) => {
    const newFlagged = { ...flagged, [qId]: !flagged[qId] };
    setFlagged(newFlagged);
    if (answers[qId] !== undefined) saveAnswer(qId, answers[qId], newFlagged[qId]);
  };

  const handleRunCode = async (qId, code, lang) => {
    if (!code) return;
    setRunning(true);
    setRunResults(null);
    try {
      const payload = { questionId: qId, code, language: lang };
      if (useManualInput) payload.customInput = manualInputText;
      
      const { data } = await api.post(`/exam/session/${sessionId}/run`, payload);
      setRunResults(data.results);
    } catch { setError('Failed to run code'); }
    setRunning(false);
  };

  const q = questions[current];
  const qId = q?._id || q;
  const questionObj = Array.isArray(test?.questions) ? test.questions.find(x => (x._id || x) === qId) || q : q;

  useEffect(() => {
    setRunResults(null);
    if (questionObj?.type === 'coding' && qId && !answers[qId]) {
      const lang = questionObj.allowedLanguages?.[0] || 'javascript';
      handleAnswer(qId, { code: TEMPLATES[lang] || '', language: lang });
    }
  }, [current, questionObj, qId]);

  const submit = async (auto = false) => {
    setSubmitting(true);
    try {
      const persistTasks = questions.map((question) => {
        const id = question?._id || question;
        return saveAnswer(id, answers[id], flagged[id]);
      });
      await Promise.allSettled(persistTasks);

      const { data } = await api.post(`/exam/session/${sessionId}/submit`, { auto });
      releaseFullScreen();
      const submittedResultId = data?.result?._id;
      if (submittedResultId) {
        navigate(`/results/${testId}/${submittedResultId}/review`);
      } else {
        navigate(`/results/${testId}`);
      }
    } catch (e) { setError('Submission failed. Please try again.'); setSubmitting(false); }
  };

  const onExpire = useCallback(() => submit(true), [sessionId]);

  const openSubmitReview = () => {
    setFinalSubmitStep(false);
    setShowConfirm(true);
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6 animate-bounce">
          <BookOpen className="w-8 h-8 text-primary-500" />
        </div>
        <p className={`font-black uppercase tracking-widest text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading Exam Data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="card text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary mt-6 px-8">Retry Connection</button>
      </div>
    </div>
  );

  const answeredCount = Object.keys(answers).filter(k => {
    const ans = answers[k];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'object' && ans.code !== undefined) return ans.code.trim() !== '';
    return ans !== '' && ans !== undefined && ans !== null;
  }).length;
  const flaggedCount = Object.keys(flagged).filter(k => flagged[k]).length;

  const getAnswerPreview = (answer) => {
    if (answer === undefined || answer === null || answer === '') return 'Not answered';
    if (Array.isArray(answer)) return answer.length ? answer.join(', ') : 'Not answered';
    if (typeof answer === 'object' && answer.code !== undefined) {
      const lang = (answer.language || 'code').toUpperCase();
      const code = String(answer.code || '').trim();
      if (!code) return 'Not answered';
      const firstLine = code.split('\n').find(Boolean) || '';
      return `${lang}: ${firstLine.substring(0, 80)}${firstLine.length > 80 ? '...' : ''}`;
    }
    const text = String(answer).trim();
    return text ? `${text.substring(0, 100)}${text.length > 100 ? '...' : ''}` : 'Not answered';
  };

  return (
    <div className={`h-screen flex flex-col transition-colors overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Header (Fixed) */}
      <div className={`shrink-0 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b transition-colors pt-[calc(0.75rem+var(--safe-top))] ${isDark ? 'bg-gray-900 border-gray-800 shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/20 text-xs md:text-base">
            {test?.subject?.charAt(0) || 'E'}
          </div>
          <div className="flex flex-col">
            <h1 className={`font-black text-[10px] md:text-sm uppercase tracking-wider leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{test?.title?.substring(0, 15)}{test?.title?.length > 15 ? '...' : ''}</h1>
            <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-tighter mt-1">{test?.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Timer startTime={session?.startTime} duration={test?.duration || 30} expiryDate={test?.expiryDate} onExpire={onExpire} />
          <button onClick={openSubmitReview} className="hidden xs:block btn-primary py-2 px-3 md:px-6 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 transition-transform active:scale-95" disabled={submitting}>
            {submitting ? '...' : 'Submit'}
          </button>
          <button onClick={() => setShowPalette(true)} className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Central Content (Row for Question + Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Question + Footer */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Question Scroll Area */}
          <div className="flex-1 overflow-y-auto hide-scrollbar bg-slate-50/50 dark:bg-gray-900/20">
            <div className="w-full border-b bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20">
                  Q{current + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {questionObj?.type?.replace('-', ' ')}
                  </span>
                  {questionObj?.type === 'mcq-multi' && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded bg-primary-500/10 text-primary-500 border border-primary-500/20 uppercase tracking-widest animate-pulse">
                      Select all that apply
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Marks</span>
                   <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>+{questionObj?.marks || 1} / -0</span>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-8 flex flex-col items-center">
              {/* Progress (Mini) */}
              <div className="mb-6 w-full max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto flex items-center gap-4">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div className="bg-primary-500 h-full transition-all duration-500" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                </div>
                <span className="text-[10px] font-black text-gray-400 whitespace-nowrap uppercase tracking-widest">{Math.round((answeredCount / questions.length) * 100)}% Complete</span>
              </div>

              {/* Question Card */}
              <div className={`w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto card p-4 md:p-5 space-y-3 md:space-y-4 shadow-xl transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-slate-200/50'}`}>
                <div className="flex items-start justify-between gap-4 md:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {questionObj?.marks || 1} M
                      </span>
                      {flagged[qId] && (
                        <span className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                          <Flag className="w-2.5 h-2.5 fill-current" /> Flagged
                        </span>
                      )}
                    </div>
                    <p className={`text-base md:text-xl font-bold leading-tight whitespace-pre-wrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {questionObj?.text || 'Loading...'}
                    </p>
                  </div>
                  <button onClick={() => toggleFlag(qId)} className={`p-2.5 md:p-3 rounded-xl transition-all shrink-0 border group ${
                    flagged[qId] 
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10' 
                      : `${isDark ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-slate-50 border-slate-200 text-slate-400'} hover:text-amber-500 hover:border-amber-500/30`
                  }`}>
                    <Flag className={`w-4 h-4 md:w-5 md:h-5 ${flagged[qId] ? 'fill-current' : ''} group-hover:scale-110 transition-transform`} />
                  </button>
                </div>


                {/* Answer Options */}
                <div className="space-y-3">
                  {questionObj?.type === 'true-false' && ['True', 'False'].map(opt => (
                    <button key={opt} onClick={() => handleAnswer(qId, opt)}
                      className={`w-full text-left p-2.5 md:p-3 rounded-xl transition-all flex items-center justify-between group active:scale-[0.99] ${
                        answers[qId] === opt 
                          ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm' 
                          : `${isDark ? 'bg-gray-800/30 text-gray-400' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`
                      }`}>
                      <span className="text-sm font-bold">{opt}</span>
                      <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        answers[qId] === opt ? 'bg-primary-500 border-primary-500 scale-110 shadow-lg shadow-primary-500/30' : 'border-gray-300 dark:border-gray-700'
                      }`}>
                        {answers[qId] === opt && <Check className="w-3 h-3 text-white font-black" />}
                      </div>
                    </button>
                  ))}
                  {(questionObj?.type === 'mcq-single' || questionObj?.type === 'mcq-multi') && 
                    (shuffledOptionsMap[qId] || questionObj?.options || [])
                    .filter(opt => opt && opt.trim() !== '')
                    .map((opt, oi) => {
                      const isSelected = questionObj?.type === 'mcq-multi'
                        ? normalizeMultiAnswer(answers[qId]).includes(opt)
                        : answers[qId] === opt;
                      const isMulti = questionObj?.type === 'mcq-multi';
                      return (
                        <button key={oi} onClick={() => {
                          if (isMulti) {
                            toggleMultiAnswer(qId, opt);
                          } else {
                            handleAnswer(qId, opt);
                          }
                        }}
                          className={`w-full text-left p-2.5 md:p-3 rounded-xl transition-all flex items-center gap-3 md:gap-4 group active:scale-[0.99] ${
                            isSelected 
                              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm' 
                              : `${isDark ? 'bg-gray-800/30 text-gray-400' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`
                          }`}>
                          <div className={`w-4 h-4 md:w-5 md:h-5 rounded-${isMulti ? 'sm' : 'full'} border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-primary-500 border-primary-500 scale-105' : 'border-gray-300 dark:border-gray-700'
                          }`}>
                            {isSelected && (
                              isMulti 
                                ? <Check className="w-2.5 md:w-3 h-2.5 md:h-3 text-white font-black" />
                                : <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-white rounded-full shadow-inner" />
                            )}
                          </div>
                          <span className="flex-1 text-sm font-bold">{opt}</span>
                        </button>
                      );
                    })}
                  {(questionObj?.type === 'short-answer' || questionObj?.type === 'fill-blank') && (
                    <div className="pt-2">
                      <input className={`input text-lg py-4 px-6 transition-all border-2 rounded-2xl ${
                        isDark ? 'bg-gray-900 border-gray-800 focus:border-primary-500' : 'bg-slate-50 border-gray-100 focus:border-primary-500 focus:bg-white text-slate-900'
                      }`}
                        placeholder={questionObj?.type === 'fill-blank' ? 'Type the missing word...' : 'Type your answer here...'}
                        value={answers[qId] || ''}
                        onChange={e => handleAnswer(qId, e.target.value)} />
                    </div>
                  )}
                  {questionObj?.type === 'coding' && (
                    <div className="space-y-4">
                      {/* Coding logic remains the same but with better styling */}
                      <div className="flex items-center justify-between gap-3">
                        <select className="input w-48 text-sm py-2 bg-gray-900 border-gray-800" 
                          value={answers[qId]?.language || questionObj?.allowedLanguages?.[0] || 'javascript'}
                          onChange={e => {
                            const lang = e.target.value;
                            const currentCode = answers[qId]?.code || '';
                            const nextCode = currentCode.trim() === '' ? (TEMPLATES[lang] || '') : currentCode;
                            handleAnswer(qId, { code: nextCode, language: lang });
                          }}>
                          {(questionObj?.allowedLanguages || ['javascript', 'python', 'java', 'cpp']).map(l => (
                            <option key={l} value={l}>{l.toUpperCase()}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleRunCode(qId, answers[qId]?.code, answers[qId]?.language || questionObj?.allowedLanguages?.[0] || 'javascript')}
                          disabled={running || !answers[qId]?.code}
                          className="btn-primary py-2 px-6 text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-600/20"
                        >
                          <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
                          {running ? 'Running...' : 'Run Code'}
                        </button>
                      </div>
                      <textarea className="input font-mono text-sm min-h-[400px] resize-y bg-[#0d1117] border-gray-800 text-gray-200 p-4 focus:ring-1 focus:ring-primary-500/50" 
                        placeholder="Write your code here..."
                        spellCheck="false"
                        value={answers[qId]?.code || ''}
                        onChange={e => handleAnswer(qId, { ...(answers[qId] || { language: questionObj?.allowedLanguages?.[0] || 'javascript' }), code: e.target.value })} />
                      
                      {/* Manual Input Section */}
                      <div className="p-5 rounded-2xl border border-gray-800 bg-gray-900/30">
                        <label className="flex items-center gap-2 cursor-pointer mb-4 group w-fit">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-primary-500 focus:ring-primary-500/20 transition-all group-hover:border-primary-500/50" 
                            checked={useManualInput} onChange={e => setUseManualInput(e.target.checked)} />
                          <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-300 uppercase tracking-widest transition-colors">Use Custom Test Input</span>
                        </label>
                        {useManualInput && (
                          <textarea className="input font-mono text-xs min-h-[100px] bg-black/40 border-gray-800 text-gray-300 w-full focus:bg-black/60 transition-all" 
                            placeholder="Enter input to pass to your program (stdin)..."
                            value={manualInputText} onChange={e => setManualInputText(e.target.value)} />
                        )}
                      </div>
                      
                      {/* Execution Results */}
                      {runResults && (
                        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                          <div className="bg-gray-800/30 px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-primary-400" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Console Output</span>
                          </div>
                          <div className="p-5 space-y-5">
                            {runResults.map((r, ri) => (
                              <div key={ri} className={`p-4 rounded-xl border-l-4 ${r.isDryRun ? (r.error ? 'bg-red-950/10 border-red-600' : 'bg-blue-950/10 border-blue-600') : (r.isCorrect ? 'bg-emerald-950/10 border-emerald-600' : 'bg-red-950/10 border-red-600')}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{r.isDryRun ? 'Custom Input Result' : `Test Case ${ri + 1}`}</span>
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${r.isDryRun ? (r.error ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400') : (r.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}`}>
                                    {r.isDryRun ? (r.error ? 'ERROR' : 'SUCCESS') : (r.isCorrect ? 'PASSED' : 'FAILED')}
                                  </span>
                                </div>
                                {!r.isDryRun && (
                                  <div className="grid grid-cols-2 gap-6 text-[11px] mb-4">
                                    <div>
                                      <p className="text-gray-500 font-bold uppercase tracking-tighter mb-1.5 Municipality opacity-60">Input</p>
                                      <code className="bg-black/40 px-3 py-2 rounded-lg block border border-gray-800 shadow-inner">{r.input || '(empty)'}</code>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 font-bold uppercase tracking-tighter mb-1.5 opacity-60">Expected</p>
                                      <code className="bg-black/40 px-3 py-2 rounded-lg block border border-gray-800 shadow-inner">{r.expected}</code>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <p className="text-gray-500 font-bold uppercase tracking-tighter text-[10px] mb-1.5 opacity-60">{r.error ? 'Error Details' : 'Actual Output'}</p>
                                  <pre className={`p-3 rounded-lg text-xs font-mono whitespace-pre-wrap border ${r.error ? 'text-red-400 bg-red-950/20 border-red-900/30' : 'text-gray-300 bg-black/50 border-gray-800 shadow-inner'}`}>
                                    {r.error || r.actual || '(no output)'}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Navigation Footer */}
          <div className={`shrink-0 border-t p-4 md:px-8 flex items-center justify-between z-10 transition-colors pb-[calc(1rem+var(--safe-bottom))] md:pb-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-2xl'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0} 
                className={`btn-secondary py-3 px-6 md:px-8 text-[11px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 disabled:opacity-20 transition-all transform active:scale-95 ${
                  isDark ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-slate-50 border-gray-200 shadow-sm'
                }`}>
                <ChevronLeft className="w-4 h-4" /> <span>Previous</span>
              </button>
              <button 
                onClick={() => handleAnswer(qId, undefined)}
                className={`hidden lg:flex btn-secondary py-3 px-6 text-[10px] font-black uppercase tracking-widest items-center gap-2 border-dashed ${isDark ? 'text-gray-500 border-gray-800' : 'text-slate-400 border-slate-200'}`}
              >
                <X className="w-3.5 h-3.5" /> Clear Response
              </button>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-0.5">Next up</span>
                <span className={`text-xs font-bold truncate max-w-[200px] ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                  {current < questions.length - 1 
                    ? `Q${current + 2}: ${test?.questions?.find(x => (x._id || x) === (questions[current+1]?._id || questions[current+1]))?.text?.substring(0,35)}...` 
                    : 'Final Submission'}
                </span>
              </div>
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(p => p + 1)} className="btn-primary py-3 px-8 md:px-10 text-[11px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 shadow-2xl shadow-primary-600/30 transition-all transform active:scale-95">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={openSubmitReview} className="btn-primary py-3 px-8 md:px-10 text-[11px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-none shadow-2xl shadow-emerald-600/30 transition-all transform active:scale-95">
                  <Check className="w-4 h-4 font-black" /> Submit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar (Fixed Desktop, Responsive Drawer Mobile) */}
        <div className={`fixed inset-0 z-50 md:relative md:inset-auto md:flex w-full md:w-80 shrink-0 border-l transition-all duration-300 h-full ${showPalette ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} ${isDark ? 'bg-[#0f172a] border-gray-800' : 'bg-slate-50 border-gray-200'}`}>
          {showPalette && <div className="absolute inset-0 bg-black/60 md:hidden" onClick={() => setShowPalette(false)} />}
          
          <div className={`relative w-72 h-full ml-auto md:ml-0 md:w-full flex flex-col overflow-hidden shadow-2xl md:shadow-none ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            <div className={`p-4 md:p-6 border-b transition-colors flex items-center justify-between ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500" />
                </div>
                <h3 className={`text-[10px] md:text-[11px] font-black uppercase tracking-[2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>Navigation</h3>
              </div>
              <button onClick={() => setShowPalette(false)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-2.5 mb-10">
                {questions.map((q, i) => {
                  const id = q?._id || q;
                  const answered = answers[id] !== undefined && answers[id] !== '' &&
                    !(Array.isArray(answers[id]) && answers[id].length === 0) &&
                    !(typeof answers[id] === 'object' && answers[id].code !== undefined && answers[id].code.trim() === '');
                  const flag = flagged[id];
                  const isActive = i === current;
                  
                  return (
                    <button key={i} onClick={() => { setCurrent(i); setShowPalette(false); }}
                      className={`aspect-square rounded-xl text-[10px] md:text-xs font-black transition-all border-2 flex items-center justify-center relative group ${
                        isActive 
                          ? 'border-primary-500 bg-primary-500 text-white shadow-xl shadow-primary-500/40 z-10 scale-105' :
                        flag 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        answered 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        `${isDark ? 'border-gray-800/80 bg-gray-900/40 text-gray-500' : 'border-gray-200 bg-white text-slate-400'}`
                      }`}>
                      {i + 1}
                      {flag && <div className="absolute -top-1 -right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-gray-950" />}
                      {answered && !flag && !isActive && <div className="absolute -bottom-1 -right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-950" />}
                    </button>
                  );
                })}
              </div>

              <div className={`space-y-3 md:space-y-4 pt-6 md:pt-8 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <h4 className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Legend</h4>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className={`flex items-center gap-1.5 p-1.5 md:p-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
                    <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Done</span>
                  </div>
                  <div className={`flex items-center gap-1.5 p-1.5 md:p-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> 
                    <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Flag</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`p-4 md:p-5 transition-colors ${isDark ? 'bg-gray-900/80 border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
               <div className={`rounded-2xl p-3 md:p-4 border transition-colors ${isDark ? 'bg-black/40 border-gray-800/50' : 'bg-slate-50 border-slate-100'}`}>
                  <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-2 md:mb-3 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Session</p>
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex justify-between items-center text-[10px] md:text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">NAME</span>
                      <span className={`font-black truncate max-w-[120px] ${isDark ? 'text-white' : 'text-primary-600'}`}>
                        {session?.student?.name || '...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] md:text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">ROLL</span>
                      <span className={`font-mono font-bold ${isDark ? 'text-primary-400' : 'text-slate-700'}`}>
                        {session?.student?.rollNo || '—'}
                      </span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Exam Gateway Modal */}
      {!hasStarted && (
        <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-[100] p-6">
          <div className="card max-w-lg w-full text-center space-y-6 shadow-2xl border-primary-500/20">
            <div className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Start?</h2>
              <p className="text-gray-400">Please ensure you are in a quiet place. This exam will be conducted in **full-screen mode**. Malpractice detection is active.</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Exam Rules
              </h4>
              <ul className="text-xs text-amber-200/70 space-y-1.5 list-disc pl-4">
                <li>Do not exit full-screen mode</li>
                <li>Do not switch tabs or minimize the window</li>
                <li>Ensure a stable internet connection</li>
              </ul>
            </div>
            <button onClick={() => { setHasStarted(true); enterFullScreen(); }} 
              className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary-600/30">
              Enter Full-screen & Start
            </button>
          </div>
        </div>
      )}

      {/* Malpractice Warning Modal */}
      {hasStarted && !isFullScreen && !submitting && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[110] p-6">
          <div className="card max-w-md w-full text-center space-y-6 border-red-500/30 shadow-2xl shadow-red-500/20">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">MALPRACTICE WARNING</h2>
              <p className="text-red-400 font-medium">You have exited full-screen mode!</p>
              <p className="text-gray-400 text-sm mt-3">Exiting full-screen is recorded as potential malpractice. Please return to full-screen immediately to continue your exam.</p>
              {exitCount > 0 && <p className="text-xs text-red-500/60 mt-2 uppercase tracking-widest font-bold">Exit detected {exitCount} time(s)</p>}
            </div>
            <button onClick={enterFullScreen} 
              className="btn-primary bg-red-600 hover:bg-red-700 border-red-500 w-full py-3">
              RE-ENTER FULL-SCREEN
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Saved Answers Review</h2>
              <p className="text-gray-400 text-sm mt-1">
                You've answered <strong className="text-white">{answeredCount}</strong> of <strong className="text-white">{questions.length}</strong> questions.
                {answeredCount < questions.length && <span className="block text-amber-400 mt-1">{questions.length - answeredCount} question(s) unanswered.</span>}
              </p>
            </div>

            <div className="mb-5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Question Review</p>
              <div className="grid grid-cols-8 gap-2 max-h-36 overflow-y-auto pr-1">
                {questions.map((question, i) => {
                  const id = question?._id || question;
                  const ans = answers[id];
                  const attended = ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0) && !(typeof ans === 'object' && ans?.code !== undefined && ans.code.trim() === '');
                  return (
                    <button
                      key={id || i}
                      onClick={() => { setCurrent(i); setShowConfirm(false); }}
                      className={`h-8 rounded-lg text-[10px] font-black border transition-all ${attended ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Saved Answers</p>
              <div className="max-h-44 overflow-y-auto pr-1 space-y-2">
                {questions.map((question, i) => {
                  const id = question?._id || question;
                  const ans = answers[id];
                  const preview = getAnswerPreview(ans);
                  const attended = preview !== 'Not answered';
                  const qObj = Array.isArray(test?.questions) ? test.questions.find(x => (x._id || x) === id) : null;
                  return (
                    <div
                      key={`saved-${id || i}`}
                      className={`rounded-xl border p-2.5 text-left ${attended ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-700 bg-gray-800/40'}`}
                    >
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Q{i + 1}
                      </p>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        {qObj?.text ? `${qObj.text.substring(0, 70)}${qObj.text.length > 70 ? '...' : ''}` : 'Question'}
                      </p>
                      <p className={`text-[11px] mt-1.5 ${attended ? 'text-emerald-300' : 'text-gray-500'}`}>
                        {preview}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowConfirm(false); setFinalSubmitStep(false); }} className="btn-secondary flex-1">Review</button>
              {answeredCount < questions.length ? (
                <button
                  onClick={() => {
                    const firstUnansweredIndex = questions.findIndex((question) => {
                      const id = question?._id || question;
                      const ans = answers[id];
                      return ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'object' && ans?.code !== undefined && ans.code.trim() === '');
                    });
                    setShowConfirm(false);
                    if (firstUnansweredIndex >= 0) setCurrent(firstUnansweredIndex);
                  }}
                  className="btn-primary flex-1"
                >
                  Attempt All Questions
                </button>
              ) : !finalSubmitStep ? (
                <button onClick={() => setFinalSubmitStep(true)} className="btn-primary flex-1">
                  Proceed to Final Submit
                </button>
              ) : (
                <button onClick={() => submit(false)} disabled={submitting} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-500">
                  {submitting ? 'Submitting...' : 'Final Submit'}
                </button>
              )}
            </div>
            {finalSubmitStep && answeredCount === questions.length && (
              <p className="text-[11px] text-emerald-400 text-center mt-3">Step 2 ready. Click Final Submit to open results page (summary only).</p>
            )}
            {answeredCount < questions.length && (
              <p className="text-[11px] text-amber-400 text-center mt-3">Final submit is available only after all questions are attended.</p>
            )}
            {finalSubmitStep && answeredCount === questions.length && (
              <button
                onClick={() => setFinalSubmitStep(false)}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-200 uppercase tracking-wider mt-2 w-full"
              >
                Back to Attempt Step
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
