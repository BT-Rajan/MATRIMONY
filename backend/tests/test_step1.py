import requests, json

BASE = "http://127.0.0.1:8081"

data = {
    "registration_type": "groom",
    "name_tamil": "ராஜேஷ் குமார்",
    "name_english": "Rajesh Kumar",
    "dob": "1995-06-15",
    "height_cm": "175",
    "weight_kg": "70",
    "marital_status": "single",
    "education_id": "3",
    "occupation_id": "5",
    "income_id": "1",
    "religion_id": "1",
    "caste_id": "4",
    "sub_caste_id": "",
    "star_id": "4",
    "rasi_id": "1",
    "dosham_id": "1",
    "native_place": "Chrompet",
    "district_id": "3",
    "current_address": "No 12, Main Street, Chrompet, Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "mobile": "9876543210",
    "whatsapp": "9876543210",
    "email": "rajesh.kumar@example.com",
    "about_myself": "Software engineer looking for a life partner",
    "diet": "veg",
    "smoking": "no",
    "drinking": "no",
    "physically_challenged": "no",
    "password": "SecurePass123",
    "password_confirmation": "SecurePass123",
}

files = {
    "photo": ("photo.jpg", open("/tmp/testfiles/photo.jpg", "rb"), "image/jpeg"),
    "id_proof": ("idproof.pdf", open("/tmp/testfiles/idproof.pdf", "rb"), "application/pdf"),
}

r = requests.post(f"{BASE}/registration/step1", data=data, files=files)
print("HTTP", r.status_code)
print(json.dumps(r.json(), ensure_ascii=False, indent=2))

if r.status_code == 201:
    with open("/tmp/token.txt", "w") as f:
        f.write(r.json()["data"]["token"])
