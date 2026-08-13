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
 *
 * Only the masters registration actually uses remain here (education,
 * occupation, star, sign/rasi). Religion, caste, sub-caste, district,
 * taluk, village, income, dosham, relationship, event, and payment-type
 * were dropped along with the fields they backed — see migration 012.
 */
final class MasterRegistry
{
    private const REGISTRY = [
        'educations' => [
            'table' => 'educations', 'type' => 'simple',
            'label_ta' => 'கல்வி', 'label_en' => 'Education',
        ],
        'occupations' => [
            'table' => 'occupations', 'type' => 'simple',
            'label_ta' => 'தொழில்', 'label_en' => 'Occupation',
        ],
        'stars' => [
            'table' => 'stars', 'type' => 'simple',
            'label_ta' => 'நட்சத்திரம்', 'label_en' => 'Star',
        ],
        'rasis' => [
            'table' => 'rasis', 'type' => 'simple',
            'label_ta' => 'ராசி', 'label_en' => 'Sign',
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
