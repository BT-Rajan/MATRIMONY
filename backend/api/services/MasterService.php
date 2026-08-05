<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/MasterModel.php';
require_once __DIR__ . '/../config/MasterRegistry.php';
require_once __DIR__ . '/../helpers/Audit.php';

final class MasterService
{
    public static function list(string $slug, ?string $search, ?int $parentId, int $page, int $perPage): array
    {
        $config = MasterRegistry::find($slug);
        return MasterModel::paginate($config, $search, $parentId, $page, $perPage);
    }

    /** @throws MasterException */
    public static function create(string $slug, array $input, int $actorId): array
    {
        $config = MasterRegistry::find($slug);
        $errors = self::validate($config, $input, null);
        if ($errors) {
            throw new MasterException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
        }

        $fields = self::buildFields($config, $input);
        $id = MasterModel::create($config, $fields, $actorId);
        $row = MasterModel::find($config, $id);

        Audit::log($actorId, 'admin', 'master_created', $config['table'], $id, null, $row);
        return $row;
    }

    /** @throws MasterException */
    public static function update(string $slug, int $id, array $input, int $actorId): array
    {
        $config = MasterRegistry::find($slug);
        $existing = MasterModel::find($config, $id);
        if (!$existing) {
            throw new MasterException('தரவு கிடைக்கவில்லை', 404);
        }

        $errors = self::validate($config, $input, $id);
        if ($errors) {
            throw new MasterException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
        }

        $fields = self::buildFields($config, $input);
        MasterModel::update($config, $id, $fields, $actorId);
        $updated = MasterModel::find($config, $id);

        Audit::log($actorId, 'admin', 'master_updated', $config['table'], $id, $existing, $updated);
        return $updated;
    }

    /** @throws MasterException */
    public static function delete(string $slug, int $id, int $actorId): void
    {
        $config = MasterRegistry::find($slug);
        $existing = MasterModel::find($config, $id);
        if (!$existing) {
            throw new MasterException('தரவு கிடைக்கவில்லை', 404);
        }

        try {
            MasterModel::delete($config, $id);
        } catch (PDOException $e) {
            // FK RESTRICT (23000-family) => this row still has children / is referenced
            if ((int) $e->getCode() === 23000 || str_contains($e->getMessage(), 'foreign key constraint')) {
                throw new MasterException(
                    'இந்த தரவு பிற இடங்களில் பயன்பாட்டில் உள்ளது என்பதால் நீக்க முடியாது. முதலில் அதை செயலிழக்க செய்யவும்.',
                    409
                );
            }
            throw $e;
        }

        Audit::log($actorId, 'admin', 'master_deleted', $config['table'], $id, $existing, null);
    }

    private static function validate(array $config, array $input, ?int $excludeId): array
    {
        $errors = [];

        $nameTamil = trim((string) ($input['name_tamil'] ?? ''));
        $nameEnglish = trim((string) ($input['name_english'] ?? ''));

        if ($config['type'] === 'event') {
            if ($nameTamil === '') $errors['name_tamil'] = 'தமிழ் பெயர் தேவை';
            if ($nameEnglish === '') $errors['name_english'] = 'ஆங்கில பெயர் தேவை';
            return $errors; // events have no uniqueness/parent constraint in Pass 2
        }

        if ($nameTamil === '') {
            $errors['name_tamil'] = 'தமிழ் பெயர் தேவை';
        }
        if ($nameEnglish === '') {
            $errors['name_english'] = 'ஆங்கில பெயர் தேவை';
        } elseif (MasterModel::nameExists($config, $nameEnglish, self::parentIdFrom($config, $input), $excludeId)) {
            $errors['name_english'] = 'இந்த பெயர் ஏற்கனவே உள்ளது';
        }

        if ($config['type'] === 'hierarchical') {
            $parentId = self::parentIdFrom($config, $input);
            if (!$parentId) {
                $errors[$config['parent_column']] = 'மேல்நிலை தேவை';
            } elseif (!MasterModel::parentExists($config, $parentId)) {
                $errors[$config['parent_column']] = 'மேல்நிலை தரவு கிடைக்கவில்லை';
            }
        }

        return $errors;
    }

    private static function buildFields(array $config, array $input): array
    {
        if ($config['type'] === 'event') {
            return [
                'name_tamil' => trim($input['name_tamil']),
                'name_english' => trim($input['name_english']),
                'event_date' => $input['event_date'] ?: null,
                'venue' => $input['venue'] !== '' ? trim((string) $input['venue']) : null,
                'sort_order' => (int) ($input['sort_order'] ?? 0),
                'is_active' => !empty($input['is_active']) ? 1 : 0,
            ];
        }

        $fields = [
            'name_tamil' => trim($input['name_tamil']),
            'name_english' => trim($input['name_english']),
            'sort_order' => (int) ($input['sort_order'] ?? 0),
            'is_active' => !empty($input['is_active']) ? 1 : 0,
        ];

        if ($config['type'] === 'hierarchical') {
            $fields[$config['parent_column']] = self::parentIdFrom($config, $input);
        }

        return $fields;
    }

    private static function parentIdFrom(array $config, array $input): ?int
    {
        if ($config['type'] !== 'hierarchical') {
            return null;
        }
        $col = $config['parent_column'];
        return isset($input[$col]) && $input[$col] !== '' ? (int) $input[$col] : null;
    }
}

final class MasterException extends RuntimeException
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
