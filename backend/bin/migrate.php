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
    ADD COLUMN IF NOT EXISTS salary VARCHAR(60) NULL AFTER monthly_income,
    ADD COLUMN IF NOT EXISTS payment_time VARCHAR(15) NOT NULL DEFAULT '' AFTER payment_date,
    ADD COLUMN IF NOT EXISTS payment_bank VARCHAR(60) NOT NULL DEFAULT '' AFTER payment_amount,
    MODIFY COLUMN payment_ref VARCHAR(40) NULL");

db()->exec("CREATE TABLE IF NOT EXISTS site_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  event_date VARCHAR(60) NOT NULL DEFAULT '',
  venue_ta VARCHAR(255) NOT NULL DEFAULT '',
  venue_en VARCHAR(255) NOT NULL DEFAULT '',
  bank_name VARCHAR(150) NOT NULL DEFAULT '',
  bank_name_en VARCHAR(150) NOT NULL DEFAULT '',
  bank_account VARCHAR(40) NOT NULL DEFAULT '',
  bank_ifsc VARCHAR(20) NOT NULL DEFAULT '',
  qr_code MEDIUMTEXT NULL,
  updated_by INT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

db()->exec("INSERT IGNORE INTO site_settings (id, event_date, venue_ta, venue_en, bank_name, bank_account, bank_ifsc) VALUES
  (1, '', 'ஸ்ரீ கணபதி ஹால், Dr. ராஜேந்திரபிரசாத் ரோடு, குரோம்பேட்டை', 'Sri Ganapathi Hall, Dr. Rajendra Prasad Road, Chromepet', 'இந்தியன் வங்கி, சிட்லபாக்கம் கிளை', '935934700', '')");

db()->exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bank_name_en VARCHAR(150) NOT NULL DEFAULT '' AFTER bank_name");
// One-time fills for values that were never set; anything an admin already entered is left alone.
db()->exec("UPDATE site_settings SET bank_name_en = 'Indian Bank, Chitlapakkam Branch' WHERE id = 1 AND bank_name_en = ''");
db()->exec("UPDATE site_settings SET event_date = '27-12-2026' WHERE id = 1 AND event_date = ''");

echo "Migration applied (or already up to date).\n";
