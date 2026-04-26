// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireWorkspaceAdmin: vi.fn(),
}));

vi.mock("@/server/services/admin-authorization", () => ({
  requireWorkspaceAdmin: mocks.requireWorkspaceAdmin,
}));

import { MockBillingProvider } from "@/server/providers/billing";
import { getTenantBillingReadiness } from "@/server/services/billing-readiness";

const context = {
  roleKey: "OWNER",
  tenantId: "tenant_test_1",
  tenantName: "Demo Workspace",
  userId: "user_test_1",
} as const;

describe("billing readiness service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireWorkspaceAdmin.mockResolvedValue(context);
  });

  it("requires workspace admin access and returns tenant-scoped provider readiness", async () => {
    const readiness = await getTenantBillingReadiness(
      context,
      new MockBillingProvider(),
    );

    expect(mocks.requireWorkspaceAdmin).toHaveBeenCalledWith(context);
    expect(readiness).toMatchObject({
      billing: {
        providerStatus: {
          provider: "mock",
          status: "INTERNAL",
        },
      },
      currentUserRole: "OWNER",
      tenant: {
        id: "tenant_test_1",
        name: "Demo Workspace",
      },
    });
  });

  it("fails safely for non-admin contexts through the admin helper", async () => {
    mocks.requireWorkspaceAdmin.mockRejectedValueOnce(
      new Error("Workspace admin access is required"),
    );

    await expect(
      getTenantBillingReadiness(
        {
          ...context,
          roleKey: "MEMBER",
        },
        new MockBillingProvider(),
      ),
    ).rejects.toThrow("Workspace admin access is required");
  });
});
