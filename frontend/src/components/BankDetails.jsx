export default function BankDetails({ settings, lang = 'ta' }) {
  if (!settings) return null;
  const L = lang === 'en'
    ? { acc: 'A/c No.', ifsc: 'IFSC', qr: 'Scan to pay' }
    : { acc: 'கணக்கு எண்', ifsc: 'IFSC குறியீடு', qr: 'QR வழியாக செலுத்த' };
  return (
    <div className="bank">
      <p><strong>{settings.bank_name}</strong>, {L.acc}: <strong>{settings.bank_account}</strong></p>
      {settings.bank_ifsc && <p>{L.ifsc}: <strong>{settings.bank_ifsc}</strong></p>}
      {settings.qr_code && (
        <p className="qr"><img src={settings.qr_code} alt={L.qr} /></p>
      )}
    </div>
  );
}
