import requests, json

BASE = "http://127.0.0.1:8081"

def show(label, r):
    print(f"=== {label} -> HTTP {r.status_code} ===")
    try:
        print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:800])
    except Exception:
        print(r.text[:300])
    print()

base_data = {
    "registration_type": "bride",
    "name_tamil": "பிரியா", "name_english": "Priya",
    "dob": "1998-01-01", "height_cm": "160", "weight_kg": "55",
    "marital_status": "single", "education_id": "3", "occupation_id": "5",
    "income_id": "1", "religion_id": "1", "caste_id": "4", "sub_caste_id": "",
    "star_id": "4", "rasi_id": "1", "dosham_id": "1",
    "native_place": "Chrompet", "district_id": "3",
    "current_address": "No 5, Anna Nagar, Chennai",
    "state": "Tamil Nadu", "country": "India",
    "mobile": "9876543210",  # duplicate of member created in step1 test
    "email": "new.person@example.com",
    "diet": "veg", "smoking": "no", "drinking": "no", "physically_challenged": "no",
    "password": "AnotherPass123", "password_confirmation": "AnotherPass123",
}
files = {
    "photo": ("photo.jpg", open("/tmp/testfiles/photo.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}
r = requests.post(f"{BASE}/registration/step1", data=base_data, files=files)
show("Duplicate mobile (expect 422)", r)

# Underage
data2 = dict(base_data)
data2["mobile"] = "9111111111"
data2["email"] = "minor@example.com"
data2["dob"] = "2015-01-01"  # ~11 years old
files2 = {
    "photo": ("photo.jpg", open("/tmp/testfiles/photo.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}
r = requests.post(f"{BASE}/registration/step1", data=data2, files=files2)
show("Underage DOB (expect 422)", r)

# Missing photo file entirely
data3 = dict(base_data)
data3["mobile"] = "9222222222"
data3["email"] = "nophoto@example.com"
files3 = {"id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf")}
r = requests.post(f"{BASE}/registration/step1", data=data3, files=files3)
show("Missing photo file (expect 422)", r)

# Wrong file type disguised (rename a text file to .jpg)
with open("/tmp/testfiles/fake.jpg", "w") as f:
    f.write("this is not really a jpeg, just text pretending")
data4 = dict(base_data)
data4["mobile"] = "9333333333"
data4["email"] = "fakejpg@example.com"
files4 = {
    "photo": ("fake.jpg", open("/tmp/testfiles/fake.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}
r = requests.post(f"{BASE}/registration/step1", data=data4, files=files4)
show("Fake JPEG (text content, real MIME check should reject) (expect 422)", r)

# Password mismatch
data5 = dict(base_data)
data5["mobile"] = "9444444444"
data5["email"] = "pwmismatch@example.com"
data5["password_confirmation"] = "Different123"
files5 = {
    "photo": ("photo.jpg", open("/tmp/testfiles/photo.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}
r = requests.post(f"{BASE}/registration/step1", data=data5, files=files5)
show("Password mismatch (expect 422)", r)
