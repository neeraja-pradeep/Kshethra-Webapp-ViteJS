# Tech support relay: endpoint reference

The back office **Tech support** screen files a helpdesk ticket in Clozr (NexoCRM),
optionally with screenshots or documents attached. It used to call Clozr's public
issue webhook straight from the browser, with the webhook key compiled into the JS
bundle. That key works as a credential: Clozr only checks the `Origin` header, and
any non-browser client can forge that. Now the key and an HMAC secret stay on this
server. The browser calls the two endpoints below, and the backend signs and
forwards the request to Clozr.

| Screen action | Calls |
|---|---|
| Each staged file, one at a time, on **Send report** | `POST /api/tech-support/attachments/` |
| The ticket itself, with the tokens from above | `POST /api/tech-support/issues/` |

Code: `tech_support/` (`views.py`, `clozr_client.py`, `serializers.py`,
`file_types.py`, `throttles.py`). Tests: `tech_support/tests.py`.

---

## Conventions that apply to both

**Authentication.** Session cookie (`SessionAuthentication`). Send cookies on every
request (`withCredentials: true` / `credentials: "include"`). There is no token or
`Authorization` header. Use the shared `src/core/api/http.ts` client.

**CSRF.** Required on both endpoints, because both are `POST`. Send the `csrftoken`
cookie back as the `X-CSRFToken` header, the same way as every other write in the
app. A missing or wrong token gets a **403** whose `detail` contains `"CSRF Failed: ..."`.

**Permission.** Both endpoints need `rbac.access_admin_portal`. Every staff role
holds it: Admin, Manager, App Manager, Reports Manager, Counter Staff and Store
Staff. Devotees (`temple_user`) and poojaris do not.

**Methods.** Only `POST`. Any other method gets a 403 from the RBAC layer (a 405 for a superuser), because
only `post` is mapped.

**Never send these.** The browser must not send the Clozr key, the Clozr base URL,
`message`, `reported_for`, `customer_email`, `customer_phone` or `custom_fields`.
The server builds the reporter's identity itself, and it ignores unknown fields.

### Two error shapes

The `error_code` is the reliable way to tell what went wrong.

1. **Relay and upstream errors** use Clozr's envelope, so the client needs only one
   parser:

   ```json
   { "status": "error", "error_code": "upstream_timeout" }
   ```

   There is never a `message`. Every string the user sees comes from the frontend.

2. **DRF's own errors** keep DRF's shape:
   - 403 not signed in: `{ "detail": "Authentication credentials were not provided." }`
   - 403 no permission: `{ "detail": "You do not have permission to perform this action." }`
   - 403 CSRF: `{ "detail": "CSRF Failed: CSRF token missing." }`
   - 429 throttled by this server: `{ "detail": "Request was throttled. Expected available in 41 seconds." }`, with a `Retry-After` header
   - 400 validation: a field map, for example `{ "subject": ["Ensure this field has at least 5 characters."] }`
   - 415 wrong request content type: `{ "detail": "Unsupported media type \"application/json\" in request." }`

   Read `error_code` first. If the body has none, fall back to `detail` (or treat
   it as a field map on a 400).

### Every `error_code`

| HTTP | `error_code` | Endpoint | Meaning | What the UI should do |
|---|---|---|---|---|
| 503 | `not_configured` | both | One of `CLOZR_WEBHOOK_BASE_URL`, `CLOZR_ISSUE_KEY`, `CLOZR_ISSUE_HMAC_SECRET` is empty on the server, or the base URL is not `https://` (plain `http://` is allowed only when `DEBUG` is on). Nothing was sent. | Say reporting is not set up and to contact an administrator. Don't retry. |
| 502 | `upstream_misconfigured` | both | Clozr refused the relay's credentials or contract: 400 `invalid_payload`, 401 `invalid_signature`/`replayed_request`, 403 `origin_not_allowed`, 404 `key_not_found` (on the ticket route), 411, or any **3xx redirect** (the relay never follows redirects). This is logged at ERROR on the server. | Say reporting is misconfigured and to contact an administrator. Don't retry. |
| 409 | `attachments_unavailable` | attachments | Clozr answered 404, which means attachments are switched off for this webhook key. | Treat as "attachments off". Send the ticket without files, and don't retry uploads. |
| 429 | `rate_limited` | both | **Clozr** rate-limited the request. `Retry-After` is passed through from Clozr (default `60`). | Back off for `Retry-After` seconds, then retry with the **same** `X-Idempotency-Key`. |
| 504 | `upstream_timeout` | both | Clozr did not answer in time (connect 3.05 s; read 15 s for tickets, 45 s for uploads). | Retryable. For a ticket, retry with the same idempotency key, because Clozr may have filed it already. |
| 502 | `upstream_unavailable` | both | Clozr was unreachable, answered 5xx, or returned an unreadable 202. If Clozr sent `Retry-After` (for example on its 503), it is passed through. | Retryable later. |
| 413 | `payload_too_large` | both | The ticket's JSON is over 32 KB once built, or the upload is over `TECH_SUPPORT_MAX_ATTACHMENT_BYTES` (10 MB). For uploads the cap covers the whole multipart body, so a file a few hundred bytes under 10 MB can still be refused (see the attachments section). This server refuses it before sending anything. Clozr's own 413 is passed through with this code. | Tell the user to shorten the description or pick a smaller file. |
| 415 | `unsupported_file_type` | attachments | The file's leading bytes are not PNG, JPEG, GIF, WebP, PDF or XLSX/ZIP. SVG and every other text format are always refused. Checked here and passed through from Clozr. | Say: "Use PNG, JPG, GIF, WebP, PDF or XLSX." |
| 415 | `unsupported_media_type` | attachments | Clozr's 415 for a non-multipart body, or a Clozr 415 whose `error_code` the relay does not recognise. It should never happen through the relay. | Generic upload failure. |

