-- CreateTable
CREATE TABLE `devices` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `devices_device_id_key`(`device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sensor_readings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `device_id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `temp_c` DOUBLE NOT NULL,
    `rh_pct` DOUBLE NOT NULL,
    `tvoc_ppb` INTEGER NOT NULL,
    `eco2_ppm` INTEGER NOT NULL,
    `dust_ugm3` DOUBLE NOT NULL,
    `aqi` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sensor_readings_device_id_timestamp_idx`(`device_id`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sensor_readings` ADD CONSTRAINT `sensor_readings_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`device_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
