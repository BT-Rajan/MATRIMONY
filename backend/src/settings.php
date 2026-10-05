<?php
declare(strict_types=1);

const SETTINGS_TEXT = [ // field => [max length, required]
    'event_date' => [60, false], 'venue_ta' => [255, true], 'venue_en' => [255, true],
    'bank_name' => [150, true], 'bank_name_en' => [150, false], 'bank_account' => [40, true], 'bank_ifsc' => [20, false],
];
const QR_MAX_RAW_BYTES = 2 * 1024 * 1024; // 2MB original image, before base64 overhead

function settings_row(): array
{
    $row = db()->query('SELECT event_date, venue_ta, venue_en, bank_name, bank_name_en, bank_account, bank_ifsc, qr_code, updated_at FROM site_settings WHERE id = 1')->fetch();
    return $row ?: array_fill_keys(['event_date', 'venue_ta', 'venue_en', 'bank_name', 'bank_name_en', 'bank_account', 'bank_ifsc', 'qr_code', 'updated_at'], null);
}

// Public: the landing page, apply form, and event page all read this without logging in.
function h_settings_get(): void
{
    out(settings_row());
}

function h_settings_update(): void
{
    $u = require_user('admin');
    $in = body();
    $e = [];
    $d = [];

    foreach (SETTINGS_TEXT as $k => [$max, $req]) {
        $v = clean_str($in[$k] ?? '');
        if ($v === '') {
            if ($req) $e[$k] = 'required';
            $d[$k] = '';
            continue;
        }
        if (mb_strlen($v) > $max) $e[$k] = 'too_long';
        $d[$k] = $v;
    }
    if ($d['bank_ifsc'] !== '' && !preg_match('/^[A-Z]{4}0[A-Z0-9]{6}$/', $d['bank_ifsc'])) $e['bank_ifsc'] = 'invalid';

    // qr_code: omit the key to leave it untouched, send "" or null to clear it, or a data: URI to set it.
    $qrProvided = array_key_exists('qr_code', $in);
    $qr = null;
    if ($qrProvided) {
        $raw = $in['qr_code'];
        if ($raw === null || $raw === '') {
            $qr = null;
        } elseif (!is_string($raw) || !preg_match('#^data:image/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$#', $raw, $m)) {
            $e['qr_code'] = 'invalid';
        } elseif (strlen($m[2]) > QR_MAX_RAW_BYTES * 4 / 3 + 1000) {
            $e['qr_code'] = 'too_large';
        } else {
            $qr = $raw;
        }
    }

    if ($e) fail(422, 'validation', $e);

    if ($qrProvided) {
        db()->prepare('UPDATE site_settings SET event_date=?, venue_ta=?, venue_en=?, bank_name=?, bank_name_en=?, bank_account=?, bank_ifsc=?, qr_code=?, updated_by=? WHERE id = 1')
            ->execute([$d['event_date'], $d['venue_ta'], $d['venue_en'], $d['bank_name'], $d['bank_name_en'], $d['bank_account'], $d['bank_ifsc'], $qr, $u['id']]);
    } else {
        db()->prepare('UPDATE site_settings SET event_date=?, venue_ta=?, venue_en=?, bank_name=?, bank_name_en=?, bank_account=?, bank_ifsc=?, updated_by=? WHERE id = 1')
            ->execute([$d['event_date'], $d['venue_ta'], $d['venue_en'], $d['bank_name'], $d['bank_name_en'], $d['bank_account'], $d['bank_ifsc'], $u['id']]);
    }

    out(settings_row());
}
