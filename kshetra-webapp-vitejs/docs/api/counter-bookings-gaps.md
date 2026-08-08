# Counter Bookings — Gaps Between Backend and UI

Everything the counter backend supports that the console does not use, and everything the console draws that no backend supports.

The integration pass wired only what the design already draws: KPI band, people roster, pooja search, cart, take-payment, receipt, and the counter-payments modal. This file is the audit of what was left, taken from the backend source (`booking/counter_views.py`, `counter_serializers.py`, `rbac/permission_map.py`) rather than from the API docs.

Contract reference: [counter-bookings-quick-reference.md](counter-bookings-quick-reference.md).

---

## A. Endpoints with no UI — 3 of 7

| Endpoint | Permission | UI |
|---|---|---|
| `POST counter/sales/` | `operate_counter` + `booking.add_poojaorder` | ✅ Take payment |
| `GET counter/sales/collection-summary/` | `operate_counter` | ✅ KPI band |
| `GET counter/agent-bookings/` | `collect_counter_payment` | ✅ Counter payments list |
| `POST counter/agent-bookings/{id}/record-payment/` | `collect_counter_payment` | ✅ Settle + receipt |
| `GET counter/sales/` | `operate_counter` | ❌ **none** |
| `GET counter/sales/{id}/` | `operate_counter` | ❌ **none** |
| `POST counter/sales/{id}/cancel/` | **`cancel_counter_sale`** | ❌ **none** |

These three are really one missing feature. **Once a receipt is dismissed there is no way to see that sale again** — so there is also nowhere to reprint from and nowhere to void from.

Consequences worth stating plainly:

- **`rbac.cancel_counter_sale` is unreachable.** The backend defines it, `temple_admin` holds it, `rbac_audit` maps it — and no UI can exercise it. A mis-rung sale can only be voided with `curl` or Django admin.
- **A timed-out sale cannot be resolved.** `mapHttpError` distinguishes a `timeout` (request sent, outcome unknown — the sale *may* be recorded) from a `network` failure, and the counter screen warns the operator not to take payment again until it is confirmed. It gives them no way to confirm it. This item is what closes that.

All three are already wrapped end to end — `getCounterSales` / `fetchCounterSales`, `fetchCounterSale`, `cancelCounterSale` in `infrastructure/data-sources/remote/counter.api.ts` and `application/usecases/`. **The remaining work is presentation only:** a query hook keyed off `counterKeys.sales()`, a table (reuse `shared/ui/Table` and the `OrdersPaginationBar` pattern), and a cancel dialog gated on `PERMISSIONS.cancelCounterSale`.

### Suggested screen

`GET counter/sales/?date=&search=&sale_type=&page=&page_size=` — `date` defaults to today and must be `YYYY-MM-DD` (anything else is a `400`); `search` matches receipt no., customer name and phone; `page_size` max 100, default 25. Rows come from the lighter `CounterReceiptListSerializer` (no `items`). Cancelled receipts are listed but excluded from the summary. Row click → `GET counter/sales/{id}/` → the existing `Receipt` component, unchanged.

`POST counter/sales/{id}/cancel/` takes a required `reason` (blank → `400`, already-cancelled → `400`). Effects differ by sale type: a `walk_in` void cancels the receipt, order and every occurrence; an `agent_booking` void only undoes the collection — **the app booking stands and becomes payable again**. No gateway refund; cash goes back over the counter.

---

## B. Fields the API accepts or returns that nothing uses

- **`customer_name` / `customer_phone`** on `POST counter/sales/`. Sent as empty strings today. Receipt search in §A matches on exactly these, so **every sale taken now is unfindable by payer**. Two fields on `TakePaymentModal`. The payer need not be one of the people the poojas are for.
- **List filters never surfaced** — `date`, `search`, `sale_type`, `page`, `page_size` on sales; `paid` and `page` on agent-bookings. The counter-payments modal fetches a single unpaginated page and cannot filter to outstanding-only.
- **`items[].cancelledCount`** — parsed into the entity, never rendered. `amount` already excludes cancelled occurrences, so a partly-voided receipt prints a total lower than `base × count` with nothing explaining the difference.
- **`orderIds`, `saleType`, `status`, `cancelReason`** — no screen distinguishes a walk-in from an agent settlement, or shows that a receipt was cancelled.

---

## C. Counter data exposed outside the counter module

`PoojaOrderSerializer` (`booking/admin/orders/{id}/`) adds `channel`/`channel_display`, `counter_staff`/`counter_staff_details`, `counter_receipt`/`counter_receipt_no`, `counter_payment_method`, and each order line gains `devotee` and `remarks`.

Since the Orders and Bookings screens are still mock-driven, **counter sales appear nowhere in the admin order views**. Related: `onViewBooking` in `CounterPosScreen` is an empty stub — the target is `booking/admin/orders/{id}/` using `AgentBooking.orderId`.

⚠️ `booking/admin/orders/` has **no `channel` filter**. Even once Orders is wired, you cannot filter to counter sales without a backend change.

When that screen is built, read the **`devotee`** field on each order line: walk-in devotees are not app accounts, so `user_list`/`user_attribute` are `null` and the name lives in a snapshot (`counter_person_name`, `counter_person_nakshatram`).

---

## D. The gap in the other direction — UI with no backend

These panels already exist and are mock-driven. **There is no counter aggregation anywhere in the backend** — nothing in `report/`, nothing in the admin dashboard module, and `collection-summary/` covers a single day only.

