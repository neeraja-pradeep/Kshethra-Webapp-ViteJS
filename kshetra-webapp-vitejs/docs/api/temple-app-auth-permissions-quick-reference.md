# Temple App API — Auth & Permissions Quick Reference

Base URL (dev): `http://localhost:8010`
Auth: **session cookies**, not bearer tokens — send `credentials: "include"` on every request or you get `403` on everything.
Writes (`POST`/`PUT`/`PATCH`/`DELETE`) also need an `X-CSRFToken` header.

---

## 1. Login

Three sign-in endpoints, one per base role. Each rejects users of the other roles.

| Role | Endpoint |
|---|---|
| Devotee / app user | `POST auth/signin/` |
| Temple admin | `POST auth/admin-signin/` |
| Poojari | `POST auth/poojari-signin/` |

Body: `{ "username", "password" }`
Response:
```json
{ "message": "Signin successful", "user": { "id": 5, "username": "…", "role": "temple_user" } }
```
Also available: `auth/google-signin/`, OTP via `auth/send-otp/` → `auth/otp-signin/`.
Sign out: `POST auth/logout/`.

⚠️ **Exception:** `admin-signin/` admits anyone holding the `rbac.access_admin_portal` permission, not just `temple_admin` — that's how a custom staff role reaches the back office. The response still reports their base `role`.

---

## 2. CSRF (required for all writes)

1. `GET auth/csrf/` once on app start → sets `csrftoken` cookie.
2. Read the cookie, send it as `X-CSRFToken` on every write.

```js
fetch("/api/booking/poojacategory/", {
  method: "POST",
  credentials: "include",
  headers: { "X-CSRFToken": getCookie("csrftoken") },
  body: formData,
});
```
Missing/wrong token → `403` with `"CSRF Failed: ..."`. Sign-in endpoints are exempt.

---

## 3. Roles

| Role | Sees |
|---|---|
| `temple_user` | Devotee app — poojas/products/songs, own cart, orders, addresses, nakshatram lists, inbox |
| `temple_poojari` | Own profile, assigned pooja orders, read-only catalogue |
| `temple_admin` | Everything — full back office |

