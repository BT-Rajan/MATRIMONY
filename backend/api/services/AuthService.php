<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/AdminModel.php';
require_once __DIR__ . '/../models/MemberModel.php';
require_once __DIR__ . '/../helpers/Jwt.php';
require_once __DIR__ . '/../helpers/Audit.php';
require_once __DIR__ . '/../middleware/RateLimiter.php';

final class AuthService
{
    /** @throws AuthException */
    public static function loginAdmin(string $username, string $password): array
    {
        if (RateLimiter::tooManyAttempts("admin:{$username}")) {
            throw new AuthException('அதிக தோல்வி முயற்சிகள். சிறிது நேரம் கழித்து முயற்சிக்கவும்.', 429);
        }

        $admin = AdminModel::findByUsername($username);

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            RateLimiter::recordAttempt("admin:{$username}", false);
            Audit::log(null, 'admin', 'login_failed', 'admin', $admin['id'] ?? null);
            throw new AuthException('பயனர் பெயர் அல்லது கடவுச்சொல் தவறானது', 401);
        }

        RateLimiter::recordAttempt("admin:{$username}", true);
        AdminModel::touchLastLogin((int) $admin['id']);
        Audit::log((int) $admin['id'], 'admin', 'login_success', 'admin', (int) $admin['id']);

        $token = Jwt::encode([
            'sub' => (int) $admin['id'],
            'role' => 'admin',
            'username' => $admin['username'],
        ]);

        return [
            'token' => $token,
            'user' => [
                'id' => (int) $admin['id'],
                'username' => $admin['username'],
                'name' => $admin['name'],
                'role' => 'admin',
            ],
        ];
    }

    /** @throws AuthException */
    public static function loginMember(string $identifier, string $password): array
    {
        if (RateLimiter::tooManyAttempts("member:{$identifier}")) {
            throw new AuthException('அதிக தோல்வி முயற்சிகள். சிறிது நேரம் கழித்து முயற்சிக்கவும்.', 429);
        }

        $member = MemberModel::findByEmailOrMobile($identifier);

        if (!$member || !password_verify($password, $member['password_hash'])) {
            RateLimiter::recordAttempt("member:{$identifier}", false);
            Audit::log(null, 'member', 'login_failed', 'member', $member['id'] ?? null);
            throw new AuthException('மொபைல்/மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது', 401);
        }

        if ($member['status'] === 'blocked') {
            throw new AuthException('இந்த கணக்கு முடக்கப்பட்டுள்ளது. நிர்வாகியை தொடர்பு கொள்ளவும்.', 403);
        }

        RateLimiter::recordAttempt("member:{$identifier}", true);
        MemberModel::touchLastLogin((int) $member['id']);
        Audit::log((int) $member['id'], 'member', 'login_success', 'member', (int) $member['id']);

        $token = Jwt::encode([
            'sub' => (int) $member['id'],
            'role' => 'member',
            'registration_number' => $member['registration_number'],
        ]);

        return [
            'token' => $token,
            'user' => [
                'id' => (int) $member['id'],
                'name' => $member['name_english'],
                'registration_number' => $member['registration_number'],
                'status' => $member['status'],
                'role' => 'member',
            ],
        ];
    }
}

final class AuthException extends RuntimeException
{
    public function __construct(string $message, private int $httpCode = 401)
    {
        parent::__construct($message);
    }

    public function httpCode(): int
    {
        return $this->httpCode;
    }
}
