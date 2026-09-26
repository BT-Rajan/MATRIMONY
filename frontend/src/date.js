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
