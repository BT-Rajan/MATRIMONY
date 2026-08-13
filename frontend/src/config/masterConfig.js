// Mirrors backend/api/config/MasterRegistry.php. Kept as static config here
// (rather than fetched) so routes and nav can be built synchronously; the
// backend remains the source of truth for validation and data.
//
// Only the masters registration actually uses remain here. Religion, caste,
// sub-caste, district, taluk, village, income, dosham, relationship, event,
// and payment-type were removed along with the registration fields they backed.
export const MASTER_CONFIG = [
  { slug: 'educations', labelTa: 'கல்வி', labelEn: 'Education', type: 'simple' },
  { slug: 'occupations', labelTa: 'தொழில்', labelEn: 'Occupation', type: 'simple' },
  { slug: 'stars', labelTa: 'நட்சத்திரம்', labelEn: 'Star', type: 'simple' },
  { slug: 'rasis', labelTa: 'ராசி', labelEn: 'Sign', type: 'simple' },
];

export function getMasterConfig(slug) {
  return MASTER_CONFIG.find((m) => m.slug === slug) || null;
}
