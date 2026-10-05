<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

const BEGIN = '# BEGIN canonical-host';
const END   = '# END canonical-host';
$pub = realpath(__DIR__ . '/../../public');
$files = [$pub . '/.htaccess', $pub . '/api/.htaccess'];
$ht = $files[0];

function fail(string $m): never { fwrite(STDERR, "error: $m\n"); exit(1); }
function host(string $h): string {
    $h = strtolower(trim($h));
    if (!preg_match('/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $h)) fail("invalid hostname: $h");
    return $h;
}
function block(string $to, array $from): string {
    $q = fn(string $h) => preg_quote($h, '/');
    $alts = implode('|', array_map(fn($h) => str_replace('\\', '\\', preg_quote($h)), $from));
    $o = [BEGIN, "# canonical=$to from=" . implode(',', $from)];
    $o[] = "RewriteCond %{HTTP_HOST} ^($alts)$ [NC]";
    $o[] = "RewriteRule ^ https://$to%{REQUEST_URI} [R=308,L]";
    $o[] = "RewriteCond %{HTTP_HOST} ^" . preg_quote($to) . "$ [NC]";
    $o[] = 'RewriteCond %{HTTPS} off';
    $o[] = 'RewriteCond %{HTTP:X-Forwarded-Proto} !https';
    $o[] = "RewriteRule ^ https://$to%{REQUEST_URI} [R=308,L]";
    $o[] = END;
    return implode("\n", $o) . "\n";
}
function read(string $f): string { $s = @file_get_contents($f); if ($s === false) fail("cannot read $f"); return $s; }
function current_state(string $s): ?array {
    if (!preg_match('/^# canonical=(\S+) from=(\S*)$/m', $s, $m)) return null;
    return ['to' => $m[1], 'from' => array_filter(explode(',', $m[2]))];
}
function dns(string $h): string {
    $r = @dns_get_record($h, DNS_A | DNS_AAAA) ?: [];
    $ips = array_map(fn($x) => $x['ip'] ?? $x['ipv6'] ?? '', $r);
    return $ips ? implode(', ', $ips) : 'NO RECORD';
}
function head(string $url): string {
    $ctx = stream_context_create(['http' => ['method' => 'HEAD', 'follow_location' => 0, 'timeout' => 8, 'ignore_errors' => true]]);
    $h = @get_headers($url, true, $ctx);
    if (!$h) return 'unreachable';
    $loc = $h['Location'] ?? $h['location'] ?? '';
    return $h[0] . ($loc ? ' -> ' . (is_array($loc) ? end($loc) : $loc) : '');
}

[$_, $cmd] = $argv + [null, 'help'];
$args = array_slice($argv, 2);

switch ($cmd) {
case 'set':
    $to = host($args[0] ?? fail('usage: domain.php set <new-host> [old-host...]'));
    $from = array_values(array_unique(array_map('host', array_slice($args, 1))));
    $from[] = "www.$to";
    $from = array_values(array_diff(array_unique($from), [$to]));
    foreach ($files as $f) {
        $s = preg_replace('/' . preg_quote(BEGIN, '/') . '.*?' . preg_quote(END, '/') . "\n?/s", '', read($f));
        $b = rtrim(block($to, $from));
        if (preg_match('/^RewriteEngine On[ \t]*$/m', $s, $m, PREG_OFFSET_CAPTURE)) {
            $pos = $m[0][1] + strlen($m[0][0]);
            $s = substr($s, 0, $pos) . "\n" . $b . "\n" . ltrim(substr($s, $pos), "\n");
        } else {
            $s = rtrim($s) . "\nRewriteEngine On\n" . $b . "\n";
        }
        @copy($f, "$f.bak");
        $tmp = $f . '.tmp';
        if (file_put_contents($tmp, $s, LOCK_EX) === false || !rename($tmp, $f)) fail("write failed: $f");
    }
    echo "canonical: $to\nredirecting: " . implode(', ', $from) . "\nbackups: *.htaccess.bak\n";
    break;

case 'clone':
    $dest = rtrim($args[0] ?? fail('usage: domain.php clone <dest-site-dir>'), '/');
    $src = realpath(__DIR__ . '/../..');
    if (!is_dir($dest)) fail("$dest not found - create the site in CloudPanel first");
    $dest = realpath($dest);
    if ($dest === $src) fail('source and destination are the same');
    if (!is_file("$src/backend/.env")) fwrite(STDERR, "warning: backend/.env missing in source\n");
    $st = stat($dest);
    passthru('rsync -rltp --exclude=.git --exclude=node_modules ' . escapeshellarg("$src/") . ' ' . escapeshellarg("$dest/"), $rc);
    if ($rc !== 0) fail('rsync failed');
    passthru(sprintf('chown -R %d:%d %s', $st['uid'], $st['gid'], escapeshellarg($dest)));
    echo "copied $src -> $dest (owner {$st['uid']}:{$st['gid']}, .env included, same database)\n";
    break;

case 'status':
    $st = current_state(read($ht));
    if (!$st) { echo "no canonical host configured\n"; break; }
    echo "canonical: {$st['to']}\nredirecting: " . implode(', ', $st['from']) . "\n";
    break;

case 'check':
    $st = current_state(read($ht)) ?? fail('run set first');
    foreach (array_merge([$st['to']], $st['from']) as $h) {
        echo str_pad($h, 32) . dns($h) . "\n";
        echo str_pad('', 32) . 'http : ' . head("http://$h/") . "\n";
        echo str_pad('', 32) . 'https: ' . head("https://$h/") . "\n";
    }
    break;

case 'vhost':
    $to = host($args[0] ?? (current_state(read($ht))['to'] ?? fail('usage: domain.php vhost <host>')));
    $root = dirname($ht);
    echo <<<CONF
<VirtualHost *:80>
    ServerName $to
    ServerAlias www.$to
    DocumentRoot $root
    <Directory $root>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
# then: certbot --apache -d $to -d www.$to
CONF . "\n";
    break;

default:
    echo "php backend/bin/domain.php clone <dest-site-dir>\n"
       . "php backend/bin/domain.php set <new-host> [old-host...]\n"
       . "php backend/bin/domain.php status|check|vhost [host]\n";
}
