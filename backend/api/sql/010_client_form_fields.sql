-- ============================================================
-- Additional fields for the client-facing registration design
-- (uploaded HTML prototype): parent contact details, birth order,
-- workplace, and pincode. All nullable — existing rows are
-- unaffected, and these are optional enrichments on top of the
-- already-complete Pass 3 registration data.
-- ============================================================

USE karkathar_matrimony;

ALTER TABLE members
  ADD COLUMN pincode CHAR(6) NULL AFTER current_address,
  ADD COLUMN company_name VARCHAR(150) NULL AFTER occupation_id,
  ADD COLUMN work_location VARCHAR(150) NULL AFTER company_name;

ALTER TABLE member_family
  ADD COLUMN father_native_place VARCHAR(150) NULL AFTER father_occupation,
  ADD COLUMN father_mobile CHAR(10) NULL AFTER father_native_place,
  ADD COLUMN father_email VARCHAR(150) NULL AFTER father_mobile,
  ADD COLUMN mother_native_place VARCHAR(150) NULL AFTER mother_name,
  ADD COLUMN mother_mobile CHAR(10) NULL AFTER mother_native_place,
  ADD COLUMN birth_order ENUM('eldest','middle','youngest') NULL AFTER married_sisters;
