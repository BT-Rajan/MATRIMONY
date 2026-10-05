export function ymdToDmy(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s || '';
}

// 'Y-m-d' date column -> 'DD-MM-YYYY'
export function fmtDate(s) {
  return ymdToDmy(s);
}

// 'Y-m-d H:i:s' timestamp -> 'DD-MM-YYYY HH:MM'
export function fmtDateTime(s) {
  if (!s) return '';
  const [d, t] = s.split(' ');
  return t ? `${ymdToDmy(d)} ${t.slice(0, 5)}` : ymdToDmy(d);
}

const WEEKDAYS = {
  ta: ['ஞாயிற்றுக்கிழமை', 'திங்கட்கிழமை', 'செவ்வாய்க்கிழமை', 'புதன்கிழமை', 'வியாழக்கிழமை', 'வெள்ளிக்கிழமை', 'சனிக்கிழமை'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

// Admin-entered event date ('DD-MM-YYYY', anything after it ignored) -> 'DD-MM-YYYY (weekday)' in the page language.
// Free text that doesn't start with a date is shown as typed.
export function fmtEventDate(s, lang) {
  const m = /^\s*(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(s || '');
  if (!m) return s || '';
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  if (d.getUTCDate() !== +m[1]) return s;
  const dmy = `${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}-${m[3]}`;
  return `${dmy} (${(WEEKDAYS[lang] || WEEKDAYS.ta)[d.getUTCDay()]})`;
}
