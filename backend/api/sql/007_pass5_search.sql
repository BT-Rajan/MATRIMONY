-- ============================================================
-- Pass 5: Search.
-- Advanced search itself needs no new columns (it queries existing
-- members/*_horoscopes/*_family/*_references/*_event_participation
-- tables) — only a place to store named, reusable filter sets.
-- ============================================================

USE karkathar_matrimony;

CREATE TABLE saved_searches (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  filters     JSON NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_saved_searches_admin (admin_id),
  CONSTRAINT fk_saved_searches_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;
