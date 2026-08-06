import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const loginMember = useCallback(async (credentials) => {
    const res = await authService.loginMember(credentials);
    persistSession(res.data);
    return res.data;
  }, []);

  const loginAdmin = useCallback(async (credentials) => {
    const res = await authService.loginAdmin(credentials);
    persistSession(res.data);
    return res.data;
  }, []);

  // Used after registration Step 1 auto-login, and whenever we get a fresh
  // {token, user} pair back from an endpoint other than the login screens.
  const establishSession = useCallback((sessionData) => {
    persistSession(sessionData);
  }, []);

  function persistSession({ token, user: sessionUser }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Merges a partial update (e.g. { registration_step: 3 }) into the
  // stored user and persists it — used as each wizard step advances.
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, loginMember, loginAdmin, establishSession, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
