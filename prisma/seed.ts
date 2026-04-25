import { PrismaClient } from "@prisma/client";

import { seedFoundationRoles } from "./seed-data/relationship-backbone";
import { seedActionIntelligenceDemoData } from "./seed-data/action-intelligence";

const prisma = new PrismaClient();

async function main() {
  await seedFoundationRoles(prisma);
  console.log("Seeded foundation roles.");

  if (process.env.SEED_DEMO_DATA === "true") {
    await seedActionIntelligenceDemoData(prisma);
    console.log("Seeded Step 4A and Step 4B-1 demo data.");
  }
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
