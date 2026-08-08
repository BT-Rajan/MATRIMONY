<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/StatsModel.php';
require_once __DIR__ . '/../config/StatsDimensionRegistry.php';

final class StatsService
{
    public static function overview(): array
    {
        return StatsModel::overview();
    }

    /** @throws StatsException */
    public static function registrationTrend(string $period): array
    {
        if (!in_array($period, ['daily', 'monthly'], true)) {
            throw new StatsException('period ஆனது daily அல்லது monthly ஆக இருக்க வேண்டும்', 422);
        }
        $points = $period === 'monthly' ? 12 : 30;
        return StatsModel::registrationTrend($period, $points);
    }

    /** @throws StatsException */
    public static function breakdown(string $dimension): array
    {
        if ($dimension === 'age') {
            return StatsModel::ageBreakdown();
        }
        if (!StatsDimensionRegistry::exists($dimension)) {
            throw new StatsException('இந்த வகைப்பாடு கிடைக்கவில்லை', 404);
        }
        return StatsModel::breakdown($dimension);
    }

    public static function payments(): array
    {
        return StatsModel::payments();
    }

    public static function events(): array
    {
        return StatsModel::events();
    }
}

final class StatsException extends RuntimeException
{
    public function __construct(string $message, private int $httpCode = 400)
    {
        parent::__construct($message);
    }

    public function httpCode(): int
    {
        return $this->httpCode;
    }
}
