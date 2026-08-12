-- ============================================================
-- Pass: simplify registration to a single form with only the
-- fields the app now collects. Replaces the 5-step wizard schema
-- (horoscope / family / reference / event-participation tables,
-- plus the caste/religion/district/etc. columns on `members`)
-- with one flat set of columns on `members`.
--
-- Kept from the old schema (still relevant, just consolidated
-- onto `members`): dob, height_cm, education_id, occupation_id,
-- star_id, rasi_id (now used as "sign"), native_place.
-- Master tables (religions, castes, districts, incomes, doshams,
-- relationships, events, payment_types, ...) are left in place —
-- they're an admin-masters concern, not a registration concern,
-- and are out of scope for this pass.
-- ============================================================

USE karkathar_matrimony;

-- ---------------- Drop the old per-step tables ----------------
DROP TABLE IF EXISTS member_photos;
DROP TABLE IF EXISTS member_horoscopes;
DROP TABLE IF EXISTS member_family;
DROP TABLE IF EXISTS member_references;
DROP TABLE IF EXISTS member_event_participation;

-- ---------------- Drop no-longer-collected columns on members ----------------
ALTER TABLE members
  DROP FOREIGN KEY fk_members_income,
  DROP FOREIGN KEY fk_members_religion,
  DROP FOREIGN KEY fk_members_caste,
  DROP FOREIGN KEY fk_members_sub_caste,
  DROP FOREIGN KEY fk_members_dosham,
  DROP FOREIGN KEY fk_members_district;

ALTER TABLE members
  DROP INDEX idx_members_religion,
  DROP INDEX idx_members_caste,
  DROP INDEX idx_members_district;

ALTER TABLE members
  DROP COLUMN marital_status,
  DROP COLUMN weight_kg,
  DROP COLUMN income_id,
  DROP COLUMN religion_id,
  DROP COLUMN caste_id,
  DROP COLUMN sub_caste_id,
  DROP COLUMN dosham_id,
  DROP COLUMN district_id,
  DROP COLUMN current_address,
  DROP COLUMN state,
  DROP COLUMN country,
  DROP COLUMN photo_path,
  DROP COLUMN id_proof_path,
  DROP COLUMN about_myself,
  DROP COLUMN diet,
  DROP COLUMN smoking,
  DROP COLUMN drinking,
  DROP COLUMN physically_challenged,
  DROP COLUMN pincode,
  DROP COLUMN company_name,
  DROP COLUMN work_location;

-- ---------------- Add the new simplified fields ----------------
ALTER TABLE members
  ADD COLUMN gothram              VARCHAR(100)   NULL AFTER dob,
  ADD COLUMN address              VARCHAR(500)   NULL AFTER gothram,
  ADD COLUMN quarter              VARCHAR(150)   NULL AFTER address,
  ADD COLUMN father_name          VARCHAR(150)   NULL AFTER occupation_id,
  ADD COLUMN mother_name          VARCHAR(150)   NULL AFTER father_name,
  ADD COLUMN residence            VARCHAR(500)   NULL AFTER native_place,
  ADD COLUMN registrar_name       VARCHAR(150)   NULL COMMENT 'Reference / witness person named at registration' AFTER residence,
  ADD COLUMN brothers             TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER registrar_name,
  ADD COLUMN sisters              TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER brothers,
  ADD COLUMN participating        ENUM('yes','no') NULL COMMENT 'Participating in the event in person' AFTER sisters,
  ADD COLUMN payment_amount       DECIMAL(10,2)  NULL AFTER participating,
  ADD COLUMN payment_date         DATE           NULL AFTER payment_amount,
  ADD COLUMN payment_reference    VARCHAR(100)   NULL AFTER payment_date,
  ADD COLUMN payment_screenshot_path VARCHAR(255) NULL AFTER payment_reference;

-- height_cm, education_id, occupation_id, star_id, rasi_id, native_place
-- already exist from Pass 3 and are reused as-is (rasi_id = "sign").
