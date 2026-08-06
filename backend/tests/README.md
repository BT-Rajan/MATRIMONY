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
```

`test_step1_negative.py` covers: duplicate mobile/email, underage DOB,
missing required file, a fake-extension file with mismatched real content
(verifies the MIME-sniffing check in `FileUpload.php` actually rejects
it), and password-confirmation mismatch.

These scripts assume the master-data seed (`sql/004_pass2_seed_masters.sql`)
and a religion→caste hierarchy have been loaded, and use hardcoded master
IDs that match a freshly-seeded database — re-check the IDs if your local
data differs.
