<?php
declare(strict_types=1);

/**
 * Validates and persists an uploaded file. Every call site whitelists
 * its own allowed extensions/mime types/size — nothing here trusts the
 * client-declared extension or Content-Type; both are re-checked against
 * the file's real content via finfo. Files are renamed to a UUID on
 * disk; the original filename is kept by the caller in the DB row.
 */
final class FileUpload
{
    private const DANGEROUS_EXTENSIONS = ['php', 'php3', 'php4', 'php5', 'phtml', 'exe', 'sh', 'bat', 'js', 'asp', 'aspx', 'jsp', 'svg', 'zip'];

    private const MIME_BY_EXT = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'pdf' => 'application/pdf',
    ];

    /**
     * @param array $file one element of $_FILES, e.g. $_FILES['photo']
     * @param string $subfolder under backend/api/uploads/ (e.g. 'photos')
     * @param string[] $allowedExtensions e.g. ['jpg','jpeg','png']
     * @return array{path: string, original_filename: string}
     * @throws UploadException
     */
    public static function store(array $file, string $subfolder, array $allowedExtensions, int $maxBytes): array
    {
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new UploadException('கோப்பு பதிவேற்றத்தில் பிழை');
        }

        if ($file['error'] === UPLOAD_ERR_NO_FILE) {
            throw new UploadException('கோப்பு தேவை');
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new UploadException('கோப்பு பதிவேற்றத்தில் பிழை ஏற்பட்டது');
        }
        if ($file['size'] > $maxBytes) {
            $maxMb = round($maxBytes / (1024 * 1024), 1);
            throw new UploadException("கோப்பு அளவு அதிகபட்சம் {$maxMb}MB ஆக இருக்க வேண்டும்");
        }
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new UploadException('தவறான கோப்பு பதிவேற்றம்');
        }

        $originalName = $file['name'];
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if (in_array($ext, self::DANGEROUS_EXTENSIONS, true)) {
            throw new UploadException('இந்த கோப்பு வகை அனுமதிக்கப்படவில்லை');
        }
        if (!in_array($ext, $allowedExtensions, true)) {
            throw new UploadException('அனுமதிக்கப்பட்ட கோப்பு வகைகள்: ' . implode(', ', $allowedExtensions));
        }

        // Verify the file's *actual* content matches an allowed MIME type —
        // never trust the client-supplied extension or Content-Type alone.
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $expectedMime = self::MIME_BY_EXT[$ext] ?? null;
        if ($expectedMime === null || $realMime !== $expectedMime) {
            throw new UploadException('கோப்பு உள்ளடக்கம் அதன் வகையுடன் பொருந்தவில்லை');
        }

        $uploadsRoot = __DIR__ . '/../uploads/' . $subfolder;
        if (!is_dir($uploadsRoot)) {
            mkdir($uploadsRoot, 0755, true);
        }

        $newName = bin2hex(random_bytes(16)) . '.' . $ext;
        $destination = $uploadsRoot . '/' . $newName;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new UploadException('கோப்பை சேமிக்க முடியவில்லை');
        }

        return [
            'path' => $subfolder . '/' . $newName,
            'original_filename' => $originalName,
        ];
    }
}

final class UploadException extends RuntimeException
{
}
