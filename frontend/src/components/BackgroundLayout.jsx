export default function BackgroundLayout({ children }) {
  return (
    <div className="background-layout">
      <style>{backgroundLayoutStyles}</style>
      <div className="background-grid" />
      <div className="background-glow glow-1" />
      <div className="background-glow glow-2" />
      <div className="background-content">{children}</div>
    </div>
  );
}

const backgroundLayoutStyles = `
.background-layout {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  overflow-x: hidden;
  background-color: #07080c;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Wichtig: Startet oben statt in der Mitte */
  align-items: center;
  box-sizing: border-box;
  color: #f3f4f6;
  z-index: 0;
}

.background-grid {
  position: fixed; /* Fixiert den Hintergrund, während der Inhalt scrollt */
  inset: 0;
  background-image:
    radial-gradient(rgba(212, 175, 55, 0.08) 1px, transparent 0),
    radial-gradient(circle at 0% 0%, rgba(212, 175, 55, 0.05) 0%, transparent 48%),
    radial-gradient(circle at 100% 100%, rgba(255, 215, 0, 0.06) 0%, transparent 48%);
  background-size: 24px 24px, 100% 100%, 100% 100%;
  background-position: 0 0, 0 0, 0 0;
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}

.background-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(1px);
  z-index: 0;
}

.background-glow.glow-1 {
  top: 6%;
  left: 8%;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.24) 0%, transparent 58%);
  animation: backgroundGlow 10s ease-in-out infinite alternate;
}

.background-glow.glow-2 {
  bottom: 8%;
  right: 8%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.16) 0%, transparent 62%);
  animation: backgroundGlow 12s ease-in-out infinite alternate-reverse;
}

.background-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem 4rem 1rem;
  box-sizing: border-box;
}

@keyframes backgroundGlow {
  from {
    opacity: 0.18;
    transform: scale(1);
  }
  to {
    opacity: 0.28;
    transform: scale(1.08);
  }
}

@media (max-width: 768px) {
  .background-glow.glow-1 {
    width: 260px;
    height: 260px;
    top: 4%;
    left: 4%;
  }
  .background-glow.glow-2 {
    width: 300px;
    height: 300px;
    bottom: 4%;
    right: 4%;
  }
  .background-content {
    padding: 1rem 0.75rem 3rem 0.75rem;
  }
}
`;