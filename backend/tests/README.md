# Manual API test scripts

Ad-hoc Python scripts used to verify the registration wizard end-to-end
against a real running instance (real DB, real file uploads — not mocks).
Not a CI suite yet; Pass 9 (optimization/testing) should turn these into
a proper automated test suite (PHPUnit for the backend, or a scripted
Postman/Newman collection).

## Usage

```bash
pip install --break-system-packages pillow requests
python3 setup_test_files.py          # creates /tmp/testfiles/* fixtures

# In another terminal: start the API against a seeded local DB
cd ../api && php -S 127.0.0.1:8081 -t . index.php

python3 test_step1.py                # Step 1: creates a member, saves /tmp/token.txt
python3 test_steps2to5.py            # Steps 2-5, using that token
python3 test_step1_negative.py       # validation/security negative paths
python3 test_admin_members.py        # Pass 4: admin approve/reject/verify/deactivate/etc.
python3 test_search.py               # Pass 5: simple/advanced search, saved searches, export
python3 test_booklet.py              # Pass 6: booklet data endpoint (filters + master-table joins)
python3 test_stats.py                # Pass 7: dashboard/reports stats endpoints
python3 test_notifications.py        # Pass 8: notification log, counts, channel status
```

`test_notifications.py` checks the admin-facing notification log
(list/filter/counts/channel-status) — it assumes some notifications
already exist from earlier test runs (Steps 5, approve, reject all
trigger one). To see real delivery, start the local SMTP debug server
first and point `backend/.env` at it:

```bash
python3 smtp_debug_server.py &     # listens on 127.0.0.1:1025, logs to /tmp/received_emails.log
```

```bash
# in backend/.env
MAIL_ENABLED=true
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_ENCRYPTION=none
```

Then run `test_step1.py` → `test_steps2to5.py` → `test_admin_members.py`
(approve/reject) and check `/tmp/received_emails.log` for the actual
delivered emails, or `test_notifications.py` for the logged outcome.
`http_echo_server.py` (127.0.0.1:8090) is the equivalent for testing
the SMS/WhatsApp HTTP driver — point `SMS_API_URL` at it and check
`/tmp/received_http_requests.log`.

`test_admin_members.py` covers the full admin workflow: approve,
reject (with/without reason), re-approve-already-approved (409),
delete-approved-blocked (409), verify, core-field edit, payment-edit-
on-approved-blocked (409), deactivate, blocked-login-rejected (403),
reactivate, reactivated-login-succeeds, archive, archived-login-
rejected, filtered listing, and unauthenticated access (401). Run it
after `test_step1.py` and `test_steps2to5.py` so there's a fully-
registered (`registration_step = 6`) member to act on.

`test_search.py` creates a second, deliberately different member
(different gender/age/district/religion/payment status) alongside the
one from `test_step1.py`/`test_steps2to5.py`, so every advanced filter
has something to meaningfully include and exclude — then exercises
simple search, every advanced filter, saved-search create/list/delete,
and CSV export (checked for correct headers, UTF-8 BOM, and row
content, not just a 200 status).

`test_step1_negative.py` covers: duplicate mobile/email, underage DOB,
missing required file, a fake-extension file with mismatched real content
(verifies the MIME-sniffing check in `FileUpload.php` actually rejects
it), and password-confirmation mismatch.

These scripts assume the master-data seed (`sql/004_pass2_seed_masters.sql`)
and a religion→caste hierarchy have been loaded, and use hardcoded master
IDs that match a freshly-seeded database — re-check the IDs if your local
data differs.
