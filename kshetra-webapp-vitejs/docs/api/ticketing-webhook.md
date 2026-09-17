# Ticketing Webhook API — Frontend Contract

Backend contract for the **ticketing (helpdesk) webhook surfaces**: the public,
anonymous embeddable-widget endpoints, and the authenticated APIs that manage
them and proxy into them. The domain model is called **Issue**, "ticket" is
the human-facing word for the same thing — `Issue.reference` (e.g. `TKT-0042`)
is what a customer sees.

This doc covers **only the webhook-shaped surfaces**. For the full
authenticated CRM ticket screens (list, board, filters, bulk actions, notes,
SLA), see [helpdesk.md](helpdesk.md) — that doc is the source of truth for
`GET/POST/PATCH /api/v1/crm/issues/` and friends; this one does not repeat it.

Source of truth: `public_webhooks/issue_views.py`,
`public_webhooks/issue_attachment_views.py`, `public_webhooks/issue_serializers.py`,
`public_webhooks/hmac_utils.py`, `public_webhooks/rate_limit.py`,
`public_webhooks/attachment_validation.py`, `crm/views/issue_webhook.py`,
`crm/serializers/issue_webhook.py`, `crm/models/issue_webhook.py`,
`support/views.py`, `support/serializers.py`, `support/services.py`.

---

## Contents

