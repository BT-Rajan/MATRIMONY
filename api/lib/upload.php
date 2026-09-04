<?php
declare(strict_types=1);

class UploadException extends RuntimeException {}

/**
 * Stores an uploaded payment-proof file after sniffing its real MIME type
 * (never trust the client-supplied one). Returns the relative path under
 * api/uploads/ that gets saved in the DB.
 */
function store_payment_proof(array $file): string
{
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'application/pdf' => 'pdf',
    ];
    $maxBytes = 5 * 1024 * 1024;

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        if ($file['error'] === UPLOAD_ERR_NO_FILE) {
            throw new UploadException('கட்டண சான்று தேவை');
        }
    }
    if (!is_uploaded_file($file['tmp_name'] ?? '')) {
        throw new UploadException('கோப்பு பதிவேற்றம் தோல்வியடைந்தது');
    }
    if ($file['size'] > $maxBytes) {
        throw new UploadException('கோப்பு அளவு 5MB க்கு மேல் இருக்கக்கூடாது');
    }

    $mime = mime_content_type($file['tmp_name']);
    if (!isset($allowed[$mime])) {
        throw new UploadException('JPG, PNG அல்லது PDF கோப்பு மட்டுமே அனுமதிக்கப்படும்');
    }
    $ext = $allowed[$mime];

    $dir = __DIR__ . '/../uploads/payment_proofs';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest = "{$dir}/{$name}";

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new UploadException('கோப்பை சேமிக்க முடியவில்லை');
    }

    return "payment_proofs/{$name}";
}
