<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/AdminModel.php';
require_once __DIR__ . '/../models/MemberModel.php';
require_once __DIR__ . '/../helpers/Audit.php';

final class AuthController
{
    public static function loginAdmin(): void
    {
        $body = self::body();

        $validator = new Validator($body);
        $validator->required('username', 'பயனர் பெயர்')->required('password', 'கடவுச்சொல்');
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }

        try {
            $result = AuthService::loginAdmin(trim($body['username']), $body['password']);
            Response::success($result, 200, 'உள்நுழைவு வெற்றி');
        } catch (AuthException $e) {
            Response::error($e->getMessage(), $e->httpCode());
        }
    }

    public static function loginMember(): void
    {
        $body = self::body();

        $validator = new Validator($body);
        $validator->required('identifier', 'மொபைல்/மின்னஞ்சல்')->required('password', 'கடவுச்சொல்');
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }

        try {
            $result = AuthService::loginMember(trim($body['identifier']), $body['password']);
            Response::success($result, 200, 'உள்நுழைவு வெற்றி');
        } catch (AuthException $e) {
            Response::error($e->getMessage(), $e->httpCode());
        }
    }

    public static function me(): void
    {
        $payload = AuthMiddleware::requireAuth();

        if ($payload['role'] === 'admin') {
            $admin = AdminModel::findById((int) $payload['sub']);
            if (!$admin) {
                Response::error('கணக்கு கிடைக்கவில்லை', 404);
            }
            Response::success([
                'id' => (int) $admin['id'],
                'username' => $admin['username'],
                'name' => $admin['name'],
                'role' => 'admin',
            ]);
        }

        $member = MemberModel::findById((int) $payload['sub']);
        if (!$member) {
            Response::error('கணக்கு கிடைக்கவில்லை', 404);
        }
        Response::success([
            'id' => (int) $member['id'],
            'name' => $member['name_english'],
            'registration_number' => $member['registration_number'],
            'status' => $member['status'],
            'role' => 'member',
        ]);
    }

    public static function logout(): void
    {
        $payload = AuthMiddleware::requireAuth();
        Audit::log((int) $payload['sub'], $payload['role'], 'logout', $payload['role'], (int) $payload['sub']);
        // Stateless JWT: logout is client-side (token discard). Nothing to invalidate server-side in Pass 1.
        Response::success(null, 200, 'வெளியேறியது');
    }

    private static function body(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw ?: '[]', true);
        return is_array($decoded) ? $decoded : [];
    }
}
