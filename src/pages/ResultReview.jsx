import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, CircleHelp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

function renderAnswer(value) {
  if (value === undefined || value === null || value === '') {
    return <p className="text-sm font-semibold opacity-70">Not answered</p>;
  }

  if (Array.isArray(value)) {
    if (!value.length) return <p className="text-sm font-semibold opacity-70">Not answered</p>;
    return (
      <ul className="list-disc pl-5 space-y-1 text-sm font-semibold">
        {value.map((item, idx) => (
          <li key={idx} className="whitespace-pre-wrap">{String(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    return (
      <pre className="text-xs whitespace-pre-wrap rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 p-3 overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  const text = String(value).trim();
  if (!text) return <p className="text-sm font-semibold opacity-70">Not answered</p>;
  if (text.includes('\n')) {
    return (
      <pre className="text-sm font-semibold whitespace-pre-wrap rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 p-3 overflow-x-auto">
        {text}
      </pre>
    );
  }

  return <p className="text-sm font-semibold whitespace-pre-wrap">{text}</p>;
}

function AnswerBlock({ title, value, isCorrectBlock = false, isWrongBlock = false }) {
  const classes = isCorrectBlock
    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
    : isWrongBlock
      ? 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300'
      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300';

  const isCode = value && typeof value === 'object' && value.code !== undefined;

  return (
    <div className={`rounded-xl border p-3 ${classes}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">{title}</p>
      {isCode ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
            Language: {String(value.language || 'unknown').toUpperCase()}
          </p>
          <pre className="text-xs whitespace-pre-wrap rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 p-3 overflow-x-auto">
            {String(value.code || '').trim() || 'No code submitted'}
          </pre>
        </div>
      ) : (
        renderAnswer(value)
      )}
    </div>
  );
}

export default function ResultReview() {
  const { testId, resultId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/exam/result/${testId}`)
      .then(({ data }) => {
        setResults(data.results || []);
      })
      .catch(() => {
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [testId]);

  const selected = useMemo(() => {
    if (!results.length) return null;
    return results.find((r) => String(r._id) === String(resultId)) || results[0];
  }, [results, resultId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'} font-semibold`}>Loading detailed review...</p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className={`card text-center p-8 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'} font-semibold`}>No detailed result available.</p>
          <button onClick={() => navigate(`/results/${testId}`)} className="btn-primary mt-5 px-8">Back to Results</button>
        </div>
      </div>
    );
  }

  const analysis = selected.questionAnalysis || [];

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`rounded-2xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-xl shadow-slate-200/50'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-2">Detailed Review</p>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selected.test?.title || 'Exam Review'}</h1>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              Attempt {selected.attemptNumber || 1} • Score {Number(selected.score || 0).toFixed(1)}/{Number(selected.totalMarks || 0).toFixed(1)} • {Number(selected.percentage || 0).toFixed(1)}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/results/${testId}`)} className="btn-secondary px-5 py-2.5 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {analysis.map((item, index) => {
          const question = item.question || {};
          const isCorrect = Boolean(item.isCorrect);

          return (
            <div
              key={index}
              className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-lg shadow-slate-200/40'}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Question {index + 1}</p>
                  <p className={`text-base font-bold whitespace-pre-wrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {question.text || 'Question text unavailable'}
                  </p>
                </div>
                <div className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  isCorrect
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </div>
              </div>

              <div className="space-y-3">
                <AnswerBlock title="Your Response" value={item.studentAnswer} isWrongBlock={!isCorrect} />
                <AnswerBlock title="Correct Answer" value={item.correctAnswer} isCorrectBlock />
              </div>

              <div className={`mt-3 text-xs font-bold flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <CircleHelp className="w-4 h-4" />
                Marks: {Number(item.marksAwarded || 0).toFixed(1)} / {Number(item.maxMarks || 0).toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
