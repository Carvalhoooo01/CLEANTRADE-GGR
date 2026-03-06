/*
  Warnings:

  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[txid]` on the table `Transacao` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "Transacao" ADD COLUMN     "pixPayload" TEXT,
ADD COLUMN     "txid" TEXT;

-- DropTable
DROP TABLE "Transaction";

-- CreateIndex
CREATE UNIQUE INDEX "Transacao_txid_key" ON "Transacao"("txid");
