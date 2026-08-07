import requests, json, csv, io

BASE = "http://127.0.0.1:8081"

def show(label, r, truncate=1000):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:truncate])
    except Exception:
        print(r.text[:truncate])
    print()

# --- create a second, distinct member (bride, different religion/caste/district/age) ---
data = {
    "registration_type": "bride",
    "name_tamil": "பிரியா", "name_english": "Priya Devi",
    "dob": "1999-03-10", "height_cm": "158", "weight_kg": "52",
    "marital_status": "single", "education_id": "4", "occupation_id": "7",
    "income_id": "2", "religion_id": "1", "caste_id": "2", "sub_caste_id": "",
    "star_id": "6", "rasi_id": "3", "dosham_id": "1",
    "native_place": "Madurai", "district_id": "14",
    "current_address": "No 8, Gandhi Road, Madurai",
    "state": "Tamil Nadu", "country": "India",
    "mobile": "9988776655", "email": "priya.devi@example.com",
    "diet": "veg", "smoking": "no", "drinking": "no", "physically_challenged": "no",
    "password": "PriyaPass123", "password_confirmation": "PriyaPass123",
}
files = {
    "photo": ("photo.jpg", open("/tmp/testfiles/photo.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}
r = requests.post(f"{BASE}/registration/step1", data=data, files=files)
show("Create Priya (member 2)", r, 300)
priya_token = r.json()["data"]["token"]
PH = {"Authorization": f"Bearer {priya_token}"}

# Complete remaining steps quickly so she's a full pending_approval member
requests.post(f"{BASE}/registration/step2", headers=PH, data={
    "birth_date": "1999-03-10", "birth_time": "09:00", "birth_place": "Madurai",
    "star_id": "6", "rasi_id": "3", "lagnam": "Simha Lagnam",
    "chevvai_dosham": "no", "rahu_dosham": "no", "kethu_dosham": "no", "kalasarpa_dosham": "no",
}, files={"horoscope_document": ("horoscope.pdf", open("/tmp/testfiles/horoscope.pdf", "rb"), "application/pdf")})
requests.post(f"{BASE}/registration/step3", headers=PH, data={
    "father_name": "Devan", "mother_name": "Kalpana", "parents_alive": "yes",
    "brothers": "1", "married_brothers": "0", "sisters": "0", "married_sisters": "0",
    "family_type": "nuclear", "own_house": "yes",
})
requests.put(f"{BASE}/registration/step4", headers=PH, json={
    "reference_name": "Meena", "relationship_id": 2, "phone": "9000011111",
})
r = requests.post(f"{BASE}/registration/step5", headers=PH, data={"participating": "no"})
show("Priya registration complete", r, 200)

# --- admin login ---
r = requests.post(f"{BASE}/auth/admin/login", json={"username": "superadmin", "password": "ChangeMe@123"})
AH = {"Authorization": f"Bearer {r.json()['data']['token']}"}

# find priya's id and approve+verify her so she's a full searchable profile
r = requests.get(f"{BASE}/admin/members", headers=AH, params={"search": "Priya"})
priya_id = r.json()["data"]["items"][0]["id"]
requests.post(f"{BASE}/admin/members/{priya_id}/approve", headers=AH)
requests.post(f"{BASE}/admin/members/{priya_id}/verify", headers=AH)

# ============== SIMPLE SEARCH ==============
r = requests.get(f"{BASE}/admin/members", headers=AH, params={"search": "Priya"})
show("Simple search 'Priya'", r, 400)

# ============== ADVANCED SEARCH ==============
r = requests.get(f"{BASE}/admin/members", headers=AH, params={"gender": "bride", "age_min": 25, "age_max": 30})
show("Advanced: gender=bride, age 25-30 (should match Priya, ~26)", r, 400)

r = requests.get(f"{BASE}/admin/members", headers=AH, params={"gender": "groom", "age_min": 25, "age_max": 30})
show("Advanced: gender=groom, age 25-30 (should NOT match Priya)", r, 400)

r = requests.get(f"{BASE}/admin/members", headers=AH, params={"height_min": 150, "height_max": 160})
show("Advanced: height 150-160cm (should match Priya=158)", r, 400)

r = requests.get(f"{BASE}/admin/members", headers=AH, params={"district_id": 14})
show("Advanced: district_id=14 (Madurai, should match Priya)", r, 400)

r = requests.get(f"{BASE}/admin/members", headers=AH, params={"horoscope_available": 1})
show("Advanced: horoscope_available=1 (both members have horoscope)", r, 400)

r = requests.get(f"{BASE}/admin/members", headers=AH, params={"payment": 1})
show("Advanced: payment=1 (only Rajesh has a payment record)", r, 400)

r = requests.get(f"{BASE}/admin/members", headers=AH, params={"reference": "Meena"})
show("Advanced: reference name='Meena' (should match Priya)", r, 400)

r = requests.get(f"{BASE}/admin/members", headers=AH, params={"is_verified": 1, "status": "approved"})
show("Advanced: verified=1 AND status=approved (should match Priya)", r, 400)

# ============== SAVED SEARCHES ==============
r = requests.post(f"{BASE}/admin/saved-searches", headers=AH, json={
    "name": "Brides in Madurai, 25-30",
    "filters": {"gender": "bride", "district_id": 14, "age_min": 25, "age_max": 30},
})
show("Create saved search", r, 400)
saved_id = r.json()["data"]["id"]

r = requests.get(f"{BASE}/admin/saved-searches", headers=AH)
show("List saved searches", r, 400)

r = requests.post(f"{BASE}/admin/saved-searches", headers=AH, json={"name": "", "filters": {}})
show("Create saved search with no name/filters (expect 422)", r)

r = requests.delete(f"{BASE}/admin/saved-searches/{saved_id}", headers=AH)
show("Delete saved search", r)

r = requests.get(f"{BASE}/admin/saved-searches", headers=AH)
show("List saved searches after delete (should be empty)", r, 200)

# ============== EXPORT ==============
r = requests.get(f"{BASE}/admin/members/export", headers=AH, params={"gender": "bride"})
print(f"=== Export CSV (gender=bride) -> HTTP {r.status_code} ===")
print("Content-Type:", r.headers.get("Content-Type"))
print("Content-Disposition:", r.headers.get("Content-Disposition"))
content = r.content.decode("utf-8-sig")
reader = csv.reader(io.StringIO(content))
rows = list(reader)
print(f"Rows (incl header): {len(rows)}")
print("Header:", rows[0])
print("Data row:", rows[1] if len(rows) > 1 else None)
print()

# unauthenticated export attempt
r = requests.get(f"{BASE}/admin/members/export")
show("Unauthenticated export (expect 401)", r)
