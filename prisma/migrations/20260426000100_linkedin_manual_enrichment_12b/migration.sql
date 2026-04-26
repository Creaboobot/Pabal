-- Step 12B: manual LinkedIn enrichment readiness.
ALTER TYPE "RecordSourceType" ADD VALUE 'LINKEDIN_USER_PROVIDED';

ALTER TABLE "people"
ADD COLUMN "linkedin_url" TEXT,
ADD COLUMN "sales_navigator_url" TEXT;
