/*
  Warnings:

  - You are about to drop the column `boundaryAccuracy` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `boundarySource` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `lotArea` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `osmBuildingGeometry` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `parcelData` on the `images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `images` DROP COLUMN `boundaryAccuracy`,
    DROP COLUMN `boundarySource`,
    DROP COLUMN `lotArea`,
    DROP COLUMN `osmBuildingGeometry`,
    DROP COLUMN `parcelData`;
