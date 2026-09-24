export const GENDERS = [
  { v: 'male', ta: 'ஆண் (செல்வன்)', en: 'Male' },
  { v: 'female', ta: 'பெண் (செல்வி)', en: 'Female' },
];

// req: required; full: spans both columns
export const GROUPS = [
  {
    id: 'personal', ta: 'தனிப்பட்ட விவரங்கள்', en: 'Personal details',
    fields: [
      { k: 'gender', ta: 'பாலினம்', en: 'Gender', type: 'select', options: GENDERS, req: 1 },
      { k: 'full_name', ta: 'செல்வன் / செல்வி பெயர்', en: 'Name', max: 120, req: 1, full: 1, auto: 'name' },
      { k: 'dob', ta: 'பிறந்த தேதி', en: 'Date of birth', type: 'date', req: 1, auto: 'bday' },
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
      { k: 'payment_date', ta: 'பணம் செலுத்திய தேதி', en: 'Payment date', type: 'date', req: 1 },
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

export function fromRecord(rec) {
  return Object.fromEntries(ALL_FIELDS.map((f) => [f.k, rec[f.k] ?? '']));
}

export function validate(v) {
  const e = {};
  for (const f of ALL_FIELDS) {
    const x = String(v[f.k] ?? '').trim();
    if (!x) { if (f.req) e[f.k] = 'required'; continue; }
    if (f.max && x.length > f.max) e[f.k] = 'too_long';
    else if (f.type === 'tel' && !/^\+?\d{10,15}$/.test(x.replace(/[\s\-()]/g, ''))) e[f.k] = 'invalid';
    else if (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)) e[f.k] = 'invalid';
    else if (f.k === 'payment_ref' && !/^[A-Za-z0-9\-/]{6,40}$/.test(x)) e[f.k] = 'invalid';
  }
  return e;
}
