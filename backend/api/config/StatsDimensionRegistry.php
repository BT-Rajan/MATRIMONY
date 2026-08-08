<?php
declare(strict_types=1);

/**
 * Whitelists which member columns can be used as a "GROUP BY" dimension
 * for the reports/breakdown endpoints. Same reasoning as MasterRegistry:
 * StatsModel's dynamic SQL only ever pulls table/column names from here,
 * never from the request, so a query string like ?dimension=whatever
 * can select a report, not inject a column.
 */
final class StatsDimensionRegistry
{
    private const REGISTRY = [
        'religion' => ['column' => 'religion_id', 'table' => 'religions', 'label_ta' => 'மதம்', 'label_en' => 'Religion'],
        'caste' => ['column' => 'caste_id', 'table' => 'castes', 'label_ta' => 'சாதி', 'label_en' => 'Caste'],
        'education' => ['column' => 'education_id', 'table' => 'educations', 'label_ta' => 'கல்வி', 'label_en' => 'Education'],
        'occupation' => ['column' => 'occupation_id', 'table' => 'occupations', 'label_ta' => 'தொழில்', 'label_en' => 'Occupation'],
        'income' => ['column' => 'income_id', 'table' => 'incomes', 'label_ta' => 'வருமானம்', 'label_en' => 'Income'],
        'district' => ['column' => 'district_id', 'table' => 'districts', 'label_ta' => 'மாவட்டம்', 'label_en' => 'District'],
    ];

    public static function find(string $key): ?array
    {
        return self::REGISTRY[$key] ?? null;
    }

    public static function exists(string $key): bool
    {
        return isset(self::REGISTRY[$key]);
    }

    public static function keys(): array
    {
        return array_keys(self::REGISTRY);
    }
}
