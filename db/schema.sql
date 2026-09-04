-- கார்காத்தார் மங்கள சந்திப்பு - simplified schema
-- One table per real-world thing. No masters, no audit log, no wizard steps.

CREATE DATABASE IF NOT EXISTS matrimony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE matrimony;

CREATE TABLE profiles (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_number   VARCHAR(20)     NOT NULL UNIQUE,
  name                  VARCHAR(150)    NOT NULL,
  gender                ENUM('bride','groom') NOT NULL,
  dob                   DATE            NOT NULL,
  email                 VARCHAR(150)    NOT NULL UNIQUE,
  phone1                VARCHAR(15)     NOT NULL,
  phone2                VARCHAR(15)     NULL,
  gothram               VARCHAR(100)    NULL,
  address               VARCHAR(500)    NOT NULL,
  quarter               VARCHAR(150)    NULL,
  height_cm             SMALLINT UNSIGNED NOT NULL,
  education             VARCHAR(150)    NOT NULL,
  occupation            VARCHAR(150)    NOT NULL,
  father_name           VARCHAR(150)    NOT NULL,
  mother_name           VARCHAR(150)    NOT NULL,
  star                  VARCHAR(50)     NOT NULL,
  rasi                  VARCHAR(50)     NOT NULL,
  native_place          VARCHAR(150)    NOT NULL,
  residence             VARCHAR(500)    NOT NULL,
  registrar_name        VARCHAR(150)    NOT NULL,
  brothers              TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sisters               TINYINT UNSIGNED NOT NULL DEFAULT 0,
  participating         ENUM('yes','no') NOT NULL,
  payment_amount        DECIMAL(10,2)   NOT NULL,
  payment_date          DATE            NOT NULL,
  payment_reference     VARCHAR(100)    NOT NULL,
  payment_proof_path    VARCHAR(255)    NOT NULL,
  status                ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gender (gender),
  INDEX idx_status (status),
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- One-time codes emailed to prove ownership of an email before editing.
CREATE TABLE otp_codes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(150) NOT NULL,
  otp_hash    CHAR(64)     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  used        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- Short-lived edit session unlocked by a verified OTP. One profile per token.
CREATE TABLE edit_sessions (
  token       CHAR(64)     PRIMARY KEY,
  profile_id  INT UNSIGNED NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE admins (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
