import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, session, setCsrf, setUnauthorizedHandler } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    session().then((r) => setUser(r.user)).catch(() => setUser(null));
  }, []);

  const login = useCallback(async (username, password) => {
    const r = await api.post('auth/login', { username, password });
    setCsrf(r.csrf);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    try { setCsrf((await api.post('auth/logout')).csrf); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
