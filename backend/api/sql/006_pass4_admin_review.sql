-- ============================================================
-- Pass 4: Admin CRUD support columns.
-- Adds the review trail needed for approve/reject/deactivate/
-- reactivate — who acted, when, and (for reactivate) what status
-- to restore to.
-- ============================================================

USE karkathar_matrimony;

ALTER TABLE members
  ADD COLUMN reviewed_by INT UNSIGNED NULL AFTER is_verified,
  ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by,
  ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER reviewed_at,
  ADD COLUMN previous_status ENUM('draft','pending_approval','approved','rejected','blocked','archived') NULL AFTER rejection_reason,
  ADD CONSTRAINT fk_members_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
  ADD INDEX idx_members_status_created (status, created_at);
