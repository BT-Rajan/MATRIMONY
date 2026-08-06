import requests, json

BASE = "http://127.0.0.1:8084"
TOKEN = open("/tmp/token.txt").read().strip()
H = {"Authorization": f"Bearer {TOKEN}"}

def show(label, r):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        print(json.dumps(r.json(), ensure_ascii=False, indent=2))
    except Exception:
        print(r.text[:500])
    print()

# Step 2: Horoscope
r = requests.post(f"{BASE}/registration/step2", headers=H, data={
    "birth_date": "1995-06-15",
    "birth_time": "14:30",
    "birth_place": "Chennai",
    "star_id": "4",
    "rasi_id": "1",
    "lagnam": "Mesha Lagnam",
    "gothram": "Bharadwaja",
    "chevvai_dosham": "no",
    "rahu_dosham": "no",
    "kethu_dosham": "no",
    "kalasarpa_dosham": "no",
}, files={"horoscope_document": ("horoscope.pdf", open("/tmp/testfiles/horoscope.pdf", "rb"), "application/pdf")})
show("Step 2 (horoscope)", r)

# Step 2 with mismatched birth_date (should fail)
r = requests.post(f"{BASE}/registration/step2", headers=H, data={
    "birth_date": "1990-01-01",
    "birth_time": "14:30",
    "birth_place": "Chennai",
    "star_id": "4",
    "rasi_id": "1",
    "lagnam": "Mesha Lagnam",
    "chevvai_dosham": "no", "rahu_dosham": "no", "kethu_dosham": "no", "kalasarpa_dosham": "no",
})
show("Step 2 mismatched birth_date (expect 422)", r)

# Step 3: Family
r = requests.post(f"{BASE}/registration/step3", headers=H, data={
    "father_name": "Kumar Swamy",
    "mother_name": "Lakshmi",
    "father_occupation": "Retired Teacher",
    "parents_alive": "yes",
    "brothers": "2",
    "married_brothers": "1",
    "sisters": "1",
    "married_sisters": "0",
    "family_type": "nuclear",
    "own_house": "yes",
    "family_income_id": "3",
}, files={"family_photo": ("family.jpg", open("/tmp/testfiles/family.jpg", "rb"), "image/jpeg")})
show("Step 3 (family)", r)

# Step 3 invalid: married_brothers > brothers
r = requests.post(f"{BASE}/registration/step3", headers=H, data={
    "father_name": "Kumar Swamy", "mother_name": "Lakshmi", "parents_alive": "yes",
    "brothers": "1", "married_brothers": "3", "sisters": "0", "married_sisters": "0",
    "family_type": "nuclear", "own_house": "yes",
})
show("Step 3 married_brothers > brothers (expect 422)", r)

# Step 4: Reference
r = requests.put(f"{BASE}/registration/step4", headers=H, json={
    "reference_name": "Suresh Babu",
    "relationship_id": 1,
    "phone": "9123456789",
    "address": "Anna Nagar, Chennai",
    "known_since": "10 years",
    "remarks": "Family friend",
})
show("Step 4 (reference)", r)

# Step 4 with same phone as applicant (should fail)
r = requests.put(f"{BASE}/registration/step4", headers=H, json={
    "reference_name": "Suresh Babu", "relationship_id": 1, "phone": "9876543210",
})
show("Step 4 same phone as applicant (expect 422)", r)

# Step 5: Event participation = yes
r = requests.post(f"{BASE}/registration/step5", headers=H, data={
    "participating": "yes",
    "event_id": "1",
    "batch": "Batch A",
    "food_preference": "veg",
    "payment_type_id": "3",
    "amount": "500",
    "transaction_number": "TXN1001",
}, files={"receipt": ("receipt.pdf", open("/tmp/testfiles/receipt.pdf", "rb"), "application/pdf")})
show("Step 5 (event participation)", r)

# Resume check
r = requests.get(f"{BASE}/registration/me", headers=H)
show("GET /registration/me (resume)", r)
