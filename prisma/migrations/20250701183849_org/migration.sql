/*
  Warnings:

  - You are about to drop the column `storageType` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `storageType` on the `response` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `images` DROP COLUMN `storageType`;

-- AlterTable
ALTER TABLE `response` DROP COLUMN `storageType`;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `neighbourhood` VARCHAR(191) NULL,
    `borough` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,

    INDEX `Organization_name_idx`(`name`),
    INDEX `Organization_lat_lng_idx`(`lat`, `lng`),
    INDEX `Organization_neighbourhood_idx`(`neighbourhood`),
    INDEX `Organization_borough_idx`(`borough`),
    INDEX `Organization_city_idx`(`city`),
    INDEX `Organization_createdById_idx`(`createdById`),
    INDEX `Organization_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationMember` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,

    INDEX `OrganizationMember_organizationId_idx`(`organizationId`),
    INDEX `OrganizationMember_userId_idx`(`userId`),
    INDEX `OrganizationMember_leftAt_idx`(`leftAt`),
    UNIQUE INDEX `OrganizationMember_organizationId_userId_key`(`organizationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Session_userId_idx` ON `Session`(`userId`);

-- CreateIndex
CREATE INDEX `SharedChain_responseId_idx` ON `SharedChain`(`responseId`);
