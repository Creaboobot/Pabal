-- ExtendEnum
ALTER TYPE "SourceEntityType" ADD VALUE 'TASK';
ALTER TYPE "SourceEntityType" ADD VALUE 'COMMITMENT';
ALTER TYPE "SourceEntityType" ADD VALUE 'NEED';
ALTER TYPE "SourceEntityType" ADD VALUE 'CAPABILITY';
ALTER TYPE "SourceEntityType" ADD VALUE 'INTRODUCTION_SUGGESTION';

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'SNOOZED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('FOLLOW_UP', 'COMMITMENT', 'INTRODUCTION', 'MEETING_PREP', 'RELATIONSHIP_MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommitmentOwnerType" AS ENUM ('ME', 'OTHER_PERSON', 'COMPANY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('OPEN', 'WAITING', 'DONE', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "NeedType" AS ENUM ('PROBLEM', 'REQUIREMENT', 'REQUEST', 'OPPORTUNITY', 'INTEREST', 'RISK', 'QUESTION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ADDRESSED', 'PARKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CapabilityType" AS ENUM ('EXPERTISE', 'ACCESS', 'ASSET', 'SERVICE_POTENTIAL', 'EXPERIENCE', 'SOLUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "CapabilityStatus" AS ENUM ('ACTIVE', 'PARKED', 'RETIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IntroductionSuggestionStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'OPT_IN_REQUESTED', 'INTRO_SENT', 'COMPLETED', 'REJECTED', 'PARKED');

