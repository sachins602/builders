/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Response_prompt_idx` ON `response`;

-- AlterTable
ALTER TABLE `images` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `response` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    MODIFY `prompt` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `bio` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `SharedChain` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `responseId` INTEGER NOT NULL,
    `sharedById` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `commentCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `SharedChain_sharedById_idx`(`sharedById`),
    INDEX `SharedChain_isPublic_idx`(`isPublic`),
    INDEX `SharedChain_deletedAt_idx`(`deletedAt`),
    INDEX `SharedChain_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SharedChainUser` (
    `id` VARCHAR(191) NOT NULL,
    `sharedChainId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SharedChainUser_sharedChainId_idx`(`sharedChainId`),
    INDEX `SharedChainUser_userId_idx`(`userId`),
    UNIQUE INDEX `SharedChainUser_sharedChainId_userId_key`(`sharedChainId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Like` (
    `id` VARCHAR(191) NOT NULL,
    `responseId` INTEGER NULL,
    `sharedChainId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Like_responseId_idx`(`responseId`),
    INDEX `Like_sharedChainId_idx`(`sharedChainId`),
    INDEX `Like_userId_idx`(`userId`),
    UNIQUE INDEX `Like_userId_responseId_key`(`userId`, `responseId`),
    UNIQUE INDEX `Like_userId_sharedChainId_key`(`userId`, `sharedChainId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `responseId` INTEGER NULL,
    `sharedChainId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Comment_responseId_idx`(`responseId`),
    INDEX `Comment_sharedChainId_idx`(`sharedChainId`),
    INDEX `Comment_authorId_idx`(`authorId`),
    INDEX `Comment_deletedAt_idx`(`deletedAt`),
    INDEX `Comment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Images_deletedAt_idx` ON `Images`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Response_prompt_idx` ON `Response`(`prompt`(300));

-- CreateIndex
CREATE INDEX `Response_deletedAt_idx` ON `Response`(`deletedAt`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- CreateIndex
CREATE INDEX `User_deletedAt_idx` ON `User`(`deletedAt`);

-- AddForeignKey
ALTER TABLE `SharedChain` ADD CONSTRAINT `SharedChain_responseId_fkey` FOREIGN KEY (`responseId`) REFERENCES `Response`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SharedChain` ADD CONSTRAINT `SharedChain_sharedById_fkey` FOREIGN KEY (`sharedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SharedChainUser` ADD CONSTRAINT `SharedChainUser_sharedChainId_fkey` FOREIGN KEY (`sharedChainId`) REFERENCES `SharedChain`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SharedChainUser` ADD CONSTRAINT `SharedChainUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_responseId_fkey` FOREIGN KEY (`responseId`) REFERENCES `Response`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_sharedChainId_fkey` FOREIGN KEY (`sharedChainId`) REFERENCES `SharedChain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_responseId_fkey` FOREIGN KEY (`responseId`) REFERENCES `Response`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_sharedChainId_fkey` FOREIGN KEY (`sharedChainId`) REFERENCES `SharedChain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `Images_createdById_idx` ON `Images`(`createdById`);

-- CreateIndex
CREATE INDEX `Response_createdById_idx` ON `Response`(`createdById`);
