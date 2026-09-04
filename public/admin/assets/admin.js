const banner = document.getElementById('banner');
const loginForm = document.getElementById('loginForm');
const dashboard = document.getElementById('dashboard');
const editForm = document.getElementById('editForm');
const resultsBody = document.getElementById('resultsBody');
let page = 1;
let total = 0;
const perPage = 20;

function showBanner(kind, message) {
    banner.innerHTML = `<div class="banner ${kind}">${message}</div>`;
}

const statusLabel = { pending: 'பரிசீலனையில்', approved: 'ஏற்றுக்கொள்ளப்பட்டது', rejected: 'நிராகரிக்கப்பட்டது' };
const genderLabel = { groom: 'மணமகன்', bride: 'மணமகள்' };

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('../api/admin/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginForm.username.value, password: loginForm.password.value }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'உள்நுழைவு தோல்வியடைந்தது');
        return;
    }
    loginForm.style.display = 'none';
    dashboard.style.display = 'block';
    banner.innerHTML = '';
    loadReports();
    loadList();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('../api/admin/logout.php', { method: 'POST' });
    dashboard.style.display = 'none';
    editForm.style.display = 'none';
    loginForm.style.display = 'block';
});

document.getElementById('searchBtn').addEventListener('click', () => { page = 1; loadList(); });

async function loadList() {
    const q = document.getElementById('searchQ').value.trim();
    const gender = document.getElementById('filterGender').value;
    const status = document.getElementById('filterStatus').value;
    const params = new URLSearchParams({ q, gender, status, page });
    const res = await fetch(`../api/admin/list.php?${params}`);
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'பட்டியலை ஏற்ற முடியவில்லை');
        return;
    }
    total = data.total;
    resultsBody.innerHTML = data.profiles.map(p => `
        <tr>
          <td>${p.registration_number}</td>
          <td>${p.name}</td>
          <td>${genderLabel[p.gender] || p.gender}</td>
          <td>${p.phone1}</td>
          <td><span class="badge ${p.status}">${statusLabel[p.status] || p.status}</span></td>
          <td><button class="secondary" style="margin-top:0" onclick="openEdit(${p.id})">திருத்த</button></td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="muted">முடிவுகள் இல்லை</td></tr>';

    document.getElementById('pagerInfo').textContent =
        `${total === 0 ? 0 : (page - 1) * perPage + 1}-${Math.min(page * perPage, total)} / ${total}`;
    document.getElementById('prevPage').disabled = page <= 1;
    document.getElementById('nextPage').disabled = page * perPage >= total;
}
document.getElementById('prevPage').addEventListener('click', () => { if (page > 1) { page--; loadList(); } });
document.getElementById('nextPage').addEventListener('click', () => { if (page * perPage < total) { page++; loadList(); } });

async function loadReports() {
    const res = await fetch('../api/admin/reports.php');
    const data = await res.json();
    if (!res.ok || !data.ok) return;
    const s = data.summary;
    document.getElementById('summaryStats').innerHTML = `
        <div class="stat"><b>${s.groom.total}</b>மணமகன் (பரி:${s.groom.pending} ஏற்:${s.groom.approved} நிரா:${s.groom.rejected})</div>
        <div class="stat"><b>${s.bride.total}</b>மணமகள் (பரி:${s.bride.pending} ஏற்:${s.bride.approved} நிரா:${s.bride.rejected})</div>
    `;
}
document.getElementById('csvBride').addEventListener('click', (e) => { e.preventDefault(); window.location = '../api/admin/reports.php?format=csv&gender=bride'; });
document.getElementById('csvGroom').addEventListener('click', (e) => { e.preventDefault(); window.location = '../api/admin/reports.php?format=csv&gender=groom'; });
document.getElementById('csvAll').addEventListener('click', (e) => { e.preventDefault(); window.location = '../api/admin/reports.php?format=csv'; });

let currentEditId = null;
async function openEdit(id) {
    const res = await fetch(`../api/admin/profile.php?id=${id}`);
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'சுயவிவரத்தை ஏற்ற முடியவில்லை');
        return;
    }
    currentEditId = id;
    const p = data.profile;
    editForm.id.value = p.id;
    document.getElementById('editRegNo').textContent = `(${p.registration_number})`;
    fillSelect(document.getElementById('editEducation'), EDUCATIONS, p.education);
    fillSelect(document.getElementById('editOccupation'), OCCUPATIONS, p.occupation);
    fillSelect(document.getElementById('editStar'), STARS, p.star);
    fillSelect(document.getElementById('editRasi'), RASIS, p.rasi);
    for (const field of ['name', 'gender', 'dob', 'email', 'phone1', 'phone2', 'gothram', 'address',
                          'quarter', 'height_cm', 'father_name', 'mother_name', 'native_place',
                          'residence', 'registrar_name', 'brothers', 'sisters', 'participating',
                          'payment_amount', 'payment_date', 'payment_reference', 'status']) {
        if (editForm[field] && p[field] !== null) editForm[field].value = p[field];
    }
    editForm.style.display = 'block';
    editForm.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('closeEditBtn').addEventListener('click', () => {
    editForm.style.display = 'none';
    currentEditId = null;
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('../api/admin/profile.php', { method: 'POST', body: new FormData(editForm) });
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'சேமிக்க முடியவில்லை');
        return;
    }
    showBanner('ok', 'சேமிக்கப்பட்டது');
    editForm.style.display = 'none';
    loadList();
    loadReports();
});

async function decide(decision) {
    if (!currentEditId) return;
    const res = await fetch('../api/admin/decide.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentEditId, decision }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
        showBanner('err', data.message || 'செயல் தோல்வியடைந்தது');
        return;
    }
    showBanner('ok', 'நிலை புதுப்பிக்கப்பட்டு, மின்னஞ்சல் அனுப்பப்பட்டது');
    editForm.style.display = 'none';
    loadList();
    loadReports();
}
document.getElementById('approveBtn').addEventListener('click', () => decide('approved'));
document.getElementById('rejectBtn').addEventListener('click', () => decide('rejected'));
