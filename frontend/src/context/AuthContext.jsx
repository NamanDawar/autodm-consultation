import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('https://autodm-backend-u93h.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setCreator(res.data))
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
}

export function useAuth() {
  return useContext(AuthContext);
}
