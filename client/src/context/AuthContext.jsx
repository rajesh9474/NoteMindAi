import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('notemind_token');
    const savedUser = localStorage.getItem('notemind_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem('notemind_token', tokenValue);
    localStorage.setItem('notemind_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('notemind_token');
    localStorage.removeItem('notemind_user');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
