-- Step 7A: manual meeting/source metadata foundation.
CREATE TYPE "RecordSourceType" AS ENUM ('MANUAL', 'TEAMS_COPILOT_PASTE');

ALTER TABLE "meetings"
ADD COLUMN "source_type" "RecordSourceType" NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "notes"
ADD COLUMN "source_type" "RecordSourceType" NOT NULL DEFAULT 'MANUAL';

CREATE INDEX "meetings_tenant_id_source_type_idx" ON "meetings"("tenant_id", "source_type");
CREATE INDEX "notes_tenant_id_source_type_idx" ON "notes"("tenant_id", "source_type");
