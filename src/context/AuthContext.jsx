import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

// ✅ Backend base URL (uses Vite env if present)
const API =
  import.meta?.env?.VITE_API_URL?.trim() ||
  "http://localhost:5000";

const SESSION_KEY = "rb_session_v2"; // ✅ new key (token-based)

/**
 * Session shape stored in localStorage:
 * {
 *   token: string,
 *   user: { id, name, email }
 * }
 */

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-json response
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // ✅ Load session on refresh
  useEffect(() => {
    const session = readSession();
    if (session?.token && session?.user) {
      setToken(session.token);
      setUser(session.user);
    } else {
      setToken(null);
      setUser(null);
    }
  }, []);

  // ✅ Register via backend (MongoDB)
  const register = async (payload) => {
    // payload: { name, email, password }
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: payload,
    });

    // Expect backend returns: { token, user }
    const nextToken = data?.token;
    const nextUser = data?.user;

    if (!nextToken || !nextUser) {
      throw new Error(
        "Register failed: API response missing token/user. Check backend /api/auth/register response."
      );
    }

    const session = { token: nextToken, user: nextUser };
    writeSession(session);

    setToken(nextToken);
    setUser(nextUser);

    return nextUser;
  };

  // ✅ Login via backend (MongoDB)
  const login = async (payload) => {
    // payload: { email, password }
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: payload,
    });

    // Expect backend returns: { token, user }
    const nextToken = data?.token;
    const nextUser = data?.user;

    if (!nextToken || !nextUser) {
      throw new Error(
        "Login failed: API response missing token/user. Check backend /api/auth/login response."
      );
    }

    const session = { token: nextToken, user: nextUser };
    writeSession(session);

    setToken(nextToken);
    setUser(nextUser);

    return nextUser;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  // ✅ Helper: components can call authorized requests easily
  const authedFetch = async (path, { method = "GET", body } = {}) => {
    if (!token) throw new Error("Not authenticated");
    return apiRequest(path, { method, body, token });
  };

  const value = useMemo(
    () => ({
      user,
      token,
      register,
      login,
      logout,
      authedFetch, // ✅ use this for /api/resume/me etc.
      API,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
