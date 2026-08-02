# Deployment Guide — GitHub + Render

Kurzanleitung, um das Projekt in GitHub zu pushen und auf Render bereitzustellen.

1) GitHub
- Initialisiere ein Repo lokal und push zu GitHub:

```bash
git init
git add .
git commit -m "Initial commit: Schulden App"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2) Render — Ein-Service-Setup (einfach)
- In Render ein neues Web Service erstellen, GitHub-Repo verbinden.
- Build Command: `npm run build`
- Start Command: `npm start`
- Environment Variables (wichtig):
  - `DATABASE_URL` → Postgres-Verbindungsstring (Render managed DB oder extern)
  - `JWT_SECRET` → ein sicheres Secret
  - Optional: `CORS_ORIGIN` → erlaubte Origin (z.B. `https://your-service.onrender.com`) oder leer für alle
  - (Wenn Frontend und Backend getrennt deployed werden) `VITE_API_URL` → Backend-URL

Hinweis: Das Root-`start`-Skript baut das Frontend in `frontend/dist` und startet den Backend-Server, der die statischen Dateien in Produktion ausliefert.

3) Alternative: Zwei Services (empfohlen wenn du unabhängig skalieren willst)
- Erstelle einen Static Site Service für das Frontend (Build Command `npm run build`, Publish Directory `frontend/dist`).
- Erstelle einen Web Service für das Backend (Start Command `npm --prefix backend start`).
- Setze `VITE_API_URL` in den Frontend-Env-Settings auf die Backend-URL.

4) Lokale Tests vor Deploy
- Baue lokal und starte Backend:

```bash
npm run build
npm --prefix backend start
```

Öffne `http://localhost:5000`.

---
Wenn du möchtest, kann ich eine `render.yaml` erzeugen oder stattdessen eine `Dockerfile` hinzufügen — welche Option bevorzugst du? (Ein Service vs zwei Services)
