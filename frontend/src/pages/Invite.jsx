import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config"; // Passe den Import an deinen Helper an

export default function Invite({ token }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const joinGroup = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/groups/${groupId}/join`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Fehler beim Beitreten");
        }

        // Direkt zur Gruppen-Detailseite weiterleiten
        navigate(`/group/${groupId}`);
      } catch (err) {
        setError(err.message);
      }
    };

    if (token) {
      joinGroup();
    }
  }, [groupId, token, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d0e12",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      {error ? (
        <div style={{ textAlign: "center" }}>
          <h3 style={{ color: "#ff4d4d" }}>Einladung fehlgeschlagen</h3>
          <p>{error}</p>
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#d4af37",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Zurück zur Übersicht
          </button>
        </div>
      ) : (
        <p style={{ color: "#d4af37" }}>Lade Einladung & trete Gruppe bei...</p>
      )}
    </div>
  );
}