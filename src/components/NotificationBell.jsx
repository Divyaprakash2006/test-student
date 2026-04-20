import React, { useState, useRef, useEffect } from 'react';
import { HiBell, HiOutlineBell, HiCheckCircle, HiCalendar, HiAcademicCap, HiTrash } from 'react-icons/hi2';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'enrolled': return <HiAcademicCap className="w-5 h-5 text-primary-500" />;
      case 'test_created': return <HiCalendar className="w-5 h-5 text-violet-500" />;
      default: return <HiBell className="w-5 h-5 text-amber-500" />;
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-300 ${
          isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
        } ${isOpen ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
      >
        {unreadCount > 0 ? (
          <HiBell className={`w-6 h-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
        ) : (
          <HiOutlineBell className="w-6 h-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-600 border-2 border-white dark:border-gray-900 text-[10px] items-center justify-center text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden z-50 border transform origin-top-right transition-all duration-200 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => { markAllAsRead(); }}
                  className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <HiCheckCircle className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => { if (window.confirm('Clear all notifications?')) { clearNotifications(); setIsOpen(false); } }}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <HiTrash className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <HiBell className={`w-6 h-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => { if (!n.isRead) markAsRead(n._id); setIsOpen(false); }}
                  className={`px-4 py-4 border-b flex gap-3 cursor-pointer transition-colors ${
                    isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'
                  } ${!n.isRead ? (isDark ? 'bg-primary-500/5' : 'bg-primary-50') : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-gray-800' : 'bg-white shadow-sm'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className={`text-sm font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      <span className={`text-[10px] shrink-0 ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className={`px-4 py-3 text-center border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <button className={`text-xs font-semibold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              View all activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
