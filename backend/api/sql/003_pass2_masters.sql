-- ============================================================
-- Pass 2: Masters module.
-- 15 master tables. Two shapes:
--   "simple"       — id, name_tamil, name_english, sort_order, is_active
--   "hierarchical" — simple + a parent_id FK (RESTRICT on delete,
--                    so a parent can never be deleted while children
--                    reference it — the frontend surfaces this as a
--                    friendly Tamil error rather than a raw DB error)
-- Every table has created_by/updated_by (admins.id) for accountability,
-- on top of the row-level audit_log entries written by the API layer.
-- ============================================================

USE karkathar_matrimony;

-- ---------------- Religion (simple) ----------------
CREATE TABLE religions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_religions_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Caste (parent: Religion) ----------------
CREATE TABLE castes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  religion_id  INT UNSIGNED NOT NULL,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_castes_religion_name (religion_id, name_english),
  KEY idx_castes_religion (religion_id),
  CONSTRAINT fk_castes_religion FOREIGN KEY (religion_id) REFERENCES religions(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- Sub Caste (parent: Caste) ----------------
CREATE TABLE sub_castes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  caste_id     INT UNSIGNED NOT NULL,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sub_castes_caste_name (caste_id, name_english),
  KEY idx_sub_castes_caste (caste_id),
  CONSTRAINT fk_sub_castes_caste FOREIGN KEY (caste_id) REFERENCES castes(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- District (simple) ----------------
CREATE TABLE districts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_districts_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Taluk (parent: District) ----------------
CREATE TABLE taluks (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  district_id  INT UNSIGNED NOT NULL,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_taluks_district_name (district_id, name_english),
  KEY idx_taluks_district (district_id),
  CONSTRAINT fk_taluks_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- Village (parent: Taluk) ----------------
CREATE TABLE villages (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  taluk_id     INT UNSIGNED NOT NULL,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_villages_taluk_name (taluk_id, name_english),
  KEY idx_villages_taluk (taluk_id),
  CONSTRAINT fk_villages_taluk FOREIGN KEY (taluk_id) REFERENCES taluks(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- Education (simple) ----------------
CREATE TABLE educations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_educations_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Occupation (simple) ----------------
CREATE TABLE occupations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_occupations_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Income range (simple) ----------------
CREATE TABLE incomes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_incomes_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Star / Nakshatram (simple, fixed list of 27) ----------------
CREATE TABLE stars (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stars_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Rasi (simple, fixed list of 12) ----------------
CREATE TABLE rasis (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rasis_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Dosham (simple) ----------------
CREATE TABLE doshams (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_doshams_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Relationship (simple — for the "Reference" step) ----------------
CREATE TABLE relationships (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_relationships_name_english (name_english)
) ENGINE=InnoDB;

-- ---------------- Event (own shape — date + venue, referenced in Pass 3 Step 5) ----------------
CREATE TABLE events (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(150) NOT NULL,
  name_english VARCHAR(150) NOT NULL,
  event_date   DATE NULL,
  venue        VARCHAR(255) NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------- Payment Type (simple) ----------------
CREATE TABLE payment_types (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_tamil   VARCHAR(100) NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_by   INT UNSIGNED NULL,
  updated_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_types_name_english (name_english)
) ENGINE=InnoDB;
