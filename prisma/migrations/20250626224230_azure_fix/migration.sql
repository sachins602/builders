/*
  Warnings:

  - The primary key for the `verificationtoken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `my_row_id` on the `verificationtoken` table. All the data in the column will be lost.
  - The required column `id` was added to the `VerificationToken` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `Comment_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `Comment_responseId_fkey`;

-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `Comment_sharedChainId_fkey`;

-- DropForeignKey
ALTER TABLE `images` DROP FOREIGN KEY `Images_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `like` DROP FOREIGN KEY `Like_responseId_fkey`;

-- DropForeignKey
ALTER TABLE `like` DROP FOREIGN KEY `Like_sharedChainId_fkey`;

-- DropForeignKey
ALTER TABLE `like` DROP FOREIGN KEY `Like_userId_fkey`;

-- DropForeignKey
ALTER TABLE `response` DROP FOREIGN KEY `Response_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `response` DROP FOREIGN KEY `Response_previousResponseId_fkey`;

-- DropForeignKey
ALTER TABLE `response` DROP FOREIGN KEY `Response_sourceImageId_fkey`;

-- DropForeignKey
ALTER TABLE `session` DROP FOREIGN KEY `Session_userId_fkey`;

-- DropForeignKey
ALTER TABLE `sharedchain` DROP FOREIGN KEY `SharedChain_responseId_fkey`;

-- DropForeignKey
ALTER TABLE `sharedchain` DROP FOREIGN KEY `SharedChain_sharedById_fkey`;

-- DropForeignKey
ALTER TABLE `sharedchainuser` DROP FOREIGN KEY `SharedChainUser_sharedChainId_fkey`;

-- DropForeignKey
ALTER TABLE `sharedchainuser` DROP FOREIGN KEY `SharedChainUser_userId_fkey`;

-- DropIndex
DROP INDEX `Session_userId_fkey` ON `session`;

-- DropIndex
DROP INDEX `SharedChain_responseId_fkey` ON `sharedchain`;

-- AlterTable
ALTER TABLE `verificationtoken` DROP PRIMARY KEY,
    DROP COLUMN `my_row_id`,
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- RenameIndex
ALTER TABLE `account` RENAME INDEX `Account_userId_fkey` TO `Account_userId_idx`;
