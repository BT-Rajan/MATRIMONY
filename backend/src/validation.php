<?php
declare(strict_types=1);

const APP_TEXT = [ // field => [max length, required]
    'full_name' => [120, true], 'gothram' => [80, true], 'nakshatram' => [60, true], 'rasi' => [60, true],
    'education' => [150, true], 'occupation' => [150, true], 'work_location' => [150, false], 'monthly_income' => [60, false],
    'father_name' => [120, true], 'father_occupation' => [120, false], 'father_native' => [120, false],
    'mother_name' => [120, true], 'mother_occupation' => [120, false], 'mother_native' => [120, false],
    'siblings' => [255, false], 'address' => [500, true], 'signature' => [120, true],
];

const APP_COLS = [
    'gender', 'full_name', 'dob', 'gothram', 'nakshatram', 'rasi', 'education', 'occupation', 'work_location', 'monthly_income',
    'father_name', 'father_occupation', 'father_native', 'mother_name', 'mother_occupation', 'mother_native', 'siblings',
    'address', 'phone', 'email', 'payment_ref', 'payment_date', 'signature',
];

function valid_date(string $s): ?DateTimeImmutable
{
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $d : null;
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

    $dobRaw = clean_str($in['dob'] ?? '');
    $d['dob'] = $dobRaw;
    if ($dobRaw === '') {
        $e['dob'] = 'required';
    } elseif (!($dob = valid_date($dobRaw)) || $dob > $today) {
        $e['dob'] = 'invalid';
    } else {
        $age = $dob->diff($today)->y;
        if ($age < ($gender === 'male' ? 21 : 18)) $e['dob'] = 'age_min';
        elseif ($age > 70) $e['dob'] = 'invalid';
    }

    $phone = preg_replace('/[\s\-()]/', '', clean_str($in['phone'] ?? '')) ?? '';
    $d['phone'] = $phone;
    if ($phone === '') $e['phone'] = 'required';
    elseif (!preg_match('/^\+?\d{10,15}$/', $phone)) $e['phone'] = 'invalid';

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
    } elseif (!($pay = valid_date($payRaw))) {
        $e['payment_date'] = 'invalid';
    } elseif ($pay > $today) {
        $e['payment_date'] = 'future_date';
    } elseif ($public && $pay < $today->modify('-1 year')) {
        $e['payment_date'] = 'invalid';
    }

    if ($public && ($in['terms_accepted'] ?? false) !== true) $e['terms_accepted'] = 'required';

    return [$d, $e];
}
