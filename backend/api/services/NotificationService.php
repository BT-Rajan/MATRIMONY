<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/MemberModel.php';
require_once __DIR__ . '/../models/NotificationModel.php';
require_once __DIR__ . '/../helpers/SmtpMailer.php';
require_once __DIR__ . '/../helpers/HttpApiNotifier.php';
require_once __DIR__ . '/../helpers/Logger.php';
require_once __DIR__ . '/../config/Config.php';

final class NotificationService
{
    /**
     * Fires all enabled channels for a lifecycle event. Never throws —
     * every failure is caught, logged to `notifications`, and swallowed,
     * because e.g. approving a member must succeed even if the email
     * relay is down.
     */
    public static function send(int $memberId, string $eventType, array $context = []): void
    {
        try {
            $member = MemberModel::findById($memberId);
            if (!$member) {
                return;
            }

            $content = self::buildContent($eventType, $member, $context);
            if (!$content) {
                return;
            }

            self::attemptEmail($member, $eventType, $content);
            self::attemptSms($member, $eventType, $content);
            self::attemptWhatsApp($member, $eventType, $content);
        } catch (Throwable $e) {
            // Belt-and-braces: even a bug in template building must not
            // break the caller (registration completion / approve / reject).
            Logger::error('NotificationService::send failed: ' . $e->getMessage());
        }
    }

    private static function attemptEmail(array $member, string $eventType, array $content): void
    {
        $enabled = filter_var(env('MAIL_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
        $recipient = $member['email'] ?? '';

        if (!$enabled) {
            NotificationModel::log($member['id'], $eventType, 'email', $recipient, $content['subject'], $content['long'], 'skipped', 'MAIL_ENABLED=false');
            return;
        }
        if (!$recipient) {
            NotificationModel::log($member['id'], $eventType, 'email', '', $content['subject'], $content['long'], 'skipped', 'உறுப்பினருக்கு மின்னஞ்சல் இல்லை');
            return;
        }

        try {
            SmtpMailer::send($recipient, $member['name_english'], $content['subject'], $content['long']);
            NotificationModel::log($member['id'], $eventType, 'email', $recipient, $content['subject'], $content['long'], 'sent');
        } catch (Throwable $e) {
            NotificationModel::log($member['id'], $eventType, 'email', $recipient, $content['subject'], $content['long'], 'failed', $e->getMessage());
        }
    }

    private static function attemptSms(array $member, string $eventType, array $content): void
    {
        $enabled = filter_var(env('SMS_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
        $recipient = $member['mobile'] ?? '';

        if (!$enabled) {
            NotificationModel::log($member['id'], $eventType, 'sms', $recipient, null, $content['short'], 'skipped', 'SMS_ENABLED=false');
            return;
        }
        if (!$recipient) {
            NotificationModel::log($member['id'], $eventType, 'sms', '', null, $content['short'], 'skipped', 'உறுப்பினருக்கு மொபைல் இல்லை');
            return;
        }

        try {
            HttpApiNotifier::send('SMS', $recipient, $content['short']);
            NotificationModel::log($member['id'], $eventType, 'sms', $recipient, null, $content['short'], 'sent');
        } catch (Throwable $e) {
            NotificationModel::log($member['id'], $eventType, 'sms', $recipient, null, $content['short'], 'failed', $e->getMessage());
        }
    }

    private static function attemptWhatsApp(array $member, string $eventType, array $content): void
    {
        $enabled = filter_var(env('WHATSAPP_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
        $recipient = $member['whatsapp'] ?: ($member['mobile'] ?? '');

        if (!$enabled) {
            NotificationModel::log($member['id'], $eventType, 'whatsapp', $recipient, null, $content['short'], 'skipped', 'WHATSAPP_ENABLED=false');
            return;
        }
        if (!$recipient) {
            NotificationModel::log($member['id'], $eventType, 'whatsapp', '', null, $content['short'], 'skipped', 'உறுப்பினருக்கு வாட்ஸ்அப் எண் இல்லை');
            return;
        }

        try {
            HttpApiNotifier::send('WHATSAPP', $recipient, $content['short']);
            NotificationModel::log($member['id'], $eventType, 'whatsapp', $recipient, null, $content['short'], 'sent');
        } catch (Throwable $e) {
            NotificationModel::log($member['id'], $eventType, 'whatsapp', $recipient, null, $content['short'], 'failed', $e->getMessage());
        }
    }

    /** @return array{subject:string,short:string,long:string}|null */
    private static function buildContent(string $eventType, array $member, array $context): ?array
    {
        $name = $member['name_tamil'] ?: $member['name_english'];
        $regNo = $member['registration_number'];
        $assoc = 'கார்காத்தார் மங்கள சந்திப்பு';

        switch ($eventType) {
            case 'registration_completed':
                return [
                    'subject' => "பதிவு பெறப்பட்டது — {$regNo}",
                    'short' => "வணக்கம் {$name}, உங்கள் பதிவு (எண்: {$regNo}) பெறப்பட்டது. நிர்வாகி அனுமதிக்காக காத்திருக்கிறது. - {$assoc}",
                    'long' => "வணக்கம் {$name},\n\nஉங்கள் பதிவு (பதிவு எண்: {$regNo}) வெற்றிகரமாக பெறப்பட்டது.\n\n"
                        . "தற்போது இது நிர்வாகியின் அனுமதிக்காக காத்திருக்கிறது. அனுமதிக்கப்பட்டதும் உங்களுக்கு அறிவிக்கப்படும்.\n\n"
                        . "நன்றி,\n{$assoc}",
                ];

            case 'member_approved':
                return [
                    'subject' => "உங்கள் பதிவு அனுமதிக்கப்பட்டது — {$regNo}",
                    'short' => "வணக்கம் {$name}, உங்கள் பதிவு (எண்: {$regNo}) அனுமதிக்கப்பட்டது! - {$assoc}",
                    'long' => "வணக்கம் {$name},\n\nஉங்கள் பதிவு (பதிவு எண்: {$regNo}) நிர்வாகியால் அனுமதிக்கப்பட்டது.\n\n"
                        . "வாழ்த்துகள்!\n\nநன்றி,\n{$assoc}",
                ];

            case 'member_rejected':
                $reason = $context['reason'] ?? '';
                $reasonLine = $reason ? "\n\nகாரணம்: {$reason}" : '';
                return [
                    'subject' => "உங்கள் பதிவு குறித்து — {$regNo}",
                    'short' => "வணக்கம் {$name}, உங்கள் பதிவு (எண்: {$regNo}) குறித்து நிர்வாகி தொடர்பு கொள்ளும். - {$assoc}",
                    'long' => "வணக்கம் {$name},\n\nஉங்கள் பதிவு (பதிவு எண்: {$regNo}) தற்போது அனுமதிக்க முடியவில்லை.{$reasonLine}\n\n"
                        . "மேலும் விவரங்களுக்கு நிர்வாகியை தொடர்பு கொள்ளவும்.\n\nநன்றி,\n{$assoc}",
                ];

            default:
                return null;
        }
    }
}
