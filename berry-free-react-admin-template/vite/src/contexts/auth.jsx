import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, register as apiRegister, me as apiMe, logout as apiLogout } from 'api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'auth';

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function writeStorage(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth || {}));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStorage());
  const [user, setUser] = useState(() => auth?.user || null);
  const [token, setToken] = useState(() => auth?.token || null);
  const [sessionId, setSessionId] = useState(() => auth?.session_id || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) writeStorage({ token, user, session_id: sessionId });
    else clearStorage();
  }, [token, user, sessionId]);

  async function hydrate() {
    if (!token) return;
    try {
      const res = await apiMe();
      setUser(res?.user || null);
    } catch (_) {
      // token invalid
      setToken(null);
      setUser(null);
      setSessionId(null);
    }
  }

  useEffect(() => {
    // hydrate on mount if token present
    if (token && !user) hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signin(email, password) {
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setToken(res?.token || null);
      setUser(res?.user || null);
      setSessionId(res?.session_id || null);
      return res;
    } finally {
      setLoading(false);
    }
  }

  async function signup(payload) {
    setLoading(true);
    try {
      // First, register the user
      const registerResponse = await apiRegister(payload);
      
      // If we have a FormData, we can't auto-login as we don't have the password in plain text
      if (payload instanceof FormData) {
        // Return the register response and let the component handle redirection to login
        return registerResponse;
      } else {
        // For regular JSON payloads, we can try to auto-login
        if (payload.email && payload.password) {
          const loginResponse = await apiLogin(payload.email, payload.password);
          setToken(loginResponse?.token || null);
          setUser(loginResponse?.user || null);
          setSessionId(loginResponse?.session_id || null);
          return loginResponse;
        }
        return registerResponse;
      }
    } finally {
      setLoading(false);
    }
  }

  async function signout() {
    try {
      await apiLogout();
    } catch (_) {}
    setToken(null);
    setUser(null);
    setSessionId(null);
  }

  const value = useMemo(() => ({ user, token, sessionId, loading, signin, signup, signout }), [user, token, sessionId, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
