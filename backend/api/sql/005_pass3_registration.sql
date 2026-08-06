-- ============================================================
-- Pass 3: Self-registration wizard schema.
-- Extends `members` with full bio-data (Step 1) and adds one
-- table per remaining step (2-5). All new FK columns to master
-- tables are nullable at the DB level (so this ALTER is safe to
-- run against a non-empty table) — the API layer enforces
-- "required" per the wizard step's validation rules.
-- ============================================================

USE karkathar_matrimony;

-- ---------------- Step 1: Bride/Groom Details -> members ----------------
ALTER TABLE members
  ADD COLUMN marital_status ENUM('single','divorced','widowed','separated') NULL AFTER gender,
  ADD COLUMN dob DATE NULL AFTER marital_status,
  ADD COLUMN height_cm SMALLINT UNSIGNED NULL AFTER dob,
  ADD COLUMN weight_kg SMALLINT UNSIGNED NULL AFTER height_cm,
  ADD COLUMN education_id INT UNSIGNED NULL AFTER weight_kg,
  ADD COLUMN occupation_id INT UNSIGNED NULL AFTER education_id,
  ADD COLUMN income_id INT UNSIGNED NULL AFTER occupation_id,
  ADD COLUMN religion_id INT UNSIGNED NULL AFTER income_id,
  ADD COLUMN caste_id INT UNSIGNED NULL AFTER religion_id,
  ADD COLUMN sub_caste_id INT UNSIGNED NULL AFTER caste_id,
  ADD COLUMN star_id INT UNSIGNED NULL AFTER sub_caste_id,
  ADD COLUMN rasi_id INT UNSIGNED NULL AFTER star_id,
  ADD COLUMN dosham_id INT UNSIGNED NULL AFTER rasi_id,
  ADD COLUMN native_place VARCHAR(150) NULL AFTER dosham_id,
  ADD COLUMN district_id INT UNSIGNED NULL AFTER native_place,
  ADD COLUMN current_address VARCHAR(500) NULL AFTER district_id,
  ADD COLUMN state VARCHAR(100) NULL AFTER current_address,
  ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT 'India' AFTER state,
  ADD COLUMN photo_path VARCHAR(255) NULL AFTER country,
  ADD COLUMN id_proof_path VARCHAR(255) NULL AFTER photo_path,
  ADD COLUMN about_myself VARCHAR(2000) NULL AFTER id_proof_path,
  ADD COLUMN diet ENUM('veg','nonveg') NULL AFTER about_myself,
  ADD COLUMN smoking ENUM('yes','no','occasionally') NULL AFTER diet,
  ADD COLUMN drinking ENUM('yes','no','occasionally') NULL AFTER smoking,
  ADD COLUMN physically_challenged ENUM('yes','no') NOT NULL DEFAULT 'no' AFTER drinking,
  ADD CONSTRAINT fk_members_education FOREIGN KEY (education_id) REFERENCES educations(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_occupation FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_income FOREIGN KEY (income_id) REFERENCES incomes(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_religion FOREIGN KEY (religion_id) REFERENCES religions(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_caste FOREIGN KEY (caste_id) REFERENCES castes(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_sub_caste FOREIGN KEY (sub_caste_id) REFERENCES sub_castes(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_star FOREIGN KEY (star_id) REFERENCES stars(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_rasi FOREIGN KEY (rasi_id) REFERENCES rasis(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_dosham FOREIGN KEY (dosham_id) REFERENCES doshams(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_members_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT,
  ADD INDEX idx_members_religion (religion_id),
  ADD INDEX idx_members_caste (caste_id),
  ADD INDEX idx_members_district (district_id),
  ADD INDEX idx_members_dob (dob);

-- ---------------- Additional photos (max 10, enforced in API) ----------------
CREATE TABLE member_photos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_id         INT UNSIGNED NOT NULL,
  file_path         VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_member_photos_member (member_id),
  CONSTRAINT fk_member_photos_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Step 2: Horoscope (one row per member) ----------------
CREATE TABLE member_horoscopes (
  member_id            INT UNSIGNED PRIMARY KEY,
  birth_date           DATE NOT NULL,
  birth_time           TIME NOT NULL,
  birth_place          VARCHAR(150) NOT NULL,
  star_id              INT UNSIGNED NOT NULL,
  rasi_id              INT UNSIGNED NOT NULL,
  lagnam               VARCHAR(100) NOT NULL,
  gothram              VARCHAR(100) NULL,
  chevvai_dosham       ENUM('yes','no') NOT NULL,
  rahu_dosham          ENUM('yes','no') NOT NULL,
  kethu_dosham         ENUM('yes','no') NOT NULL,
  kalasarpa_dosham     ENUM('yes','no') NOT NULL,
  horoscope_file_path  VARCHAR(255) NOT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_horoscope_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  CONSTRAINT fk_horoscope_star FOREIGN KEY (star_id) REFERENCES stars(id) ON DELETE RESTRICT,
  CONSTRAINT fk_horoscope_rasi FOREIGN KEY (rasi_id) REFERENCES rasis(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------- Step 3: Family (one row per member) ----------------
CREATE TABLE member_family (
  member_id         INT UNSIGNED PRIMARY KEY,
  father_name       VARCHAR(150) NOT NULL,
  mother_name       VARCHAR(150) NOT NULL,
  father_occupation VARCHAR(150) NULL,
  parents_alive     ENUM('yes','no') NOT NULL,
  brothers          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  married_brothers  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sisters           TINYINT UNSIGNED NOT NULL DEFAULT 0,
  married_sisters   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  family_type       ENUM('nuclear','joint') NOT NULL,
  own_house         ENUM('yes','no') NOT NULL,
  family_income_id  INT UNSIGNED NULL,
  family_photo_path VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_family_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  CONSTRAINT fk_family_income FOREIGN KEY (family_income_id) REFERENCES incomes(id) ON DELETE RESTRICT,
  CONSTRAINT chk_family_married_brothers CHECK (married_brothers <= brothers),
  CONSTRAINT chk_family_married_sisters CHECK (married_sisters <= sisters)
) ENGINE=InnoDB;

-- ---------------- Step 4: Reference (one row per member) ----------------
CREATE TABLE member_references (
  member_id       INT UNSIGNED PRIMARY KEY,
  reference_name  VARCHAR(150) NOT NULL,
  relationship_id INT UNSIGNED NOT NULL,
  phone           CHAR(10) NOT NULL,
  address         VARCHAR(500) NULL,
  known_since     VARCHAR(50) NULL,
  remarks         VARCHAR(500) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reference_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  CONSTRAINT fk_reference_relationship FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------- Step 5: Event participation (one row per member) ----------------
CREATE TABLE member_event_participation (
  member_id           INT UNSIGNED PRIMARY KEY,
  participating       ENUM('yes','no') NOT NULL,
  event_id            INT UNSIGNED NULL,
  batch               VARCHAR(100) NULL,
  food_preference     ENUM('veg','nonveg') NULL,
  payment_type_id     INT UNSIGNED NULL,
  amount              DECIMAL(10,2) NULL,
  transaction_number  VARCHAR(100) NULL,
  receipt_path        VARCHAR(255) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_participation_txn (transaction_number),
  CONSTRAINT fk_participation_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  CONSTRAINT fk_participation_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  CONSTRAINT fk_participation_payment_type FOREIGN KEY (payment_type_id) REFERENCES payment_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
