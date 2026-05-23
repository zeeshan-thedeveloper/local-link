-- AlterEnum
ALTER TYPE "ResourceType" ADD VALUE IF NOT EXISTS 'web-app';
ALTER TYPE "ResourceType" ADD VALUE IF NOT EXISTS 'api';

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "slug" TEXT;

-- Backfill existing resources with URL-safe, unique slugs.
WITH generated AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        trim(both '-' from lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi'))),
        ''
      ),
      id
    ) AS base_slug
  FROM "Resource"
),
deduped AS (
  SELECT
    id,
    CASE
      WHEN row_number() OVER (PARTITION BY base_slug ORDER BY id) = 1 THEN base_slug
      ELSE base_slug || '-' || left(id, 6)
    END AS slug
  FROM generated
)
UPDATE "Resource"
SET "slug" = deduped.slug
FROM deduped
WHERE "Resource"."id" = deduped.id;

ALTER TABLE "Resource" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");
CREATE INDEX "Resource_slug_idx" ON "Resource"("slug");
