import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function resetPassword() {
  const newPassword = "123";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.updateMany({
    where: { username: "Max" },
    data: { password: hashedPassword }
  });

  if (updatedUser.count > 0) {
    console.log('\n Passwort erfolgreich für Max zurückgesetzt!\n');
  } else {
    console.log('\n Nutzer "Max" wurde in der Datenbank nicht gefunden.\n');
  }

  await prisma.$disconnect();
  process.exit();
}

resetPassword();


// Das ist im Prinzip die gleiche Logik wie in der server.js, nur dass hier die Prisma-Instanz direkt erstellt wird und nicht über den Server.
// Damit kann ich selber ändern was ich will, ohne die Datenbank öffnen zu müssen. Ich kann auch die Datenbank direkt über die Prisma-Instanz ändern, ohne dass der Server läuft.