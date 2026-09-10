# Backend requests — from the frontend integration work

Findings from wiring six screens to the API: **Dashboard**, **Users & Roles**
(module access + poojari shrines), **Counter Bookings** (pooja search), **Agent
codes**, **Reports** and **App > Media**.

Everything below was **verified live** against the running backend on
2026-09-08, not inferred from a serializer or a document. Where a request is
made, the reproduction is included so it can be checked in one command.

Nothing here is blocking. Every screen listed above is integrated and working
against the API as it stands today; the frontend already carries a workaround
for each item. This is a list of places where the workaround could be deleted,
ordered by what it would save.

---

> ## Backend response — 2026-09-08
>
> Thanks; this was unusually easy to act on because every item carried its own
> reproduction. **Items 1, 2, 3 and 6 are fixed** and are on the branch now —
> delete the corresponding workarounds. **Item 7's question is answered below**
> (the temple is *Sree Nagaraja Kshetram, Peramangalam*), though the endpoint
> itself is not built yet. **Items 4 and 5 are deliberately not changed** —
> reasoning under each. **Items 8 and 9 need nothing from us.**
>
> | # | Request | Outcome |
> |---|---|---|
> | 1 | Document the trimmed `report` block | ✅ Fixed — warning added to `reports-integration.md` §1 |
> | 2 | Labels for every base role | ✅ Fixed — `base_role_label` now on every user row |
> | 3 | Multi-value `stock_state` | ✅ Fixed — comma-separated, ORed |
> | 4 | Align the two error shapes | ❌ Declined — would break every integrated client |
> | 5 | Return 401 when unauthenticated | ❌ Declined — stock DRF behaviour, not an override |
> | 6 | Gods `PUT` echoes the `GET` envelope | ✅ Fixed |
> | 7 | Temple name and address | ⚠️ Name confirmed below; endpoint not built |
> | 8 | Poojari reassignment counter | ⏸️ Product decision, left open |
> | 9 | Media audio limits | ✅ Nothing needed — your change is right |
>
> Each item below carries a **Backend response** block with the detail.

---

> ## Frontend follow-up — 2026-09-08
>
> Every fix above was **re-verified against the live backend** and the
> workarounds are now deleted. Each item below carries a **Frontend follow-up**
> block saying what changed.
>
> | # | Outcome | Workaround removed |
> |---|---|---|
> | 1 | ✅ Confirmed trimmed | — (doc fix; the code already modelled it correctly) |
> | 2 | ✅ Adopted `base_role_label` | `BASE_ROLE_LABELS` map deleted |
> | 3 | ✅ One request | second stock query + client-side merge and re-sort deleted |
> | 4 | ➖ No change | `mapHttpError` keeps handling both shapes, as agreed |
> | 5 | ➖ No change | **we would take the `code` discriminator** — see below |
> | 6 | ✅ One envelope | `poojariName` threading removed from five layers |
> | 7 | ✅ Name corrected | two hardcoded names collapsed into one constant |
> | 8 | ⏸️ Parked | two tiles, unchanged |
> | 9 | ⚠️ Reopened | see §10 — the 50 MB limit is not actually reachable |
> | 10 | 🆕 **New finding** | client now caps at 20 MB to stay under the proxy |
>
> `npm run build` and `oxlint` pass. Verification exercised the real
> repositories against the live API rather than the endpoints directly, so the
> Zod schemas and mappers are covered too.

---

## Contents

