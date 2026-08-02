import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/api";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
        throw new Error(data.message || data.error || "Registrierung fehlgeschlagen.");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.pageBackground}>
      <style>{keyframeStyles}</style>

      <div style={styles.card}>
        <div style={styles.headerContainer}>
          <div style={styles.logoBadge}>✨</div>
          <h2 style={styles.title}>Konto erstellen</h2>
          <p style={styles.subtitle}>Werde Teil der Finanz-Community</p>
        </div>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>
              Benutzername (einmalig)
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="z.B. max_mustermann"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="displayName" style={styles.label}>
              Spitzname (Anzeigename)
            </label>
            <input
              id="displayName"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              placeholder="z.B. Max"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              Passwort
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              style={styles.input}
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
          >
            {submitting ? "Erstelle Konto..." : "Registrieren"}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Bereits ein Konto?{" "}
            <Link to="/login" style={styles.link}>
              Hier anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
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
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.25);
    }
    50% {
      box-shadow: 0 0 40px rgba(212, 175, 55, 0.4);
    }
  }

  input:focus {
    border-color: #d4af37 !important;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3) !important;
    outline: none !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4) !important;
    filter: brightness(1.05);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const styles = {
  pageBackground: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0e12",
    backgroundImage: `
      radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.05) 0%, transparent 40%)
    `,
    padding: "1.5rem",
    boxSizing: "border-box",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "rgba(22, 24, 31, 0.85)",
    backdropFilter: "blur(16px)",
    borderRadius: "20px",
    border: "1px solid rgba(212, 175, 55, 0.2)",
    padding: "2.5rem 2rem",
    boxSizing: "border-box",
    animation: "cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, pulseGlow 6s infinite ease-in-out",
  },
  headerContainer: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoBadge: {
    width: "50px",
    height: "50px",
    margin: "0 auto 1rem auto",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(255, 215, 0, 0.05) 100%)",
    border: "1px solid rgba(212, 175, 55, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
  },
  title: {
    margin: "0 0 0.5rem 0",
    color: "#f8f9fa",
    fontSize: "1.75rem",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: 0,
    color: "#a0a5b5",
    fontSize: "0.9rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#d4af37",
    fontSize: "0.85rem",
    fontWeight: "600",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "12px",
    backgroundColor: "rgba(10, 11, 15, 0.7)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    fontSize: "1rem",
    boxSizing: "border-box",
    transition: "all 0.25s ease",
  },
  button: {
    width: "100%",
    padding: "0.95rem",
    marginTop: "0.5rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%)",
    color: "#0d0e12",
    fontSize: "1rem",
    fontWeight: "700",
    letterSpacing: "0.3px",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)",
  },
  errorMessage: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    fontSize: "0.875rem",
    marginBottom: "1.5rem",
    wordBreak: "break-word",
  },
  footer: {
    marginTop: "2rem",
    textAlign: "center",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    paddingTop: "1.25rem",
  },
  footerText: {
    margin: 0,
    color: "#a0a5b5",
    fontSize: "0.9rem",
  },
  link: {
    color: "#d4af37",
    textDecoration: "none",
    fontWeight: "600",
    transition: "color 0.2s ease",
  },
};