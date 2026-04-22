import { useEffect, useState } from 'react';
import { User, Mail, BookOpen, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Profile() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exam/result/all')
      .then(({ data }) => setResults(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const passCount = results.filter(r => r.passed).length;
  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          My <span className="text-primary-600 dark:text-primary-400">Profile</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mt-2 font-medium">Manage your account and track your academic standing</p>
      </header>

      <div className="glass rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-indigo-600/5" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary-500/20 group-hover:scale-105 transition-transform duration-500">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-gray-950 rounded-full flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{user?.name}</h2>
              <span className="inline-flex px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 w-fit mx-auto md:mx-0">
                Active Student
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 font-medium">
                <Mail className="w-4 h-4 text-primary-500" />
                {user?.email}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 font-medium">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Roll No: {user?.rollNo || user?.rollno || 'Not available'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass rounded-2xl p-6 border border-gray-200 dark:border-gray-800 text-center hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{results.length}</p>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">Tests Attempted</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-gray-200 dark:border-gray-800 text-center hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{avgScore}%</p>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">Average Accuracy</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-gray-200 dark:border-gray-800 text-center hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{passCount}</p>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">Exams Passed</p>
        </div>
      </div>
    </div>
  );
}
