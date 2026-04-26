// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { getTenantStructuredSearch } from "@/server/services/structured-search";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

describeWithDatabase("structured keyword search", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns tenant-scoped structured results without semantic or AI boundaries", async () => {
    const context = await createTenantContext("search-owner@example.com");
    const otherContext = await createTenantContext("search-other@example.com");

    const person = await createTenantPerson(context, {
      displayName: "Anna Searchable",
      jobTitle: "Transformation Partner",
    });
    await createTenantPerson(otherContext, {
      displayName: "Anna Cross Tenant",
      jobTitle: "Should not appear",
    });
    await createTenantCompany(context, {
      description: "Works on observable search readiness.",
      name: "Searchable Industries",
    });
    await createTenantNote(context, {
      body: "Structured search should find this note body.",
      noteType: "GENERAL",
      summary: "Structured search note",
    });
    await prisma.voiceNote.create({
      data: {
        audioRetentionStatus: "NOT_STORED",
        createdByUserId: context.userId,
        status: "TRANSCRIBED",
        tenantId: context.tenantId,
        title: "Searchable voice note",
        transcriptText: "Voice transcript with structured search context.",
        updatedByUserId: context.userId,
      },
    });

    const result = await getTenantStructuredSearch(context, "search");
    const serialized = JSON.stringify(result);

    expect(result.boundary).toEqual({
      usesAI: false,
      usesEmbeddings: false,
      usesExternalSearch: false,
      usesSemanticRanking: false,
    });
    expect(result.resultCount).toBeGreaterThanOrEqual(3);
    expect(serialized).toContain(person.id);
    expect(serialized).toContain("/people/");
    expect(serialized).toContain("/notes/");
    expect(serialized).toContain("/voice-notes/");
    expect(serialized).not.toContain("Anna Cross Tenant");
  });

  it("returns an empty structured response for blank queries", async () => {
    const context = await createTenantContext("search-blank@example.com");

    const result = await getTenantStructuredSearch(context, "   ");

    expect(result.query).toBe("");
    expect(result.resultCount).toBe(0);
    expect(result.groups).toEqual([]);
  });
});
