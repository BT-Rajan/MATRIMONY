import requests, json

BASE = "http://127.0.0.1:8081"

def show(label, r, truncate=800):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:truncate])
    except Exception:
        print(r.text[:truncate])
    print()

r = requests.post(f"{BASE}/auth/admin/login", json={"username": "superadmin", "password": "ChangeMe@123"})
AH = {"Authorization": f"Bearer {r.json()['data']['token']}"}

show("Overview", requests.get(f"{BASE}/admin/stats/overview", headers=AH))
show("Trend: daily", requests.get(f"{BASE}/admin/stats/trend", headers=AH, params={"period": "daily"}))
show("Trend: monthly", requests.get(f"{BASE}/admin/stats/trend", headers=AH, params={"period": "monthly"}))
show("Trend: invalid period (expect 422)", requests.get(f"{BASE}/admin/stats/trend", headers=AH, params={"period": "weekly"}))

for dim in ["religion", "caste", "education", "occupation", "income", "district", "age"]:
    show(f"Breakdown: {dim}", requests.get(f"{BASE}/admin/stats/breakdown/{dim}", headers=AH))

show("Breakdown: invalid dimension (expect 404)", requests.get(f"{BASE}/admin/stats/breakdown/foobar", headers=AH))
show("Payments", requests.get(f"{BASE}/admin/stats/payments", headers=AH))
show("Events", requests.get(f"{BASE}/admin/stats/events", headers=AH))
show("Unauthenticated overview (expect 401)", requests.get(f"{BASE}/admin/stats/overview"))

print("All stats checks completed.")
