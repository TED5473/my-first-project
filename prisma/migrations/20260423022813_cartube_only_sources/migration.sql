-- AlterTable: flip default for new rows
ALTER TABLE "Trim" ALTER COLUMN "sourceVolume" SET DEFAULT 'CARTUBE';

-- Backfill: every existing row that was still tagged with legacy sources
-- moves to CARTUBE so the UI reflects cartube.co.il as the sole source.
UPDATE "Trim"
SET "sourceVolume" = 'CARTUBE'
WHERE "sourceVolume" IN ('IVIA', 'SEED') OR "sourceVolume" IS NULL;

UPDATE "Trim"
SET "sourceSpecs" = 'CARTUBE'
WHERE "sourceSpecs" IN ('IVIA', 'SEED') OR "sourceSpecs" IS NULL;