Clozr's 413 and 415 pass through only with codes Clozr documents:
- 413: `payload_too_large`
- 415: `unsupported_file_type` or `unsupported_media_type`

A 413 or 415 carrying any other code, or no JSON at all, becomes `payload_too_large`
for a 413 and `unsupported_media_type` for a 415. Every other Clozr status is folded
into the relay codes above. **The `error_code` values in this table are the complete
set the relay can return.**

---

## `POST /api/tech-support/attachments/`

Uploads **one** file and returns a short-lived token. To attach several files, call
this once per file, **one after another** (see Throttling).

**Request**

- `Content-Type: multipart/form-data`. Let the browser set the boundary, and don't
  set the header by hand.
- Exactly **one** part, named `file`. If there are zero file parts, two parts named
  `file`, a file under another name, or an extra file part, the request gets a DRF
  400: `{ "file": ["Send exactly one file, in a multipart field named 'file'."] }`.
- Maximum size is `TECH_SUPPORT_MAX_ATTACHMENT_BYTES` (default 10 MB = 10485760
  bytes). Anything over it gets `413 payload_too_large`, and nothing is forwarded.
  The cap applies twice:
  - to the file itself;
  - to the multipart body the relay sends on to Clozr, which adds roughly 200 bytes
    plus the filename. Clozr compares its cap to the request's `Content-Length`, so
    the relay applies the same rule.

  In practice, keep files at least 1 KB under 10 MB. Check the size in the browser
  first (for example `file.size > 10 * 1024 * 1024 - 1024`), so the user isn't left
  waiting while a large file uploads. nginx refuses bodies over 25 MB outright, with
  its own 413 HTML page and no JSON.
- The type is decided by the file's **magic bytes**, never by its name or the
  part's `Content-Type`:

  | Sniffed as | `content_type` returned |
  |---|---|
  | PNG | `image/png` |
  | JPEG | `image/jpeg` |
  | GIF (87a/89a) | `image/gif` |
  | WebP | `image/webp` |
  | PDF | `application/pdf` |
  | Any ZIP (XLSX) | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

  An empty file is refused too.
- The relay sanitises the filename before forwarding it, for example
  `my screen shot!.PNG` becomes `my_screen_shot.png`.
- Use a client timeout of about 60 s, because the relay waits up to 45 s for Clozr.

**202 Accepted**

```json
{
  "attachment_token": "<opaque token>",
  "expires_in": 1800,
  "name": "my_screen_shot.png",
  "size": 48213,
  "content_type": "image/png"
}
```

