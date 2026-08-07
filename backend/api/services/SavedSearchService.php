<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/SavedSearchModel.php';
require_once __DIR__ . '/../helpers/Audit.php';

final class SavedSearchService
{
    public static function list(int $adminId): array
    {
        return SavedSearchModel::listForAdmin($adminId);
    }

    /** @throws SavedSearchException */
    public static function create(int $adminId, array $input): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $filters = $input['filters'] ?? [];

        if ($name === '') {
            throw new SavedSearchException('சரிபார்ப்பு தோல்வியடைந்தது', 422, ['name' => 'பெயர் தேவை']);
        }
        if (!is_array($filters) || empty($filters)) {
            throw new SavedSearchException('சரிபார்ப்பு தோல்வியடைந்தது', 422, ['filters' => 'குறைந்தது ஒரு வடிகட்டி தேவை']);
        }

        $id = SavedSearchModel::create($adminId, $name, $filters);
        Audit::log($adminId, 'admin', 'saved_search_created', 'saved_searches', $id, null, ['name' => $name]);

        return SavedSearchModel::find($id, $adminId);
    }

    /** @throws SavedSearchException */
    public static function delete(int $id, int $adminId): void
    {
        $existing = SavedSearchModel::find($id, $adminId);
        if (!$existing) {
            throw new SavedSearchException('கிடைக்கவில்லை', 404);
        }
        SavedSearchModel::delete($id, $adminId);
        Audit::log($adminId, 'admin', 'saved_search_deleted', 'saved_searches', $id, ['name' => $existing['name']], null);
    }
}

final class SavedSearchException extends RuntimeException
{
    public function __construct(string $message, private int $httpCode = 400, private ?array $errors = null)
    {
        parent::__construct($message);
    }

    public function httpCode(): int
    {
        return $this->httpCode;
    }

    public function errors(): ?array
    {
        return $this->errors;
    }
}