-- CreateTable
CREATE TABLE "tasks" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "task_type" "TaskType" NOT NULL DEFAULT 'FOLLOW_UP',
  "due_at" TIMESTAMP(3),
  "reminder_at" TIMESTAMP(3),
  "snoozed_until" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "why_now_rationale" TEXT,
  "confidence" DOUBLE PRECISION,
  "person_id" TEXT,
  "company_id" TEXT,
  "meeting_id" TEXT,
  "note_id" TEXT,
  "commitment_id" TEXT,
  "introduction_suggestion_id" TEXT,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commitments" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "owner_type" "CommitmentOwnerType" NOT NULL DEFAULT 'UNKNOWN',
  "owner_person_id" TEXT,
  "owner_company_id" TEXT,
  "counterparty_person_id" TEXT,
  "counterparty_company_id" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "due_at" TIMESTAMP(3),
  "due_window_start" TIMESTAMP(3),
  "due_window_end" TIMESTAMP(3),
  "status" "CommitmentStatus" NOT NULL DEFAULT 'OPEN',
  "sensitivity" "Sensitivity" NOT NULL DEFAULT 'NORMAL',
  "meeting_id" TEXT,
  "note_id" TEXT,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "need_type" "NeedType" NOT NULL DEFAULT 'UNKNOWN',
  "status" "NeedStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "sensitivity" "Sensitivity" NOT NULL DEFAULT 'NORMAL',
  "person_id" TEXT,
  "company_id" TEXT,
  "meeting_id" TEXT,
  "note_id" TEXT,
  "confidence" DOUBLE PRECISION,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capabilities" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "capability_type" "CapabilityType" NOT NULL DEFAULT 'OTHER',
  "status" "CapabilityStatus" NOT NULL DEFAULT 'ACTIVE',
  "sensitivity" "Sensitivity" NOT NULL DEFAULT 'NORMAL',
  "person_id" TEXT,
  "company_id" TEXT,
  "note_id" TEXT,
  "confidence" DOUBLE PRECISION,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "introduction_suggestions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "need_id" TEXT,
  "capability_id" TEXT,
  "from_person_id" TEXT,
  "to_person_id" TEXT,
  "from_company_id" TEXT,
  "to_company_id" TEXT,
  "rationale" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "status" "IntroductionSuggestionStatus" NOT NULL DEFAULT 'PROPOSED',
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "introduction_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tasks_id_tenant_id_key" ON "tasks"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_status_due_at_idx" ON "tasks"("tenant_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_reminder_at_idx" ON "tasks"("tenant_id", "reminder_at");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_person_id_idx" ON "tasks"("tenant_id", "person_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_company_id_idx" ON "tasks"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_meeting_id_idx" ON "tasks"("tenant_id", "meeting_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_note_id_idx" ON "tasks"("tenant_id", "note_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_commitment_id_idx" ON "tasks"("tenant_id", "commitment_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_introduction_suggestion_id_idx" ON "tasks"("tenant_id", "introduction_suggestion_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_archived_at_idx" ON "tasks"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "commitments_id_tenant_id_key" ON "commitments"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_status_due_at_idx" ON "commitments"("tenant_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_owner_person_id_idx" ON "commitments"("tenant_id", "owner_person_id");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_owner_company_id_idx" ON "commitments"("tenant_id", "owner_company_id");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_counterparty_person_id_idx" ON "commitments"("tenant_id", "counterparty_person_id");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_counterparty_company_id_idx" ON "commitments"("tenant_id", "counterparty_company_id");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_meeting_id_idx" ON "commitments"("tenant_id", "meeting_id");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_note_id_idx" ON "commitments"("tenant_id", "note_id");

-- CreateIndex
CREATE INDEX "commitments_tenant_id_archived_at_idx" ON "commitments"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "needs_id_tenant_id_key" ON "needs"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "needs_tenant_id_status_priority_idx" ON "needs"("tenant_id", "status", "priority");

-- CreateIndex
CREATE INDEX "needs_tenant_id_person_id_idx" ON "needs"("tenant_id", "person_id");

-- CreateIndex
CREATE INDEX "needs_tenant_id_company_id_idx" ON "needs"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "needs_tenant_id_meeting_id_idx" ON "needs"("tenant_id", "meeting_id");

-- CreateIndex
CREATE INDEX "needs_tenant_id_note_id_idx" ON "needs"("tenant_id", "note_id");

-- CreateIndex
CREATE INDEX "needs_tenant_id_archived_at_idx" ON "needs"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "capabilities_id_tenant_id_key" ON "capabilities"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "capabilities_tenant_id_status_idx" ON "capabilities"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "capabilities_tenant_id_person_id_idx" ON "capabilities"("tenant_id", "person_id");

-- CreateIndex
CREATE INDEX "capabilities_tenant_id_company_id_idx" ON "capabilities"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "capabilities_tenant_id_note_id_idx" ON "capabilities"("tenant_id", "note_id");

-- CreateIndex
CREATE INDEX "capabilities_tenant_id_archived_at_idx" ON "capabilities"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "introduction_suggestions_id_tenant_id_key" ON "introduction_suggestions"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_status_idx" ON "introduction_suggestions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_need_id_idx" ON "introduction_suggestions"("tenant_id", "need_id");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_capability_id_idx" ON "introduction_suggestions"("tenant_id", "capability_id");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_from_person_id_idx" ON "introduction_suggestions"("tenant_id", "from_person_id");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_to_person_id_idx" ON "introduction_suggestions"("tenant_id", "to_person_id");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_from_company_id_idx" ON "introduction_suggestions"("tenant_id", "from_company_id");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_to_company_id_idx" ON "introduction_suggestions"("tenant_id", "to_company_id");

-- CreateIndex
CREATE INDEX "introduction_suggestions_tenant_id_archived_at_idx" ON "introduction_suggestions"("tenant_id", "archived_at");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_person_id_tenant_id_fkey" FOREIGN KEY ("person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_tenant_id_fkey" FOREIGN KEY ("company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_meeting_id_tenant_id_fkey" FOREIGN KEY ("meeting_id", "tenant_id") REFERENCES "meetings"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_note_id_tenant_id_fkey" FOREIGN KEY ("note_id", "tenant_id") REFERENCES "notes"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_commitment_id_tenant_id_fkey" FOREIGN KEY ("commitment_id", "tenant_id") REFERENCES "commitments"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_introduction_suggestion_id_tenant_id_fkey" FOREIGN KEY ("introduction_suggestion_id", "tenant_id") REFERENCES "introduction_suggestions"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_owner_person_id_tenant_id_fkey" FOREIGN KEY ("owner_person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_owner_company_id_tenant_id_fkey" FOREIGN KEY ("owner_company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_counterparty_person_id_tenant_id_fkey" FOREIGN KEY ("counterparty_person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_counterparty_company_id_tenant_id_fkey" FOREIGN KEY ("counterparty_company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_meeting_id_tenant_id_fkey" FOREIGN KEY ("meeting_id", "tenant_id") REFERENCES "meetings"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_note_id_tenant_id_fkey" FOREIGN KEY ("note_id", "tenant_id") REFERENCES "notes"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_person_id_tenant_id_fkey" FOREIGN KEY ("person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_company_id_tenant_id_fkey" FOREIGN KEY ("company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_meeting_id_tenant_id_fkey" FOREIGN KEY ("meeting_id", "tenant_id") REFERENCES "meetings"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_note_id_tenant_id_fkey" FOREIGN KEY ("note_id", "tenant_id") REFERENCES "notes"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_person_id_tenant_id_fkey" FOREIGN KEY ("person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_company_id_tenant_id_fkey" FOREIGN KEY ("company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_note_id_tenant_id_fkey" FOREIGN KEY ("note_id", "tenant_id") REFERENCES "notes"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_need_id_tenant_id_fkey" FOREIGN KEY ("need_id", "tenant_id") REFERENCES "needs"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_capability_id_tenant_id_fkey" FOREIGN KEY ("capability_id", "tenant_id") REFERENCES "capabilities"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_from_person_id_tenant_id_fkey" FOREIGN KEY ("from_person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_to_person_id_tenant_id_fkey" FOREIGN KEY ("to_person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_from_company_id_tenant_id_fkey" FOREIGN KEY ("from_company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_to_company_id_tenant_id_fkey" FOREIGN KEY ("to_company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_suggestions" ADD CONSTRAINT "introduction_suggestions_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
