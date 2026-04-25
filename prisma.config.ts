import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "prisma/config";

for (const envFile of [".env.local", ".env"]) {
  const path = resolve(process.cwd(), envFile);

  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
