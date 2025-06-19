/*
  Warnings:

  - You are about to drop the column `proompt` on the `response` table. All the data in the column will be lost.
  - Added the required column `prompt` to the `Response` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Response_proompt_idx` ON `response`;

-- AlterTable
ALTER TABLE `images` ADD COLUMN `parcelData` JSON NULL;

-- AlterTable
ALTER TABLE `response` DROP COLUMN `proompt`,
    ADD COLUMN `prompt` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Response_prompt_idx` ON `Response`(`prompt`);
