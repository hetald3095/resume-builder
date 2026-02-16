import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("Name is required");
    if (!form.email.includes("@")) return setErr("Enter a valid email");
    if (form.password.length < 6)
      return setErr("Password must be at least 6 chars");

    setLoading(true);
    try {
      // ✅ IMPORTANT: register is async now (calls backend), so MUST await
      await register(form);

      nav("/", { replace: true });
    } catch (e) {
      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Create account</h1>
        <p style={styles.sub}>Save and access your resumes anytime</p>

        {err ? <div style={styles.err}>{err}</div> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
          <label style={styles.label}>Full name</label>
          <input
            style={styles.input}
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Ravi Soni"
            required
            autoComplete="name"
          />

          <label style={{ ...styles.label, marginTop: 10 }}>Email</label>
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
            placeholder="Min 6 chars"
            required
            autoComplete="new-password"
          />

          <button style={styles.btn} disabled={loading} type="submit">
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login">Login</Link>
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
