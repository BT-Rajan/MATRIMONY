import { ymdToDmy } from './date';

export const GENDERS = [
  { v: 'male', ta: 'ஆண் (செல்வன்)', en: 'Male' },
  { v: 'female', ta: 'பெண் (செல்வி)', en: 'Female' },
];

export const MARITAL_STATUS = [
  { v: 'first', ta: 'முதல் திருமணம்', en: 'First marriage' },
  { v: 'remarriage', ta: 'மறுமணம்', en: 'Remarriage' },
];

// req: required; full: spans both columns
export const GROUPS = [
  {
    id: 'personal', ta: 'தனிப்பட்ட விவரங்கள்', en: 'Personal details',
    fields: [
      { k: 'gender', ta: 'பாலினம்', en: 'Gender', type: 'select', options: GENDERS, req: 1 },
      { k: 'marital_status', ta: 'திருமண நிலை', en: 'Marital status', type: 'select', options: MARITAL_STATUS, req: 1 },
      { k: 'full_name', ta: 'செல்வன் / செல்வி பெயர்', en: 'Name', max: 120, req: 1, full: 1, auto: 'name' },
      { k: 'dob', ta: 'பிறந்த தேதி (DD-MM-YYYY)', en: 'Date of birth (DD-MM-YYYY)', dateField: 1, req: 1, auto: 'bday' },
      { k: 'height', ta: 'உயரம்', en: 'Height', max: 30, ph: 'எ.கா: 5\'6" / 168 செ.மீ' },
      { k: 'gothram', ta: 'கோத்திரம்', en: 'Gothram', max: 80, req: 1 },
      { k: 'nakshatram', ta: 'நட்சத்திரம்', en: 'Star (Nakshatram)', max: 60, req: 1 },
      { k: 'rasi', ta: 'ராசி', en: 'Rasi', max: 60, req: 1 },
    ],
  },
  {
    id: 'work', ta: 'கல்வி மற்றும் பணி விவரங்கள்', en: 'Education & occupation',
    fields: [
      { k: 'education', ta: 'கல்வி', en: 'Education', max: 150, req: 1 },
      { k: 'occupation', ta: 'பணி', en: 'Occupation', max: 150, req: 1, auto: 'organization-title' },
      { k: 'work_location', ta: 'பணியிடம்', en: 'Work location', max: 150 },
      { k: 'monthly_income', ta: 'மாத வருமானம்', en: 'Monthly income', max: 60 },
      { k: 'salary', ta: 'சம்பளம்', en: 'Salary', max: 60 },
    ],
  },
  {
    id: 'family', ta: 'குடும்ப விவரங்கள்', en: 'Family details',
    fields: [
      { k: 'father_name', ta: 'தந்தை பெயர்', en: "Father's name", max: 120, req: 1 },
      { k: 'father_occupation', ta: 'தந்தை பணி', en: "Father's occupation", max: 120 },
      { k: 'father_native', ta: 'தந்தை பூர்வீகம்', en: "Father's native place", max: 120 },
      { k: 'mother_name', ta: 'தாய் பெயர்', en: "Mother's name", max: 120, req: 1 },
      { k: 'mother_occupation', ta: 'தாய் பணி', en: "Mother's occupation", max: 120 },
      { k: 'mother_native', ta: 'தாய் பூர்வீகம்', en: "Mother's native place", max: 120 },
      { k: 'siblings', ta: 'உடன் பிறந்தோர்', en: 'Siblings', max: 255, full: 1, ph: 'எ.கா: 1 சகோதரன் (திருமணமானவர்), 1 சகோதரி' },
    ],
  },
  {
    id: 'contact', ta: 'தொடர்பு முகவரி', en: 'Contact details',
    fields: [
      { k: 'address', ta: 'முகவரி', en: 'Address', type: 'textarea', max: 500, req: 1, full: 1, auto: 'street-address' },
      { k: 'phone', ta: 'தொலைபேசி எண்', en: 'Phone number', type: 'tel', max: 20, req: 1, auto: 'tel' },
      { k: 'email', ta: 'மின்னஞ்சல்', en: 'Email', type: 'email', max: 120, auto: 'email' },
    ],
  },
  {
    id: 'payment', ta: 'கட்டண விவரங்கள்', en: 'Payment details',
    fields: [
      { k: 'payment_ref', ta: 'பரிவர்த்தனை எண் (UTR / Ref No.)', en: 'Transaction no. (UTR / Ref No.)', max: 40, req: 1 },
      { k: 'payment_date', ta: 'பணம் செலுத்திய தேதி (DD-MM-YYYY)', en: 'Payment date (DD-MM-YYYY)', dateField: 1, req: 1 },
    ],
  },
  {
    id: 'sign', ta: 'உறுதிமொழி', en: 'Declaration',
    fields: [
      { k: 'signature', ta: 'கையொப்பம் (முழு பெயரை தட்டச்சு செய்யவும்)', en: 'Signature (type full name)', max: 120, req: 1, full: 1 },
    ],
  },
];

export const ALL_FIELDS = GROUPS.flatMap((g) => g.fields);
export const EMPTY = Object.fromEntries(ALL_FIELDS.map((f) => [f.k, '']));
EMPTY.marital_status = 'first';

export function fromRecord(rec) {
  return Object.fromEntries(ALL_FIELDS.map((f) => {
    const raw = rec[f.k] ?? '';
    return [f.k, f.dateField ? ymdToDmy(raw) : raw];
  }));
}

const DATE_RE = /^\d{2}-\d{2}-\d{4}$/;
const MOBILE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;

// Auto-inserts dashes as the user types digits: '01011990' -> '01-01-1990'.
export function maskDMY(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('-');
}

// Parses a DD-MM-YYYY string with real calendar validation (rejects 31-02-2000 etc). Returns Date or null.
export function parseDMY(s) {
  const m = DATE_RE.test(s || '') && /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return (dt.getFullYear() === Number(y) && dt.getMonth() === Number(mo) - 1 && dt.getDate() === Number(d)) ? dt : null;
}

// Whole years as of today; null if the string isn't a complete, valid date.
export function ageYears(dobStr) {
  const dt = parseDMY(dobStr);
  if (!dt) return null;
  const today = new Date();
  let age = today.getFullYear() - dt.getFullYear();
  const m = today.getMonth() - dt.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dt.getDate())) age--;
  return age;
}

export function validate(v) {
  const e = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const f of ALL_FIELDS) {
    const x = String(v[f.k] ?? '').trim();
    if (!x) { if (f.req) e[f.k] = 'required'; continue; }
    if (f.max && x.length > f.max) { e[f.k] = 'too_long'; continue; }

    if (f.dateField) {
      const dt = parseDMY(x);
      if (!dt) { e[f.k] = 'date_format'; continue; }
      if (dt > today) { e[f.k] = f.k === 'dob' ? 'invalid' : 'future_date'; continue; }
      if (f.k === 'dob' && ageYears(x) < 18) e[f.k] = 'age_min';
    } else if (f.type === 'tel') {
      if (!MOBILE_RE.test(x.replace(/[\s\-()]/g, ''))) e[f.k] = 'invalid';
    } else if (f.type === 'email') {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)) e[f.k] = 'invalid';
    } else if (f.k === 'payment_ref') {
      if (!/^[A-Za-z0-9\-/]{6,40}$/.test(x)) e[f.k] = 'invalid';
    }
  }
  return e;
}
