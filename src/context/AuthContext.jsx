import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('student_user');
      return u ? JSON.parse(u) : null;
    } catch {
      localStorage.removeItem('student_user');
      return null;
    }
  });

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const authUser = data?.user || data?.student || data?.data?.user;
      const authToken = data?.token || data?.accessToken || data?.data?.token;

      if (!authUser || typeof authUser !== 'object') {
        throw new Error(data?.message || 'Invalid user data received from server.');
      }
      
      const userRole = authUser.role || 'student';
      
      if (userRole !== 'student') {
        throw new Error('Access denied. Student portal requires student privileges.');
      }
      
      if (!authToken) {
        throw new Error('Authentication token is missing. Please try again.');
      }

      localStorage.setItem('student_token', authToken);
      localStorage.setItem('student_user', JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const loginWithRollNo = async (rollNo, password) => {
    try {
      const { data } = await api.post('/auth/login', { rollNo, password });
      const authUser = data?.user || data?.student || data?.data?.user;
      const authToken = data?.token || data?.accessToken || data?.data?.token;

      if (!authUser || typeof authUser !== 'object') {
        throw new Error(data?.message || 'Invalid user data received from server.');
      }
      
      const userRole = authUser.role || 'student';
      
      if (userRole !== 'student') {
        throw new Error('Access denied. Student portal requires student privileges.');
      }
      
      if (!authToken) {
        throw new Error('Authentication token is missing. Please try again.');
      }

      localStorage.setItem('student_token', authToken);
      localStorage.setItem('student_user', JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, loginWithRollNo, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
