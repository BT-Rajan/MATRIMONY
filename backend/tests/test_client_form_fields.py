import requests, json

BASE = "http://127.0.0.1:8081"

def show(label, r, truncate=800):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:truncate])
    except Exception:
        print(r.text[:truncate])
    print()

data = {
    "registration_type": "groom",
    "name_tamil": "விஜய் குமார்", "name_english": "Vijay Kumar",
    "dob": "1994-02-20", "height_cm": "172", "weight_kg": "68",
    "marital_status": "single", "education_id": "3", "occupation_id": "5",
    "income_id": "1", "religion_id": "1", "caste_id": "4", "sub_caste_id": "",
    "star_id": "5", "rasi_id": "2", "dosham_id": "1",
    "native_place": "Salem", "district_id": "23",
    "current_address": "No 20, Main Road, Salem",
    "pincode": "636001",
    "state": "Tamil Nadu", "country": "India",
    "mobile": "9012345678", "email": "vijay.kumar@example.com",
    "company_name": "Acme Software Pvt Ltd",
    "work_location": "Bengaluru",
    "diet": "veg", "smoking": "no", "drinking": "no", "physically_challenged": "no",
    "password": "VijayPass123", "password_confirmation": "VijayPass123",
}
files = {
    "photo": ("photo.jpg", open("/tmp/testfiles/photo.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}
r = requests.post(f"{BASE}/registration/step1", data=data, files=files)
show("Step 1 with pincode/company/work_location", r, 300)
assert r.status_code == 201
token = r.json()["data"]["token"]
H = {"Authorization": f"Bearer {token}"}

# Bad pincode
data2 = dict(data)
data2["mobile"] = "9012345679"
data2["email"] = "badpincode@example.com"
data2["pincode"] = "abc"
files2 = {
    "photo": ("photo.jpg", open("/tmp/testfiles/photo.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}
r = requests.post(f"{BASE}/registration/step1", data=data2, files=files2)
show("Step 1 with invalid pincode (expect 422)", r, 400)

# Step 3 with new family fields
r = requests.post(f"{BASE}/registration/step3", headers=H, data={
    "father_name": "Kumaresan", "mother_name": "Meenakshi",
    "father_native_place": "Salem", "father_mobile": "9111122223", "father_email": "father@example.com",
    "mother_native_place": "Salem", "mother_mobile": "9111122224",
    "parents_alive": "yes", "birth_order": "eldest",
    "brothers": "1", "married_brothers": "0", "sisters": "1", "married_sisters": "1",
    "family_type": "nuclear", "own_house": "yes",
})
show("Step 3 with parent contact + birth order", r, 400)

# Step 3 with bad father_mobile
r = requests.post(f"{BASE}/registration/step3", headers=H, data={
    "father_name": "Kumaresan", "mother_name": "Meenakshi",
    "father_mobile": "12345",
    "parents_alive": "yes", "brothers": "0", "married_brothers": "0", "sisters": "0", "married_sisters": "0",
    "family_type": "nuclear", "own_house": "yes",
})
show("Step 3 with invalid father_mobile (expect 422)", r, 400)

# Verify data actually persisted via resume endpoint
r = requests.get(f"{BASE}/registration/me", headers=H)
d = r.json()["data"]
print("=== Verify persisted data ===")
print("member.pincode:", d["member"].get("pincode"))
print("member.company_name:", d["member"].get("company_name"))
print("member.work_location:", d["member"].get("work_location"))
print("family.father_mobile:", d["family"].get("father_mobile"))
print("family.father_email:", d["family"].get("father_email"))
print("family.birth_order:", d["family"].get("birth_order"))
assert d["member"]["pincode"] == "636001"
assert d["member"]["company_name"] == "Acme Software Pvt Ltd"
assert d["family"]["father_mobile"] == "9111122223"
assert d["family"]["birth_order"] == "eldest"
print("\nAll assertions passed.")
