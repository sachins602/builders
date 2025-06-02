/*
  Warnings:

  - You are about to drop the column `createdByImageId` on the `response` table. All the data in the column will be lost.
  - You are about to drop the `_imagestoresponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_imagestoresponse` DROP FOREIGN KEY `_ImagesToResponse_A_fkey`;

-- DropForeignKey
ALTER TABLE `_imagestoresponse` DROP FOREIGN KEY `_ImagesToResponse_B_fkey`;

-- AlterTable
ALTER TABLE `response` DROP COLUMN `createdByImageId`,
    ADD COLUMN `previousResponseId` INTEGER NULL,
    ADD COLUMN `sourceImageId` INTEGER NULL;

-- DropTable
DROP TABLE `_imagestoresponse`;

-- CreateIndex
CREATE INDEX `Response_previousResponseId_idx` ON `Response`(`previousResponseId`);

-- CreateIndex
CREATE INDEX `Response_sourceImageId_idx` ON `Response`(`sourceImageId`);

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_sourceImageId_fkey` FOREIGN KEY (`sourceImageId`) REFERENCES `Images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_previousResponseId_fkey` FOREIGN KEY (`previousResponseId`) REFERENCES `Response`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
