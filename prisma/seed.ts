import { PrismaClient } from "@prisma/client";

import { seedAIVoiceReadinessDemoData } from "./seed-data/ai-voice-readiness";
import { seedFoundationRoles } from "./seed-data/relationship-backbone";

const prisma = new PrismaClient();

async function main() {
  await seedFoundationRoles(prisma);
  console.log("Seeded foundation roles.");

  if (process.env.SEED_DEMO_DATA === "true") {
    await seedAIVoiceReadinessDemoData(prisma);
    console.log("Seeded Step 4A, Step 4B-1, and Step 4B-2 demo data.");
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
