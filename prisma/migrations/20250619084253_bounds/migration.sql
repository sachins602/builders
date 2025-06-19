-- AlterTable
ALTER TABLE `images` ADD COLUMN `boundaryAccuracy` VARCHAR(191) NULL,
    ADD COLUMN `boundarySource` VARCHAR(191) NULL,
    ADD COLUMN `buildingArea` DOUBLE NULL,
    ADD COLUMN `buildingType` VARCHAR(191) NULL,
    ADD COLUMN `lotArea` DOUBLE NULL,
    ADD COLUMN `osmBuildingGeometry` JSON NULL,
    ADD COLUMN `osmBuildingId` VARCHAR(191) NULL,
    ADD COLUMN `propertyBoundary` JSON NULL,
    ADD COLUMN `propertyType` VARCHAR(191) NULL;
