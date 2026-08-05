<?php
declare(strict_types=1);

/**
 * Registry of every master/lookup table. This is the ONLY place table
 * and column names for the generic Master engine are allowed to come
 * from — MasterModel never accepts a table/column name from the request,
 * only a "slug" that is looked up here. That's what keeps the dynamic
 * SQL in MasterModel safe from injection.
 *
 * type: 'simple'  -> id, name_tamil, name_english, sort_order, is_active
 *       'hierarchical' -> simple + parent_column referencing parent_slug
 *       'event' -> its own shape (name, event_date, venue) — handled by
 *                  a small amount of special-casing in the controller.
 */
final class MasterRegistry
{
    private const REGISTRY = [
        'religions' => [
            'table' => 'religions', 'type' => 'simple',
            'label_ta' => 'மதம்', 'label_en' => 'Religion',
        ],
        'castes' => [
            'table' => 'castes', 'type' => 'hierarchical',
            'parent_slug' => 'religions', 'parent_column' => 'religion_id',
            'label_ta' => 'சாதி', 'label_en' => 'Caste',
        ],
        'sub-castes' => [
            'table' => 'sub_castes', 'type' => 'hierarchical',
            'parent_slug' => 'castes', 'parent_column' => 'caste_id',
            'label_ta' => 'உப சாதி', 'label_en' => 'Sub Caste',
        ],
        'districts' => [
            'table' => 'districts', 'type' => 'simple',
            'label_ta' => 'மாவட்டம்', 'label_en' => 'District',
        ],
        'taluks' => [
            'table' => 'taluks', 'type' => 'hierarchical',
            'parent_slug' => 'districts', 'parent_column' => 'district_id',
            'label_ta' => 'வட்டம்', 'label_en' => 'Taluk',
        ],
        'villages' => [
            'table' => 'villages', 'type' => 'hierarchical',
            'parent_slug' => 'taluks', 'parent_column' => 'taluk_id',
            'label_ta' => 'கிராமம்', 'label_en' => 'Village',
        ],
        'educations' => [
            'table' => 'educations', 'type' => 'simple',
            'label_ta' => 'கல்வி', 'label_en' => 'Education',
        ],
        'occupations' => [
            'table' => 'occupations', 'type' => 'simple',
            'label_ta' => 'தொழில்', 'label_en' => 'Occupation',
        ],
        'incomes' => [
            'table' => 'incomes', 'type' => 'simple',
            'label_ta' => 'வருமானம்', 'label_en' => 'Income',
        ],
        'stars' => [
            'table' => 'stars', 'type' => 'simple',
            'label_ta' => 'நட்சத்திரம்', 'label_en' => 'Star',
        ],
        'rasis' => [
            'table' => 'rasis', 'type' => 'simple',
            'label_ta' => 'ராசி', 'label_en' => 'Rasi',
        ],
        'doshams' => [
            'table' => 'doshams', 'type' => 'simple',
            'label_ta' => 'தோஷம்', 'label_en' => 'Dosham',
        ],
        'relationships' => [
            'table' => 'relationships', 'type' => 'simple',
            'label_ta' => 'உறவுமுறை', 'label_en' => 'Relationship',
        ],
        'events' => [
            'table' => 'events', 'type' => 'event',
            'label_ta' => 'நிகழ்வு', 'label_en' => 'Event',
        ],
        'payment-types' => [
            'table' => 'payment_types', 'type' => 'simple',
            'label_ta' => 'கட்டண வகை', 'label_en' => 'Payment Type',
        ],
    ];

    public static function all(): array
    {
        return self::REGISTRY;
    }

    public static function find(string $slug): ?array
    {
        return self::REGISTRY[$slug] ?? null;
    }

    public static function exists(string $slug): bool
    {
        return isset(self::REGISTRY[$slug]);
    }
}
