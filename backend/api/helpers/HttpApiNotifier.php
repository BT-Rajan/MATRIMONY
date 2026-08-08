<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/NotificationDeliveryException.php';

/**
 * SMS and WhatsApp delivery, unlike email, have no universal protocol —
 * every provider (Twilio, MSG91, Gupshup, Meta Cloud API, ...) has its
 * own REST API and auth scheme. Rather than hard-code one vendor's SDK
 * (which would be untested against real credentials and lock the
 * project to that vendor), this sends a configurable HTTP request built
 * from .env: a URL, headers, and a JSON body template with {{phone}}
 * and {{message}} placeholders. Wiring in a specific provider is then
 * an .env change, not a code change — see docs/SETUP.md.
 */
final class HttpApiNotifier
{
    /** @throws NotificationDeliveryException */
    public static function send(string $channelPrefix, string $phone, string $message): void
    {
        $url = env("{$channelPrefix}_API_URL");
        if (!$url) {
            throw new NotificationDeliveryException("{$channelPrefix}_API_URL கட்டமைக்கப்படவில்லை");
        }

        $method = strtoupper((string) env("{$channelPrefix}_API_METHOD", 'POST'));
        $headersJson = env("{$channelPrefix}_API_HEADERS", '{"Content-Type":"application/json"}');
        $bodyTemplate = env("{$channelPrefix}_API_BODY_TEMPLATE", '{"to":"{{phone}}","message":"{{message}}"}');

        $headersArr = json_decode((string) $headersJson, true) ?: [];
        $headers = [];
        foreach ($headersArr as $key => $value) {
            $headers[] = "{$key}: {$value}";
        }

        $body = str_replace(
            ['{{phone}}', '{{message}}'],
            [$phone, addslashes($message)],
            (string) $bodyTemplate
        );

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CUSTOMREQUEST => $method,
        ]);
        if ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new NotificationDeliveryException("HTTP கோரிக்கை தோல்வி: {$curlError}");
        }
        if ($httpCode < 200 || $httpCode >= 300) {
            throw new NotificationDeliveryException("வழங்குநர் பிழையை திருப்பியது (HTTP {$httpCode}): " . substr((string) $response, 0, 200));
        }
    }
}
