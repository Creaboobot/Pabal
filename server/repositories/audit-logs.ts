import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type AuditLogClient = PrismaClient | Prisma.TransactionClient;

export type TenantAuditLogFilters = {
  action?: string | undefined;
  actorUserId?: string | undefined;
  cursor?: string | undefined;
  entityType?: string | undefined;
  from?: Date | undefined;
  limit: number;
  tenantId: string;
  to?: Date | undefined;
};

export type TenantAuditLogRecord = Prisma.AuditLogGetPayload<{
  include: {
    actor: {
      select: {
        email: true;
        id: true;
        name: true;
      };
    };
  };
}>;

export type TenantAuditLogPage = {
  nextCursor: string | null;
  records: TenantAuditLogRecord[];
};

function buildCreatedAtFilter(input: TenantAuditLogFilters) {
  if (!input.from && !input.to) {
    return undefined;
  }

  const filter: Prisma.DateTimeFilter = {};

  if (input.from) {
    filter.gte = input.from;
  }

  if (input.to) {
    filter.lte = input.to;
  }

  return filter;
}

export async function listTenantAuditLogs(
  input: TenantAuditLogFilters,
  db: AuditLogClient = prisma,
): Promise<TenantAuditLogPage> {
  if (input.cursor) {
    const tenantCursor = await db.auditLog.findFirst({
      where: {
        id: input.cursor,
        tenantId: input.tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!tenantCursor) {
      return {
        nextCursor: null,
        records: [],
      };
    }
  }

  const where: Prisma.AuditLogWhereInput = {
    tenantId: input.tenantId,
  };
  const createdAt = buildCreatedAtFilter(input);

  if (input.action) {
    where.action = input.action;
  }

  if (input.actorUserId) {
    where.actorUserId = input.actorUserId;
  }

  if (createdAt) {
    where.createdAt = createdAt;
  }

  if (input.entityType) {
    where.entityType = input.entityType;
  }

  const findManyArgs: Prisma.AuditLogFindManyArgs = {
    take: input.limit + 1,
    where,
    include: {
      actor: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  };

  if (input.cursor) {
    findManyArgs.cursor = {
      id: input.cursor,
    };
    findManyArgs.skip = 1;
  }

  const records = await db.auditLog.findMany(findManyArgs);
  const hasNextPage = records.length > input.limit;
  const visibleRecords = records.slice(0, input.limit);

  return {
    nextCursor: hasNextPage
      ? (visibleRecords[visibleRecords.length - 1]?.id ?? null)
      : null,
    records: visibleRecords,
  };
}