**Users only ever see their own data** (e.g. `GET booking/orders/` returns only the caller's orders — no client-side filtering needed).

On top of the base role, an admin can grant **custom roles** (e.g. "Temple Staff") that add permissions — a user can still show `role: "temple_user"` while holding back-office access. Full reference: `roles-and-permissions.md`.

---

## 4. Driving the UI from permissions

**Never branch on `role` name for what to show** — a staff member's base role is still `temple_user`. Call `GET rbac/me/permissions/` after login and check its `permissions` list instead:

```js
const can = (perm) => me.permissions.includes(perm);
if (can("rbac.manage_pooja_orders")) showOrdersMenu();
```

Two rules:
1. Hiding a button is **not** security — the server enforces every rule.
2. Handle `403` everywhere with "You don't have access", not a crash.

---

## 5. Status codes

| Code | Meaning | What to do |
|---|---|---|
| `200` / `201` | Success | — |
| `400` | Permission ok, body/query invalid | Show validation error |
| `401` | Not logged in / session expired | Redirect to login |
| `403` | Logged in, not allowed | Hide/disable the feature |
| `404` | Not found — **or someone else's object** | Treat as not found (server never reveals it exists) |
| `415` | Wrong content type | Some endpoints need `form-data`, not JSON |

`403` body: `{ "detail": "You do not have permission to perform this action." }`

---

## 6. Endpoint permission matrix

Access levels used below:
- **everyone** — no login needed
- **any logged-in user** — any role
- **all roles** — user, poojari and admin
- **user / poojari / admin** — only the role(s) named

| Area | Pattern | Who can call it |
|---|---|---|
| Auth (signin/signup/otp/csrf/google-signin) | all endpoints | everyone (no login) |
| Auth (logout, change-password, forgot-password, fcm-token) | all endpoints | any logged-in user |
| Pooja catalogue (`poojas/`, `poojacategory/`, `agent-codes/`, `special-pooja-date*`, `orders/`) | `GET` | all roles |
| Pooja catalogue writes (create/update/delete) | `POST`/`PUT`/`PATCH`/`DELETE` | admin |
| `booking/cart/`, `booking/checkout/`, `booking/verify-payment/` | all methods | user |
| `booking/admin/orders/*`, `booking/counter/*`, `booking/refund*`, `booking/hive-cache-logging/` | all methods | admin |
| `booking/global-update*`, `booking/malayalam-dates/` | `GET` | everyone (no login) |
| Shop `category/`, `product/`, `product-variant/`, `producttype/` | `GET` | all roles |
| Shop catalogue writes | write methods | admin |
| Shop `cart/`, `checkout/`, `pay/`, `verify-payment/`, `shop-products/` | all methods | user |
| Shop `address/`, `orders/` | `GET`/`POST` | user, admin |
| Shop `orders/` writes (`PUT`/`PATCH`/`DELETE`/`refund/`) | | admin |
| `ecommerce/bestsellers/` | `GET` | everyone (no login) |
| `notifications/inbox/` | `GET`, mark-read | all roles |
| `notifications/inbox/` create, delete-all-read | | user, admin (delete) / admin (create) |
| `notifications/notifications/*`, `notifications/send/` | all methods | admin |
| `user/profile/`, `user/nakshatrams/` (read) | `GET` | all roles |
| `user/profile/` writes | | all roles (own record); `DELETE` is user only |
| `user/nakshatrams/` writes | | admin |
| `user/user-attributes/`, `user/user-lists/` writes | | user, admin |
| `poojari/pooja-management/`, `poojari/pooja-stats/` | all methods | poojari |
| `poojari/profile/` | `GET`/`PATCH` | poojari, admin |
| `admin/dashboard/data/`, `admin/poojaris/*`, `admin/register-poojari/` | all methods | admin |
| `song/songs/` | `GET` | all roles |
| `song/songs/` writes | | admin |
| `report/export/*` | `POST` | admin |
| `rbac/*` (roles, permissions, users) | all methods | admin |
| `rbac/me/permissions/` | `GET` | any logged-in user |

Anything not listed → `403`. Full per-endpoint matrix (generated from the server's permission map) lives in the source `API_PERMISSIONS.md` if you need an exact row.

---

## 7. Gotchas

- **Some endpoints only accept `form-data`, not JSON.** Anything that can carry an image (poojas, pooja categories, products, songs) uses `multipart/form-data`; sending JSON → `415`. Auth, checkout and payment endpoints take JSON.
- **`GET booking/orders/` returns grouped orders**, not flat rows — list items have no `id`. Use the detail route with a real order id.
- **Public endpoints** (`auth/csrf/`, `booking/global-update/`, `booking/malayalam-dates/`, `ecommerce/bestsellers/`) work pre-login — useful for splash/bootstrap screens.
- **This doc is generated from the server's permission map.** If access changes, regenerate rather than hand-edit.

---

## Screen → Endpoint cheat sheet

| Screen | Endpoints |
|---|---|
| Login | `auth/signin/`, `auth/admin-signin/`, `auth/poojari-signin/`, `auth/csrf/`, `auth/logout/` |
| Bootstrap / splash | `auth/csrf/`, `booking/global-update/`, `booking/malayalam-dates/` |
| Devotee app | `booking/poojas/`, `booking/cart/`, `booking/checkout/`, `booking/orders/`, `ecommerce/*`, `user/profile/` |
| Poojari app | `poojari/pooja-management/`, `poojari/pooja-stats/`, `poojari/profile/` |
| Admin back office | `admin/dashboard/data/`, `booking/admin/orders/`, `admin/poojaris/`, `report/export/*` |
| Roles & access | `rbac/*` — see `roles-and-permissions.md` |
| Post-login menu gating | `rbac/me/permissions/` |
