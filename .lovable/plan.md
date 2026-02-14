

## ✅ COMPLETED: Zinc Webhook Error Handling and Auto-Retry

### What Was Fixed

1. **Root-level error field extraction** — `handleRequestFailed` now reads `payload.code`, `payload.message`, `payload.data` first (Zinc's actual format), falling back to nested `payload.error.*`.

2. **Auto-retry for retryable errors** — Uses shared `classifyZmaError()` to determine if an error is retryable. For `internal_error`: sets status to `requires_attention`, tracks retry count in notes, skips customer failure email, and creates an admin alert. Only marks `failed` and sends customer email when max retries (2) are exhausted or error is non-retryable.

3. **Interface updated** — `ZincWebhookPayload` now includes root-level `code?`, `message?`, `data?` fields.

### Immediate Action for Order #7371

Manually retry from Trunkline — the webhook already fired before the fix was deployed.
