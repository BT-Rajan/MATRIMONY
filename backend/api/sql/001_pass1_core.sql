-- ============================================================
-- Karkathar Mangala Sandhippu (கார்காத்தார் மங்கள சந்திப்பு)
-- Pass 1: core schema — auth + audit only.
-- Later passes ALTER these tables / add new ones; never destructive.
-- ============================================================

CREATE DATABASE IF NOT EXISTS karkathar_matrimony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE karkathar_matrimony;

-- ----------------------------------------------------------------
-- admins: staff who manage the platform
-- ----------------------------------------------------------------
CREATE TABLE admins (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username         VARCHAR(50)  NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  name             VARCHAR(150) NOT NULL,
  email            VARCHAR(150) NULL,
  role             ENUM('super_admin','admin','staff') NOT NULL DEFAULT 'staff',
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at    DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admins_username (username),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- members: core identity + login fields for Pass 1.
-- Full profile columns (bio-data, horoscope, family, reference,
-- event) are added by Pass 2/3 migrations without touching these.
-- ----------------------------------------------------------------
CREATE TABLE members (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_number  CHAR(5)      NOT NULL COMMENT 'Zero-padded, e.g. 00001. Never reused after delete.',
  name_english         VARCHAR(100) NOT NULL,
  name_tamil           VARCHAR(100) NULL,
  gender               ENUM('bride','groom') NOT NULL,
  email                VARCHAR(150) NOT NULL,
  mobile               CHAR(10)     NOT NULL,
  whatsapp             CHAR(10)     NULL,
  password_hash        VARCHAR(255) NOT NULL,
  status               ENUM('draft','pending_approval','approved','rejected','blocked','archived')
                         NOT NULL DEFAULT 'draft',
  registration_step     TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Resume point for the 5-step wizard (Pass 3)',
  is_verified           TINYINT(1)   NOT NULL DEFAULT 0,
  last_login_at         DATETIME     NULL,
  created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_members_registration_number (registration_number),
  UNIQUE KEY uq_members_email (email),
  UNIQUE KEY uq_members_mobile (mobile),
  KEY idx_members_status (status)
) ENGINE=InnoDB;

-- Guarantees registration numbers are never reused, even after a
-- member row is deleted (Pass 4 admin delete must only soft-delete
-- via status='archived' in practice, but this sequence is the
-- belt-and-braces backstop).
CREATE TABLE registration_number_sequence (
  id            TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  last_number   INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO registration_number_sequence (id, last_number) VALUES (1, 0);

-- ----------------------------------------------------------------
-- audit_log: every sensitive action, across every module/pass
-- ----------------------------------------------------------------
CREATE TABLE audit_log (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id     INT UNSIGNED NULL COMMENT 'admins.id or members.id, per actor_type',
  actor_type   ENUM('admin','member','system') NOT NULL,
  action       VARCHAR(100) NOT NULL COMMENT 'e.g. login_success, member_approved, payment_recorded',
  entity_type  VARCHAR(50)  NULL,
  entity_id    INT UNSIGNED NULL,
  old_values   JSON NULL,
  new_values   JSON NULL,
  ip_address   VARCHAR(45)  NULL,
  user_agent   VARCHAR(255) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_actor (actor_type, actor_id),
  KEY idx_audit_created_at (created_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- login_attempts: brute-force throttling for both login forms
-- ----------------------------------------------------------------
CREATE TABLE login_attempts (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identifier   VARCHAR(160) NOT NULL COMMENT 'e.g. admin:jsmith or member:9876543210',
  success      TINYINT(1)   NOT NULL,
  ip_address   VARCHAR(45)  NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_login_attempts_identifier_time (identifier, created_at)
) ENGINE=InnoDB;
