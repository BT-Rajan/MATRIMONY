<?php
declare(strict_types=1);

/** Thrown by any notification channel driver (SMTP, HTTP API) on delivery failure. */
final class NotificationDeliveryException extends RuntimeException
{
}
