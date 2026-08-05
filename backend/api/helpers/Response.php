<?php
declare(strict_types=1);

/**
 * All API responses share one shape so the frontend never has to guess:
 *   success: { status: "success", data: {...} }
 *   error:   { status: "error", message: "...", errors: { field: "..." } | null }
 */
final class Response
{
    public static function success(mixed $data = null, int $code = 200, ?string $message = null): void
    {
        http_response_code($code);
        $payload = ['status' => 'success'];
        if ($message !== null) {
            $payload['message'] = $message;
        }
        $payload['data'] = $data;
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $code = 400, ?array $errors = null): void
    {
        http_response_code($code);
        echo json_encode([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function validationError(array $errors, string $message = 'சரிபார்ப்பு தோல்வியடைந்தது'): void
    {
        self::error($message, 422, $errors);
    }
}
