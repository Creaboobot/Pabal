import { PrismaClient } from "@prisma/client";

import {
  seedFoundationRoles,
  seedRelationshipBackboneDemoData,
} from "./seed-data/relationship-backbone";

const prisma = new PrismaClient();

async function main() {
  await seedFoundationRoles(prisma);
  console.log("Seeded foundation roles.");

  if (process.env.SEED_DEMO_DATA === "true") {
    await seedRelationshipBackboneDemoData(prisma);
    console.log("Seeded Step 4A relationship backbone demo data.");
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
