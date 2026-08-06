import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config";
import BackgroundLayout from "../components/BackgroundLayout";

export default function Profile({ user, token, onLogout, setUser }) {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [iban, setIban] = useState(user?.iban ? user.iban.match(/.{1,4}/g)?.join(" ") || "" : "");
  
  // Funktion, um das Profilbild aus allen möglichen Property-Namen zu fischen
  const getProfilePic = (usr) => {
    return usr?.pb || usr?.profilePicture || usr?.avatarUrl || usr?.avatar || usr?.image || usr?.profile_picture || "";
  };

  const [pb, setPb] = useState(getProfilePic(user));
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Synchronisiert die Daten, falls sich das user-Objekt nachträglich ändert/lädt
  useEffect(() => {
    if (user) {
      if (user.displayName !== undefined) setDisplayName(user.displayName || "");
      if (user.iban !== undefined && user.iban) {
        setIban(user.iban.match(/.{1,4}/g)?.join(" ") || "");
      }
      const fetchedPb = getProfilePic(user);
      if (fetchedPb) {
        setPb(fetchedPb);
      }
    }
  }, [user]);

  const handleIbanChange = (e) => {
    let rawValue = e.target.value.replace(/\s+/g, "").toUpperCase();
    if (rawValue.length > 34) rawValue = rawValue.substring(0, 34);
    const formatted = rawValue.match(/.{1,4}/g)?.join(" ") || "";
    setIban(formatted);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const cleanIban = iban.replace(/\s+/g, "");

      const res = await fetch(buildApiUrl("/api/users/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName, iban: cleanIban, pb }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        const newUser = {
          ...user,
          displayName: updatedUser.displayName || displayName,
          iban: updatedUser.iban !== undefined ? updatedUser.iban : cleanIban,
          pb: updatedUser.pb !== undefined ? updatedUser.pb : pb,
        };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        alert("✨ Profil erfolgreich aktualisiert!");
      } else {
        const err = await res.json();
        alert(err.message || "Fehler beim Aktualisieren des Profils.");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Aktualisieren des Profils.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Passwort ändern
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return alert("Bitte fülle alle Passwort-Felder aus.");
    }

    if (newPassword.length < 6) {
      return alert("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
    }

    setSavingPassword(true);
    try {
      const res = await fetch(buildApiUrl("/api/users/password"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        alert("🔒 Passwort erfolgreich geändert!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        alert(err.message || "Fehler beim Ändern des Passworts.");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Ändern des Passworts.");
    } finally {
      setSavingPassword(false);
    }
  };

  // Account löschen
  const handleDeleteAccount = async () => {
    const confirmText = prompt(
      "Möchtest du deinen Account wirklich unwiderruflich löschen? Tippe zur Bestätigung 'LÖSCHEN':"
    );

    if (confirmText !== "LÖSCHEN") {
      return alert("Löschvorgang abgebrochen.");
    }

    try {
      const res = await fetch(buildApiUrl("/api/users/account"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert("Dein Account wurde gelöscht.");
        onLogout();
        navigate("/login");
      } else {
        const err = await res.json();
        alert(err.message || "Account konnte nicht gelöscht werden.");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Löschen des Accounts.");
    }
  };

  return (
    <BackgroundLayout>
      <style>{componentStyles}</style>
      <div style={styles.container}>
        <header style={styles.header} className="responsive-header">
          <button
            onClick={() => navigate("/home")}
            style={styles.backBtn}
            className="action-btn"
          >
            ← Übersicht
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              style={styles.logoutBtn}
              className="logout-btn"
            >
              Abmelden 🚪
            </button>
          )}
        </header>

        <main style={styles.mainContent}>
          <div style={styles.heroCard} className="card-animated">
            <div style={styles.heroMain}>
              {pb ? (
                <img
                  src={pb}
                  alt="Profilbild"
                  style={styles.avatarImageLarge}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div style={styles.avatarLarge}>
                  {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div style={styles.heroTextGroup}>
                <span style={styles.metaBadge}>Benutzerprofil</span>
                <h1 style={styles.groupTitle}>
                  {user?.displayName || user?.username || "Mein Account"}
                </h1>
                <p style={styles.subtextEmail}>@{user?.username}</p>
              </div>
            </div>
          </div>

          <div style={styles.gridContainer} className="responsive-grid">
            <section style={styles.card} className="card-animated">
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>✏️ Allgemeine Daten</h3>
              </div>
              <form onSubmit={handleUpdateProfile} style={styles.form}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Anzeigename</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={styles.input}
                    className="form-input"
                    placeholder="Dein Anzeigename"
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>IBAN</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={handleIbanChange}
                    style={styles.input}
                    className="form-input"
                    placeholder="DE12 3456..."
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>Profilbild (URL)</label>
                  <input
                    type="text"
                    value={pb}
                    onChange={(e) => setPb(e.target.value)}
                    style={styles.input}
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  style={styles.submitBtn}
                  className="primary-btn"
                >
                  {savingProfile ? "Wird gespeichert..." : "💾 Änderungen speichern"}
                </button>
              </form>
            </section>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <section style={styles.card} className="card-animated">
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>🔒 Passwort ändern</h3>
                </div>
                <form onSubmit={handleChangePassword} style={styles.form}>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Aktuelles Passwort</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={styles.input}
                      className="form-input"
                      placeholder="••••••••"
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Neues Passwort</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={styles.input}
                      className="form-input"
                      placeholder="Min. 6 Zeichen"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    style={styles.submitBtn}
                    className="primary-btn"
                  >
                    {savingPassword ? "Wird geändert..." : "🔑 Passwort aktualisieren"}
                  </button>
                </form>
              </section>

              <section style={{ ...styles.card, borderColor: "rgba(239, 68, 68, 0.2)" }} className="card-animated">
                <div style={styles.cardHeader}>
                  <h3 style={{ ...styles.cardTitle, color: "#fca5a5" }}>⚠️ Gefahrenzone</h3>
                </div>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "1.2rem", lineHeight: "1.4" }}>
                  Wenn du deinen Account löschst, werden alle deine Daten unwiderruflich entfernt.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  style={styles.dangerBtn}
                  className="danger-btn"
                >
                  🗑️ Account unwiderruflich löschen
                </button>
              </section>
            </div>
          </div>
        </main>
      </div>
    </BackgroundLayout>
  );
}

const componentStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(14px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.card-animated {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.form-input {
  transition: all 0.25s ease !important;
  outline: none !important;
}

.form-input:focus {
  border-color: #e2b842 !important;
  box-shadow: 0 0 0 3px rgba(226, 184, 66, 0.18), 0 4px 12px rgba(0, 0, 0, 0.5) !important;
  background-color: #121520 !important;
  transform: translateY(-1px);
}

.action-btn, .primary-btn, .logout-btn {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.action-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.25) !important;
  border-color: rgba(212, 175, 55, 0.5) !important;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(226, 184, 66, 0.4) !important;
  filter: brightness(1.1);
}

.danger-btn {
  transition: all 0.22s ease !important;
}

.danger-btn:hover {
  transform: translateY(-2px) !important;
  background-color: rgba(239, 68, 68, 0.22) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.2) !important;
}

@media (max-width: 640px) {
  body, html {
    overflow-x: hidden;
  }
  
  .responsive-header {
    flex-direction: column !important;
    align-items: stretch !important;
    flex-wrap: wrap !important;
    gap: 0.8rem !important;
    margin-top: 1.5rem !important;
    position: relative !important;
    z-index: 10 !important;
  }
  .responsive-header button {
    width: 100% !important;
  }
  .responsive-grid {
    grid-template-columns: 1fr !important;
  }
}
`;

const styles = {
  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "1.5rem 1rem 3rem 1rem",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: "1.5rem",
  },
  backBtn: {
    padding: "0.6rem 1.2rem",
    cursor: "pointer",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    color: "#d1d5db",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "600",
    backdropFilter: "blur(12px)",
  },
  logoutBtn: {
    padding: "0.6rem 1.2rem",
    cursor: "pointer",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    color: "#fca5a5",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  mainContent: {
    width: "100%",
  },
  heroCard: {
    backgroundColor: "rgba(17, 19, 26, 0.85)",
    backdropFilter: "blur(16px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  },
  heroMain: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  avatarLarge: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    color: "#e2b842",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "2rem",
    border: "1px solid rgba(212, 175, 55, 0.35)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
  },
  avatarImageLarge: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    objectFit: "cover",
    border: "1px solid rgba(212, 175, 55, 0.35)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
  },
  heroTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  metaBadge: {
    fontSize: "0.75rem",
    color: "#e2b842",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  groupTitle: {
    margin: 0,
    fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
    fontWeight: "900",
    letterSpacing: "-0.5px",
    color: "#ffffff",
  },
  subtextEmail: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#9ca3af",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    alignItems: "start",
  },
  card: {
    backgroundColor: "rgba(17, 19, 26, 0.85)",
    backdropFilter: "blur(16px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "1.75rem",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
  },
  cardHeader: {
    marginBottom: "1.5rem",
    paddingBottom: "0.9rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.15rem",
    color: "#e2b842",
    fontWeight: "800",
    letterSpacing: "-0.3px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "0.75rem 0.9rem",
    borderRadius: "12px",
    backgroundColor: "#0d0f17",
    color: "#f3f4f6",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    fontSize: "0.9rem",
    fontWeight: "500",
    width: "100%",
    boxSizing: "border-box",
  },
  submitBtn: {
    padding: "0.85rem",
    cursor: "pointer",
    backgroundColor: "#e2b842",
    backgroundImage: "linear-gradient(135deg, #f0c853 0%, #b88a14 100%)",
    color: "#07080c",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "0.9rem",
    marginTop: "0.5rem",
    boxShadow: "0 4px 15px rgba(226, 184, 66, 0.25)",
  },
  dangerBtn: {
    width: "100%",
    padding: "0.85rem",
    cursor: "pointer",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "#fca5a5",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "0.9rem",
  },
};