| Component | Needs |
|---|---|
| `dashboard/CounterCollectionsPanel` + `counter-collections.mock` | A multi-day collections series |
| `COUNTER_BOOKING_STATS` stat tiles (`stat-tiles.mock`) | Period totals with deltas |
| `users-roles/CounterActivityPanel` | Per-staff bookings taken / collection handled |

**These are not frontend tasks.** They cannot be wired without new endpoints, and estimating them as UI work will be wrong. The cheapest interim option is to drive them from repeated `collection-summary/?date=` calls, which is one request per day shown and gives no per-staff breakdown at all.

---

## E. Auth stages with no admin-side backend

`AuthScreen` draws four stages; only password login is real.

| Stage | Status |
|---|---|
| `login` | **Real** — `POST auth/admin-signin/` |
| `request-code` | Mock. `auth/send-otp/` exists but is the devotee flow. |
| `otp` | Mock. `auth/otp-signin/` likewise. |
| `set-password` | Mock. No admin-side reset endpoint found. |

Decide whether back-office staff should have OTP and self-service reset before building against the devotee endpoints — they sign in through a different route and the base-role checks differ.

---

## F. Sidebar gating is partial

`nav.ts` carries RBAC codenames, but only the five entries whose permission is certain are gated: Dashboard, Counter Bookings, Pooja Orders, Notifications, Users & Roles. Everything else (Store, Pooja Management, Devotees, Media, Agent code, Reports) renders for any signed-in console user. Under-gating is cosmetic — the server refuses the call either way — but the menu over-promises. Fill the rest in from `rbac/permission_map.py`.

Related: the index route still redirects to `/dashboard`. A counter-only operator lands on a screen their sidebar hides. Once gating is complete, the redirect should pick the first entry the user can actually see.

---

## G. No price preview exists

There is **no endpoint that prices a cart**. The running total in `BookingPanel` and "Amount due" in `TakePaymentModal` are computed client-side from `offlinePrice` (or the special date's own price, via `priceForDate()`), and the modal says so in small print. The server's `total` on the `201` is authoritative and is what the receipt prints.

The two agree today because the same rule is applied on both sides. They will silently diverge the moment the backend adds a discount, a rounding rule, or a per-date surcharge. A `POST counter/sales/preview/` returning priced lines without persisting would close this properly.

---

## H. Backend observations

Found by reading the source and by exercising the live server; none are documented elsewhere.

- **`staff_name` can come back empty.** `get_staff_name` returns `"first last".strip() or staff.email`, so an account with neither prints nothing. `buildReceiptPages()` falls back to the literal "Counter" so a receipt never shows a blank till; the real fix is requiring a name (or falling back to `username`) server-side.
- **Half the special poojas have no published dates.** 4 of the 8 poojas in the current database are `special_pooja` with zero active upcoming `SpecialPoojaDate` rows, so they cannot legally be booked. The counter screen says so rather than opening a form that can never be submitted, but the catalogue data needs attention.
- **`receipt_no` has gaps by design** — `"RCP-" + (1000 + pk)`, stamped in a second save after insert, so a rolled-back transaction burns a number. Do not present it as a gapless sequence to anyone reconciling cash.
- **No edit path for a receipt** — only create and cancel. Correcting a mistake means void-and-re-ring, which burns a number. This is why the confirm button disables itself while in flight.
- **`sale_type` is unvalidated** — a typo returns an empty page, not a `400`. Drive it from a fixed select.
- **`date` filters on `created_at__date` in server local time**, with no timezone parameter. A browser in another timezone will disagree about "today".
- **`CSRF_TRUSTED_ORIGINS` is never set in the dev branch of `settings.py`.** Django compares the browser's `Origin` against the host the request arrived on, so an unsafe request from the dev server is refused with `403 "... does not match any trusted origins"`. Sign-in survives only because it is CSRF-exempt, so the failure first appears on a real write. `vite.config.ts` sends `headers: { Origin: apiTarget }` — `changeOrigin: true` rewrites `Host` but **not** `Origin`, so both are needed. Production on a different host than the API still needs `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` and `SameSite` revisited.
- **`GET auth/csrf/` sets the cookie correctly.** It lacks `@ensure_csrf_cookie`, which looked like a cold-start risk, but a cold request returns `Set-Cookie: csrftoken=...; SameSite=Lax` as intended. The client still refreshes and retries once on a `403 "CSRF Failed"` to cover an expired token.
- **Catalogue list responses are cached with `timeout=None`**, keyed on the querystring (`poojas/`, `poojacategory/`, `special-pooja-dates/`). An admin's price edit may not surface until that cache is invalidated — a stale price is the server's cache, not the client's.
- **`user/nakshatrams/` is paginated at 10** while there are 27 nakshatras; `catalogue.api.ts` passes `page_size=100`. Names come back in Malayalam.
- **`booking/poojas/` and `booking/poojacategory/` ignore `page`/`page_size`** and return `{count, results}` with no `next`/`previous`. They are not DRF pages — `wire.ts` models them separately as `countedList`.
- **No "active poojas only" server filter.** `PoojaFilter` exposes no `status` param, so inactive poojas are dropped client-side; posting an inactive `pooja_id` fails the whole sale.
- **`Nakshatram` is paginated without an `order_by`**, which logs `UnorderedObjectListWarning`. Harmless at `page_size=100` (one page), but ordering should be deterministic.
- **`temple-nginx` cannot start** — it crash-loops on `host not found in upstream "temple-frontend:3000"` (`nginx/temple.conf:7`) because `temple-frontend` is commented out of `docker-compose.yml`.
