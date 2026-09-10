# Poojari attendance geofence — admin API

**From:** Backend **To:** Admin portal / back office frontend
**Branch:** `hari-dev` **Date:** 10 Sep 2026
**Companion:** [poojari-geofence.md](poojari-geofence.md) — the mobile side

Attendance is geofenced: a poojari marking "present" for today must be inside
the temple premises, and the server measures the distance itself. **This
document covers the back office's side — configuring the premises.**

> ## Frontend status — integrated 10 Sep 2026
>
> Live at **App › Temple location** (`/temple-location`), gated on
> `view_templelocation`. Full CRUD: list, add, edit, activate/deactivate and
> delete, with the radius bounds mirrored client-side so a typo is caught beside
> the field rather than after a round trip.
>
> Every endpoint and every documented behaviour in this file was verified
> against the running backend — defaults (`200` / `true`), the `PATCH` leaving
> untouched fields alone, all four validation shapes, and the `10`/`5000`
> boundaries being inclusive on both sides. Test rows were created and deleted;
> the table is back to empty.
>
> **§7's multi-site trap is surfaced in the UI.** The screen reads the
> resolution rules and says which site attendance currently resolves to — and
> warns, when a second site is active, that only explicitly-assigned poojaris
> can mark and that assignment is Django-admin-only. That warning is the reason
> the screen is more than a CRUD table.
>
> **The add/edit form carries a map** (Leaflet + OpenStreetMap tiles). Click or
> drag to place the pin, and the shaded circle is the radius — §10's "choose a
> radius" step now has a visual referent instead of being a bare number. The
> coordinate inputs stay authoritative: the map writes into them and reads back
> from them, so the 6-decimal string contract in §1 is untouched and typing
> still works exactly as before.
>
> No API key and no backend change. Leaflet is BSD-2-Clause with no transitive
> dependencies, lazy-loaded into its own 42 KB chunk so only this screen pays
> for it — the main bundle got *smaller*. If a deployment cannot reach
> `tile.openstreetmap.org`, the map degrades to a message plus the existing
> Google Maps link, and the form still works.
>
> Two notes for the backend, neither blocking:
> - **`latitude`/`longitude` are kept as strings end-to-end**, never parsed to a
>   float, exactly as §1 asks. Worth keeping that contract if the serializer is
>   ever revisited.
> - **No assignment endpoint** (§7). Not needed for a single-site temple, which
>   is the current state — but the moment anyone activates a second site, the
>   portal cannot fix what it has just broken. If multi-site is real, `location`
>   on the poojari serializer is the ask.

The table behind it is the geofence's only dial. The radius here is what every
mark is measured against, so widening it is how the office answers *"the GPS
will not let me mark"* without waiting for a mobile release. That is the whole
reason these numbers live in a table rather than in the app or in settings.

---

## 1. Who can do what

| Role | View | Create / Edit / Delete |
|---|---|---|
| `temple_admin` | ✅ | ✅ |
| `manager` | ✅ | ✅ |
| `reports_manager` | ✅ | ❌ |
| `temple_poojari` | ✅ *(own site only, via the mobile endpoint)* | ❌ |
| everyone else | ❌ | ❌ |

Permissions: `temple_poojari.{view,add,change,delete}_templelocation`. The
capability appears in the role editor as **"Manage attendance locations"** under
the **Poojaris** module, alongside "View poojari attendance".

> **Write access is deliberately narrow.** Somebody who can widen their own
> radius to a kilometre has turned the geofence off without touching a single
> attendance row. That is why poojaris hold `view` and nothing more, and why
> this capability is separate from reading the attendance sheet.

### Headers — same as every other admin endpoint

| Header | Value | When |
|---|---|---|
| `Cookie` | `sessionid=…` | every request |
| `X-CSRFToken` | the `csrftoken` cookie's value | `POST` / `PUT` / `PATCH` / `DELETE` |
| `Content-Type` | `application/json` | requests with a body |

Session auth, cookie-based — no bearer token. `GET /api/auth/csrf/` first, then
`POST /api/auth/admin-signin/`. Throttle: 2000 requests/hour per user.

### The object

| Field | Type | Writable | Notes |
|---|---|---|---|
| `id` | integer | read-only | |
| `name` | string, ≤120 | ✅ | e.g. `"Main Temple"` |
| `latitude` | decimal string, −90…90 | ✅ | 6 decimal places |
| `longitude` | decimal string, −180…180 | ✅ | 6 decimal places |
| `radius_meters` | integer, **10…5000** | ✅ | defaults to `200` |
| `is_active` | boolean | ✅ | defaults to `true` |

`latitude`/`longitude` come back as **strings**, not floats — they are decimals
with 6 places and JSON floats would lose precision. Send them as strings too.

---

## 2. List attendance locations

* **Name / purpose:** Every configured site, active and inactive.
* **Method + path:** `GET /api/admin/temple-locations/`
* **Headers:** `Cookie: sessionid=…`. No CSRF — it is a read.
* **Query params:**

