import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('s_theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    root.classList.remove('dark');
    body.classList.remove('dark', 'light-theme', 'dark-theme');
    
    if (theme === 'light') {
      body.classList.add('light-theme');
    } else {
      body.classList.add('dark-theme', 'dark');
      root.classList.add('dark');
    }
    localStorage.setItem('s_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
