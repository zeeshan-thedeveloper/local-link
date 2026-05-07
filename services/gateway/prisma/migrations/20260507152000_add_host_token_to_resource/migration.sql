-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "tokenHash" TEXT;
ALTER TABLE "Resource" ADD COLUMN "tokenPrefix" TEXT;

-- DropTable
DROP TABLE "ConnectedHost";

-- CreateIndex
CREATE UNIQUE INDEX "Resource_tokenHash_key" ON "Resource"("tokenHash");