| Param | Values | Default |
|---|---|---|
| `page` | integer | `1` |
| `page_size` | integer, max `100` | `10` |

* **Request body:** none.

**Success response — `200 OK`**

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 4,
      "name": "Main Temple",
      "latitude": "10.123456",
      "longitude": "76.654321",
      "radius_meters": 200,
      "is_active": true
    }
  ]
}
```

**Error responses**

| Code | Body |
|---|---|
| `403` | `{"detail": "Authentication credentials were not provided."}` |
| `403` | `{"detail": "You do not have permission to perform this action."}` |

* **Pagination:** ✅ **This is the only paginated endpoint here.** Standard
  page-number style — `count`, `next`, `previous`, `results`. Note the response
  is an *envelope*, unlike the single-object responses below.

---

## 3. Create an attendance location

* **Name / purpose:** Register a shrine poojaris may mark attendance from.
* **Method + path:** `POST /api/admin/temple-locations/`
* **Headers:** `Cookie`, `X-CSRFToken`, `Content-Type: application/json`
* **Path / query params:** none.

**Request body**

```json
{
  "name": "Main Temple",
  "latitude": "10.123456",
  "longitude": "76.654321",
  "radius_meters": 200,
  "is_active": true
}
```

`radius_meters` and `is_active` are optional (`200` / `true`). The other three
are required.

**Success response — `201 Created`**

```json
{
  "id": 4,
  "name": "Main Temple",
  "latitude": "10.123456",
  "longitude": "76.654321",
  "radius_meters": 200,
  "is_active": true
}
```

**Error responses**

`400` — validation. **Note the shape: field-keyed at the top level, with no
`error`/`details` envelope.** This differs from the poojari-facing endpoints.

```json
{ "radius_meters": ["Radius must be between 10 and 5000 metres."] }
```

```json
{ "latitude": ["Latitude must be between -90 and 90."] }
```

```json
{ "name": ["This field is required."] }
```

Nothing is written when validation fails — the bounds are checked before the row
reaches the table.

| Code | Meaning |
|---|---|
| `400` | Out-of-range or missing field (see above) |
| `403` | Not signed in, or lacks `add_templelocation` |

* **Pagination:** none.

---

## 4. Read one location

* **Name / purpose:** A single site.
* **Method + path:** `GET /api/admin/temple-locations/{id}/`
* **Headers:** `Cookie: sessionid=…`
* **Path params:** `id` — integer, the location's id.
* **Request body:** none.

**Success response — `200 OK`**

```json
{
  "id": 4,
  "name": "Main Temple",
  "latitude": "10.123456",
  "longitude": "76.654321",
  "radius_meters": 200,
  "is_active": true
}
```

**Error responses**

| Code | Body |
|---|---|
| `404` | `{"detail": "No TempleLocation matches the given query."}` |
| `403` | `{"detail": "You do not have permission to perform this action."}` |

* **Pagination:** none.

---

## 5. Update a location — the radius dial

* **Name / purpose:** Move a site, rename it, widen the radius, or take it out
  of use. **`PATCH` is what the "geofence too tight" support ticket needs.**
* **Method + path:** `PATCH /api/admin/temple-locations/{id}/` (partial) or
  `PUT /api/admin/temple-locations/{id}/` (full replace)
* **Headers:** `Cookie`, `X-CSRFToken`, `Content-Type: application/json`
* **Path params:** `id` — integer.

**Request body — `PATCH`, one field at a time**

```json
{ "radius_meters": 500 }
```

Deactivate a shrine without deleting its history:

```json
{ "is_active": false }
```

`PUT` requires `name`, `latitude` and `longitude` as well.

**Success response — `200 OK`** — the full object as stored:

```json
{
  "id": 4,
  "name": "Main Temple",
  "latitude": "10.123456",
  "longitude": "76.654321",
  "radius_meters": 500,
  "is_active": true
}
```

A `PATCH` of one field is validated against the other three **as they actually
are in the database**, not against an empty object — so patching only the radius
cannot be tricked into skipping the coordinate checks.

**Error responses**

| Code | Body |
|---|---|
| `400` | `{"radius_meters": ["Radius must be between 10 and 5000 metres."]}` |
| `403` | `{"detail": "You do not have permission to perform this action."}` |
| `404` | `{"detail": "No TempleLocation matches the given query."}` |

* **Pagination:** none.

> **Effect is immediate.** The next mark is measured against the new radius.
> Poojari apps cache the config per session, so someone mid-session may still be
> running their *local* pre-check against the old radius until they re-fetch —
> but the server's answer is always current, and a refusal hands the app the
> updated config to re-cache.

---

## 6. Delete a location

* **Name / purpose:** Remove a site permanently.
* **Method + path:** `DELETE /api/admin/temple-locations/{id}/`
* **Headers:** `Cookie`, `X-CSRFToken`
* **Path params:** `id` — integer.
* **Request body:** none.

**Success response — `204 No Content`**, empty body.

**Error responses**

| Code | Body |
|---|---|
| `403` | `{"detail": "You do not have permission to perform this action."}` |
| `404` | `{"detail": "No TempleLocation matches the given query."}` |

* **Pagination:** none.

> ⚠️ **Prefer `is_active: false` over deleting.** Any poojari assigned to a
> deleted site has their assignment silently cleared (`SET NULL`), and if it was
> the only active site, **every poojari's mark starts failing with `409`**.
> Deactivating keeps the row and the assignment intact.

---

## 7. Resolution rules — which site a poojari is measured against

Worth understanding before configuring anything, because it decides whether
marks succeed:

1. **The poojari's explicitly assigned site**, if they have one *and it is
   active*.
2. Otherwise, **the single active site** — this is the normal one-temple case,
   and it means nobody has to assign anything.
3. Otherwise **nothing resolves**, and every same-day present mark is refused
   with `409`.

Case 3 happens in two situations, both of which are configuration problems:

* **No active site at all** — none created, or the last one deactivated.
* **Two or more active sites and this poojari assigned to none.** The server
  refuses to guess which shrine somebody works at rather than pick one.

> **So: if you create a second active site, assign every poojari to one.** The
> moment a second site goes active, unassigned poojaris stop being able to mark.
> A single-site temple needs no assignments at all.

An assignment to a *deactivated* site falls back to rule 2, so deactivating a
shrine does not strand the poojaris assigned to it.

### Assigning a poojari to a site — Django admin only

**There is no REST endpoint for this yet.** `PoojariProfile.location` is
editable at `/admin/temple_poojari/poojariprofile/`, but the
`/api/admin/poojaris/` serializer does not expose it.

This is only a gap for multi-site temples — a single-temple deployment never
needs an assignment. **If the portal needs to manage several shrines, ask and we
will add `location` to the poojari admin serializer.**

---

## 8. Reading who marked from where

The four location fields appear on every attendance record returned by the
existing admin endpoints — no new endpoint, no query param:

* `GET /api/admin/poojaris/{id}/attendance/` — one poojari's sheet
* `GET /api/admin/poojaris/attendance/` — the whole team

```json
{
  "id": 2,
  "date": "2026-09-10",
  "status": "present",
  "remarks": "",
  "latitude": "10.123456",
  "longitude": "76.654321",
  "distance_meters": 0,
  "location_verified": true,
  "marked_at": "2026-09-10T11:25:54.332594+05:30"
}
```

* **`distance_meters`** — metres from the site *at the moment of marking*.
  Stored rather than recomputed, so widening the radius later does not rewrite
  history: the record still says how far away they actually were.
* **`location_verified`** — `true` only when the server measured the distance
  **and** accepted it.

> ⚠️ **`location_verified: false` is not evidence of cheating.** It is `false`
> for every leave and absence, every backdated correction, every row created
> before this feature shipped, and everything marked while enforcement was off
> (see §9). Do not surface it as a fraud flag. The meaningful signal is
> `status: "present"` **and** `location_verified: false` **and** a non-null
> `distance_meters` — that is a present mark the server measured and did not
> accept, which only exists while enforcement is off.

The Django admin attendance list is filterable on `location_verified` if you
need to eyeball this before the portal has a column for it.

---

## 9. Rollout — enforcement is currently OFF

`POOJARI_ATTENDANCE_GEOFENCE_ENFORCED` defaults to `False`. While off, marks are
still measured and `distance_meters` / `location_verified` are still recorded
honestly — but **no mark is ever refused**. This lets the backend ship before
the mobile build that sends coordinates.

**Order of operations:**

1. Deploy the migration. *(done — the table exists)*
2. **Create the temple's `TempleLocation` row.** ← the back office's step
3. Ship the mobile build.
4. Confirm marks are arriving with coordinates (`location_verified: true` on the
   attendance sheet).
5. Set `POOJARI_ATTENDANCE_GEOFENCE_ENFORCED=True` and restart.

Between steps 2 and 5 the attendance sheet becomes a free audit: you can see who
would have been refused, before anybody actually is.

The flag is also the way out if field GPS turns out to be blocking real
poojaris. **A geofence with no off switch is one bad radius away from nobody in
the temple being able to mark attendance** — so if marks start failing en masse,
widening the radius (§5) is the first lever and this flag is the second.

---

## 10. Choosing a radius

* **200 m** (the default) suits a typical compound. Consumer GPS drifts by tens
  of metres beside masonry and indoors, so this absorbs the jitter.
* **Below 10 m is rejected** — it would refuse poojaris standing in the sanctum.
* **Above 5000 m is rejected** — that is a district, not a premises.
* Measure from the point poojaris actually stand when marking, not the temple's
  postal centroid or its gate.

If reports of false refusals come in, widen before switching enforcement off:
`PATCH {"radius_meters": 400}` is one request and takes effect on the next mark.
