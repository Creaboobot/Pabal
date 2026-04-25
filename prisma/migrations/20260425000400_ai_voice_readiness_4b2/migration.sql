-- ExtendEnum
ALTER TYPE "SourceEntityType" ADD VALUE 'AI_PROPOSAL';
ALTER TYPE "SourceEntityType" ADD VALUE 'AI_PROPOSAL_ITEM';
ALTER TYPE "SourceEntityType" ADD VALUE 'VOICE_NOTE';
ALTER TYPE "SourceEntityType" ADD VALUE 'VOICE_MENTION';

-- CreateEnum
CREATE TYPE "AIProposalType" AS ENUM ('NOTE_EXTRACTION', 'VOICE_NOTE_EXTRACTION', 'MEETING_EXTRACTION', 'RELATIONSHIP_UPDATE', 'FOLLOW_UP_SUGGESTION', 'INTRODUCTION_SUGGESTION', 'OTHER');

-- CreateEnum
CREATE TYPE "AIProposalStatus" AS ENUM ('PENDING_REVIEW', 'IN_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AIProposalActionType" AS ENUM ('CREATE', 'UPDATE', 'ARCHIVE', 'LINK', 'UNLINK', 'NO_OP');

-- CreateEnum
CREATE TYPE "AIProposalItemStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CLARIFICATION');

-- CreateEnum
CREATE TYPE "VoiceNoteStatus" AS ENUM ('DRAFT', 'AWAITING_TRANSCRIPTION', 'TRANSCRIBED', 'TRANSCRIPTION_FAILED', 'READY_FOR_REVIEW', 'REVIEWED', 'DELETED');

-- CreateEnum
CREATE TYPE "VoiceAudioRetentionStatus" AS ENUM ('NOT_STORED', 'PENDING_DELETION', 'DELETED', 'RETAINED_WITH_CONSENT');

-- CreateEnum
CREATE TYPE "VoiceMentionType" AS ENUM ('PERSON', 'COMPANY', 'MEETING', 'NOTE', 'TASK', 'COMMITMENT', 'NEED', 'CAPABILITY', 'INTRODUCTION_SUGGESTION', 'UNKNOWN');

-- CreateTable
CREATE TABLE "ai_proposals" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "proposal_type" "AIProposalType" NOT NULL DEFAULT 'OTHER',
  "status" "AIProposalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "source_note_id" TEXT,
  "source_meeting_id" TEXT,
  "source_voice_note_id" TEXT,
  "target_entity_type" "SourceEntityType",
  "target_entity_id" TEXT,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "explanation" TEXT,
  "confidence" DOUBLE PRECISION,
  "created_by_user_id" TEXT,
  "reviewed_by_user_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "review_note" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ai_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_proposal_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "ai_proposal_id" TEXT NOT NULL,
  "action_type" "AIProposalActionType" NOT NULL DEFAULT 'NO_OP',
  "status" "AIProposalItemStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "target_entity_type" "SourceEntityType",
  "target_entity_id" TEXT,
  "proposed_patch" JSONB NOT NULL,
  "explanation" TEXT,
  "confidence" DOUBLE PRECISION,
  "created_by_user_id" TEXT,
  "reviewed_by_user_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "review_note" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ai_proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_notes" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "status" "VoiceNoteStatus" NOT NULL DEFAULT 'DRAFT',
  "title" TEXT,
  "person_id" TEXT,
  "company_id" TEXT,
  "meeting_id" TEXT,
  "note_id" TEXT,
  "transcript_text" TEXT,
  "edited_transcript_text" TEXT,
  "language" TEXT,
  "transcript_confidence" DOUBLE PRECISION,
  "audio_storage_key" TEXT,
  "audio_mime_type" TEXT,
  "audio_size_bytes" INTEGER,
  "audio_duration_seconds" INTEGER,
  "audio_retention_status" "VoiceAudioRetentionStatus" NOT NULL DEFAULT 'NOT_STORED',
  "raw_audio_deleted_at" TIMESTAMP(3),
  "retention_expires_at" TIMESTAMP(3),
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "voice_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_mentions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "voice_note_id" TEXT NOT NULL,
  "mention_text" TEXT NOT NULL,
  "mention_type" "VoiceMentionType" NOT NULL DEFAULT 'UNKNOWN',
  "start_char" INTEGER,
  "end_char" INTEGER,
  "resolved_entity_type" "SourceEntityType",
  "resolved_entity_id" TEXT,
  "confidence" DOUBLE PRECISION,
  "requires_user_confirmation" BOOLEAN NOT NULL DEFAULT true,
  "confirmed_by_user_id" TEXT,
  "confirmed_at" TIMESTAMP(3),
  "created_by_user_id" TEXT,
  "updated_by_user_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "voice_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_proposals_id_tenant_id_key" ON "ai_proposals"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_id_status_idx" ON "ai_proposals"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_id_proposal_type_idx" ON "ai_proposals"("tenant_id", "proposal_type");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_id_source_note_id_idx" ON "ai_proposals"("tenant_id", "source_note_id");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_id_source_meeting_id_idx" ON "ai_proposals"("tenant_id", "source_meeting_id");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_id_source_voice_note_id_idx" ON "ai_proposals"("tenant_id", "source_voice_note_id");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_target_idx" ON "ai_proposals"("tenant_id", "target_entity_type", "target_entity_id");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_id_created_at_idx" ON "ai_proposals"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_proposals_tenant_id_archived_at_idx" ON "ai_proposals"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_proposal_items_id_tenant_id_key" ON "ai_proposal_items"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "ai_proposal_items_tenant_id_ai_proposal_id_idx" ON "ai_proposal_items"("tenant_id", "ai_proposal_id");

-- CreateIndex
CREATE INDEX "ai_proposal_items_tenant_id_status_idx" ON "ai_proposal_items"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ai_proposal_items_tenant_id_action_type_idx" ON "ai_proposal_items"("tenant_id", "action_type");

-- CreateIndex
CREATE INDEX "ai_proposal_items_tenant_target_idx" ON "ai_proposal_items"("tenant_id", "target_entity_type", "target_entity_id");

-- CreateIndex
CREATE INDEX "ai_proposal_items_tenant_id_archived_at_idx" ON "ai_proposal_items"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "voice_notes_id_tenant_id_key" ON "voice_notes"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "voice_notes_tenant_id_status_idx" ON "voice_notes"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "voice_notes_tenant_id_person_id_idx" ON "voice_notes"("tenant_id", "person_id");

-- CreateIndex
CREATE INDEX "voice_notes_tenant_id_company_id_idx" ON "voice_notes"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "voice_notes_tenant_id_meeting_id_idx" ON "voice_notes"("tenant_id", "meeting_id");

-- CreateIndex
CREATE INDEX "voice_notes_tenant_id_note_id_idx" ON "voice_notes"("tenant_id", "note_id");

-- CreateIndex
CREATE INDEX "voice_notes_tenant_id_created_at_idx" ON "voice_notes"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "voice_notes_tenant_id_archived_at_idx" ON "voice_notes"("tenant_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "voice_mentions_id_tenant_id_key" ON "voice_mentions"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "voice_mentions_tenant_id_voice_note_id_idx" ON "voice_mentions"("tenant_id", "voice_note_id");

-- CreateIndex
CREATE INDEX "voice_mentions_tenant_id_mention_type_idx" ON "voice_mentions"("tenant_id", "mention_type");

-- CreateIndex
CREATE INDEX "voice_mentions_tenant_resolved_idx" ON "voice_mentions"("tenant_id", "resolved_entity_type", "resolved_entity_id");

-- CreateIndex
CREATE INDEX "voice_mentions_tenant_id_archived_at_idx" ON "voice_mentions"("tenant_id", "archived_at");

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_source_note_id_tenant_id_fkey" FOREIGN KEY ("source_note_id", "tenant_id") REFERENCES "notes"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_source_meeting_id_tenant_id_fkey" FOREIGN KEY ("source_meeting_id", "tenant_id") REFERENCES "meetings"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_source_voice_note_id_tenant_id_fkey" FOREIGN KEY ("source_voice_note_id", "tenant_id") REFERENCES "voice_notes"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposal_items" ADD CONSTRAINT "ai_proposal_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposal_items" ADD CONSTRAINT "ai_proposal_items_ai_proposal_id_tenant_id_fkey" FOREIGN KEY ("ai_proposal_id", "tenant_id") REFERENCES "ai_proposals"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposal_items" ADD CONSTRAINT "ai_proposal_items_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposal_items" ADD CONSTRAINT "ai_proposal_items_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_person_id_tenant_id_fkey" FOREIGN KEY ("person_id", "tenant_id") REFERENCES "people"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_company_id_tenant_id_fkey" FOREIGN KEY ("company_id", "tenant_id") REFERENCES "companies"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_meeting_id_tenant_id_fkey" FOREIGN KEY ("meeting_id", "tenant_id") REFERENCES "meetings"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_note_id_tenant_id_fkey" FOREIGN KEY ("note_id", "tenant_id") REFERENCES "notes"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_mentions" ADD CONSTRAINT "voice_mentions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_mentions" ADD CONSTRAINT "voice_mentions_voice_note_id_tenant_id_fkey" FOREIGN KEY ("voice_note_id", "tenant_id") REFERENCES "voice_notes"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_mentions" ADD CONSTRAINT "voice_mentions_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_mentions" ADD CONSTRAINT "voice_mentions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_mentions" ADD CONSTRAINT "voice_mentions_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
