"""
Requires the local SMTP debug server running (tests/smtp_debug_server.py
on 127.0.0.1:1025) and backend/.env with MAIL_ENABLED=true,
SMTP_HOST=127.0.0.1, SMTP_PORT=1025 — see tests/README.md.
"""
import requests, json

BASE = "http://127.0.0.1:8081"

def show(label, r, truncate=500):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:truncate])
    except Exception:
        print(r.text[:truncate])
    print()

r = requests.post(f"{BASE}/auth/admin/login", json={"username": "superadmin", "password": "ChangeMe@123"})
AH = {"Authorization": f"Bearer {r.json()['data']['token']}"}

show("Notification log", requests.get(f"{BASE}/admin/notifications", headers=AH))
show("Notification log filtered by status=sent", requests.get(f"{BASE}/admin/notifications", headers=AH, params={"status": "sent"}))
show("Notification log filtered by channel=email", requests.get(f"{BASE}/admin/notifications", headers=AH, params={"channel": "email"}))
show("Notification counts", requests.get(f"{BASE}/admin/notifications/counts", headers=AH))
show("Channel status", requests.get(f"{BASE}/admin/notifications/channel-status", headers=AH))
show("Unauthenticated (expect 401)", requests.get(f"{BASE}/admin/notifications"))

print("All notification checks completed.")
