<?php
declare(strict_types=1);

// Lists images dropped into public/hero/ (home-page slider) or public/gallery/ (gallery page).
// No upload UI and no rebuild needed: copy files into the folder and they appear.
function media_list(string $folder): void
{
    $dir = rtrim((string)(defined('PUBLIC_DIR') ? PUBLIC_DIR : __DIR__ . '/../../public'), '/') . '/' . $folder;
    $out = [];
    if (is_dir($dir)) {
        $files = scandir($dir) ?: [];
        natcasesort($files); // name them 01-..., 02-... to control the order
        foreach ($files as $f) {
            if ($f === '' || $f[0] === '.' || !preg_match('/\.(jpe?g|png|webp|avif|gif)$/i', $f)) continue;
            $p = "$dir/$f";
            if (!is_file($p)) continue;
            $out[] = [
                'src'  => "/$folder/" . rawurlencode($f) . '?v=' . (int)filemtime($p),
                'name' => pathinfo($f, PATHINFO_FILENAME),
            ];
            if (count($out) >= 60) break;
        }
    }
    header('Cache-Control: public, max-age=60');
    out(['images' => $out]);
}

function h_images_hero(): void { media_list('hero'); }
function h_images_gallery(): void { media_list('gallery'); }
