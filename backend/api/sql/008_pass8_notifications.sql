-- ============================================================
-- Pass 8: Notifications (Email / SMS / WhatsApp).
-- One row per delivery attempt per channel, always written — a
-- failed send is still logged (status='failed', error_message set),
-- never silently dropped. This is the notification system's own
-- audit trail, on top of the general audit_log for the action that
-- triggered it (e.g. member_approved is already in audit_log; the
-- notification row records whether the resulting email actually sent).
-- ============================================================

USE karkathar_matrimony;

CREATE TABLE notifications (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_id      INT UNSIGNED NOT NULL,
  event_type     VARCHAR(50)  NOT NULL COMMENT 'registration_completed, member_approved, member_rejected, ...',
  channel        ENUM('email','sms','whatsapp') NOT NULL,
  recipient      VARCHAR(150) NOT NULL COMMENT 'email address or phone number actually used',
  subject        VARCHAR(255) NULL COMMENT 'email only',
  message        TEXT NOT NULL,
  status         ENUM('sent','failed','skipped') NOT NULL COMMENT 'skipped = channel not configured/enabled',
  error_message  VARCHAR(500) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_member (member_id),
  KEY idx_notifications_event (event_type),
  KEY idx_notifications_status (status),
  KEY idx_notifications_created (created_at),
  CONSTRAINT fk_notifications_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB;
