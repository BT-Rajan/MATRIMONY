// Mirrors backend/api/config/MasterRegistry.php. Kept as static config here
// (rather than fetched) so routes and nav can be built synchronously; the
// backend remains the source of truth for validation and data.
export const MASTER_CONFIG = [
  { slug: 'religions', labelTa: 'மதம்', labelEn: 'Religion', type: 'simple' },
  { slug: 'castes', labelTa: 'சாதி', labelEn: 'Caste', type: 'hierarchical', parentSlug: 'religions', parentColumn: 'religion_id', parentLabelTa: 'மதம்' },
  { slug: 'sub-castes', labelTa: 'உப சாதி', labelEn: 'Sub Caste', type: 'hierarchical', parentSlug: 'castes', parentColumn: 'caste_id', parentLabelTa: 'சாதி' },
  { slug: 'districts', labelTa: 'மாவட்டம்', labelEn: 'District', type: 'simple' },
  { slug: 'taluks', labelTa: 'வட்டம்', labelEn: 'Taluk', type: 'hierarchical', parentSlug: 'districts', parentColumn: 'district_id', parentLabelTa: 'மாவட்டம்' },
  { slug: 'villages', labelTa: 'கிராமம்', labelEn: 'Village', type: 'hierarchical', parentSlug: 'taluks', parentColumn: 'taluk_id', parentLabelTa: 'வட்டம்' },
  { slug: 'educations', labelTa: 'கல்வி', labelEn: 'Education', type: 'simple' },
  { slug: 'occupations', labelTa: 'தொழில்', labelEn: 'Occupation', type: 'simple' },
  { slug: 'incomes', labelTa: 'வருமானம்', labelEn: 'Income', type: 'simple' },
  { slug: 'stars', labelTa: 'நட்சத்திரம்', labelEn: 'Star', type: 'simple' },
  { slug: 'rasis', labelTa: 'ராசி', labelEn: 'Rasi', type: 'simple' },
  { slug: 'doshams', labelTa: 'தோஷம்', labelEn: 'Dosham', type: 'simple' },
  { slug: 'relationships', labelTa: 'உறவுமுறை', labelEn: 'Relationship', type: 'simple' },
  { slug: 'events', labelTa: 'நிகழ்வு', labelEn: 'Event', type: 'event' },
  { slug: 'payment-types', labelTa: 'கட்டண வகை', labelEn: 'Payment Type', type: 'simple' },
];

export function getMasterConfig(slug) {
  return MASTER_CONFIG.find((m) => m.slug === slug) || null;
}
