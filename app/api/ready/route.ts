import { NextResponse } from "next/server";

import { getReadinessStatus } from "@/server/config/env";

export const dynamic = "force-dynamic";

export function GET() {
  const readiness = getReadinessStatus(process.env);

  return NextResponse.json(
    {
      status: readiness.ready ? "ready" : "not_ready",
      checks: readiness.checks,
    },
    { status: readiness.ready ? 200 : 503 },
  );
}
