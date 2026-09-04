fillSelect(document.getElementById('star'), STARS);
fillSelect(document.getElementById('rasi'), RASIS);
fillSelect(document.getElementById('education'), EDUCATIONS);
fillSelect(document.getElementById('occupation'), OCCUPATIONS);

const form = document.getElementById('regForm');
const banner = document.getElementById('banner');
const submitBtn = document.getElementById('submitBtn');

function clearFieldErrors() {
    form.querySelectorAll('.error').forEach(e => e.remove());
}

function showFieldErrors(errors) {
    clearFieldErrors();
    for (const [field, message] of Object.entries(errors || {})) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            const p = document.createElement('p');
            p.className = 'error';
            p.textContent = message;
            input.insertAdjacentElement('afterend', p);
        }
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    banner.innerHTML = '';
    clearFieldErrors();
    submitBtn.disabled = true;
    submitBtn.textContent = 'சமர்ப்பிக்கிறது...';

    try {
        const res = await fetch('../api/register.php', { method: 'POST', body: new FormData(form) });
        const data = await res.json();

        if (!res.ok || !data.ok) {
            showFieldErrors(data.errors);
            banner.innerHTML = `<div class="banner err">${data.message || 'பதிவு தோல்வியடைந்தது'}</div>`;
            return;
        }

        form.style.display = 'none';
        banner.innerHTML = `<div class="banner ok">
            பதிவு வெற்றி! உங்கள் பதிவு எண்: <strong>${data.registration_number}</strong><br>
            இந்த விவரம் உங்கள் மின்னஞ்சலுக்கும் அனுப்பப்பட்டுள்ளது.
        </div>`;
    } catch (err) {
        banner.innerHTML = '<div class="banner err">இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்.</div>';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'பதிவு செய்யவும்';
    }
});
