const banner = document.getElementById('banner');
const otpRequestForm = document.getElementById('otpRequestForm');
const otpVerifyForm = document.getElementById('otpVerifyForm');
const editForm = document.getElementById('editForm');
let currentEmail = '';

function showBanner(kind, message) {
    banner.innerHTML = `<div class="banner ${kind}">${message}</div>`;
}

otpRequestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    currentEmail = otpRequestForm.email.value.trim();
    const res = await fetch('../api/request-otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'பிழை ஏற்பட்டது');
        return;
    }
    showBanner('ok', 'OTP அனுப்பப்பட்டது. உங்கள் மின்னஞ்சலை சரிபார்க்கவும்.');
    otpRequestForm.style.display = 'none';
    otpVerifyForm.style.display = 'block';
});

document.getElementById('backBtn').addEventListener('click', () => {
    otpVerifyForm.style.display = 'none';
    otpRequestForm.style.display = 'block';
    banner.innerHTML = '';
});

otpVerifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = otpVerifyForm.otp.value.trim();
    const res = await fetch('../api/verify-otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, otp }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'தவறான OTP');
        return;
    }
    sessionStorage.setItem('edit_token', data.edit_token);
    banner.innerHTML = '';
    otpVerifyForm.style.display = 'none';
    await loadProfile();
});

async function loadProfile() {
    const token = sessionStorage.getItem('edit_token');
    const res = await fetch('../api/profile.php', { headers: { 'X-Edit-Token': token } });
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'சுயவிவரத்தை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
        sessionStorage.removeItem('edit_token');
        return;
    }
    const p = data.profile;
    document.getElementById('regNoLabel').textContent = `(${p.registration_number})`;
    fillSelect(document.getElementById('education'), EDUCATIONS, p.education);
    fillSelect(document.getElementById('occupation'), OCCUPATIONS, p.occupation);
    fillSelect(document.getElementById('star'), STARS, p.star);
    fillSelect(document.getElementById('rasi'), RASIS, p.rasi);
    for (const field of ['phone1', 'phone2', 'gothram', 'address', 'quarter', 'height_cm',
                          'father_name', 'mother_name', 'native_place', 'residence',
                          'registrar_name', 'brothers', 'sisters', 'participating',
                          'payment_amount', 'payment_date', 'payment_reference']) {
        if (editForm[field] && p[field] !== null) {
            editForm[field].value = p[field];
        }
    }
    editForm.style.display = 'block';
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'சேமிக்கிறது...';
    const token = sessionStorage.getItem('edit_token');
    try {
        const res = await fetch('../api/profile.php', {
            method: 'POST',
            headers: { 'X-Edit-Token': token },
            body: new FormData(editForm),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
            showBanner('err', data.message || 'சேமிக்க முடியவில்லை');
            return;
        }
        showBanner('ok', 'சுயவிவரம் புதுப்பிக்கப்பட்டது.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'சேமிக்கவும்';
    }
});

// Resume an existing edit session on page reload within the same tab.
if (sessionStorage.getItem('edit_token')) {
    otpRequestForm.style.display = 'none';
    loadProfile();
}
