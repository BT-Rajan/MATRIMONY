CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','manager') NOT NULL DEFAULT 'manager',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reg_no VARCHAR(20) NULL,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  gender ENUM('male','female') NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  dob DATE NOT NULL,
  gothram VARCHAR(80) NOT NULL,
  nakshatram VARCHAR(60) NOT NULL,
  rasi VARCHAR(60) NOT NULL,
  education VARCHAR(150) NOT NULL,
  occupation VARCHAR(150) NOT NULL,
  work_location VARCHAR(150) NULL,
  monthly_income VARCHAR(60) NULL,
  father_name VARCHAR(120) NOT NULL,
  father_occupation VARCHAR(120) NULL,
  father_native VARCHAR(120) NULL,
  mother_name VARCHAR(120) NOT NULL,
  mother_occupation VARCHAR(120) NULL,
  mother_native VARCHAR(120) NULL,
  siblings VARCHAR(255) NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NULL,
  payment_ref VARCHAR(40) NOT NULL,
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  signature VARCHAR(120) NOT NULL,
  terms_version VARCHAR(10) NOT NULL,
  terms_accepted_at DATETIME NOT NULL,
  decided_by INT UNSIGNED NULL,
  decided_at DATETIME NULL,
  decision_note VARCHAR(500) NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_app_reg_no (reg_no),
  UNIQUE KEY uq_app_payment_ref (payment_ref),
  KEY idx_app_status (status),
  KEY idx_app_created (created_at),
  CONSTRAINT fk_app_decided FOREIGN KEY (decided_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_app_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS application_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  action VARCHAR(20) NOT NULL,
  from_status VARCHAR(10) NULL,
  to_status VARCHAR(10) NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_hist_app (application_id),
  CONSTRAINT fk_hist_app FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS throttle (
  k CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_throttle (k, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
