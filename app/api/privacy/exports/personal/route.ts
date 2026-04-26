import { NextResponse } from "next/server";

import { exportTenantPersonalData } from "@/server/services/data-export";
import { getCurrentUserContext } from "@/server/services/session";
import { TenantAccessDeniedError } from "@/server/services/tenancy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    },
  );
}

function exportFilename(type: "personal" | "workspace") {
  return `pabal-${type}-export-${new Date().toISOString().slice(0, 10)}.json`;
}

function exportResponse(type: "personal" | "workspace", payload: unknown) {
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${exportFilename(type)}"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function POST() {
  const context = await getCurrentUserContext();

  if (!context) {
    return jsonError("Authentication is required.", 401);
  }

  try {
    const payload = await exportTenantPersonalData(context);

    return exportResponse("personal", payload);
  } catch (error) {
    if (error instanceof TenantAccessDeniedError) {
      return jsonError("Tenant access denied.", 403);
    }

    return jsonError("Unable to generate the personal export.", 500);
  }
}
