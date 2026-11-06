export default function BankDetails({ settings, lang = 'ta' }) {
  if (!settings) return null;
  const en = lang === 'en';
  const L = en
    ? { holder: 'Name', bank: 'Bank', acc: 'A/c No.', ifsc: 'IFSC', qr: 'Scan to pay' }
    : { holder: 'பெயர்', bank: 'வங்கி', acc: 'கணக்கு எண்', ifsc: 'IFSC குறியீடு', qr: 'QR வழியாக செலுத்த' };
  const bankName = (en && settings.bank_name_en) || settings.bank_name;
  return (
    <div className="bank">
      {settings.bank_holder && <p>{L.holder}: <strong>{settings.bank_holder}</strong></p>}
      <p>{L.bank}: <strong>{bankName}</strong></p>
      <p>{L.acc}: <strong>{settings.bank_account}</strong></p>
      {settings.bank_ifsc && <p>{L.ifsc}: <strong>{settings.bank_ifsc}</strong></p>}
      {settings.qr_code && (
        <p className="qr"><img src={settings.qr_code} alt={L.qr} /></p>
      )}
    </div>
  );
}
