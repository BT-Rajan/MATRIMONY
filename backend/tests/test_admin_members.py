import requests, json

BASE = "http://127.0.0.1:8084"

def show(label, r):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:1000])
    except Exception:
        print(r.text[:300])
    print()

# Admin login
r = requests.post(f"{BASE}/auth/admin/login", json={"username": "superadmin", "password": "ChangeMe@123"})
ADMIN_TOKEN = r.json()["data"]["token"]
AH = {"Authorization": f"Bearer {ADMIN_TOKEN}"}

# List members
r = requests.get(f"{BASE}/admin/members", headers=AH, params={"search": "Rajesh"})
show("List members (search=Rajesh)", r)
member_id = r.json()["data"]["items"][0]["id"]
print("Using member_id =", member_id)

# View full profile
r = requests.get(f"{BASE}/admin/members/{member_id}", headers=AH)
show("View member full profile", r)
assert "password_hash" not in json.dumps(r.json())

# Try to reject with no reason (expect 422)
r = requests.post(f"{BASE}/admin/members/{member_id}/reject", headers=AH, json={})
show("Reject with no reason (expect 422)", r)

# Approve (registration_step is 6, status pending_approval -> should succeed)
r = requests.post(f"{BASE}/admin/members/{member_id}/approve", headers=AH)
show("Approve member", r)

# Try to approve again (expect 409, already approved)
r = requests.post(f"{BASE}/admin/members/{member_id}/approve", headers=AH)
show("Re-approve already-approved member (expect 409)", r)

# Try to delete an approved member (expect 409)
r = requests.delete(f"{BASE}/admin/members/{member_id}", headers=AH)
show("Delete approved member (expect 409)", r)

# Verify member
r = requests.post(f"{BASE}/admin/members/{member_id}/verify", headers=AH)
show("Verify member", r)

# Edit core fields
r = requests.put(f"{BASE}/admin/members/{member_id}", headers=AH, json={"whatsapp": "9123456780"})
show("Edit core field (whatsapp)", r)

# Try duplicate mobile edit (use own mobile - should be no-op/pass since same, then try a real dup)
r = requests.put(f"{BASE}/admin/members/{member_id}", headers=AH, json={"email": "not-an-email"})
show("Edit with invalid email (expect 422)", r)

# Try to edit event participation on approved member (expect 409)
r = requests.put(f"{BASE}/admin/members/{member_id}/event", headers=AH, json={"participating": "no"})
show("Edit event participation on approved member (expect 409)", r)

# Deactivate
r = requests.post(f"{BASE}/admin/members/{member_id}/deactivate", headers=AH)
show("Deactivate approved member", r)

# Member login should now fail (blocked)
r = requests.post(f"{BASE}/auth/member/login", json={"identifier": "9876543210", "password": "SecurePass123"})
show("Blocked member login attempt (expect 403)", r)

# Reactivate
r = requests.post(f"{BASE}/admin/members/{member_id}/reactivate", headers=AH)
show("Reactivate member (should restore to approved)", r)

# Member login should now succeed again
r = requests.post(f"{BASE}/auth/member/login", json={"identifier": "9876543210", "password": "SecurePass123"})
show("Reactivated member login (expect success)", r)

# Archive
r = requests.post(f"{BASE}/admin/members/{member_id}/archive", headers=AH)
show("Archive member", r)

# Filter list by status=archived
r = requests.get(f"{BASE}/admin/members", headers=AH, params={"status": "archived"})
show("List filtered by status=archived", r)

# Non-admin (unauthenticated) access attempt
r = requests.get(f"{BASE}/admin/members")
show("Unauthenticated admin list access (expect 401)", r)