| Field | Type | Notes |
|---|---|---|
| `attachment_token` | string | Opaque. Pass it in `attachment_tokens` on the ticket. It is valid **only for this webhook key**. |
| `expires_in` | integer | Seconds until the token expires (Clozr's TTL, 1800 by default). File the ticket before then. |
| `name` | string | The sanitised filename, for display. |
| `size` | integer | Bytes. |
| `content_type` | string | The sniffed type (see the table above). |

**Errors:** `not_configured` 503, `payload_too_large` 413, `unsupported_file_type`
415, `attachments_unavailable` 409, `rate_limited` 429, `upstream_timeout` 504,
`upstream_unavailable` 502, `upstream_misconfigured` 502, plus the DRF 400, 403,
415 and 429 responses described above.

---

## `POST /api/tech-support/issues/`

Files the ticket.

**Request**

- `Content-Type: application/json`
- Optional header `X-Idempotency-Key: <string, 1–128 printable chars>`. Generate it
  once per **Send report** click, for example with `crypto.randomUUID()`, and reuse
  it on every retry of that click. The server forwards it to Clozr as
  `"<user id>:<your key>"`. Clozr keeps the first 202 response for 24 h and replays
  it, so a retry returns the original ticket instead of filing a second one.
  Different users' keys can never collide. A key over 128 characters, or one
  containing non-printable characters, gets a DRF 400:
  `{ "X-Idempotency-Key": ["Must be printable and at most 128 characters."] }`.

```json
{
  "subject": "Receipts are not printing",
  "description": "Counter 2 printer shows a blank page.",
  "priority": "high",
  "page": "/admin/counter",
  "attachment_tokens": ["<token 1>", "<token 2>"]
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `subject` | string | **yes** | 5–280 characters, after trimming. |
| `description` | string | no | Free text. Blank is allowed. The whole ticket, once built, must stay under 32 KB, otherwise you get `413 payload_too_large`. |
| `priority` | string | **yes** | Exactly one of `low`, `medium`, `high`, `critical` (lower case). The server maps it to Clozr's `Low`/`Medium`/`High`/`Critical`. |
| `page` | string | no | The route the reporter was on, for example `location.pathname` (optionally with `location.search` and `location.hash`). Up to 500 characters. It must start with `/` and use only URL path, query and fragment characters: letters, digits and ``-._~%!$&'()*+,;=:@/?#[]``. It can't contain spaces, quotes, `<`/`>`, newlines or other control characters, so URL-encode anything else. Otherwise the request gets a DRF 400: `{ "page": ["Must be an app path starting with '/' (letters, digits and URL path characters only)."] }`. |
| `attachment_tokens` | string[] | no | Up to **10** tokens from the attachments endpoint. Each is at most 128 characters. |

Any other field is **ignored**, including `message`, `reported_for`, `customer_email`
and `custom_fields`.

What the server adds before signing and forwarding:

- `reported_for: "self"`
- A `message` that Clozr shows to support as the ticket's context:

  ```
  Reported by: Ravi Menon (username: ravi.admin)
  User ID: 18
  Email: ravi@temple.test
  Role: Admin (temple_admin)
  Temple: <KSHETHRA_TEMPLE_LABEL>
  Page: /admin/counter
  Submitted via: Kshethra back office (server relay)
  ```

There is no field for "files that failed to upload". If a file fails, add a line to
`description` instead, for example `Could not upload: a.png, b.pdf`.

**202 Accepted**

```json
{ "issue_id": "6c1f…", "request_id": "1b0e…", "attachments_attached": 2 }
```

| Field | Type | Notes |
|---|---|---|
| `issue_id` | string | The Clozr ticket id. |
| `request_id` | string | Clozr's id for this request. |
| `attachments_attached` | integer | How many tokens Clozr actually redeemed. This is a **count only**. An expired or invalid token is skipped silently rather than failing the ticket. If the count is lower than the number of tokens sent, say so (for example, "2 of 3 files attached"). |

**Errors:** `not_configured` 503, `payload_too_large` 413, `rate_limited` 429,
`upstream_timeout` 504, `upstream_unavailable` 502, `upstream_misconfigured` 502,
plus the DRF 400, 403, 415 and 429 responses described above.

---

## Throttling

These are per signed-in user, enforced by this server:

| Endpoint | Scope | Rate |
|---|---|---|
| `issues/` | `tech_support_ticket` | 5 / minute |
| `attachments/` | `tech_support_upload` | 20 / minute |

Over the limit, the response is DRF's `429 { "detail": … }` with `Retry-After`.

Clozr also limits **per key** and **per source IP**. Every relayed request now comes
from this server's IP, so Clozr's per-IP limits (30 tickets and 10 uploads a minute
at the time of writing) are shared by everyone in the deployment. When Clozr says
no, you get `429 { "status": "error", "error_code": "rate_limited" }` with Clozr's
`Retry-After`. Upload files one after another, not in parallel, and honour
`Retry-After` on both kinds of 429. A 429 retry counts against the 5-per-minute
ticket budget too, so keep retries to two or three.

---

## Environment variables (backend)

All are read in `temple_project/settings.py` with `config(..., default=...)`, so the
app boots without them. While any of the first three is empty, both endpoints
answer `503 not_configured`.

| Variable | Default | Purpose |
|---|---|---|
| `CLOZR_WEBHOOK_BASE_URL` | `""` | The Clozr API origin, **without** `/webhooks/...`, for example `https://api.clozr.in`. It **must be `https://`**. `http://` works only with `DEBUG` on (local development), and anything else gives `503 not_configured` plus a warning in the log. Point it at the final host, because redirects are not followed and a 3xx gives `502 upstream_misconfigured`. A trailing slash is fine. The relay appends `/webhooks/issues/<key>/` and `/webhooks/issues/<key>/attachments/`. |
| `CLOZR_ISSUE_KEY` | `""` | The issue webhook key UUID. It must have **`require_hmac` on** in Clozr. Without HMAC, Clozr falls back to `Origin` checks, which a server-to-server call cannot pass, so every request would end as `502 upstream_misconfigured`. Enable `attachments_enabled` on the key if files should work. |
| `CLOZR_ISSUE_HMAC_SECRET` | `""` | The key's HMAC secret from Clozr. It is used to sign the ticket body and the upload's canonical string. It is a secret: keep it in `.env` / the secret store only. |
| `TECH_SUPPORT_MAX_ATTACHMENT_BYTES` | `10485760` | The per-file cap the relay enforces before forwarding. Keep it at or below the key's `max_attachment_bytes` in Clozr, which is itself capped at 10 MB. |
| `KSHETHRA_TEMPLE_LABEL` | `""` | The temple or deployment name printed in every ticket's `message` (`Temple: …`), so support knows who filed it. If unset, it prints `-`. |

The frontend needs **no** Clozr variables any more. Remove `CLOZR_ISSUE_KEY` and
`VITE_CLOZR_WEBHOOK_BASE_URL` from its build environment and CI.

Logging: the `tech_support` logger records status codes, Clozr `error_code`s, the
issue id and the user id. It never records request bodies, the key, the secret, or a
`requests` exception message, since that message contains the URL and therefore the
key.

Sentry: the stdlib integration records every outbound HTTP call as a breadcrumb that
includes the full URL, and that URL contains the key. `tech_support/sentry.py` is
wired into `sentry_sdk.init` in `settings.py` as `before_breadcrumb` and at the end of
`before_send`. It replaces any `/webhooks/issues/<key>` path segment with
`/webhooks/issues/[redacted]` in every string of a breadcrumb or event.

Uploads use the same proxy and CA-bundle environment variables as tickets
(`HTTPS_PROXY`, `REQUESTS_CA_BUNDLE`, and so on).

---

## Rollout

Do the steps in this order, so reporting keeps working at every point and the leaked
key ends up revoked.

1. **Create a new issue webhook key in Clozr** for this tenant, with
   `require_hmac: true`. Add `attachments_enabled: true` and a suitable
   `max_attachment_bytes` if files should work. Copy its key UUID and HMAC secret.
   Use a new key rather than switching `require_hmac` on for the old one: the old
   key is in every published JS bundle, and flipping it would break the deployed
   frontend before the new one ships.
2. **Configure the backend.** Add `CLOZR_WEBHOOK_BASE_URL`, `CLOZR_ISSUE_KEY`,
   `CLOZR_ISSUE_HMAC_SECRET` and `KSHETHRA_TEMPLE_LABEL` (and
   `TECH_SUPPORT_MAX_ATTACHMENT_BYTES` if you need it) to the backend `.env` that
   `docker-compose.yml` loads (`env_file: ../.env`).
3. **Deploy the backend** (branch `security/tech-support-relay`). The app has no
   models, so there are no migrations. Restart `temple-backend` so it picks up the
   new env, then check that `python manage.py rbac_audit --fail-on-gaps` is clean.
4. **Smoke test the relay** as a signed-in staff user (it needs the session cookie
   and the CSRF header):
   - `POST /api/tech-support/attachments/` with a small PNG should return 202 and a
     token. A 409 means attachments are off on the key.
   - `POST /api/tech-support/issues/` with that token should return 202 with
     `attachments_attached: 1`. Check that the ticket in Clozr shows the "Reported
     by …" block.
   - If the response is `502 upstream_misconfigured`, check the backend log line
     (`status=401 error_code=invalid_signature` means the secret is wrong;
     `403 origin_not_allowed` means the key does not have `require_hmac` on).
5. **Deploy the frontend** that calls `/api/tech-support/*` (Task E). Remove
   `CLOZR_ISSUE_KEY` and `VITE_CLOZR_WEBHOOK_BASE_URL` from its build environment.
   Verify with `grep -rE "webhooks/issues|__CLOZR" dist/`, which must return nothing.
6. **Revoke the old key in Clozr**, the one that was in the public bundle, and remove
   the frontend origins from any remaining key's `allowed_origins`. From now on,
   reports can be filed only through the backend.

Rollback: redeploy the previous frontend and re-enable the old key. The backend
endpoints are additive and can stay in place.