1. [Cross-cutting: the two error envelopes](#1--cross-cutting-the-two-error-envelopes)
2. [Public ticket webhook — create a ticket](#2--public-ticket-webhook--create-a-ticket)
3. [Public attachment upload webhook](#3--public-attachment-upload-webhook)
4. [Webhook key management (authenticated)](#4--webhook-key-management-authenticated)
   - 4a. List keys
   - 4b. Create key
   - 4c. Retrieve key
   - 4d. Update key
   - 4e. Delete (revoke) key
   - 4f. Rotate secret
   - 4g. Key usage log (submissions)
5. [In-app support report (authenticated proxy)](#5--in-app-support-report-authenticated-proxy)
6. [Accepted attachment file types](#6--accepted-attachment-file-types)

---

## 1 — Cross-cutting: the two error envelopes

There are **two structurally different error response shapes** in this
module. Don't write one generic `error.code`-string switch that assumes
either — it will break on the other.

### Envelope A — the two public webhooks (plain Django views, not DRF)

Every error from §2 and §3 has this shape:

```jsonc
{
  "status": "error",
  "error_code": "rate_limited",   // machine-readable, see per-endpoint tables
  "details": { /* optional, only on some 400s */ }
}
```

A `Retry-After` **header** (seconds, as a string) is set on `429`/`503`
responses. There is no `code`/`message` here — always read `error_code`.

### Envelope B — everything authenticated (DRF, §4 and §5)

Every authenticated endpoint in this app is wrapped by a global DRF exception
handler (`nexocrm/exceptions.py`). It normalizes DRF's default shapes into:

```jsonc
// Generic detail error (401/403/404/429/500)
{ "code": 403, "message": "You do not have permission to perform this action." }
```

```jsonc
// Validation error (400)
{
  "code": 400,
  "message": "Validation Error",
  "errors": { "subject": ["This field may not be blank."] },
  "error_codes": { "status_id": ["note_required_before_hold"] }   // only present for custom codes
}
```

`code` here is the **HTTP status as an integer**. `error_codes` only appears
when a field error carries a non-generic `ErrorDetail.code` — plain
`required`/`blank`/`invalid` codes are filtered out, so most 400s have no
`error_codes` key at all.

**Known wrinkle — plan-gate 403s lose detail.** When a plan-feature gate
(`required_feature`) fails, the source raises a richer payload internally
(`feature`, `current_plan`, `upgrade_url`), but the global handler flattens it
— the final body a frontend actually receives is just:
```json
{ "code": 403, "message": "Your current plan does not include this feature." }
```
There is currently **no machine-readable way** to distinguish "you lack the
RBAC permission" from "your plan doesn't include this module" — both render
as a plain-string 403. Don't build UI that branches on it; show a generic
"contact your admin" message for any 403 on these endpoints.

**Two raw exceptions to §5** (support-report's `502`/`503`) bypass this
handler entirely and use a third, simpler shape — see §5's error table.

---

## 2 — Public ticket webhook — create a ticket

### Name / purpose
Anonymous intake endpoint for an embedded support-form widget. Creates an
`Issue` in the tenant's workspace. No login, no cookies — authenticated purely
by the `key_id` in the URL plus either an `Origin` allowlist (browser embeds)
or an HMAC signature (server-to-server integrations).

### Method + path
```
POST /webhooks/issues/<uuid:key_id>/
```
`key_id` is the `IssueWebhookKey.key_id` a tenant admin generates via §4b —
it is meant to be embedded in a public webpage/bundle; it is **not** a secret
by itself (the HMAC `secret`, separately, is the actual secret — never ship
that to a browser).

### Headers (auth, CSRF, content-type)
- `Content-Type: application/json` — required, the body must parse as JSON.
- CSRF: exempt (anonymous, no cookies).
- **Auth — pick ONE mode per key** (set when the key is created, §4b `require_hmac`):
  - **Browser mode** (`require_hmac: false`): send `Origin: <your-origin>`.
    Must exactly match one entry in the key's `allowed_origins`.
  - **Server mode** (`require_hmac: true`): send
    `X-Signature: sha256=<hex-hmac-of-the-raw-json-body>`, signed with the
    key's `secret` (shown once, at creation — §4b) using HMAC-SHA256.
- `X-Idempotency-Key` — **optional**, any string you choose. If sent, a
  replay with the same key + value within **24 hours** returns the *original*
  cached response verbatim (same `issue_id`, no new ticket created). Use this
  for retry-safe submission from a flaky network.

### Path / query params
- Path: `key_id` (UUID) — required.
- Query: none.

### Request body (JSON example)
```jsonc
{
  "subject": "Login page shows a blank screen",   // required, string, ≤280 chars
  "description": "Happens on Safari only…",        // optional, string
  "priority": "High",                               // optional: Low | Medium | High | Critical
  "reported_for": "client",                         // optional: self | client (default: client)
  "customer_email": "jane@acme.com",                // optional — LOOKUP ONLY, links to an existing Customer by email; never written to the ticket as a field
  "customer_phone": "+15551234567",                 // optional — LOOKUP ONLY, same as above by phone
  "attachment_tokens": ["iu_AbC123...", "iu_XyZ789..."],  // optional, ≤10 entries — tokens from §3's upload endpoint
  "custom_fields": { "product_area": "billing" }    // optional, freeform object
}
```
Any **other** top-level key you send is not rejected — it's silently folded
into the ticket's internal `custom_fields` under a `form.<key>` prefix. There
is no 400 for unknown fields; use this sparingly, it's a compatibility
fallback, not a documented extension point.

### Success response (HTTP code + JSON example)
`202 Accepted` — same status on both a fresh create *and* an idempotent replay.
```json
{
  "status": "accepted",
  "request_id": "3f2a9b10-...-uuid4",
  "issue_id": "c1d2e3f4-...-uuid",
  "attachments_attached": 2
}
```
- `attachments_attached` is a **count only** — never a per-token
  success/failure breakdown (deliberately, to avoid leaking which tokens are
  valid to a prober, and because idempotent replays would otherwise serve a
  stale per-token breakdown). If it's lower than the number of tokens you
  sent, one or more had already expired (30 min TTL) or were already used —
  the ticket is still created; show the user "N of M attached."
- `request_id` is fresh on every non-replayed call; a replay returns the
  **original** call's full body, including its original `request_id`.

### Error responses (codes + JSON example)
Envelope A (§1). All `error_code` values that can appear here:

| HTTP | `error_code` | Meaning |
|---|---|---|
| `400` | `invalid_payload` | Body isn't valid JSON/UTF-8, **or** serializer validation failed (body includes `details` with per-field DRF errors in that case) |
| `401` | `invalid_signature` | HMAC mode: missing/wrong `X-Signature`, or the key's secret failed to decrypt server-side |
| `403` | `origin_not_allowed` | Browser mode: `Origin` header missing or not in `allowed_origins` |
| `404` | `key_not_found` | `key_id` doesn't exist, or the key is inactive/revoked |
| `413` | `payload_too_large` | Body over 32 KB |
| `429` | `rate_limited` | Per-IP (30/min) or per-key (tenant-configured) limit exceeded — `Retry-After: 60` header set |
| `500` | `internal_error` | Unhandled server error creating the ticket |

Example:
```json
{ "status": "error", "error_code": "invalid_payload", "details": { "subject": ["This field is required."] } }
```

### Pagination
None — this is a create-only endpoint.

---

## 3 — Public attachment upload webhook

### Name / purpose
Step 1 of a two-step flow for attaching a screenshot/file to a ticket the
customer hasn't submitted yet. Upload a single file here first; you get back
an opaque **token**. Pass that token in `attachment_tokens` on §2's request to
actually attach it to the ticket. The file is **not** attached to anything
until the ticket-create call redeems the token — an uploaded-but-never-used
token's file is garbage-collected automatically (nightly sweep) and simply
never appears anywhere.

**This endpoint is off by default.** A tenant's webhook key must have
`attachments_enabled: true` (§4b/§4d) before this route works at all — until
then it returns `404 key_not_found`, indistinguishable from a nonexistent
route (deliberately — not `403`, so the feature's existence isn't advertised
to a prober).

### Method + path
```
POST /webhooks/issues/<uuid:key_id>/attachments/
```
Same `key_id` as §2 — one key covers both routes.

### Headers (auth, CSRF, content-type)
- `Content-Type: multipart/form-data; boundary=...` — required (standard
  browser `FormData` sets this for you).
- `Content-Length` — required. A request with no declared length (e.g.
  chunked transfer-encoding) is rejected outright.
- CSRF: exempt.
- **Auth — same two modes as §2, but signed differently:**
  - **Browser mode** (`require_hmac: false`): `Origin` header, same allowlist
    rule as §2.
  - **Server mode** (`require_hmac: true`): **three** headers, because a
    multipart body can't be HMAC'd the same way JSON can:
    - `X-Timestamp` — current Unix time in seconds (integer). Must be within
      ±5 minutes of the server's clock.
    - `X-Upload-Nonce` — any random string you generate per-request. Single-use
      — the same nonce cannot be replayed within 5 minutes.
    - `X-Signature: sha256=<hex-hmac>` — HMAC-SHA256 of the string
      `"{key_id}\n{timestamp}\n{nonce}\n{content_length}"` (newline-joined, in
      that exact order), using the key's `secret`. **Note this signs request
      metadata, not the file bytes** — content integrity relies on the
      enforced `Content-Length` cap, not the signature.

### Path / query params
- Path: `key_id` (UUID) — required.
- Query: none.

### Request body (JSON example)
Not JSON — `multipart/form-data` with **exactly one** field:

| Field | Type | Required |
|---|---|---|
| `file` | file | required — a request with zero or more than one file part is rejected |

Example (as a curl for clarity, since this isn't JSON):
```bash
curl -X POST https://api.example.com/webhooks/issues/<key_id>/attachments/ \
  -H "Origin: https://support.acme.com" \
  -F "file=@screenshot.png"
```

Size and type limits (tenant-configurable within a system ceiling — ask your
backend admin what this key's specific values are, via §4c/§4d):
- Per-file size: up to **10 MB** system-wide ceiling (a key can set a lower cap).
- Accepted types: see [§6](#6--accepted-attachment-file-types) — detected from
  file content, **not** the filename extension or the browser's declared
  `Content-Type`.

### Success response (HTTP code + JSON example)
`202 Accepted`
```json
{
  "status": "accepted",
  "attachment_token": "iu_AbC123XyZ...",
  "expires_in": 1800,
  "name": "screenshot.png",
  "size": 184320,
  "content_type": "image/png"
}
```
- `attachment_token` — pass this in §2's `attachment_tokens` array. **Single-use
  and expires in `expires_in` seconds (30 min default)** — if the customer
  takes longer than that to finish and submit the form, re-upload.
  `content_type` here is the **sniffed** type, which may differ from what the
  browser reported.

### Error responses (codes + JSON example)
Envelope A (§1). All `error_code` values that can appear here:

| HTTP | `error_code` | Meaning |
|---|---|---|
| `400` | `invalid_payload` | No `file` field, or more than one file sent — `details` explains which |
| `401` | `invalid_signature` | HMAC mode: missing/malformed/wrong signature, bad timestamp, or clock skew >5 min |
| `401` | `replayed_request` | HMAC mode: the `X-Upload-Nonce` was already used (or Redis was briefly unreachable — fails closed) |
| `403` | `origin_not_allowed` | Browser mode: `Origin` missing or not allowlisted |
| `404` | `key_not_found` | Key doesn't exist/is inactive, **or** `attachments_enabled` is off for this key |
| `411` | `length_required` | No (or unparseable) `Content-Length` header |
| `413` | `payload_too_large` | Declared or actual file size exceeds the key's/system's cap |
| `415` | `unsupported_media_type` | `Content-Type` isn't `multipart/form-data` |
| `415` | `unsupported_file_type` | File content doesn't match any accepted type (§6) — SVG is always rejected |
| `429` | `rate_limited` | Per-IP (10/min) or per-key (tenant-configured) upload limit — separate budget from §2's ticket-creation limit; `Retry-After: 60` |
| `502` | `upload_failed` | Storage/CDN error while receiving the file — retry |
| `503` | `service_unavailable` | Server briefly at capacity (concurrency limit) or Redis unreachable — `Retry-After: 5`, safe to retry shortly |

Example:
```json
{ "status": "error", "error_code": "unsupported_file_type" }
```

### Pagination
None — this is a create-only endpoint.

---

## 4 — Webhook key management (authenticated)

Everything in this section requires a logged-in tenant admin. This is how a
tenant sets up/rotates/monitors the public endpoints in §2 and §3.

**Base path:** `/api/v1/crm/issue-webhook-keys/`

**Auth (all of §4):** `Authorization: Bearer <JWT>` — no other headers required.

**Permission (all of §4):** requires the `settings` module permission —
`view_settings` for GET/HEAD, `update_settings` for everything else.
Superusers/staff always pass. A user without it gets a plain
`403` (Envelope B, §1) with no extra detail — you cannot tell from the
response alone whether it's a role issue or a plan issue.

**Plan gate:** creating a key additionally requires the `issue_webhooks`
plan feature. A plan without it also renders as a plain `403` — see §1's
"known wrinkle."

### 4a. List keys

**Name / purpose:** List all webhook keys configured for the current tenant.

**Method + path:** `GET /api/v1/crm/issue-webhook-keys/`

**Headers:** `Authorization: Bearer <JWT>`.

**Path / query params:** none beyond standard pagination (below).

**Request body:** none.

**Success response:** `200 OK`
```jsonc
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "key_id": "b6b9...-uuid",
      "name": "Website support form",
      "organization": 14,
      "secret_last_four": "9kQ2",
      "default_issue_type": null,
      "default_assigned_to": null,
      "default_assigned_team": null,
      "default_status": null,
      "default_customer": null,
      "default_priority": null,
      "allowed_origins": ["https://support.acme.com"],
      "require_hmac": false,
      "rate_limit_per_minute": 30,
      "is_active": true,
      "attachments_enabled": false,
      "max_attachments_per_issue": 3,
      "max_attachment_bytes": 10485760,
      "attachment_rate_limit_per_minute": 20,
      "request_count": 4213,
      "last_used_at": "2026-09-15T09:12:00Z",
      "revoked_at": null,
      "created_at": "2026-06-01T10:00:00Z",
      "updated_at": "2026-09-14T08:30:00Z"
    }
  ]
}
```
**Note:** the plaintext `secret` is **never** returned by list/retrieve —
only `secret_last_four`, for display ("Key ending in `9kQ2`"). The full
secret is shown exactly once, at create (§4b) or rotate (§4f) time.

**Error responses:** `401`/`403` (Envelope B, §1).

**Pagination:** standard page-number pagination. `?page=<n>`,
`?page_size=<n>` (default 100, max 200). Envelope shown above
(`count`/`next`/`previous`/`results`).

---

### 4b. Create key

**Name / purpose:** Provision a new webhook key for a support form/integration.

**Method + path:** `POST /api/v1/crm/issue-webhook-keys/`

**Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`.

**Path / query params:** none.

**Request body (JSON example):**
```jsonc
{
  "name": "Website support form",             // required
  "allowed_origins": ["https://support.acme.com"],  // required in browser mode; each entry must start http:// or https://
  "require_hmac": false,                       // optional, default false
  "rate_limit_per_minute": 30,                 // optional, default 30, range 1–6000
  "default_priority": "Medium",                // optional: Low | Medium | High | Critical
  "default_status": "8a3f...-uuid",             // optional, an IssueStatus UUID
  "default_issue_type": "1c2d...-uuid",         // optional
  "default_assigned_to": "9f8e...-uuid",        // optional, a User UUID
  "default_assigned_team": "3b4a...-uuid",      // optional
  "default_customer": "5e6f...-uuid",           // optional — pins every inbound ticket to one Customer
  "attachments_enabled": false,                 // optional, default false — see §3
  "max_attachments_per_issue": 3,               // optional, default 3, capped at the system ceiling (10)
  "max_attachment_bytes": 10485760,             // optional, default 10MB, capped at the system ceiling (10MB)
  "attachment_rate_limit_per_minute": 20        // optional, default 20, range 1–6000
}
```

**Success response:** `201 Created` — same shape as §4a's list item, plus the
plaintext secret **once**:
```jsonc
{
  "key_id": "b6b9...-uuid",
  "name": "Website support form",
  "secret_last_four": "9kQ2",
  // …all other fields from §4a…
  "secret": "wh_live_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c9kQ2"   // SAVE THIS NOW — never shown again
}
```
`secret` only appears in this create response and in §4f's rotate response.
Store it server-side if you're setting up an HMAC-mode integration; it is not
retrievable later.

**Error responses:**
| HTTP | Body | Meaning |
|---|---|---|
| `400` | `{"detail": "Organization context required."}` | Raw (non-Envelope-B) body — organization couldn't be resolved from the JWT |
| `400` | Envelope B validation shape | Bad field value, e.g. `{"code":400,"message":"Validation Error","errors":{"rate_limit_per_minute":["rate_limit_per_minute must be at most 6000."]}}` |
| `401`/`403` | Envelope B | Not authenticated / lacks `update_settings` / plan lacks `issue_webhooks` |

**Pagination:** N/A.

---

### 4c. Retrieve key

**Name / purpose:** Fetch one key's current config.

**Method + path:** `GET /api/v1/crm/issue-webhook-keys/<uuid:key_id>/`

**Headers:** `Authorization: Bearer <JWT>`.

**Path / query params:** `key_id` (UUID, path) — required.

**Request body:** none.

**Success response:** `200 OK` — same shape as one §4a list item (no `secret`).

**Error responses:** `404` (`{"code":404,"message":"Not found."}`) if the key
doesn't exist or belongs to another tenant. `401`/`403` as above.

**Pagination:** N/A.

---

### 4d. Update key

**Name / purpose:** Change a key's config — flip `attachments_enabled` on, tighten a rate limit, change allowed origins, etc.

**Method + path:** `PATCH /api/v1/crm/issue-webhook-keys/<uuid:key_id>/` (partial — send only changed fields). `PUT` also works (full replace).

**Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`.

**Path / query params:** `key_id` (UUID, path) — required.

**Request body (JSON example):**
```json
{ "attachments_enabled": true, "max_attachment_bytes": 5242880 }
```
Any subset of §4b's writable fields. `key_id`, `secret_last_four`,
`request_count`, `last_used_at`, `revoked_at`, `created_at`, `updated_at`,
`organization` are read-only — sending them is ignored, not an error.

**Success response:** `200 OK` — full updated key, same shape as §4a's item.

**Note on propagation delay:** the key is cached for performance on the
public endpoints (§2, §3). A change here (including disabling the key) can
take up to **60 seconds** to take effect on the public routes.

**Error responses:** same 400/401/403/404 shapes as §4b/§4c.

**Pagination:** N/A.

---

### 4e. Delete (revoke) key

**Name / purpose:** Revoke a key. This is a **soft delete** — the row isn't
removed, it's marked inactive/revoked, so its usage history (§4g) is retained.

**Method + path:** `DELETE /api/v1/crm/issue-webhook-keys/<uuid:key_id>/`

**Headers:** `Authorization: Bearer <JWT>`.

**Path / query params:** `key_id` (UUID, path) — required.

**Request body:** none.

**Success response:** `204 No Content` — empty body.

**Error responses:** `404` if not found/wrong tenant. `401`/`403` as above.

**Pagination:** N/A.

---

### 4f. Rotate secret

**Name / purpose:** Issue a fresh HMAC secret for a key without changing its
`key_id` (so a browser-embedded `key_id` doesn't need to be re-deployed) or
disrupting `allowed_origins` config. Use if a secret may have leaked.

**Method + path:** `POST /api/v1/crm/issue-webhook-keys/<uuid:key_id>/rotate/`

**Headers:** `Authorization: Bearer <JWT>`.

**Path / query params:** `key_id` (UUID, path) — required.

**Request body:** none (empty POST).

**Success response:** `200 OK` — same shape as §4b's create response,
including the new plaintext `secret` **once**:
```json
{
  "key_id": "b6b9...-uuid",
  "secret_last_four": "3xM7",
  "secret": "wh_live_...new-secret...3xM7",
  "...": "...rest of the key fields..."
}
```
The **old** secret stops verifying immediately.

**Error responses:** `404` if not found/wrong tenant. `401`/`403` as above.

**Pagination:** N/A.

---

### 4g. Key usage log (submissions)

**Name / purpose:** Diagnostic feed — every request that hit this key on the
public routes, accepted or rejected. Powers a "recent activity" panel on the
key's settings screen; also the only way to confirm a key is actually being
hit by a live integration.

**Method + path:** `GET /api/v1/crm/issue-webhook-keys/<uuid:key_id>/submissions/`

**Headers:** `Authorization: Bearer <JWT>`.

**Path / query params:**
- `key_id` (UUID, path) — required.
- `?source=webhook` or `?source=in_app` (query, optional) — narrows to only
  §2/§3's public calls (`webhook`) or only §5's support-report proxy
  (`in_app`). An unrecognized value is **silently ignored** (returns
  everything), not a 400 — this is a diagnostic list, not a strict filter.
- Standard pagination params (below).

**Request body:** none.

**Success response:** `200 OK`
```jsonc
{
  "count": 128,
  "next": "https://.../issue-webhook-keys/b6b9.../submissions/?page=2",
  "previous": null,
  "results": [
    {
      "submission_id": "e1f2...-uuid",
      "issue_id": "c1d2...-uuid",   // null if the request was rejected before a ticket was created
      "payload": { "subject": "Login broken", "attachment_tokens": ["iu_..."] },
      "source_ip": "203.0.113.5",
      "user_agent": "Mozilla/5.0 ...",
      "origin": "https://support.acme.com",
      "status": "accepted",           // accepted | rejected | duplicate
      "source": "webhook",            // webhook | in_app
      "error_code": "",               // populated when status=rejected, e.g. "rate_limited"
      "received_at": "2026-09-15T09:12:00Z"
    }
  ]
}
```

**Error responses:** `404` if the key doesn't exist/wrong tenant. `401`/`403` as above.

**Pagination:** standard page-number pagination, same as §4a (`page`/`page_size`, default 100, max 200).

---

## 5 — In-app support report (authenticated proxy)

### Name / purpose
"Report a problem" button inside the product itself (not the public
website). A logged-in **tenant user** reports a bug/issue with the product,
and it's filed as a ticket in the **provider's own** helpdesk workspace — not
the tenant's. This exists because a public webhook `key_id` shipped in a
frontend bundle is inherently public, so filing directly against a public
webhook from inside the authenticated app would let any tenant impersonate
any other tenant's support requests. This endpoint instead proxies
server-side, with the reporter's identity read from their JWT — never from
the request body.

### Method + path
```
POST /api/v1/support/report/
```

### Headers (auth, CSRF, content-type)
- `Authorization: Bearer <JWT>` — required. Any authenticated user may use
  this (no RBAC permission check — reporting "the app is broken" must work
  even for a user whose role grants nothing else).
- `Content-Type: application/json`
- CSRF: standard DRF session/JWT handling (not cookie-based for this app).

### Path / query params
None.

### Request body (JSON example)
```jsonc
{
  "subject": "Helpdesk → Tickets failed to load",   // required, ≤280 chars, non-blank
  "description": "Clicking the Tickets tab shows a blank screen…",  // required, non-blank
  "priority": "Medium",                              // optional: Low | Medium | High | Critical, default Medium
  "context": {                                       // optional, freeform diagnostics
    "route": "/helpdesk/tickets",
    "app_version": "2.4.1",
    "user_agent": "Mozilla/5.0 ..."
  }
}
```
`context` is capped at **25 keys**, each key truncated to 64 chars and each
value (coerced to string if not already one) truncated to 2000 chars — no
whitelist of key names, but don't rely on it to carry structured/large data.
There is **no identity field** here — do not send an email/name, it's ignored;
the reporter is always the authenticated user.

### Success response (HTTP code + JSON example)
`202 Accepted`
```json
{ "reference": "TKT-0042", "issue_id": "c1d2e3f4-...-uuid" }
```
`reference` is the provider workspace's own ticket number — show it to the
user as their support ticket reference ("Filed as TKT-0042").

### Error responses (codes + JSON example)
| HTTP | Shape | Meaning |
|---|---|---|
| `400` | Envelope B | Blank/oversized `subject`/`description`, bad `priority`, or oversized `context` |
| `401` | Envelope B | Not authenticated |
| `429` | Envelope B (DRF `Throttled`) | Throttled at **10/min per user** |
| `502` | `{"detail": "Could not file the support report. Please email support@clozr.io.", "code": "support_report_failed"}` | Ticket creation failed server-side — **raw response, not Envelope B**; note `code` here is a *string*, not the HTTP status |
| `503` | `{"detail": "Support reporting is not configured on this server.", "code": "support_not_configured"}` | Backend misconfiguration — **raw response, not Envelope B**, same fallback messaging |

The `502`/`503` bodies are a **third shape** distinct from both §1 envelopes
— `code` is a descriptive string here, not an HTTP status integer. If either
fires, show the static fallback ("please email support@clozr.io") rather
than trying to parse `code` generically.

There is no read-back endpoint ("my submitted reports") — this is filed and
you never see it again through this API.

### Pagination
None — this is a create-only endpoint.

---

## 6 — Accepted attachment file types

Applies to §3's upload endpoint. Detection is by **file content** (magic
bytes), never by filename extension or the browser's declared
`Content-Type` — both are attacker-controlled and ignored.

| Extension | Content-Type |
|---|---|
| `.png` | `image/png` |
| `.jpg` | `image/jpeg` |
| `.gif` | `image/gif` |
| `.webp` | `image/webp` |
| `.pdf` | `application/pdf` |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

**SVG is never accepted** — SVG is XML/script-capable and is excluded on
purpose as a stored-XSS defense, not an oversight. Don't build a client-side
allowlist that includes it; the server will reject it with
`415 unsupported_file_type` regardless. Server reads the first 512 bytes to
detect the type, so an empty or truncated file also fails this check.
