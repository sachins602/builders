/*
  Warnings:

  - You are about to drop the column `name` on the `response` table. All the data in the column will be lost.
  - Added the required column `proompt` to the `Response` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Response_name_idx` ON `response`;

-- AlterTable
ALTER TABLE `response` DROP COLUMN `name`,
    ADD COLUMN `proompt` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Response_proompt_idx` ON `Response`(`proompt`);
