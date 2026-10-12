// Small inline icons (no extra dependency). Decorative: pair with visible text.
export function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="foot-ico">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor" className="foot-ico">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3V14h2.8v8h3.4z" />
    </svg>
  );
}

// Role and contact icons for the Contact page.
const base = { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function CrownIcon() {
  return <svg {...base}><path d="M3 8l4.5 4L12 6l4.5 6L21 8l-2 11H5z" /></svg>;
}
export function PenIcon() {
  return <svg {...base}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></svg>;
}
export function WalletIcon() {
  return <svg {...base}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1" /></svg>;
}
export function PhoneIcon() {
  return <svg {...base}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></svg>;
}
export function UsersIcon() {
  return <svg {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></svg>;
}
export function RoleIcon({ role }) {
  if (role === 'president') return <CrownIcon />;
  if (role === 'secretary') return <PenIcon />;
  if (role === 'treasurer') return <WalletIcon />;
  return <UsersIcon />;
}