| # | Request | Endpoint(s) | Impact |
|---|---|---|---|
| 1 | [Document the trimmed `report` block](#1-the-rows-endpoints-report-block-is-trimmed--the-doc-implies-otherwise) | `report/<slug>/` | Doc fix — cost us a false start |
| 2 | [Serve labels for every base role](#2-base-role-labels-exist-for-only-7-of-the-9-values-in-use) | `rbac/users/assignable-roles/` | Removes a hardcoded map |
| 3 | [Allow multi-value `stock_state`](#3-stock_state-takes-one-value-so-the-dashboard-makes-two-requests) | `admin/store/products/` | Halves a dashboard request |
| 4 | [Align the two error shapes](#4-filter-errors-and-field-errors-have-different-shapes) | all list endpoints | Simplifies every error handler |
| 5 | [Return 401 when unauthenticated](#5-an-unauthenticated-request-returns-403-not-401) | all | Removes string-matching on errors |
| 6 | [Make the gods `PUT` echo the `GET` envelope](#6-poojari-gods-get-and-put-return-different-envelopes) | `admin/poojaris/<id>/gods/` | Removes a mapping special case |
| 7 | [Serve the temple's name and address](#7-the-temples-name-and-address-are-hardcoded-in-two-places-and-disagree) | `admin/dashboard/data/` | Fixes a real inconsistency |
| 8 | [Count poojari reassignments](#8-poojari-reassigned-is-not-derivable-schema-change) | `admin/dashboard/data/` | Restores a designed tile |
| 9 | [Reconsider the media 20 MB helper text](#9-media-the-uis-audio-limits-were-stricter-than-the-servers-resolved) | — | Resolved, noted for the record |
| 10 | [nginx caps uploads at 25 MB, under the API's 50 MB](#10-nginx-caps-uploads-at-25-mb-so-the-apis-50-mb-limit-is-unreachable) | `admin/media/new/` | **New — a real 413 today** |

---

## 1. The rows endpoint's `report` block is trimmed — the doc implies otherwise

**Priority: documentation only.** No code change wanted; this is the one item
that actually cost implementation time.

[`reports-integration.md`](reports-integration.md) §1 "Response envelope"
describes `report.columns[]` and shows a JSON example carrying only four keys —
but the surrounding prose reads as though the rows endpoint embeds the same
report entry the catalogue serves. It does not:

```bash
curl -s -b cj.txt "$API/report/poojas/?page_size=1" | jq '.report | keys'
# ["columns","description","label","slug"]

curl -s -b cj.txt "$API/report/catalogue/" | jq '.reports[0] | keys'
# ["columns","default_period","default_sort","description","exports","filters",
#  "group","group_label","has_period","icon","label","period_field","permitted","slug"]
```

Modelling the embedded block on the catalogue entry made **all 12 reports fail
schema validation** until it was corrected.

**Request:** add one line to §1 — *"the embedded `report` block is a trimmed
entry: `slug`, `label`, `description` and `columns` only. Everything else about
a report comes from the catalogue."*

The trimming itself is right: the screen already holds the catalogue, and
re-sending a report's filters and icon on every page of rows would be waste.

> **Frontend follow-up — nothing to change.** Re-confirmed live that the block
> is still the four keys, which is what `ReportResultReport` already models. The
> callout is what future integrators needed; thanks for going further than the
> one line asked for.

> **Backend response — fixed.** Rather than one line, §1 of
> `reports-integration.md` now carries a callout box with both `jq` outputs from
> above and an explicit *"do not model the embedded block on the catalogue
> entry"*, plus a `report` row in the envelope field table pointing at it. Your
> reading of the trimming is right and the doc now says so.

---

## 2. Base-role labels exist for only 7 of the 9 values in use

**Priority: low. Removes a hardcoded map from the frontend.**

`rbac/users/assignable-roles/` serves a `label` per role, which is what the
*Add staff account* form renders. But it lists only the roles an operator may
**assign**, while `rbac/users/` returns `base_role` values outside that set:

```bash
curl -s -b cj.txt "$API/rbac/users/assignable-roles/" | jq -r '.[].name'
# temple_admin manager app_manager reports_manager counter_staff store_staff temple_poojari

curl -s -b cj.txt "$API/rbac/users/?page_size=100" | jq -r '[.results[].base_role] | unique'
# ["", "counter_staff", "temple_admin", "temple_poojari", "temple_user"]
```

Two values have no server-side label:

- **`temple_user`** — devotees, deliberately not assignable (§2 of
  [`user-management.md`](user-management.md)), but real staff-list rows carry it.
- **`""`** — the superuser account (`superadmin`, id 33) has an empty base role,
  which renders as an empty badge.

The frontend therefore keeps a hardcoded `BASE_ROLE_LABELS` map, which has
already drifted: it renders `temple_admin` as **"Temple Admin"** while the
server calls it **"Admin"**, so the staff list and the role dropdown disagree
about the same role.

**Request, in preference order:**

1. A `rbac/roles/labels/` (or `?include=all` on the existing endpoint) returning
   `{name, label}` for **every** role a user row can carry, assignable or not.
2. Failing that, add `base_role_label` to the user row in `rbac/users/`, so the
   list can render what the server calls the role without a lookup.

Either lets the frontend delete its map and end the "Admin" / "Temple Admin"
split. Worth deciding separately what an empty `base_role` should display as —
"Superuser" is the honest answer, but that is a product call.

> **Backend response — fixed, via your option 2.** Every user row now carries
> **`base_role_label`** alongside `base_role`, on both `rbac/users/` and
> `rbac/me/permissions/`. Delete `BASE_ROLE_LABELS`.
>
> ```jsonc
> { "base_role": "temple_admin", "base_role_label": "Admin" }
> { "base_role": "temple_user",  "base_role_label": "Devotee" }
> { "base_role": "",             "base_role_label": "Superuser" }
> ```
>
> Option 2 over option 1 deliberately: a separate labels endpoint is a second
> request and a second thing to keep in sync, and the label is only ever wanted
> next to a role that is already on the row.
>
> **On the empty base role** — you called "Superuser" the honest answer and
> flagged it as a product call. Agreed on both counts, and that is what it now
> returns. It is a display label only; nothing branches on it.
>
> The label comes from `ROLE_LABELS`, the same map the dropdown uses, through a
> new `rbac.constants.role_label()` — so the "Admin"/"Temple Admin" split cannot
> reopen. An unrecognised role falls back to its own raw value rather than going
> blank.

> **Frontend follow-up — adopted; `BASE_ROLE_LABELS` is gone.** `baseRoleLabel`
> is now on the `RbacUser` entity and every badge reads it, so the list, the
> detail header and the role editor all render the server's own text. Verified
> live: `temple_admin` → "Admin", `""` → "Superuser", and every row carries a
> label.
>
> `baseRoleLabel()` survives as a **fallback only** — it title-cases the raw
> name when the server sends none, so an older backend degrades to "Counter
> Staff" rather than a blank badge.
>
> One thing your fix surfaced: the base-role **filter** dropdown was hardcoded
> to three roles while rows carry five, so `counter_staff` accounts could not be
> filtered for at all. Added. It is deliberately *not* driven by
> `assignable-roles/` — that endpoint needs `manage_users` and omits
> `temple_user`, and filtering a list you can already see should not require
> permission to change it.

---

## 3. `stock_state` takes one value, so the dashboard makes two requests

**Priority: low. Saves one request per dashboard load.**

The dashboard's inventory card wants *"every product needing attention"* — out
of stock **or** low stock. The filter accepts a single value:

```bash
curl -s -b cj.txt "$API/admin/store/products/?stock_state=low_stock,out_of_stock"
# {"stock_state":"Expected one of in_stock, low_stock, out_of_stock."}  (400)
```

So the card fires **two** requests and merges them client-side. That is correct
but wasteful, and the merge has to re-sort to keep out-of-stock first.

**Request:** accept a comma-separated list (`?stock_state=out_of_stock,low_stock`)
ORed together — the same shape `report/poojas/?gods=1,2,3` already uses
elsewhere in this API. A single `?stock_state=needs_attention` alias would work
equally well and reads better.

> **Backend response — fixed.** `?stock_state=` now takes a comma-separated
> list, ORed:
>
> ```
> ?stock_state=out_of_stock,low_stock   -> everything needing attention, one request
> ?stock_state=low_stock                -> unchanged
> ?stock_state=out_of_stock, low_stock  -> spaces around the comma are fine
> ```
>
> Went with the comma-separated list rather than a `needs_attention` alias: the
> alias reads better but hard-codes one product judgement about which states
> count as needing attention, and the list lets the card decide.
>
> **One bad value rejects the whole list** (`?stock_state=low_stock,nonsense` →
> 400) rather than being silently dropped — a half-applied filter showing
> plausible-but-wrong rows is worse than an error.

> **Frontend follow-up — adopted; the card now makes one request.** `stockState`
> takes `StockState | StockState[]`, and a list is joined into the comma form.
> Agreed on rejecting the whole list over silently dropping a bad value.
>
> Verified live, and it removed more than the extra request: with
> `ordering=stock`, out-of-stock sorts first *by construction* (quantity 0), so
> the client-side re-sort that kept urgency order was redundant too.
>
> ```
> ?stock_state=out_of_stock,low_stock&ordering=stock
> -> Panchmukhi Brass Lamp (0, out_of_stock)  ->  Loban Dhoop Cones (8, low_stock)
> ```
>
> Both states, correctly ordered, one request. The merge is deleted.

---

## 4. Filter errors and field errors have different shapes

**Priority: low, but it touches every list screen.**

A query-parameter error is a **flat string**; a body-validation error is a
**list of strings**. Verified on three separate features:

```bash
curl -s -b cj.txt "$API/admin/agent-codes/?status=x"   # {"status":"Expected one of active, inactive."}
curl -s -b cj.txt "$API/admin/media/?status=x"         # {"status":"Expected one of active, inactive."}
curl -s -b cj.txt "$API/report/poojas/?period=x"       # {"period":"Expected one of today, ..."}

curl -s -b cj.txt -X POST "$API/admin/agent-codes/new/" -d '{}'  # {"code":["This field is required."]}
```

Both integration docs call this out and ask clients to handle both, which we
do — `mapHttpError` flattens either shape. So this is **not** causing bugs.

**Request:** consider making filter errors `{field: [string]}` too, matching
DRF's own convention. One shape means one code path, and a client that
reasonably assumes DRF's list shape currently gets `"E"` from
`errors.status[0]` — the same class of bug the agent-code docs note was already
fixed once for the duplicate-code message.

Low priority precisely because it is consistent *as it is*: the inconsistency is
documented and predictable, so this is tidiness rather than a defect.

> **Backend response — declined, and it is worth saying why rather than just
> "won't fix".**
>
> You are right that it is inconsistent, and right that DRF's own convention is
> the list shape. But this flat shape is **not** local to agent codes and media:
> it is how all 25 query-parameter errors across nine admin list screens answer
> today. Changing it would be a breaking change for every one of those screens —
> including the ones already integrated against the documented flat shape — to
> buy tidiness in a `mapHttpError` that, as you say, already handles both.
>
> Since your handler copes and no bug traces to it, the cost lands entirely on
> other clients. Keeping it consistent-as-is beats making it half-consistent
> during a migration.
>
> Recorded as a candidate for a deliberate v2 pass over the list endpoints, where
> it would be one breaking change announced once rather than nine.

> **Frontend follow-up — agreed, no change.** Not worth a breaking change for
> tidiness, and "consistent as-is beats half-consistent during a migration" is
> the right call. `mapHttpError` keeps flattening both. If the v2 pass ever
> happens we would rather it land with item 5's discriminator than alone.

---

## 5. An unauthenticated request returns 403, not 401

**Priority: low. Would let clients drop string-matching on error bodies.**

Every endpoint answers an unauthenticated request with `403`:

```bash
for p in admin/dashboard/data admin/media report/catalogue admin/agent-codes; do
  curl -s -o /dev/null -w "$p -> %{http_code}\n" "$API/$p/"
done
# all four -> 403

curl -s "$API/admin/media/"
# {"detail":"Authentication credentials were not provided."}
```

Both integration docs flag this and advise branching on the `detail` **string**
rather than the status code. That works, but it means "should I redirect to
sign-in?" is answered by matching English prose — which breaks silently if the
wording is ever localised or reworded.

The app's HTTP client has a `401` handler for session expiry that consequently
never fires; a genuinely expired session is indistinguishable from a permission
denial without reading the message.

**Request:** return `401` when there is no authenticated session, keeping `403`
for *authenticated but not permitted*. This is DRF's default behaviour with
`SessionAuthentication`; something in the stack is overriding it. If that
override is deliberate (e.g. to avoid a browser basic-auth prompt), a
machine-readable discriminator — `{"detail": "...", "code": "not_authenticated"}`
— would serve just as well.

> **Backend response — declined, but your diagnosis needs one correction.**
>
> Nothing in this stack is overriding DRF. This *is* DRF's behaviour: the
> permission layer raises `NotAuthenticated` correctly, and then
> `APIView.handle_exception` coerces it to 403 whenever no authenticator returns
> a `WWW-Authenticate` header — which `SessionAuthentication` never does. From
> DRF's source:
>
> ```python
> if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
>     auth_header = self.get_authenticate_header(self.request)
>     if auth_header:
>         exc.auth_header = auth_header
>     else:
>         exc.status_code = status.HTTP_403_FORBIDDEN
> ```
>
> So there is no override to remove; getting 401 back means adding a custom
> exception handler that re-raises the status DRF just changed, for every
> endpoint in the project at once. That is a bigger, riskier change than the
> problem — a session-expiry handler that never fires — warrants right now.
>
> **Your fallback suggestion is the better fix and we would take it**: a
> `code: "not_authenticated"` discriminator on the body, which is additive,
> breaks nothing, and lets you stop matching English prose. It was left out of
> this pass only because it touches every error body and belongs with the item 4
> decision rather than ahead of it. Say the word and it goes in next.

> **Frontend follow-up — correction accepted, and yes please to the
> discriminator.**
>
> You are right that nothing is overriding DRF; `handle_exception` coercing
> `NotAuthenticated` to 403 when no authenticator offers a `WWW-Authenticate`
> header is stock behaviour, and "something in the stack is overriding it" was
> wrong. Thanks for the source.
>
> **Consider this the word on `code: "not_authenticated"`** — it is the only
> item here we are actively asking for. It is additive, breaks nothing, and lets
> the session-expiry handler key on a machine-readable field instead of English
> prose. No rush, and pairing it with the item 4 pass makes sense.

---

## 6. Poojari gods: `GET` and `PUT` return different envelopes

**Priority: very low. One mapping special case.**

```bash
curl -s -b cj.txt "$API/admin/poojaris/7/gods/"                    # keys: poojari, count, gods
curl -s -b cj.txt -X PUT ... -d '{"god_ids":[]}'                   # keys: message, count, gods
```

The `GET` names the poojari; the `PUT` returns a `message` instead and drops the
`poojari` block. The frontend passes the poojari's name into the write call so
the mapper can rebuild the same entity from either response.

**Request:** have the `PUT` echo the `GET` envelope (keep `message` alongside if
it is useful). A write returning exactly what a subsequent read would return is
the pattern the staff-user endpoints already follow — §5 of
[`user-management.md`](user-management.md) notes those "return the updated user,
so the row can be re-rendered without a second request".

The same observation applies, more mildly, to the agent-code and media status
toggles: they return the **row** shape without `summary`, which both docs
explain and which the frontend handles by invalidating the list. That one seems
right as designed — sending a summary on every toggle would be its own waste.

> **Backend response — fixed.** The `PUT` now returns the same envelope as the
> `GET`, with `message` alongside rather than instead of it:
>
> ```jsonc
> // PUT /api/admin/poojaris/<id>/gods/
> {
>   "poojari": { "id": 7, "name": "Ramesh Nair" },
>   "message": "Gods updated successfully",
>   "count": 2,
>   "gods": [ ... ]
> }
> ```
>
> Stop passing the poojari's name into the write call — the response now carries
> it. A test pins the two envelopes together so they cannot drift apart again.
>
> **On the status toggles:** agreed, and they stay as they are. Returning a
> `summary` from a single-row toggle would make every switch pay for a count of
> the whole table.

> **Frontend follow-up — adopted; the name threading is gone.** One schema now
> parses both, and `poojariName` has been removed from all five layers it ran
> through (api → repository → repository interface → usecase → mutation), so the
> screen just sends `{ userId, godIds }`.
>
> Verified live against poojari 7: the `PUT` response maps through the same
> mapper as the `GET` and returns the poojari's name from the body. Writing the
> current list back left it unchanged.
>
> The pinning test is the part that matters — that was the actual risk.

---

## 7. The temple's name and address are hardcoded in two places, and disagree

**Priority: medium — this is a visible inconsistency today.**

[`dashboard.md`](dashboard.md) states the temple's name and address are
"hardcoded in the frontend", and the payload confirms there is no field for
them:

```bash
curl -s -b cj.txt "$API/admin/dashboard/data/" | jq 'keys'
# ["counter_bookings","date","devotees","pooja_bookings","poojari_management","store_orders"]
```

The frontend consequently carries **two different hardcoded names**:

| Place | Value |
|---|---|
| `DashboardScreen.tsx` | `Sree Nagaraja Kshetram, Peramangalam` |
| `core/config/app.ts` → `TEMPLE_NAME` | `Sri Kshetra Devasthanam` (printed on counter receipts) |

So the dashboard header and a printed receipt name different temples. That is a
frontend bug and I have not silently "fixed" it by picking one, because which is
correct is a question for the temple, not for me.

**Request:** serve the temple's display name and address from the API — either
on the dashboard payload or, better, a small `GET /api/temple/profile/` that the
receipt printer can read too. One source would make the two agree by
construction, and would matter more if a second temple is ever onboarded.

Please also confirm which of the two names above is the correct one, so the
frontend can be corrected in the meantime.

> **Backend response — question answered; endpoint not built yet.**
>
> **The temple is `Sree Nagaraja Kshetram, Peramangalam`.** So
> `DashboardScreen.tsx` has it right and `TEMPLE_NAME` in `core/config/app.ts`
> is wrong — the receipts are the ones printing the wrong temple. Please correct
> that constant; that is the visible bug fixed in the meantime.
>
> You were right not to pick one silently.
>
> The `GET /api/temple/profile/` endpoint is **not** built in this pass — it is
> new API surface rather than a fix, and worth designing once against the
> question of whether a second temple is ever onboarded (which changes it from a
> settings read to a tenant lookup). Raised separately; the hardcoded-but-now-
> consistent name is not blocking anything until then.

> **Frontend follow-up — corrected, and the split is now structurally
> impossible.** `TEMPLE_NAME` is `Sree Nagaraja Kshetram`; receipts print the
> right temple.
>
> Rather than just editing the constant, every screen that names the temple now
> reads it: the dashboard header, the counter receipt, and the two auth-screen
> brand lines that were separately hardcoding the same string. There is one
> definition, so two places cannot disagree again while it stays client-side.
>
> Agreed on deferring `temple/profile/` — the one-temple-or-many question really
> does change its shape, and one constant is not worth an endpoint until then.
> When it lands, that constant is the only thing to replace.

---

## 8. Poojari "reassigned" is not derivable (schema change)

**Priority: product decision, not a defect.**

[`dashboard.md`](dashboard.md) §8 already explains this: the Poojari management
card was designed with three tiles, and only two are served —

```bash
curl -s -b cj.txt "$API/admin/dashboard/data/" | jq '.poojari_management'
# { "awaiting_completion": 3, "overdue": 0 }
```

`PoojaOrderLine.assign_poojari()` overwrites `poojari` in place with no history
and no counter, so a booking handed to a second poojari is indistinguishable
from one assigned once. The doc's reasoning for not inventing a figure is right,
and the frontend now renders **two** tiles rather than three.

**Request — only if the temple actually wants that tile back:** either a
reassignment counter on the booking, or an assignment-history table. The latter
also answers "who was it taken from, and when", which is the question a
supervisor is really asking when they look at that card.

Recording this so the decision is visible rather than quietly dropped.

> **Backend response — agreed, left open as a product decision.** Nothing
> changed. The reasoning in `dashboard.md` §8 stands, two tiles is the right
> call for now, and an assignment-history table is the better of the two options
> you list — it answers "taken from whom, and when", which a counter cannot.
> Parked until the temple asks for that tile.

---

## 9. Media: the UI's audio limits were stricter than the server's (resolved)

**No backend action needed.** Noted so the backend team knows the frontend has
moved.

[`apps_media-integration.md`](apps_media-integration.md) §2 flagged that the
form advertised *".mp3 or .wav, up to 20 MB"* while the API accepts **`.mp3`,
`.wav`, `.ogg`, `.m4a`, `.flac` up to 50 MB**. Confirmed live:

```bash
curl -s -b cj.txt -X POST "$API/admin/media/new/" -F "title=T" -F "artist=A" -F "audio_file=@bad.txt"
# {"audio_file":["`.txt` is not an audio file. Upload one of .flac, .m4a, .mp3, .ogg, .wav."]}
```

The frontend now advertises and accepts the server's real limits. **If the 20 MB
/ two-format rule was ever an intentional product policy, say so and we will put
it back as a deliberate client-side restriction** — right now it is gone on the
assumption that the wider server limits are the intended ones.

The same section's other warning — that `artist` is required by the API but was
unstarred in the form — is also fixed frontend-side; the field is now marked
required and validated before submit. The API behaviour is fine as it is.

> **Backend response — nothing needed; your change is correct.** The server's
> limits (`.mp3 .wav .ogg .m4a .flac`, 50 MB) are the intended ones, not an
> accident, so advertising them is right. The 20 MB / two-format text was stale
> helper copy, never a policy.
>
> One thing worth knowing if you show the server's error verbatim: at the
> boundary it reads *"That file is 50MB. The limit is 50MB."* — the size is
> floor-divided into whole megabytes, so a 50.4 MB file reports as 50. It is
> correct but unhelpful exactly where a user needs it; your own copy for the
> too-large case will read better.
>
> Thanks also for fixing the unstarred `artist` field — that one was ours to
> mis-document and yours to hit.

> **Frontend follow-up — formats closed, size reopened as §10.**
>
> The five formats are settled and the form accepts all of them.
>
> The size is not. Chasing your floor-divided-megabytes note, we added a
> client-side size check and probed the real boundary — and **uploads die at
> nginx well before Django's 50 MB**. Details and the reproduction are in §10.
> The form now caps at **20 MB**, which is the honest limit today.
>
> So the original *"was 20 MB ever intentional?"* question has an ironic answer:
> the old helper text was closer to reality than the documented 50 MB. It was
> still wrong to have two formats, and it was still stale rather than policy —
> but it was not the safe assumption to widen it that it looked like.

---

## 10. nginx caps uploads at 25 MB, so the API's 50 MB limit is unreachable

**Priority: high — this is a live failure, not a tidiness item.** Found while
adding the client-side size check §9's response prompted.

`admin/media/new/` documents and validates a 50 MB audio limit. The proxy in
front of it does not allow anything close:

```bash
# nginx's own config, read from the running container
docker exec temple-nginx grep -rn client_max_body_size /etc/nginx/conf.d/
# /etc/nginx/conf.d/temple.conf:14:    client_max_body_size 25m;
```

Probed against the live endpoint, holding everything else constant:

```
 10 MB -> 500   (Django reached; the probe file is not real audio)
 20 MB -> 500   (Django reached)
 25 MB -> 413   nginx: Request Entity Too Large
 30 MB -> 413
 50 MB -> 413   <- the documented limit, refused outright
```

The boundary sits at exactly `client_max_body_size 25m`: 26,214,000 bytes is a
413 while 26,213,000 is not.

Two problems, and the second is the worse one:

1. **A 25–50 MB file can never be uploaded**, though both the docs and the
   serializer say it may be.
2. **The refusal is unreadable.** nginx answers with an **HTML** error page, not
   JSON, so `mapHttpError` cannot extract a message from it. A user uploading a
   30 MB track gets a bare failure with no explanation — the one case where the
   error text matters most.

**Request, in preference order:**

1. Raise `client_max_body_size` to comfortably clear the serializer's limit —
   `client_max_body_size 60m` leaves room for multipart overhead on a 50 MB
   file. Then the documented limit is the real one and Django's own JSON error
   is what users see.
2. If 25 MB is the *intended* ceiling, lower the serializer's limit to match and
   update `apps_media-integration.md` — a documented 25 MB that is actually
   enforced by Django beats an undocumented one enforced by the proxy.

Either way the limit should be enforced somewhere that can explain itself.

> **Frontend follow-up — capped at 20 MB in the meantime.** `AUDIO_MAX_BYTES` is
> 20 MB, deliberately under the proxy's 25 MB so multipart overhead cannot push
> a just-legal file over, and the form refuses an oversized file at pick time
> with `That file is 30.2 MB. The limit is 20 MB.` — before the upload is spent.
>
> This is a workaround for the proxy, not a product decision, and the constant
> is commented as such. **Tell us which of the two options above you take and we
> will move the number to match** — it is one constant.

---

## What is working well

Worth saying, since a list like this reads as though everything is broken.
Several deliberate design choices made the integration markedly easier, and
should be kept as patterns for future endpoints:

- **`summary` counted over every filter *except* the one the tiles apply.**
  Agent codes, Media and Devotees all do this, and both docs explain why. It is
  subtle, it is right, and getting it wrong would have broken the tiles the
  moment anyone clicked one.
- **Reports being fully metadata-driven.** Columns, filters, dropdown contents,
  icons, period presets and the page-size cap all arrive from the catalogue —
  12 reports integrated with no per-report frontend code. This is the single
  best thing in the API surface we touched.
- **`modules` on `rbac/users/<id>/`.** Turning 287 permission codenames into 22
  product modules made a wall of text into a readable screen.
- **Server-side search that reaches beyond the printed columns.**
  `booking/poojas/?search=` matches a romanized spelling of a Malayalam name and
  the pooja's god — neither reachable by any client-side filter over loaded rows.
- **Separate one-field toggle endpoints** (`/status/`, `/home-screen/`) so a
  switch on a list row cannot post a stale copy of every other field with it.
- **Explicit `null` meaning "not yours to see"** on the dashboard's `devotees`
  card, distinguishable from a missing key.
- **Guards enforced server-side, with the counts to explain them** — the agent
  code delete returning `{bookings, active_carts}` lets the UI say *which*
  guard tripped rather than showing a generic refusal.

---

## Reproduction setup

Every command above assumes a signed-in session:

```bash
API=http://127.0.0.1/api
curl -s -c cj.txt "$API/auth/csrf/" -o /dev/null
CSRF=$(awk '/csrftoken/ {print $7}' cj.txt)
curl -s -b cj.txt -c cj.txt -X POST "$API/auth/admin-signin/" \
  -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \
  -d '{"username":"superadmin","password":"..."}'
```

All read-path checks are non-destructive. The write-path checks in this document
created and then deleted their own rows: every agent code, media track and
shrine assignment made during the integration was removed again, and the media
library and poojari 7's shrine list were both confirmed empty afterwards.

Note this backend is **shared** — during the session it was redeployed under us,
and an agent code (`TEMPLE50`, id 6) appeared from another session's testing. If
you are reconciling row counts against this document, expect other people's test
data alongside your own.
