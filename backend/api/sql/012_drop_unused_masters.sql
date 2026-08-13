-- ============================================================
-- Pass: drop the master/lookup tables that are no longer used
-- anywhere (registration dropped them in 011; their admin CRUD
-- pages are removed in this pass too). Order respects FKs:
-- children before parents in each hierarchy.
-- ============================================================

USE karkathar_matrimony;

DROP TABLE IF EXISTS sub_castes;
DROP TABLE IF EXISTS castes;
DROP TABLE IF EXISTS religions;

DROP TABLE IF EXISTS villages;
DROP TABLE IF EXISTS taluks;
DROP TABLE IF EXISTS districts;

DROP TABLE IF EXISTS incomes;
DROP TABLE IF EXISTS doshams;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS payment_types;
