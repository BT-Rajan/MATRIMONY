<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

class MailException extends RuntimeException {}

/**
 * Sends plain-text email. Uses hand-written SMTP if SMTP_HOST is set in
 * .env (supports STARTTLS/implicit-TLS + AUTH LOGIN — covers Gmail, SES,
 * SendGrid SMTP, a local Postfix relay, etc). Falls back to PHP's mail()
 * for quick local testing when no SMTP host is configured.
 */
function send_mail(string $toEmail, string $toName, string $subject, string $bodyText): void
{
    $host = env('SMTP_HOST');
    if (!$host) {
        mail_fallback($toEmail, $subject, $bodyText);
        return;
    }

    $port = (int) env('SMTP_PORT', '587');
    $user = env('SMTP_USER');
    $pass = env('SMTP_PASS');
    $encryption = strtolower((string) env('SMTP_ENCRYPTION', 'tls')); // tls | ssl | none
    $fromEmail = env('SMTP_FROM_EMAIL', $user ?? 'no-reply@example.com');
    $fromName = env('SMTP_FROM_NAME', 'கார்காத்தார் மங்கள சந்திப்பு');

    $socket = @stream_socket_client(
        ($encryption === 'ssl' ? 'ssl' : 'tcp') . "://{$host}:{$port}",
        $errno,
        $errstr,
        15
    );
    if (!$socket) {
        throw new MailException("SMTP இணைப்பு தோல்வி: {$errstr}");
    }
    stream_set_timeout($socket, 15);

    $read = function (int $expected) use ($socket): string {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        if ((int) substr($response, 0, 3) !== $expected) {
            throw new MailException('SMTP எதிர்பாராத பதில்: ' . trim($response));
        }
        return $response;
    };
    $cmd = function (string $line, int $expected) use ($socket, $read): void {
        fwrite($socket, $line . "\r\n");
        $read($expected);
    };

    $read(220);
    $cmd("EHLO {$host}", 250);

    if ($encryption === 'tls') {
        $cmd('STARTTLS', 220);
        if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) !== true) {
            throw new MailException('STARTTLS தோல்வியடைந்தது');
        }
        $cmd("EHLO {$host}", 250);
    }

    if ($user && $pass) {
        $cmd('AUTH LOGIN', 334);
        $cmd(base64_encode($user), 334);
        $cmd(base64_encode($pass), 235);
    }

    $cmd('MAIL FROM:<' . $fromEmail . '>', 250);
    $cmd('RCPT TO:<' . $toEmail . '>', 250);
    $cmd('DATA', 354);

    $encodeHeader = fn(string $v) => preg_match('/^[\x20-\x7E]*$/', $v)
        ? $v
        : '=?UTF-8?B?' . base64_encode($v) . '?=';

    $headers = [
        'From: ' . $encodeHeader($fromName) . " <{$fromEmail}>",
        'To: ' . $encodeHeader($toName) . " <{$toEmail}>",
        'Subject: ' . $encodeHeader($subject),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'Date: ' . date('r'),
    ];
    $escapedBody = preg_replace('/^\./m', '..', $bodyText);
    fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . $escapedBody . "\r\n.\r\n");
    $read(250);
    $cmd('QUIT', 221);
    fclose($socket);
}

function mail_fallback(string $toEmail, string $subject, string $bodyText): void
{
    $from = env('SMTP_FROM_EMAIL', 'no-reply@example.com');
    $headers = "From: {$from}\r\nContent-Type: text/plain; charset=UTF-8";
    if (!@mail($toEmail, $subject, $bodyText, $headers)) {
        // Don't block registration/OTP flows on a dev machine with no MTA —
        // log it so the developer can still see the OTP/confirmation.
        error_log("MAIL (fallback, not actually sent) to {$toEmail}: {$subject}\n{$bodyText}");
    }
}
