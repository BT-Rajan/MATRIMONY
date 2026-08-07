import requests, json

BASE = "http://127.0.0.1:8081"

def show(label, r, truncate=600):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        d = r.json()
        if isinstance(d.get("data"), list):
            print(f"rows: {len(d['data'])}")
            for row in d["data"]:
                print(f"  {row.get('registration_number')} - {row.get('name_english')} "
                      f"({row.get('religion_english')}/{row.get('caste_english')}, "
                      f"{row.get('district_english')}, {row.get('education_english')})")
        else:
            print(json.dumps(d, ensure_ascii=False, indent=2)[:truncate])
    except Exception:
        print(r.text[:truncate])
    print()

r = requests.post(f"{BASE}/auth/admin/login", json={"username": "superadmin", "password": "ChangeMe@123"})
AH = {"Authorization": f"Bearer {r.json()['data']['token']}"}

# All approved members, with master-table names joined
r = requests.get(f"{BASE}/admin/members/booklet", headers=AH, params={"status": "approved"})
show("Booklet: all approved members", r)

# Filtered to a single member by registration number (the single-member booklet use case)
if r.status_code == 200 and r.json()["data"]:
    reg_no = r.json()["data"][0]["registration_number"]
    r2 = requests.get(f"{BASE}/admin/members/booklet", headers=AH, params={"registration_number": reg_no})
    show(f"Booklet: single member (reg={reg_no})", r2)
    assert len(r2.json()["data"]) == 1, "single-member booklet filter should return exactly one row"

# Filtered by gender
r = requests.get(f"{BASE}/admin/members/booklet", headers=AH, params={"gender": "bride"})
show("Booklet: gender=bride", r)

# Unauthenticated
r = requests.get(f"{BASE}/admin/members/booklet")
show("Booklet: unauthenticated (expect 401)", r)

print("All booklet checks completed.")
