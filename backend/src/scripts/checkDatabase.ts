import { prisma } from "../config/prisma.js";

async function checkDatabase(): Promise<void> {
  await prisma.$connect();
  console.info("PostgreSQL connection established.");
  await prisma.$disconnect();
}

checkDatabase().catch(async (error: unknown) => {
  console.error("Unable to connect to PostgreSQL.", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
