<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/NotificationDeliveryException.php';

/**
 * A minimal SMTP client written by hand, in the same spirit as
 * helpers/Jwt.php — this project carries zero Composer dependencies,
 * and SMTP is a well-documented, plain-text protocol that doesn't
 * need a full library. Supports plain/STARTTLS/implicit-TLS and
 * AUTH LOGIN, which covers the overwhelming majority of real SMTP
 * relays (Gmail, SES, SendGrid SMTP, a local Postfix relay, etc).
 */
final class SmtpMailer
{
    private $socket;

    /** @throws NotificationDeliveryException */
    public static function send(string $toEmail, string $toName, string $subject, string $bodyText): void
    {
        $host = env('SMTP_HOST');
        $port = (int) env('SMTP_PORT', 587);
        $user = env('SMTP_USER');
        $pass = env('SMTP_PASS');
        $encryption = strtolower((string) env('SMTP_ENCRYPTION', 'tls')); // tls | ssl | none
        $fromEmail = env('SMTP_FROM_EMAIL', $user);
        $fromName = env('SMTP_FROM_NAME', 'Karkathar Mangala Sandhippu');

        if (!$host) {
            throw new NotificationDeliveryException('SMTP_HOST கட்டமைக்கப்படவில்லை');
        }

        $mailer = new self();
        $mailer->connect($host, $port, $encryption === 'ssl');
        $mailer->readResponse(220);

        $mailer->command("EHLO {$host}", 250);

        if ($encryption === 'tls') {
            $mailer->command('STARTTLS', 220);
            $mailer->enableTls();
            $mailer->command("EHLO {$host}", 250);
        }

        if ($user && $pass) {
            $mailer->command('AUTH LOGIN', 334);
            $mailer->command(base64_encode($user), 334);
            $mailer->command(base64_encode($pass), 235);
        }

        $mailer->command('MAIL FROM:<' . $fromEmail . '>', 250);
        $mailer->command('RCPT TO:<' . $toEmail . '>', 250);
        $mailer->command('DATA', 354);

        $headers = [
            'From: ' . self::encodeHeader($fromName) . " <{$fromEmail}>",
            'To: ' . self::encodeHeader($toName) . " <{$toEmail}>",
            'Subject: ' . self::encodeHeader($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'Date: ' . date('r'),
        ];

        // Dot-stuff any line that starts with a literal "." (SMTP DATA rule).
        $escapedBody = preg_replace('/^\./m', '..', $bodyText);

        $mailer->raw(implode("\r\n", $headers) . "\r\n\r\n" . $escapedBody . "\r\n.\r\n");
        $mailer->readResponse(250);

        $mailer->command('QUIT', 221);
        $mailer->close();
    }

    private function connect(string $host, int $port, bool $implicitTls): void
    {
        $transport = $implicitTls ? 'ssl' : 'tcp';
        $errno = 0;
        $errstr = '';
        $this->socket = @stream_socket_client(
            "{$transport}://{$host}:{$port}",
            $errno,
            $errstr,
            15,
            STREAM_CLIENT_CONNECT
        );
        if (!$this->socket) {
            throw new NotificationDeliveryException("SMTP இணைப்பு தோல்வி: {$errstr}");
        }
        stream_set_timeout($this->socket, 15);
    }

    private function enableTls(): void
    {
        $ok = stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($ok !== true) {
            throw new NotificationDeliveryException('STARTTLS தோல்வியடைந்தது');
        }
    }

    private function command(string $line, int $expectedCode): string
    {
        $this->raw($line . "\r\n");
        return $this->readResponse($expectedCode);
    }

    private function raw(string $data): void
    {
        if (fwrite($this->socket, $data) === false) {
            throw new NotificationDeliveryException('SMTP க்கு எழுத முடியவில்லை');
        }
    }

    private function readResponse(int $expectedCode): string
    {
        $response = '';
        while (($line = fgets($this->socket, 515)) !== false) {
            $response .= $line;
            // Multi-line responses have a "-" after the code on all but the last line.
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new NotificationDeliveryException("SMTP எதிர்பாராத பதில் ({$code}): " . trim($response));
        }
        return $response;
    }

    private function close(): void
    {
        if (is_resource($this->socket)) {
            fclose($this->socket);
        }
    }

    private static function encodeHeader(string $value): string
    {
        // RFC 2047 encoded-word, needed for Tamil names/subjects in email headers.
        if (preg_match('/^[\x20-\x7E]*$/', $value)) {
            return $value; // pure ASCII, no encoding needed
        }
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }
}
