<?php
declare(strict_types=1);

// Lists images dropped into public/hero/ (home-page slider) or public/gallery/ (gallery page).
// No upload UI and no rebuild needed: copy files into the folder and they appear.
function media_scan(string $dir, string $url): array
{
    $out = [];
    if (!is_dir($dir)) return $out;
    $files = scandir($dir) ?: [];
    natcasesort($files); // name them 01-..., 02-... to control the order
    foreach ($files as $f) {
        if ($f === '' || $f[0] === '.' || !preg_match('/\.(jpe?g|png|webp|avif|gif)$/i', $f)) continue;
        $p = "$dir/$f";
        if (!is_file($p)) continue;
        $out[] = ['src' => "$url/" . rawurlencode($f) . '?v=' . (int)filemtime($p), 'name' => pathinfo($f, PATHINFO_FILENAME)];
        if (count($out) >= 60) break;
    }
    return $out;
}

// $device: '' | mobile | tablet | desktop.
// Images in public/<folder>/ are shared by all devices; a file with the same name inside
// public/<folder>/<device>/ replaces it for that device (e.g. hero/spiritual.jpg + hero/mobile/spiritual.jpg).
function media_list(string $folder, string $device = ''): void
{
    $root = rtrim((string)(defined('PUBLIC_DIR') ? PUBLIC_DIR : __DIR__ . '/../../public'), '/');
    $byName = [];
    foreach (media_scan("$root/$folder", "/$folder") as $im) $byName[strtolower($im['name'])] = $im;
    if ($device !== '') {
        foreach (media_scan("$root/$folder/$device", "/$folder/$device") as $im) $byName[strtolower($im['name'])] = $im;
    }
    ksort($byName, SORT_NATURAL);
    header('Cache-Control: public, max-age=60');
    out(['images' => array_values($byName), 'device' => $device]);
}

function h_images_hero(): void { media_list('hero'); }
function h_images_hero_mobile(): void { media_list('hero', 'mobile'); }
function h_images_hero_tablet(): void { media_list('hero', 'tablet'); }
function h_images_hero_desktop(): void { media_list('hero', 'desktop'); }
function h_images_gallery(): void { media_list('gallery'); }
function h_images_events(): void { media_list('events'); }
function h_images_events_mobile(): void { media_list('events', 'mobile'); }
function h_images_events_tablet(): void { media_list('events', 'tablet'); }
function h_images_events_desktop(): void { media_list('events', 'desktop'); }
