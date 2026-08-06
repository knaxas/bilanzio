import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { buildApiUrl } from "../config/api";
import BackgroundLayout from "../components/BackgroundLayout";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server lieferte kein JSON (Status ${response.status}). Antwort: ${text.slice(0, 100)}...`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Anmeldung fehlgeschlagen");
      }

      onLoginSuccess(data.user, data.token);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BackgroundLayout>
      <style>{keyframeStyles}</style>

      <div style={styles.centerWrapper}>
        <div style={styles.card} className="card-animated">
          <div style={styles.headerContainer}>
            <div style={styles.logoBadge}>💎</div>
            <h2 style={styles.title}>Willkommen zurück</h2>
            <p style={styles.subtitle}>Melde dich an, um deine Finanzen zu verwalten</p>
          </div>

          {error && <div style={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="username" style={styles.label}>
                Benutzername
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="z.B. max_mustermann"
                style={styles.input}
                className="form-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={styles.input}
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.button,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
              className="primary-btn"
            >
              {submitting ? "Melde an..." : "Anmelden"}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Noch kein Konto?{" "}
              <Link to="/register" style={styles.link}>
                Registrieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </BackgroundLayout>
  );
}

const keyframeStyles = `
  @keyframes cardEntrance {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.25), 0 20px 50px rgba(0, 0, 0, 0.8);
    }
    50% {
      box-shadow: 0 0 45px rgba(212, 175, 55, 0.45), 0 20px 50px rgba(0, 0, 0, 0.8);
    }
  }

  .card-animated {
    animation: cardEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards, pulseGlow 4s infinite ease-in-out;
  }

  .form-input {
    transition: all 0.25s ease !important;
    outline: none !important;
  }

  .form-input:focus {
    border-color: #d4af37 !important;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.35) !important;
    background-color: #08090d !important;
  }

  .primary-btn {
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5) !important;
    filter: brightness(1.1);
  }

  .primary-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98) !important;
  }
`;

const styles = {
  centerWrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none", // Damit Klicks im Hintergrund nicht blockiert werden
    zIndex: 10,
  },
  card: {
    pointerEvents: "auto", // Reaktivert Klicks auf der Card
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "rgba(14, 16, 22, 0.92)",
    backdropFilter: "blur(16px)",
    borderRadius: "24px",
    border: "1px solid rgba(212, 175, 55, 0.35)",
    padding: "2.5rem 2rem",
    boxSizing: "border-box",
  },
  headerContainer: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoBadge: {
    width: "52px",
    height: "52px",
    margin: "0 auto 1.25rem auto",
    borderRadius: "16px",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    border: "1px solid rgba(212, 175, 55, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    boxShadow: "0 0 15px rgba(212, 175, 55, 0.2)",
  },
  title: {
    margin: "0 0 0.5rem 0",
    color: "#f3f4f6",
    fontSize: "1.75rem",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: 0,
    color: "#8e95a5",
    fontSize: "0.875rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },
  label: {
    color: "#d4af37",
    fontSize: "0.725rem",
    fontWeight: "700",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "12px",
    backgroundColor: "#08090d",
    border: "1px solid rgba(212, 175, 55, 0.2)",
    color: "#ffffff",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "0.95rem",
    marginTop: "0.5rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%)",
    color: "#07080c",
    fontSize: "1rem",
    fontWeight: "800",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)",
  },
  errorMessage: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    marginBottom: "1.25rem",
    wordBreak: "break-word",
  },
  footer: {
    marginTop: "2rem",
    textAlign: "center",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    paddingTop: "1.25rem",
  },
  footerText: {
    margin: 0,
    color: "#8e95a5",
    fontSize: "0.875rem",
  },
  link: {
    color: "#d4af37",
    textDecoration: "none",
    fontWeight: "700",
  },
};