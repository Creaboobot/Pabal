// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("billing readiness boundaries", () => {
  it("does not add checkout, portal, webhook, or pricing routes", () => {
    const disallowedRoutes = [
      "app/api/billing/checkout/route.ts",
      "app/api/billing/portal/route.ts",
      "app/api/billing/webhook/route.ts",
      "app/(app)/settings/billing/checkout/page.tsx",
      "app/(app)/settings/billing/portal/page.tsx",
      "app/(app)/pricing/page.tsx",
    ];

    for (const route of disallowedRoutes) {
      expect(existsSync(join(root, route))).toBe(false);
    }
  });

  it("does not add billing schema or payment data fields", () => {
    const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");

    expect(schema).not.toContain("TenantBillingProfile");
    expect(schema).not.toContain("PaymentMethod");
    expect(schema).not.toContain("Invoice");
    expect(schema).not.toContain("externalCustomerId");
    expect(schema).not.toContain("externalSubscriptionId");
    expect(schema).not.toContain("stripe");
  });

  it("keeps billing readiness read-only with no audit log writes", () => {
    const service = readFileSync(
      join(root, "server/services/billing-readiness.ts"),
      "utf8",
    );

    expect(service).not.toContain("writeAuditLog");
    expect(service).not.toContain(".create(");
    expect(service).not.toContain(".update(");
    expect(service).not.toContain(".delete(");
  });

  it("does not add a Stripe provider or live Stripe calls", () => {
    const providerDir = join(root, "server/providers/billing");
    const providerFiles = readdirSync(providerDir).filter((file) =>
      file.endsWith(".ts"),
    );

    for (const file of providerFiles) {
      const content = readFileSync(join(providerDir, file), "utf8");
      expect(content.toLowerCase()).not.toContain("stripe");
    }
  });
});
