import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/index.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setCreator(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, creatorData) => {
    localStorage.setItem('token', token);
    setCreator(creatorData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setCreator(null);
  };

  return (
    <AuthContext.Provider value={{ creator, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);