<?php
declare(strict_types=1);
// Safe to re-run: every clause is IF NOT EXISTS. For sites created before
// the marital_status/height/salary fields existed. Fresh installs already
// get these columns from schema.sql via bin/install.php.
if (PHP_SAPI !== 'cli') exit(1);
require __DIR__ . '/../src/helpers.php';

db()->exec("ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS marital_status ENUM('first','remarriage') NOT NULL DEFAULT 'first' AFTER gender,
    ADD COLUMN IF NOT EXISTS height VARCHAR(30) NULL AFTER dob,
    ADD COLUMN IF NOT EXISTS salary VARCHAR(60) NULL AFTER monthly_income");

echo "Migration applied (or already up to date).\n";
