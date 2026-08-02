import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaPkg from "@prisma/client";
const { PrismaClient } = prismaPkg;

import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "fallback_8674u5r7FGH53z4";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Nicht autorisiert" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId, username: decoded.username };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Ungültiger oder abgelaufener Token" });
  }
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Benutzername ist bereits vergeben." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        displayName: displayName || username,
      },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registrierung erfolgreich",
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: `Fehler bei Registrierung: ${error.message}` });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Benutzername und Passwort erforderlich." });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: "Ungültige Anmeldedaten." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Ungültige Anmeldedaten." });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Erfolgreich angemeldet",
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: `Fehler beim Login: ${error.message}` });
  }
});

app.get("/api/groups", authenticateToken, async (req, res) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: { group: true },
    });

    const groups = memberships.map((m) => m.group);
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: `Fehler beim Laden der Gruppen: ${error.message}` });
  }
});

app.post("/api/groups", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Gruppenname erforderlich." });

    const newGroup = await prisma.group.create({
      data: {
        name,
        members: {
          create: {
            userId: req.user.id,
            role: "ADMIN",
          },
        },
      },
    });

    res.status(201).json({ group: newGroup, message: "Gruppe erfolgreich erstellt" });
  } catch (error) {
    res.status(500).json({ message: `Fehler beim Erstellen der Gruppe: ${error.message}` });
  }
});

app.get("/api/groups/:groupId", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
        debts: true,
      },
    });

    if (!group) return res.status(404).json({ message: "Gruppe nicht gefunden" });

    const isMember = group.members.some((m) => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Kein Zugriff auf diese Gruppe" });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: `Fehler beim Laden der Gruppe: ${error.message}` });
  }
});

app.get("/api/groups/:groupId/debts", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await prisma.group.findUnique({ where: { id: groupId }, include: { members: true } });
    if (!group) return res.status(404).json({ message: "Gruppe nicht gefunden" });

    const isMember = group.members.some((m) => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Kein Zugriff auf diese Gruppe" });

    const debts = await prisma.debt.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ debts });
  } catch (error) {
    console.error('Error fetching debts list:', error);
    res.status(500).json({ message: `Fehler beim Laden der Schulden: ${error.message}` });
  }
});

app.post("/api/groups/:groupId/debts", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, description, debtorId, creditorId } = req.body;

    if (!amount || !debtorId || !creditorId) {
      return res.status(400).json({ message: "Amount, debtorId and creditorId are required." });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId }, include: { members: true } });
    if (!group) return res.status(404).json({ message: "Gruppe nicht gefunden" });

    const isMember = group.members.some((m) => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Kein Zugriff auf diese Gruppe" });

    const debtorMember = await prisma.groupMember.findFirst({ where: { groupId, userId: debtorId }, include: { user: true } });
    const creditorMember = await prisma.groupMember.findFirst({ where: { groupId, userId: creditorId }, include: { user: true } });

    if (!debtorMember || !creditorMember) {
      return res.status(400).json({ message: "Debtor or creditor not found in group." });
    }

    const debt = await prisma.debt.create({
      data: {
        amount: Number(amount),
        description: description || "",
        debtorName: debtorMember.user.displayName || debtorMember.user.username,
        creditorName: creditorMember.user.displayName || creditorMember.user.username,
        groupId,
        createdById: req.user.id,
      },
    });

    res.status(201).json({ debt });
  } catch (error) {
    console.error("Error creating debt:", error);
    res.status(500).json({ message: `Fehler beim Erstellen der Schuld: ${error.message}` });
  }
});

app.delete("/api/groups/:groupId/debts/:debtId", authenticateToken, async (req, res) => {
  try {
    const { groupId, debtId } = req.params;

    const group = await prisma.group.findUnique({ where: { id: groupId }, include: { members: true } });
    if (!group) return res.status(404).json({ message: "Gruppe nicht gefunden" });

    const isMember = group.members.some((m) => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Kein Zugriff auf diese Gruppe" });

    const debt = await prisma.debt.findUnique({ where: { id: debtId } });
    if (!debt || debt.groupId !== groupId) return res.status(404).json({ message: "Schuld nicht gefunden" });

    await prisma.debt.delete({ where: { id: debtId } });

    res.json({ message: "Schuld gelöscht" });
  } catch (error) {
    console.error("Error deleting debt:", error);
    res.status(500).json({ message: `Fehler beim Löschen der Schuld: ${error.message}` });
  }
});

app.post("/api/groups/:groupId/join", authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ error: "Gruppe nicht gefunden." });
    }

    await prisma.groupMember.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      update: {},
      create: {
        groupId,
        userId,
        role: "MEMBER",
      },
    });

    res.json({ message: "Erfolgreich der Gruppe beigetreten!", groupId });
  } catch (error) {
    console.error("Fehler beim Beitreten:", error);
    res.status(500).json({ error: "Fehler beim Beitreten der Gruppe." });
  }
});

app.delete("/api/groups/:groupId/leave", authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ error: "Gruppe nicht gefunden." });
    }

    const memberRecord = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!memberRecord) {
      return res.status(400).json({ error: "Du bist kein Mitglied dieser Gruppe." });
    }

    if (memberRecord.role === "ADMIN") {
      await prisma.debt.deleteMany({ where: { groupId } });
      await prisma.groupMember.deleteMany({ where: { groupId } });
      await prisma.group.delete({ where: { id: groupId } });
      return res.json({ message: "Gruppe wurde gelöscht.", action: "deleted" });
    }

    await prisma.groupMember.deleteMany({
      where: { groupId, userId },
    });

    res.json({ message: "Gruppe erfolgreich verlassen.", action: "left" });
  } catch (error) {
    console.error("Fehler beim Verlassen/Löschen:", error);
    res.status(500).json({ error: "Aktion konnte nicht ausgeführt werden." });
  }
});

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get(/.*/, (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Backend läuft auf http://${HOST}:${PORT}`);
});