<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/RegistrationService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/RateLimiter.php';
require_once __DIR__ . '/../helpers/Response.php';

final class RegistrationController
{
    /**
     * POST /registration — public, multipart/form-data.
     * Single-step registration: bio-data + payment in one submit.
     * Auto-logs the member in on success.
     */
    public static function register(): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (RateLimiter::tooManyRecentAttempts("register_ip:{$ip}", 10, 60)) {
            Response::error('அதிக பதிவு முயற்சிகள். சிறிது நேரம் கழித்து முயற்சிக்கவும்.', 429);
        }
        RateLimiter::recordAttempt("register_ip:{$ip}", true);

        try {
            $result = RegistrationService::register($_POST, $_FILES);
            Response::success($result, 201, 'பதிவு முடிக்கப்பட்டது! அனுமதிக்காக காத்திருக்கிறது.');
        } catch (RegistrationException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    /** GET /registration/me — the logged-in member's own registration record. */
    public static function me(): void
    {
        $payload = AuthMiddleware::requireAuth(['member']);
        $member = RegistrationService::currentState((int) $payload['sub']);
        if (!$member) {
            Response::error('கணக்கு கிடைக்கவில்லை', 404);
        }
        unset($member['password_hash']);
        Response::success($member);
    }
}
