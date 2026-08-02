import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config";

export default function GroupDetail({ user, token, onLogout }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [debtorId, setDebtorId] = useState("");
  const [creditorId, setCreditorId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(buildApiUrl(`/api/groups/${groupId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setGroup(data);
          setCreditorId(user?.id || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();

    const fetchDebts = async () => {
      try {
        const r = await fetch(buildApiUrl(`/api/groups/${groupId}/debts`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const jd = await r.json();
          setGroup((g) => ({ ...(g || {}), debts: jd.debts || [] }));
        } else {
          console.warn('Could not fetch debts list:', r.status);
        }
      } catch (e) {
        console.error('Error fetching debts separately:', e);
      }
    };

    fetchDebts();
  }, [groupId, token, user?.id]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const currentUserMember = group?.members?.find((m) => m.userId === user?.id);
  const isAdmin = currentUserMember?.role === "ADMIN";

  const totalDebts = group?.debts?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
  const myOwed = group?.debts
    ?.filter((d) => d.debtorName === (user?.displayName || user?.username))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
  const myReceivables = group?.debts
    ?.filter((d) => d.creditorName === (user?.displayName || user?.username))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
  const myBalance = myReceivables - myOwed;

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/invite/${groupId}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("✨ Einladungslink kopiert! Teile ihn mit deiner Gruppe.");
  };

  const handleLeaveOrDelete = async () => {
    const confirmMessage = isAdmin
      ? "Möchtest du diese Gruppe wirklich unwiderruflich löschen?"
      : "Möchtest du diese Gruppe wirklich verlassen?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(buildApiUrl(`/api/groups/${groupId}/leave`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        navigate("/home");
      } else {
        alert("Aktion konnte nicht durchgeführt werden.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDebt = async (e) => {
    e.preventDefault();
    if (!amount || !debtorId || !creditorId)
      return alert("Bitte wähle Schuldner, Empfänger und gib einen gültigen Betrag an.");
    
    setCreating(true);
    try {
      const res = await fetch(buildApiUrl(`/api/groups/${groupId}/debts`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(amount), description, debtorId, creditorId }),
      });
      if (res.ok) {
        const { debt } = await res.json();
        setGroup((g) => ({ ...g, debts: [debt, ...(g.debts || [])] }));
        setAmount("");
        setDescription("");
        setDebtorId("");
      } else {
        const err = await res.json();
        alert(err.message || "Fehler beim Eintragen der Ausgabe");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Eintragen der Ausgabe");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (!window.confirm("Diese Ausgabe als beglichen markieren?")) return;
    try {
      const res = await fetch(buildApiUrl(`/api/groups/${groupId}/debts/${debtId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setGroup((g) => ({ ...g, debts: (g.debts || []).filter((d) => d.id !== debtId) }));
      } else {
        const err = await res.json();
        alert(err.message || "Fehler beim Ausgleichen der Ausgabe");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Ausgleichen der Ausgabe");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <style>{keyframeStyles}</style>
        <div style={styles.spinnerOuter}>
          <div style={styles.spinner}></div>
        </div>
        <p style={{ color: "#e2b842", marginTop: "1.2rem", fontWeight: "600", letterSpacing: "1px", fontSize: "0.95rem" }}>
          LADE Userdaten...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{keyframeStyles}</style>

      <header style={styles.header}>
        <button onClick={() => navigate("/home")} style={styles.backBtn} className="action-btn">
          ← Übersicht
        </button>
        {onLogout && (
          <button onClick={onLogout} style={styles.logoutBtn} className="logout-btn">
            Abmelden 🚪
          </button>
        )}
      </header>

      <main style={styles.mainContent}>
        <div style={styles.heroCard} className="card-animated">
          <div style={styles.heroMain}>
            <div style={styles.heroTextGroup}>
              <div style={styles.badgeRow}>
                <span style={styles.metaBadge}>ID: {groupId}</span>
                {isAdmin && <span style={styles.adminHeroBadge}>👑</span>}
              </div>
              <h1 style={styles.groupTitle}>{group?.name || "Gruppe"}</h1>
            </div>

            <div style={styles.actionGroup}>
              <button onClick={handleCopyInviteLink} style={styles.inviteBtn} className="invite-btn">
                🔗 Link kopieren
              </button>
              <button
                onClick={handleLeaveOrDelete}
                className="danger-btn"
                style={{
                  ...styles.dangerBtn,
                  backgroundColor: isAdmin ? "rgba(239, 68, 68, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  color: isAdmin ? "#fca5a5" : "#aaa",
                  borderColor: isAdmin ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.1)",
                }}
              >
                {isAdmin ? "🗑️ Gruppe löschen" : "🚪 Verlassen"}
              </button>
            </div>
          </div>

          <div style={styles.statsBar}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Gesamte Ausgaben</span>
              <span style={styles.statValue}>
                {totalDebts.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Deine<br />Bilanz</span>
              <span
                style={{
                  ...styles.statValue,
                  color: myBalance > 0 ? "#4ade80" : myBalance < 0 ? "#f87171" : "#f3f4f6",
                }}
              >
                {myBalance > 0 ? "+" : ""}
                {myBalance.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.gridContainer}>
          <section style={styles.card} className="card-animated">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>👥 Mitglieder ({group?.members?.length || 0})</h3>
            </div>
            <ul style={styles.memberList}>
              {group?.members?.map((member) => {
                const isCurrentUser = member.userId === user?.id;
                return (
                  <li key={member.id} style={styles.memberItem} className="list-item">
                    <div style={styles.memberInfo}>
                      <div style={styles.avatar}>
                        {(member.user?.displayName || member.user?.username || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.memberName}>
                          {member.user?.displayName || member.user?.username}
                          {isCurrentUser && <span style={styles.youBadge}> (Du)</span>}
                        </div>
                        <div style={styles.memberUsername}>@{member.user?.username || "unbekannt"}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        ...styles.roleBadge,
                        backgroundColor: member.role === "ADMIN" ? "rgba(212, 175, 55, 0.12)" : "rgba(255, 255, 255, 0.04)",
                        color: member.role === "ADMIN" ? "#e2b842" : "#888",
                        borderColor: member.role === "ADMIN" ? "rgba(212, 175, 55, 0.3)" : "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {member.role === "ADMIN" ? "👑 Admin" : "Mitglied"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section style={styles.card} className="card-animated">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>💸 Ausgaben & Schulden</h3>
            </div>
            
            <div style={{ marginBottom: "1.75rem" }}>
              <form onSubmit={handleCreateDebt} style={styles.debtForm}>
                <div style={styles.formHeaderTitle}>Neue Ausgabe eintragen</div>
                
                <div style={styles.formGrid}>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Wer schuldet?</label>
                    <select
                      value={debtorId}
                      onChange={(e) => setDebtorId(e.target.value)}
                      style={styles.select}
                      className="form-input"
                    >
                      <option value="">Wählen...</option>
                      {group?.members?.map((m) => (
                        <option key={m.id} value={m.userId}>
                          {m.user?.displayName || m.user?.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formRow}>
                    <label style={styles.label}>Wer bekommt?</label>
                    <select
                      value={creditorId}
                      onChange={(e) => setCreditorId(e.target.value)}
                      style={styles.select}
                      className="form-input"
                    >
                      <option value="">Wählen...</option>
                      {group?.members?.map((m) => (
                        <option key={m.id} value={m.userId}>
                          {m.user?.displayName || m.user?.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formRow}>
                    <label style={styles.label}>Betrag (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      style={styles.input}
                      className="form-input"
                    />
                  </div>

                  <div style={styles.formRow}>
                    <label style={styles.label}>Verwendungszweck</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="z. B. Einkaufen, Pizza"
                      style={styles.input}
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" disabled={creating} style={styles.submitBtn} className="primary-btn">
                  {creating ? "Speichere..." : "➕ Ausgabe buchen"}
                </button>
              </form>
            </div>

            {(group?.debts || []).length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
                <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#f3f4f6" }}>
                  Alles bestens ausgeglichen!
                </p>
                <p style={{ color: "#71717a", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                  Keine offenen Posten in dieser Gruppe vorhanden.
                </p>
              </div>
            ) : (
              <ul style={styles.debtList}>
                {group.debts.map((d) => {
                  const amDebtor = d.debtorName === (user?.displayName || user?.username);
                  const amCreditor = d.creditorName === (user?.displayName || user?.username);
                  
                  return (
                    <li
                      key={d.id}
                      style={{
                        ...styles.debtItem,
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "stretch" : "center",
                      }}
                      className="list-item"
                    >
                      <div style={styles.debtDetails}>
                        <div style={styles.debtFlowText}>
                          <span style={styles.memberNameHighlight}>{d.debtorName}</span>
                          <span style={styles.arrowIcon}>➔</span>
                          <span style={styles.memberNameHighlight}>{d.creditorName}</span>
                        </div>
                        <div style={styles.debtAmount}>
                          {Number(d.amount).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                        </div>
                        {d.description && <div style={styles.debtDescription}>{d.description}</div>}
                      </div>

                      <div style={{ ...styles.debtActionGroup, justifyContent: isMobile ? "space-between" : "flex-end" }}>
                        {(amDebtor || amCreditor) && (
                          <div
                            style={{
                              ...styles.personalBadge,
                              backgroundColor: amDebtor ? "rgba(239, 68, 68, 0.12)" : "rgba(34, 197, 94, 0.12)",
                              color: amDebtor ? "#fca5a5" : "#86efac",
                              borderColor: amDebtor ? "rgba(239, 68, 68, 0.25)" : "rgba(34, 197, 94, 0.25)",
                            }}
                          >
                            {amDebtor ? "Du schuldest" : "Du kriegst"}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteDebt(d.id)}
                          style={styles.settleBtn}
                          className="settle-btn"
                        >
                          Begleichen
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

const keyframeStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(14px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes goldGlow {
    0%, 100% { box-shadow: 0 0 15px rgba(212, 175, 55, 0.1); }
    50% { box-shadow: 0 0 25px rgba(212, 175, 55, 0.25); }
  }

  .card-animated {
    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .list-item {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .list-item:hover {
    background-color: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(212, 175, 55, 0.25) !important;
    transform: translateY(-2px);
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

  .form-input::placeholder {
    color: #4b5563;
  }

  select.form-input {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e2b842' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.8rem center;
    background-size: 1em;
    padding-right: 2.5rem !important;
  }

  .action-btn, .invite-btn, .danger-btn, .primary-btn, .logout-btn, .settle-btn {
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .action-btn:hover, .invite-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.25) !important;
    border-color: rgba(212, 175, 55, 0.5) !important;
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(226, 184, 66, 0.4) !important;
    filter: brightness(1.1);
  }

  .danger-btn:hover {
    transform: translateY(-2px) !important;
    background-color: rgba(239, 68, 68, 0.22) !important;
    border-color: rgba(239, 68, 68, 0.5) !important;
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.2) !important;
  }

  .settle-btn:hover {
    background-color: rgba(34, 197, 94, 0.2) !important;
    color: #86efac !important;
    border-color: rgba(34, 197, 94, 0.4) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 14px rgba(34, 197, 94, 0.2) !important;
  }

  button:active {
    transform: translateY(0) scale(0.98) !important;
  }

  @media (max-width: 640px) {
    .responsive-grid {
      grid-template-columns: 1fr !important;
    }
    .responsive-stats {
      flex-direction: column !important;
      gap: 1.25rem !important;
    }
    .stat-divider-responsive {
      width: 80% !important;
      height: 1px !important;
    }
  }
`;

export const styles = {
  container: {
    padding: "2rem 1rem",
    color: "#f3f4f6",
    backgroundColor: "#07080c",
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(212, 175, 55, 0.08) 0px, transparent 45%),
      radial-gradient(at 100% 100%, rgba(212, 175, 55, 0.04) 0px, transparent 50%),
      radial-gradient(at 50% 50%, rgba(15, 17, 26, 0.5) 0px, transparent 100%)
    `,
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
    overflowX: "hidden",
  },
  loadingContainer: {
    minHeight: "100vh",
    backgroundColor: "#07080c",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerOuter: {
    padding: "8px",
    borderRadius: "50%",
    background: "rgba(212, 175, 55, 0.05)",
    border: "1px solid rgba(212, 175, 55, 0.2)",
  },
  spinner: {
    width: "44px",
    height: "44px",
    border: "3px solid rgba(212, 175, 55, 0.1)",
    borderTop: "3px solid #e2b842",
    borderRadius: "50%",
    animation: "spin 0.75s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite",
  },
  header: {
    display: "flex",
    justify: "space-between",
    alignItems: "center",
    maxWidth: "1140px",
    margin: "0 auto 1.5rem auto",
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
    maxWidth: "1140px",
    margin: "0 auto",
  },
  heroCard: {
    backgroundColor: "rgba(17, 19, 26, 0.85)",
    backdropFilter: "blur(16px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
  },
  heroMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  heroTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  badgeRow: {
    display: "flex",
    gap: "0.6rem",
    alignItems: "center",
  },
  groupTitle: {
    margin: 0,
    padding: "0.2rem 0",
    fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
    fontWeight: "900",
    letterSpacing: "-0.8px",
    lineHeight: "1.2",
    background: "linear-gradient(135deg, #ffffff 20%, #f3e5ab 60%, #e2b842 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
  },
  metaBadge: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    fontFamily: "'JetBrains Mono', monospace, sans-serif",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: "0.25rem 0.65rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  adminHeroBadge: {
    fontSize: "0.75rem",
    color: "#e2b842",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    padding: "0.25rem 0.65rem",
    borderRadius: "8px",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    fontWeight: "700",
  },
  actionGroup: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  inviteBtn: {
    padding: "0.75rem 1.4rem",
    cursor: "pointer",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    color: "#e2b842",
    border: "1px solid rgba(212, 175, 55, 0.35)",
    borderRadius: "14px",
    fontWeight: "700",
    fontSize: "0.875rem",
    boxShadow: "0 4px 18px rgba(212, 175, 55, 0.12)",
  },
  dangerBtn: {
    padding: "0.75rem 1.4rem",
    cursor: "pointer",
    borderRadius: "14px",
    fontWeight: "700",
    fontSize: "0.875rem",
    border: "1px solid",
  },
  statsBar: {
    display: "flex",
    backgroundColor: "rgba(10, 12, 18, 0.6)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "1.2rem 1.75rem",
    border: "1px solid rgba(212, 175, 55, 0.15)",
    boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 8px 20px rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    textAlign: "center",
  },
  statLabel: {
    fontSize: "0.7rem",
    color: "#8e95a5",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  statValue: {
    fontSize: "1.35rem",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "-0.3px",
    textAlign: "center",
    width: "100%",
  },
  statDivider: {
    width: "1px",
    height: "36px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.25rem",
    color: "#e2b842",
    fontWeight: "800",
    letterSpacing: "-0.3px",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  memberList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  memberItem: {
    padding: "0.85rem 0.9rem",
    backgroundColor: "rgba(255, 255, 255, 0.015)",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "14px",
  },
  memberInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.9rem",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    color: "#e2b842",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "1.1rem",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
  },
  memberName: {
    fontWeight: "700",
    fontSize: "0.95rem",
    color: "#f3f4f6",
  },
  youBadge: {
    color: "#e2b842",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  memberUsername: {
    fontSize: "0.75rem",
    color: "#6b7280",
    marginTop: "0.1rem",
  },
  roleBadge: {
    fontSize: "0.725rem",
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    fontWeight: "700",
    border: "1px solid",
  },
  emptyState: {
    padding: "3.5rem 1.5rem",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "18px",
    border: "1px dashed rgba(212, 175, 55, 0.2)",
  },
  debtForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    padding: "1.5rem",
    borderRadius: "18px",
    backgroundColor: "rgba(10, 12, 18, 0.7)",
    border: "1px solid rgba(212, 175, 55, 0.18)",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 25px rgba(0, 0, 0, 0.3)",
  },
  formHeaderTitle: {
    fontSize: "0.8rem",
    fontWeight: "800",
    color: "#e2b842",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "1.1rem",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },
  label: {
    fontSize: "0.725rem",
    color: "#9ca3af",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  select: {
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
    padding: "0.9rem",
    cursor: "pointer",
    backgroundColor: "#e2b842",
    backgroundImage: "linear-gradient(135deg, #f0c853 0%, #b88a14 100%)",
    color: "#07080c",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "0.95rem",
    marginTop: "0.2rem",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 15px rgba(226, 184, 66, 0.25)",
  },
  debtList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
  },
  debtItem: {
    padding: "1.1rem 1.25rem",
    backgroundColor: "rgba(10, 12, 18, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  },
  debtDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  debtFlowText: {
    fontWeight: "600",
    color: "#9ca3af",
    fontSize: "0.875rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  memberNameHighlight: {
    color: "#ffffff",
    fontWeight: "700",
  },
  arrowIcon: {
    color: "#e2b842",
    fontSize: "0.8rem",
    margin: "0 0.1rem",
  },
  debtAmount: {
    color: "#e2b842",
    fontWeight: "900",
    fontSize: "1.35rem",
    letterSpacing: "-0.5px",
  },
  debtDescription: {
    color: "#9ca3af",
    fontSize: "0.825rem",
    marginTop: "0.1rem",
    fontStyle: "italic",
  },
  debtActionGroup: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "nowrap",
    justifyContent: "flex-end",
  },
  personalBadge: {
    fontSize: "0.725rem",
    padding: "0.35rem 0.7rem",
    borderRadius: "10px",
    fontWeight: "800",
    border: "1px solid",
    letterSpacing: "0.3px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "110px",
    textAlign: "center",
  },
  settleBtn: {
    padding: "0.6rem 1rem",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    color: "#e5e7eb",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "0.825rem",
    display: "inline-flex",
    alignItems: "center",
    minWidth: "110px",
  },
};