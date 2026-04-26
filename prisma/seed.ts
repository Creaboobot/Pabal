import { PrismaClient } from "@prisma/client";

import { seedFoundationRoles } from "./seed-data/relationship-backbone";
import { seedV1ReviewDemoData } from "./seed-data/v1-review-demo";

const prisma = new PrismaClient();

async function main() {
  await seedFoundationRoles(prisma);
  console.log("Seeded foundation roles.");

  if (process.env.SEED_DEMO_DATA === "true") {
    await seedV1ReviewDemoData(prisma);
    console.log("Seeded deterministic V1 review demo data.");
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
