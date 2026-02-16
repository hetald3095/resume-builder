import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // ✅ IMPORTANT: login is async now (calls backend), so MUST await
      await login(form);

      nav("/", { replace: true });
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Login</h1>
        <p style={styles.sub}>Access your resume builder</p>

        {err ? <div style={styles.err}>{err}</div> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@email.com"
            required
            autoComplete="email"
          />

          <label style={{ ...styles.label, marginTop: 10 }}>Password</label>
          <input
            style={styles.input}
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <button style={styles.btn} disabled={loading} type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.footer}>
          Don’t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
  },
  h1: { margin: 0, fontSize: 24 },
  sub: { margin: "6px 0 0", color: "#6b7280", fontSize: 13 },
  label: {
    display: "block",
    fontSize: 12,
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
  },
  btn: {
    width: "100%",
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    fontWeight: 800,
    cursor: "pointer",
  },
  err: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#991b1b",
    fontSize: 13,
  },
  footer: { marginTop: 12, fontSize: 13, color: "#374151" },
};
