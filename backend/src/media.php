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

// $device: '' | mobile | tablet | desktop. Images in public/hero/<device>/ are used for that device;
// if that folder is empty the images directly in public/hero/ are used for every device.
function media_list(string $folder, string $device = ''): void
{
    $root = rtrim((string)(defined('PUBLIC_DIR') ? PUBLIC_DIR : __DIR__ . '/../../public'), '/');
    $out = [];
    if ($device !== '') $out = media_scan("$root/$folder/$device", "/$folder/$device");
    if (!$out) $out = media_scan("$root/$folder", "/$folder");
    header('Cache-Control: public, max-age=60');
    out(['images' => $out, 'device' => $device]);
}

function h_images_hero(): void { media_list('hero'); }
function h_images_hero_mobile(): void { media_list('hero', 'mobile'); }
function h_images_hero_tablet(): void { media_list('hero', 'tablet'); }
function h_images_hero_desktop(): void { media_list('hero', 'desktop'); }
function h_images_gallery(): void { media_list('gallery'); }
