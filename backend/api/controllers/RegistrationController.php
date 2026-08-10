<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/RegistrationService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/RateLimiter.php';
require_once __DIR__ . '/../helpers/Response.php';

final class RegistrationController
{
    /** POST /registration/step1 — public, multipart/form-data. Auto-logs in on success. */
    public static function step1(): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (RateLimiter::tooManyRecentAttempts("register_ip:{$ip}", 10, 60)) {
            Response::error('அதிக பதிவு முயற்சிகள். சிறிது நேரம் கழித்து முயற்சிக்கவும்.', 429);
        }
        RateLimiter::recordAttempt("register_ip:{$ip}", true);

        try {
            $result = RegistrationService::step1($_POST, $_FILES);
            Response::success($result, 201, 'படி 1 சேமிக்கப்பட்டது');
        } catch (RegistrationException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    /** PUT/POST /registration/step2 — member-authenticated, multipart/form-data. */
    public static function step2(): void
    {
        $payload = AuthMiddleware::requireAuth(['member']);
        try {
            $result = RegistrationService::step2((int) $payload['sub'], $_POST, $_FILES);
            Response::success($result, 200, 'படி 2 சேமிக்கப்பட்டது');
        } catch (RegistrationException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    public static function step3(): void
    {
        $payload = AuthMiddleware::requireAuth(['member']);
        try {
            $result = RegistrationService::step3((int) $payload['sub'], $_POST, $_FILES);
            Response::success($result, 200, 'படி 3 சேமிக்கப்பட்டது');
        } catch (RegistrationException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    public static function step4(): void
    {
        $payload = AuthMiddleware::requireAuth(['member']);
        try {
            $result = RegistrationService::step4((int) $payload['sub'], self::jsonOrPostBody());
            Response::success($result, 200, 'படி 4 சேமிக்கப்பட்டது');
        } catch (RegistrationException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    public static function step5(): void
    {
        $payload = AuthMiddleware::requireAuth(['member']);
        try {
            $result = RegistrationService::step5((int) $payload['sub'], $_POST, $_FILES);
            Response::success($result, 200, 'பதிவு முடிக்கப்பட்டது! அனுமதிக்காக காத்திருக்கிறது.');
        } catch (RegistrationException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    /** GET /registration/me — full draft state, for the resume screen. */
    public static function me(): void
    {
        $payload = AuthMiddleware::requireAuth(['member']);
        try {
            $result = RegistrationService::currentState((int) $payload['sub']);
            Response::success($result);
        } catch (RegistrationException $e) {
            Response::error($e->getMessage(), $e->httpCode());
        }
    }

    /** Step 4 has no files, so the frontend may send plain JSON instead of multipart. */
    private static function jsonOrPostBody(): array
    {
        if (!empty($_POST)) {
            return $_POST;
        }
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw ?: '[]', true);
        return is_array($decoded) ? $decoded : [];
    }
}
