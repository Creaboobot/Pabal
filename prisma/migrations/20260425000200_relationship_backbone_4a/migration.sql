-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('UNKNOWN', 'ACTIVE', 'DORMANT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RelationshipTemperature" AS ENUM ('UNKNOWN', 'COLD', 'COOL', 'NEUTRAL', 'WARM', 'HOT');

-- CreateEnum
CREATE TYPE "MeetingParticipantRole" AS ENUM ('UNKNOWN', 'ORGANIZER', 'HOST', 'ATTENDEE', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('GENERAL', 'PERSON', 'COMPANY', 'MEETING', 'SOURCE_EXCERPT');

-- CreateEnum
CREATE TYPE "Sensitivity" AS ENUM ('NORMAL', 'SENSITIVE_BUSINESS', 'PERSONAL', 'CONFIDENTIAL', 'DO_NOT_USE_IN_OUTREACH', 'DO_NOT_SHARE');

-- CreateEnum
CREATE TYPE "SourceEntityType" AS ENUM ('PERSON', 'COMPANY', 'COMPANY_AFFILIATION', 'MEETING', 'MEETING_PARTICIPANT', 'NOTE');

-- CreateTable
CREATE TABLE "people" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "first_name" TEXT,
  "last_name" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "job_title" TEXT,
  "relationship_status" "RelationshipStatus" NOT NULL DEFAULT 'UNKNOWN',
  "relationship_temperature" "RelationshipTemperature" NOT NULL DEFAULT 'UNKNOWN',
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalized_name" TEXT,
  "website" TEXT,
  "industry" TEXT,
  "description" TEXT,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_affiliations" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "affiliation_title" TEXT,
  "department" TEXT,
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "location" TEXT,
  "summary" TEXT,
  "primary_company_id" TEXT,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "meeting_id" TEXT NOT NULL,
  "person_id" TEXT,
  "company_id" TEXT,
  "name_snapshot" TEXT,
  "email_snapshot" TEXT,
  "participant_role" "MeetingParticipantRole" NOT NULL DEFAULT 'UNKNOWN',
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "summary" TEXT,
  "note_type" "NoteType" NOT NULL DEFAULT 'GENERAL',
  "sensitivity" "Sensitivity" NOT NULL DEFAULT 'NORMAL',
  "person_id" TEXT,
  "company_id" TEXT,
  "meeting_id" TEXT,
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_references" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "source_entity_type" "SourceEntityType" NOT NULL,
  "source_entity_id" TEXT NOT NULL,
  "target_entity_type" "SourceEntityType" NOT NULL,
  "target_entity_id" TEXT NOT NULL,
  "label" TEXT,
  "reason" TEXT,
  "confidence" DOUBLE PRECISION,
  "created_by_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "source_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_id_tenant_id_key" ON "people"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "people_tenant_id_display_name_idx" ON "people"("tenant_id", "display_name");

-- CreateIndex
CREATE INDEX "people_tenant_id_email_idx" ON "people"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "people_tenant_id_archived_at_idx" ON "people"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_id_tenant_id_key" ON "companies"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "companies_tenant_id_name_idx" ON "companies"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "companies_tenant_id_normalized_name_idx" ON "companies"("tenant_id", "normalized_name");

-- CreateIndex
CREATE INDEX "companies_tenant_id_archived_at_idx" ON "companies"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_affiliations_id_tenant_id_key" ON "company_affiliations"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "company_affiliations_tenant_id_person_id_idx" ON "company_affiliations"("tenant_id", "person_id");

-- CreateIndex
CREATE INDEX "company_affiliations_tenant_id_company_id_idx" ON "company_affiliations"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "company_affiliations_tenant_id_archived_at_idx" ON "company_affiliations"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_id_tenant_id_key" ON "meetings"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "meetings_tenant_id_occurred_at_idx" ON "meetings"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "meetings_tenant_id_primary_company_id_idx" ON "meetings"("tenant_id", "primary_company_id");

-- CreateIndex
CREATE INDEX "meetings_tenant_id_archived_at_idx" ON "meetings"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_id_tenant_id_key" ON "meeting_participants"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_tenant_id_meeting_id_person_id_key" ON "meeting_participants"("tenant_id", "meeting_id", "person_id");

-- CreateIndex
CREATE INDEX "meeting_participants_tenant_id_meeting_id_idx" ON "meeting_participants"("tenant_id", "meeting_id");

-- CreateIndex
CREATE INDEX "meeting_participants_tenant_id_person_id_idx" ON "meeting_participants"("tenant_id", "person_id");

-- CreateIndex
CREATE INDEX "meeting_participants_tenant_id_company_id_idx" ON "meeting_participants"("tenant_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "notes_id_tenant_id_key" ON "notes"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_note_type_idx" ON "notes"("tenant_id", "note_type");

-- CreateIndex
CREATE INDEX "notes_tenant_id_person_id_idx" ON "notes"("tenant_id", "person_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_company_id_idx" ON "notes"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_meeting_id_idx" ON "notes"("tenant_id", "meeting_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_archived_at_idx" ON "notes"("tenant_id", "archived_at");

-- CreateIndex
CREATE INDEX "source_references_tenant_id_source_entity_type_source_entity_id_idx" ON "source_references"("tenant_id", "source_entity_type", "source_entity_id");

-- CreateIndex
CREATE INDEX "source_references_tenant_id_target_entity_type_target_entity_id_idx" ON "source_references"("tenant_id", "target_entity_type", "target_entity_id");

-- CreateIndex
CREATE INDEX "source_references_tenant_id_created_at_idx" ON "source_references"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_affiliations" ADD CONSTRAINT "company_affiliations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_affiliations" ADD CONSTRAINT "company_affiliations_person_id_tenant_id_fkey" FOREIGN KEY ("person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_affiliations" ADD CONSTRAINT "company_affiliations_company_id_tenant_id_fkey" FOREIGN KEY ("company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_affiliations" ADD CONSTRAINT "company_affiliations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_affiliations" ADD CONSTRAINT "company_affiliations_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_primary_company_id_tenant_id_fkey" FOREIGN KEY ("primary_company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_tenant_id_fkey" FOREIGN KEY ("meeting_id", "tenant_id") REFERENCES "meetings"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_person_id_tenant_id_fkey" FOREIGN KEY ("person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_company_id_tenant_id_fkey" FOREIGN KEY ("company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_person_id_tenant_id_fkey" FOREIGN KEY ("person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_company_id_tenant_id_fkey" FOREIGN KEY ("company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_meeting_id_tenant_id_fkey" FOREIGN KEY ("meeting_id", "tenant_id") REFERENCES "meetings"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
