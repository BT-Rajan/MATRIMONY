-- ============================================================
-- Pass 9: Optimization.
-- One evidence-based index change, found via an EXPLAIN audit against
-- a realistic (1000+ row) synthetic dataset rather than guessed:
-- the per-member notification history query (member_id filter +
-- ORDER BY created_at DESC) was falling back to a filesort even
-- though a single-column index on member_id existed. A composite
-- index matching the actual filter+sort pattern fixes it.
--
-- Everything else audited (members.status, .gender, .is_verified;
-- audit_log ordering) was confirmed via EXPLAIN to already be
-- correctly served by existing indexes, or to be low-cardinality
-- columns where MySQL correctly prefers a full scan over an index at
-- this table size — adding indexes there would only slow down writes
-- for no read benefit. See docs/ARCHITECTURE.md "Optimization" for
-- the full audit writeup.
-- ============================================================

USE karkathar_matrimony;

ALTER TABLE notifications
  DROP INDEX idx_notifications_member,
  ADD INDEX idx_notifications_member_created (member_id, created_at);
