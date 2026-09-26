<?php
declare(strict_types=1);

const APP_TEXT = [ // field => [max length, required]
    'full_name' => [120, true], 'height' => [30, false], 'gothram' => [80, true], 'nakshatram' => [60, true], 'rasi' => [60, true],
    'education' => [150, true], 'occupation' => [150, true], 'work_location' => [150, false], 'monthly_income' => [60, false],
    'salary' => [60, false],
    'father_name' => [120, true], 'father_occupation' => [120, false], 'father_native' => [120, false],
    'mother_name' => [120, true], 'mother_occupation' => [120, false], 'mother_native' => [120, false],
    'siblings' => [255, false], 'address' => [500, true], 'signature' => [120, true],
    'payment_time' => [15, true], 'payment_bank' => [60, true],
];

const APP_COLS = [
    'gender', 'marital_status', 'full_name', 'dob', 'height', 'gothram', 'nakshatram', 'rasi', 'education', 'occupation',
    'work_location', 'monthly_income', 'salary',
    'father_name', 'father_occupation', 'father_native', 'mother_name', 'mother_occupation', 'mother_native', 'siblings',
    'address', 'phone', 'email', 'payment_ref', 'payment_date', 'payment_time', 'payment_amount', 'payment_bank', 'signature',
];

// All dates travel over the API as DD-MM-YYYY; only the DB layer sees Y-m-d.
function valid_date_dmy(string $s): ?DateTimeImmutable
{
    if (!preg_match('/^\d{2}-\d{2}-\d{4}$/', $s)) return null;
    $d = DateTimeImmutable::createFromFormat('!d-m-Y', $s);
    return ($d && $d->format('d-m-Y') === $s) ? $d : null;
}

// Accepts an Indian mobile with an optional +91/91/0 prefix; returns the bare 10-digit number, or null.
function normalize_mobile(string $raw): ?string
{
    $p = preg_replace('/[\s\-()]/', '', $raw) ?? '';
    return preg_match('/^(?:\+?91|0)?([6-9]\d{9})$/', $p, $m) ? $m[1] : null;
}

/** @return array{0: array, 1: array} [clean data, field => error code] */
function validate_application(array $in, bool $public): array
{
    $d = [];
    $e = [];
    $today = new DateTimeImmutable('today');

    foreach (APP_TEXT as $k => [$max, $req]) {
        $v = clean_str($in[$k] ?? '');
        if ($v === '') {
            if ($req) $e[$k] = 'required';
            $d[$k] = null;
            continue;
        }
        if (mb_strlen($v) > $max) $e[$k] = 'too_long';
        $d[$k] = $v;
    }

    $gender = $in['gender'] ?? '';
    if (!in_array($gender, ['male', 'female'], true)) $e['gender'] = 'required';
    $d['gender'] = $gender;

    $marital = $in['marital_status'] ?? 'first';
    if (!in_array($marital, ['first', 'remarriage'], true)) $e['marital_status'] = 'invalid';
    $d['marital_status'] = $marital;

    $dobRaw = clean_str($in['dob'] ?? '');
    $d['dob'] = $dobRaw;
    if ($dobRaw === '') {
        $e['dob'] = 'required';
    } elseif (!($dob = valid_date_dmy($dobRaw))) {
        $e['dob'] = 'date_format';
    } elseif ($dob > $today) {
        $e['dob'] = 'invalid';
    } else {
        $age = $dob->diff($today)->y;
        if ($age < 18) $e['dob'] = 'age_min';
        elseif ($age > 90) $e['dob'] = 'invalid';
        else $d['dob'] = $dob->format('Y-m-d'); // normalized for storage only once fully valid
    }

    $phoneRaw = clean_str($in['phone'] ?? '');
    $mobile = $phoneRaw === '' ? null : normalize_mobile($phoneRaw);
    $d['phone'] = $mobile ?? $phoneRaw;
    if ($phoneRaw === '') $e['phone'] = 'required';
    elseif (!$mobile) $e['phone'] = 'invalid';

    $email = clean_str($in['email'] ?? '');
    $d['email'] = $email === '' ? null : $email;
    if ($email !== '' && (mb_strlen($email) > 120 || !filter_var($email, FILTER_VALIDATE_EMAIL))) $e['email'] = 'invalid';

    $ref = strtoupper(clean_str($in['payment_ref'] ?? ''));
    $d['payment_ref'] = $ref;
    if ($ref === '') $e['payment_ref'] = 'required';
    elseif (!preg_match('#^[A-Z0-9/-]{6,40}$#', $ref)) $e['payment_ref'] = 'invalid';

    $payRaw = clean_str($in['payment_date'] ?? '');
    $d['payment_date'] = $payRaw;
    if ($payRaw === '') {
        $e['payment_date'] = 'required';
    } elseif (!($pay = valid_date_dmy($payRaw))) {
        $e['payment_date'] = 'date_format';
    } elseif ($pay > $today) {
        $e['payment_date'] = 'future_date';
    } elseif ($public && $pay < $today->modify('-1 year')) {
        $e['payment_date'] = 'invalid';
    } else {
        $d['payment_date'] = $pay->format('Y-m-d');
    }

    if ($public && ($in['terms_accepted'] ?? false) !== true) $e['terms_accepted'] = 'required';

    $amtRaw = clean_str($in['payment_amount'] ?? '');
    $d['payment_amount'] = $amtRaw;
    if ($amtRaw === '') $e['payment_amount'] = 'required';
    elseif (!preg_match('/^\d{1,6}(\.\d{1,2})?$/', $amtRaw) || (float)$amtRaw <= 0) $e['payment_amount'] = 'invalid';

    return [$d, $e];
}
