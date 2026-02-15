import React, { useState } from "react";
import SIKERMA from "../assets/SIKERMA.png";

const Login = ({ onSuccess }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Login gagal");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onSuccess) onSuccess(data.user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      background: "linear-gradient(135deg, #e6f7fb 0%, #f0f8ff 100%)",
      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    card: {
      width: "100%",
      maxWidth: 450,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      overflow: "hidden",
    },
    topBar: {
      height: 4,
      background: "#07b8af",
    },
    inner: { padding: 20 },
    header: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginBottom: 18,
    },
    logo: {
      height: 150,
      width: "auto",
      objectFit: "contain",
    },
    title: {
      margin: 0,
      fontSize: 15,
      fontWeight: 600,
      color: "#00336C",
      letterSpacing: "-0.2px",
      lineHeight: 1.2,
    },
    subtitle: {
      margin: 0,
      marginTop: 0,
      fontSize: 15,
      color: "#64748b",
      fontWeight: 500,
      lineHeight: 1.4,
    },
    alert: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 8,
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.20)",
      color: "#991b1b",
      marginBottom: 14,
    },
    alertIcon: { fontSize: 16, lineHeight: 1.2, marginTop: 2 },
    form: { display: "grid", gap: 16 },
    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "#00336C",
      marginBottom: 8,
      letterSpacing: "0.2px",
    },
    fieldWrap: { display: "grid" },
    input: (disabled) => ({
      width: "100%",
      padding: "12px 14px",
      borderRadius: 8,
      border: "1px solid #cbd5e1",
      background: disabled ? "#f8fafc" : "#fff",
      color: "#0f172a",
      fontSize: 14,
      fontWeight: 500,
      outline: "none",
      transition: "border-color .2s",
    }),
    helperRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      marginBottom: 2,
    },
    hint: { fontSize: 12, color: "#64748b", fontWeight: 500 },
    btn: (disabled) => ({
      width: "100%",
      border: "none",
      borderRadius: 8,
      padding: "12px 14px",
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "#e2e8f0" : "#07b8af",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: "0.2px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      transition: "background .2s, transform .15s",
    }),
    spinner: {
      width: 18,
      height: 18,
      borderRadius: 999,
      border: "3px solid rgba(255,255,255,0.35)",
      borderTop: "3px solid rgba(255,255,255,0.95)",
      animation: "spin 1s linear infinite",
    },
    footer: {
      padding: "16px 28px",
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "center",
      color: "#64748b",
      fontSize: 13,
      fontWeight: 500,
    },
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        input:focus {
          border-color: #07b8af !important;
          box-shadow: 0 0 0 4px rgba(7, 184, 175, 0.15) !important;
        }
        button:hover {
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        @media (max-width: 480px) {
          .login-inner { padding: 22px !important; }
        }
      `}</style>

      <div style={s.card}>
        <div style={s.topBar} />

        <div className="login-inner" style={s.inner}>
          <div style={s.header}>
            <img src={SIKERMA} alt="SIKERMA" style={s.logo} />
            <p style={s.subtitle}>Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div style={s.alert}>
              <div style={s.alertIcon}>⚠️</div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.fieldWrap}>
              <label htmlFor="username" style={s.label}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Masukkan username"
                disabled={loading}
                style={s.input(loading)}
              />
              <div style={s.helperRow}>
                <span style={s.hint}>Gunakan akun yang terdaftar</span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>*</span>
              </div>
            </div>

            <div style={s.fieldWrap}>
              <label htmlFor="password" style={s.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Masukkan password"
                disabled={loading}
                style={s.input(loading)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={s.btn(loading)}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#06a79d";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#07b8af";
                }
              }}
            >
              {loading ? (
                <>
                  <span style={s.spinner} />
                  Memproses...
                </>
              ) : (
                <>Masuk</>
              )}
            </button>
          </form>
        </div>

        <div style={s.footer}>© {new Date().getFullYear()} SIKERMA • BLSDM Komdigi Manado</div>
      </div>
    </div>
  );
};

export default Login;