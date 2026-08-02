import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config";

export default function Home({ user, token, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const navigate = useNavigate();

const fetchGroups = async () => {
  try {
    const url = buildApiUrl("/api/groups");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gruppen konnten nicht geladen werden");
      }

      const baseGroups = data.groups || data || [];

      const enrichedGroups = await Promise.all(
        baseGroups.map(async (group) => {
          if (!group?.id) return group;

          try {
            const detailResponse = await fetch(buildApiUrl(`/api/groups/${group.id}`), {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!detailResponse.ok) return group;

            const detailData = await detailResponse.json();
            return { ...group, ...detailData };
          } catch (err) {
            return group;
          }
        })
      );

      setGroups(enrichedGroups);
    } catch (err) {
      console.error("Fehler beim Abrufen der Gruppen:", err);
      setError(err.message || "Gruppen konnten nicht geladen werden.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    console.log("handleCreateGroup triggered", { newGroupName, token, apiUrl: buildApiUrl("/api/groups") });
    if (!newGroupName.trim()) return;

    if (!token || token === "undefined" || token === "null") {
      setError("Sitzung ungültig. Bitte melde dich erneut an.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/api/groups"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGroupName }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = { message: text || "Ungültige Server-Antwort" };
      }

      if (!response.ok) {
        console.error("Gruppe erstellen fehlgeschlagen:", response.status, data);
        throw new Error(data.message || `Gruppe konnte nicht erstellt werden (${response.status})`);
      }

      console.log("Gruppe erstellt:", data);
      setNewGroupName("");
      setIsModalOpen(false);
      setGroups((prev) => [...prev, data.group]);
      setFilterRole("all");

      if (data.group?.id) {
        navigate(`/group/${data.group.id}`);
      } else {
        await fetchGroups();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedGroups = () => {
    return groups
      .filter((group) => {
        const currentUserMember = group.members?.find((m) => m.userId === user?.id);
        const isAdmin = currentUserMember?.role === "ADMIN" || group.createdById === user?.id;

        if (filterRole === "admin") return isAdmin;
        if (filterRole === "member") return !isAdmin;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "members") {
          return (b.members?.length || 0) - (a.members?.length || 0);
        }
        return 0;
      });
  };

  const filteredGroups = getFilteredAndSortedGroups();

  return (
    <div style={styles.pageBackground}>
      <style>{keyframeStyles}</style>

      {/* Dynamic Background Glow Spheres */}
      <div style={styles.glowSphere1} />
      <div style={styles.glowSphere2} />

      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <div style={styles.logoBadge}>💎</div>
          <div>
            <h1 style={styles.navTitle}>Klimax Schulden</h1>
            <span style={styles.badgePro}>ULTIMATE EDITION</span>
          </div>
        </div>

        <div style={styles.navActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => alert("Profil bearbeiten - Demnächst verfügbar!")}
          >
            👤 Profil
          </button>
          <button style={styles.logoutButton} onClick={onLogout}>
            Abmelden ➔
          </button>
        </div>
      </nav>

      <main style={styles.container}>
        {error && (
          <div style={styles.pageErrorBanner}>
            {error}
          </div>
        )}
        <div style={styles.welcomeCard}>
          <div style={{ flex: "1 1 280px" }}>
            <h2 style={styles.welcomeTitle}>
              Hallo, <span style={styles.goldGradientText}>{user?.displayName || user?.username || "Finanz-Profi"}</span> 👋
            </h2>
            <p style={styles.welcomeSubtitle}>
              Behalte die absolute Kontrolle über alle gemeinsamen Finanzen und Gruppen-Ausgaben.
            </p>
          </div>
          <button style={styles.primaryButton} onClick={() => setIsModalOpen(true)}>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>+</span> Neue Gruppe
          </button>
        </div>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h3 style={styles.sectionTitle}>Deine Gruppen</h3>
              <span style={styles.countBadge}>{filteredGroups.length}</span>
            </div>

            <div style={styles.controlsRow}>
              <div style={styles.selectWrapper}>
                <select style={styles.selectInput} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                  <option value="all">⚡ Alle Gruppen</option>
                  <option value="admin">👑 Nur Admin</option>
                  <option value="member">👥 Nur Mitglied</option>
                </select>
              </div>

              <div style={styles.selectWrapper}>
                <select style={styles.selectInput} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">🕒 Neueste zuerst</option>
                  <option value="oldest">⏳ Älteste zuerst</option>
                  <option value="name">🔤 Name (A-Z)</option>
                  <option value="members">🔥 Meiste Mitglieder</option>
                </select>
              </div>
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📂</div>
              <h4 style={{ margin: "0.5rem 0 0.25rem 0", color: "#fff", fontSize: "1.1rem" }}>Keine Gruppen gefunden</h4>
              <p style={{ margin: 0, color: "#8a90a2", fontSize: "0.9rem", maxWidth: "400px", marginInline: "auto" }}>
                Erstelle mit dem Button oben deine erste Gruppe oder verändere die aktiven Filter!
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredGroups.map((group) => {
                const currentUserMember = group.members?.find((m) => m.userId === user?.id);
                const isAdmin = currentUserMember?.role === "ADMIN" || group.createdById === user?.id;

                const adminMember = group.members?.find((m) => m.role === "ADMIN");

                let adminName = "Unbekannt";
                if (adminMember?.user) {
                  adminName = adminMember.user.displayName || adminMember.user.username;
                } else if (isAdmin) {
                  adminName = user?.displayName || user?.username || "Du";
                } else if (group.createdBy) {
                  adminName = group.createdBy.displayName || group.createdBy.username;
                }

                const memberCount = group.members?.length ?? 0;

                return (
                  <div
                    key={group.id}
                    className="group-card"
                    style={styles.groupCard}
                    onClick={() => navigate(`/group/${group.id}`)}
                  >
                    <div style={styles.groupHeader}>
                      <div style={styles.iconWrapper}>
                        <span style={styles.groupIcon}>👥</span>
                        {isAdmin && <span style={styles.crownBadge} title="Du bist Admin">👑</span>}
                      </div>
                      <h4 style={styles.groupName}>{group.name}</h4>
                    </div>

                    <div style={styles.groupMetaContainer}>
                      <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>👑 Admin</span>
                        <span style={styles.metaValue}>{adminName}</span>
                      </div>
                      <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>👥 Mitglieder</span>
                        <span style={styles.pillBadge}>{memberCount} Pers.</span>
                      </div>
                      {group.createdAt && (
                        <div style={{ ...styles.metaRow, marginTop: "0.2rem" }}>
                          <span style={{ ...styles.metaLabel, fontSize: "0.75rem" }}>📅 Erstellt</span>
                          <span style={{ ...styles.metaValue, color: "#6c7284", fontSize: "0.78rem" }}>
                            {new Date(group.createdAt).toLocaleDateString("de-DE")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={styles.cardArrow}>➔</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {isModalOpen && (
          <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Neue Gruppe starten</h3>
                <button style={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}>✕</button>
              </div>
              
              {error && <div style={styles.errorMessage}>{error}</div>}

              <form onSubmit={handleCreateGroup} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label htmlFor="groupName" style={styles.label}>
                    Name der Gruppe
                  </label>
                  <input
                    id="groupName"
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="z.B. WG Kitzingen, Sommerurlaub, Party..."
                    required
                    style={styles.input}
                    autoFocus
                  />
                </div>

                <div style={styles.modalActions}>
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                  >
                    Abbrechen
                  </button>
                  <button type="submit" style={styles.primaryButton} disabled={loading}>
                    {loading ? "Erstelle..." : "Gruppe Erstellen 🎉"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const keyframeStyles = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Custom Premium Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0d0e12;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.25);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.5);
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.12; transform: scale(1); }
    50% { opacity: 0.22; transform: scale(1.08); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.92) translateY(15px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  input::placeholder {
    color: #4e5365 !important;
  }

  input:focus, select:focus {
    border-color: #d4af37 !important;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.35) !important;
    outline: none !important;
    background-color: rgba(18, 20, 28, 0.98) !important;
  }

  button {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.15);
  }

  button:active:not(:disabled) {
    transform: translateY(1px);
  }

  .group-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  .group-card::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.08), transparent);
    transition: left 0.6s ease;
  }

  .group-card:hover::before {
    left: 100%;
  }

  .group-card:hover {
    transform: translateY(-6px) scale(1.01) !important;
    border-color: rgba(212, 175, 55, 0.55) !important;
    box-shadow: 0 16px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.18) !important;
  }

  .group-card:hover .card-arrow {
    opacity: 1 !important;
    transform: translateX(0) !important;
  }
`;

const styles = {
  pageBackground: {
    minHeight: "100vh",
    backgroundColor: "#0a0b0e",
    backgroundImage: `
      radial-gradient(rgba(212, 175, 55, 0.07) 1px, transparent 0),
      radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 60%)
    `,
    backgroundSize: "24px 24px, 100% 100%",
    color: "#f8f9fa",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: "3rem",
    position: "relative",
    overflowX: "hidden",
  },
  glowSphere1: {
    position: "absolute",
    top: "-150px",
    left: "-150px",
    width: "450px",
    height: "450px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "pulseGlow 8s infinite ease-in-out",
  },
  glowSphere2: {
    position: "absolute",
    bottom: "10%",
    right: "-100px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "pulseGlow 10s infinite ease-in-out 2s",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.9rem 2rem",
    backgroundColor: "rgba(14, 16, 22, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(212, 175, 55, 0.22)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexWrap: "wrap",
    gap: "1rem",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
  },
  logoBadge: {
    fontSize: "1.5rem",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(0,0,0,0.4) 100%)",
    border: "1px solid rgba(212, 175, 55, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 15px rgba(212, 175, 55, 0.15)",
  },
  navTitle: {
    fontSize: "1.35rem",
    fontWeight: "900",
    margin: 0,
    background: "linear-gradient(135deg, #ffffff 30%, #d4af37 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.4px",
    lineHeight: "1.1",
  },
  badgePro: {
    fontSize: "0.6rem",
    fontWeight: "800",
    color: "#d4af37",
    letterSpacing: "1.2px",
    opacity: 0.8,
  },
  navActions: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    animation: "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
    position: "relative",
    zIndex: 1,
  },
  welcomeCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(18, 20, 28, 0.75)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    borderRadius: "22px",
    padding: "1.75rem 2rem",
    marginBottom: "2.5rem",
    flexWrap: "wrap",
    gap: "1.25rem",
    boxShadow: "0 12px 35px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  },
  welcomeTitle: {
    margin: "0 0 0.4rem 0",
    fontSize: "1.6rem",
    fontWeight: "800",
    letterSpacing: "-0.4px",
  },
  goldGradientText: {
    background: "linear-gradient(135deg, #f3e5ab 0%, #d4af37 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  welcomeSubtitle: {
    margin: 0,
    color: "#9ca3af",
    fontSize: "0.95rem",
    lineHeight: "1.45",
  },
  section: {
    marginTop: "0.5rem",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.35rem",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  countBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    color: "#d4af37",
    padding: "0.15rem 0.6rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "700",
  },
  controlsRow: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  selectWrapper: {
    position: "relative",
  },
  selectInput: {
    padding: "0.65rem 2.4rem 0.65rem 1rem",
    borderRadius: "14px",
    backgroundColor: "rgba(18, 20, 28, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    color: "#f8f9fa",
    fontSize: "0.875rem",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="%23d4af37" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.658l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>')`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "calc(100% - 0.85rem) center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.4rem",
  },
  groupCard: {
    backgroundColor: "rgba(16, 18, 25, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.09)",
    borderRadius: "20px",
    padding: "1.4rem",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "165px",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.9rem",
    marginBottom: "1.1rem",
  },
  iconWrapper: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  groupIcon: {
    fontSize: "1.35rem",
    background: "linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.05) 100%)",
    padding: "0.6rem",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(212, 175, 55, 0.25)",
  },
  crownBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    fontSize: "0.9rem",
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.9))",
  },
  groupName: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: "800",
    color: "#ffffff",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    lineHeight: "1.3",
    letterSpacing: "-0.2px",
  },
  groupMetaContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.07)",
    paddingTop: "0.9rem",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
  },
  metaLabel: {
    fontSize: "0.82rem",
    color: "#8a90a2",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: "0.85rem",
    color: "#e2e8f0",
    fontWeight: "600",
    overflowWrap: "anywhere",
  },
  pillBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#d4af37",
    padding: "0.1rem 0.55rem",
    borderRadius: "10px",
    fontSize: "0.78rem",
    fontWeight: "700",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    backgroundColor: "rgba(16, 18, 25, 0.5)",
    borderRadius: "22px",
    border: "2px dashed rgba(212, 175, 55, 0.2)",
  },
  emptyIcon: {
    fontSize: "3rem",
    filter: "drop-shadow(0 6px 15px rgba(0,0,0,0.6))",
    marginBottom: "0.5rem",
  },
  pageErrorBanner: {
    marginBottom: "1rem",
    padding: "1rem 1.2rem",
    borderRadius: "18px",
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    color: "#fcd7d7",
    fontWeight: "700",
  },
  primaryButton: {
    padding: "0.75rem 1.4rem",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%)",
    color: "#0a0b0e",
    fontSize: "0.925rem",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(212, 175, 55, 0.3)",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    justifyContent: "center",
  },
  secondaryButton: {
    padding: "0.6rem 1rem",
    borderRadius: "12px",
    border: "1px solid rgba(212, 175, 55, 0.35)",
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    color: "#d4af37",
    fontSize: "0.875rem",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  logoutButton: {
    padding: "0.6rem 1rem",
    borderRadius: "12px",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "#fca5a5",
    fontSize: "0.875rem",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.25rem",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#12141d",
    border: "1px solid rgba(212, 175, 55, 0.4)",
    borderRadius: "24px",
    padding: "2rem",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.2)",
    animation: "modalPop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  closeModalBtn: {
    background: "none",
    border: "none",
    color: "#8a90a2",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "0.2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.4rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  label: {
    color: "#d4af37",
    fontSize: "0.8rem",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  input: {
    width: "100%",
    padding: "0.9rem 1.15rem",
    borderRadius: "14px",
    backgroundColor: "rgba(10, 11, 16, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    fontSize: "0.95rem",
    transition: "all 0.2s ease",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.85rem",
    marginTop: "0.5rem",
  },
  cancelButton: {
    padding: "0.75rem 1.3rem",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#9ca3af",
    fontSize: "0.9rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  errorMessage: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fca5a5",
    padding: "0.85rem 1.1rem",
    borderRadius: "14px",
    fontSize: "0.875rem",
    marginBottom: "1rem",
    lineHeight: "1.4",
  },
};
