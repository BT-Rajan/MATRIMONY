-- Run AFTER 001_pass1_core.sql.
-- Default super-admin — CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN.
-- Username: superadmin   Password: ChangeMe@123
--
-- The hash below was generated with PHP's password_hash() (bcrypt).
-- To generate your own:
--   php -r "echo password_hash('YourNewPassword', PASSWORD_DEFAULT), PHP_EOL;"

INSERT INTO admins (username, password_hash, name, email, role, is_active)
VALUES (
  'superadmin',
  '$2y$10$g78E6ylGAVL8V0qhnuUVOuhLy8s.uAsXepLTmjISyljXGdocr7MWq',
  'சூப்பர் நிர்வாகி',
  'admin@karkathar.local',
  'super_admin',
  1
);
