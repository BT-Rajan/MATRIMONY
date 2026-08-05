<?php
declare(strict_types=1);

/**
 * Small server-side validation helper. Every field the client can validate
 * with Yup, the API validates again here — client-side rules are a UX
 * convenience, never the source of truth.
 */
final class Validator
{
    private array $errors = [];

    public function __construct(private array $data)
    {
    }

    public function required(string $field, string $label): self
    {
        $value = $this->data[$field] ?? null;
        if ($value === null || (is_string($value) && trim($value) === '')) {
            $this->errors[$field] = "{$label} தேவை";
        }
        return $this;
    }

    public function email(string $field, string $label): self
    {
        $value = $this->data[$field] ?? null;
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "சரியான {$label} இல்லை";
        }
        return $this;
    }

    public function mobile(string $field, string $label): self
    {
        $value = $this->data[$field] ?? null;
        if ($value !== null && $value !== '' && !preg_match('/^[6-9]\d{9}$/', (string) $value)) {
            $this->errors[$field] = "சரியான {$label} (10 இலக்கம்) இல்லை";
        }
        return $this;
    }

    public function minLength(string $field, int $min, string $label): self
    {
        $value = $this->data[$field] ?? '';
        if (is_string($value) && strlen($value) > 0 && mb_strlen($value) < $min) {
            $this->errors[$field] = "{$label} குறைந்தது {$min} எழுத்துகள் தேவை";
        }
        return $this;
    }

    public function fails(): bool
    {
        return count($this->errors) > 0;
    }

    public function errors(): array
    {
        return $this->errors;
    }
}
