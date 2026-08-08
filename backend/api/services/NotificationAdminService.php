<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/NotificationModel.php';
require_once __DIR__ . '/../config/Config.php';

final class NotificationAdminService
{
    public static function list(array $filters, int $page, int $perPage): array
    {
        return NotificationModel::paginate($filters, $page, $perPage);
    }

    public static function counts(): array
    {
        return NotificationModel::counts();
    }

    /** Which channels are actually configured, without exposing secrets — for the admin settings screen. */
    public static function channelStatus(): array
    {
        return [
            'email' => [
                'enabled' => filter_var(env('MAIL_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN),
                'configured' => (bool) env('SMTP_HOST'),
            ],
            'sms' => [
                'enabled' => filter_var(env('SMS_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN),
                'configured' => (bool) env('SMS_API_URL'),
            ],
            'whatsapp' => [
                'enabled' => filter_var(env('WHATSAPP_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN),
                'configured' => (bool) env('WHATSAPP_API_URL'),
            ],
        ];
    }
}
