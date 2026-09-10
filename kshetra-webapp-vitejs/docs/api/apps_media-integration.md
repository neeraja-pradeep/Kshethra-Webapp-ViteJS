# Media — endpoint reference for frontend integration

Seven endpoints back the four Media screens: the **list**, the **add** form, the
**detail** page and the **edit** form. Every response and error body below was
captured from a live run — nothing here is inferred from the serializers.

Screen → endpoint:

| Screen | Calls |
|---|---|
| Media list | `GET /api/admin/media/` |
| STATUS toggle on the list | `PATCH /api/admin/media/<id>/status/` |
| New track (Save track) | `POST /api/admin/media/new/` |
| Track detail (View only) | `GET /api/admin/media/<id>/` |
| Edit track (Save track) | `PATCH /api/admin/media/<id>/` |
| *Add to app home screen* switch | `PATCH /api/admin/media/<id>/home-screen/` |
| Delete track | `DELETE /api/admin/media/<id>/` |

For the *why* behind the model — what a track is, why featured and live are two
questions — see [apps_media.md](apps_media.md). This file is the wire contract
only.

---

## Conventions that apply to all seven

**Authentication.** Session cookie, `SessionAuthentication`. Send
`credentials: "include"` on every request. No token header.

**CSRF.** Required on all five writes. Call `GET /api/auth/csrf/` once on app
start, then send the `csrftoken` cookie back as the `X-CSRFToken` header. A
missing or wrong token is a **403** with `"CSRF Failed: ..."`. `GET` needs no
CSRF.

**Content-Type.** The two form endpoints (`POST new/`, `PATCH <id>/`) accept
**`multipart/form-data`**, `application/x-www-form-urlencoded` *and*
`application/json`. Use multipart whenever you send a file — audio or cover art.
**Create is always multipart** (audio is mandatory, and a file cannot travel as
JSON). JSON works on `PATCH <id>/` for a text-only edit — verified: renaming a
track via JSON returns `200`. The two toggle endpoints take JSON.

**Permissions.** Every endpoint needs `rbac.access_admin_portal` plus a model
permission:

| Endpoint | Model permission |
|---|---|
| `GET` list / detail | `song.view_song` |
| `POST new/` | `song.add_song` |
| `PATCH <id>/` | `song.change_song` |
| `PATCH <id>/status/` | `song.change_song` |
| `PATCH <id>/home-screen/` | `song.change_song` |
| `DELETE <id>/` | `song.delete_song` |

By role:

| | Admin | Manager | App Manager | Reports Manager | Counter | Store | Poojari |
|---|---|---|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Add / edit / delete | ✅ | ✅ | ✅ | — | — | — | — |

**Note this differs from the Agent code screen.** There, App Manager is
read-only; here they are a full writer — Media is their screen. Verified live:
App Manager gets `200` on the list and `201` on create. Gate your *Add track*,
*Edit* and *Delete* controls on `song.add_song` / `change_song` / `delete_song`
rather than on a role name.

**Two auth failures, two bodies** — the same on all seven:

```jsonc
// 403 — not signed in
{ "detail": "Authentication credentials were not provided." }

// 403 — signed in, lacks the permission
{ "detail": "You do not have permission to perform this action." }
```

Both are **403**, not 401 — an unauthenticated request does not get a 401 here,
so branch on the `detail` string rather than the status code.

**Datetimes.** `uploaded_at` is UTC, `Z`-suffixed. There are no local-offset
dates on this screen (unlike Agent codes).

---

## 1. List the tracks

- **Name / purpose:** The Media table and the three tiles above it
  (`10 tracks`, `8 Active`, `2 Inactive`).
- **Method + path:** `GET /api/admin/media/`
- **Headers:** session cookie. No CSRF, no Content-Type.
- **Path / query params:**

| Param | Values | Notes |
|---|---|---|
| `search` | any string | Case-insensitive partial match on **title or artist** — the two lines the TRACK column prints. Searching `subbulakshmi` returns all three of her tracks. |
| `status` | `active`, `inactive` | The *All statuses* dropdown and the tile click-through. |
| `home_screen` | `featured`, `regular` | The *All tracks* dropdown. `featured` is what the HOME SCREEN column prints. |
| `ordering` | `track`, `artist`, `home_screen`, `plays`, `status`, `uploaded_at` | Prefix `-` for descending. Defaults to alphabetical by title. |
| `page` | integer ≥ 1 | Defaults to 1. |
| `page_size` | integer 1–100 | Defaults to **20**. |

`ordering=track` sorts by title — the artist underneath is a subtitle, not a
second sort key. `ordering=status` puts Active first ascending, matching the way
the two printed words read.

- **Request body:** none.
- **Success response — `200 OK`:**

```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Aditya Hridayam",
      "artist": "Ghantasala",
      "cover_url": null,
      "home_screen": false,
      "play_count": 3980,
      "status": "active",
      "uploaded_at": "2026-09-08T07:59:10.644275Z"
    }
  ],
  "summary": { "total": 10, "active": 8, "inactive": 2 }
}
```

Rendering the row: `home_screen: true` is the **`Featured`** the HOME SCREEN
column prints; `false` prints the em dash. `cover_url` is `null` when no art has
been uploaded — render the letter-tile fallback the screen already uses.

**`play_count` is exact, and the API will never round it.** The table shows
`4.0K` for `3980` and `56K` for `56000`; that rounding is yours to do. The detail
page prints the full figure (`3,980`) off the same field.

- **The tiles.** `summary` is counted over `search` and `home_screen` but
  **deliberately not over `status`** — a tile *is* how that filter is applied, so
  counting it into its own total would zero the other two on the first click.
  This is why `8 + 2 = 10` on the unfiltered screen, and why `?status=inactive`
  still answers `{"total": 10, "active": 8, "inactive": 2}` while returning 2
  rows. Render the tiles from `summary`, never from `results.length`.

- **Error responses:**

```jsonc
// 400 — unknown ?status=
{ "status": "Expected one of active, inactive." }

// 400 — unknown ?home_screen=
{ "home_screen": "Expected one of featured, regular." }

// 400 — unknown ?ordering=
{ "ordering": "Expected one of artist, home_screen, plays, status, track, uploaded_at." }

// 404 — ?page= past the end
{ "detail": "Invalid page." }
```

These filter errors are a **flat `{field: string}`**, not the DRF
`{field: [string]}` list shape the write endpoints use. Handle both.

- **Pagination:** `PageNumberPagination` — `count`, `next`, `previous`,
  `results`, page size 20, `?page_size=` up to 100. `next`/`previous` are
  absolute URLs carrying the other query params forward, e.g.
  `.../media/?ordering=-plays&page=2&page_size=3`. `summary` sits **beside**
  `results` and is the same on every page.

---

## 2. Add a track

- **Name / purpose:** The *Add track* → *Save track* button. Audio, cover art
  and both switches in one request.
- **Method + path:** `POST /api/admin/media/new/`
- **Headers:**
  - Auth: session cookie
  - CSRF: `X-CSRFToken` — **required**
  - Content-Type: `multipart/form-data` — **required in practice**: `audio_file`
    is mandatory on create and a file cannot be sent as JSON, so a JSON POST
    always fails with `{"audio_file": ["No file was submitted."]}`
- **Path / query params:** none.
- **Request body:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string, ≤255 | **yes** | Trimmed. Blank is rejected. |
| `artist` | string, ≤255 | **yes** | Required by the API even though the form does not mark it with an asterisk — see the warning below. |
| `audio_file` | file | **yes** | See the accepted formats below. |
| `cover` | image file | no | The *Cover image* / player art. |
| `home_cover` | image file | no | Artwork used when the track is featured on the home screen. |
| `home_screen` | boolean | no | The *Add to app home screen* switch. Defaults to `false`. |
| `status` | `active` \| `inactive` | no | Defaults to `active` — something just uploaded is meant to be heard. |

**⚠️ `artist` is required by the API but is not starred in the UI.** The form
marks only *Title* and *Audio file* with a red asterisk, yet a POST without
`artist` fails with `{"artist": ["This field is required."]}`. Either mark the
field required in the form, or send `artist: ""`— note that an *empty string* is
also rejected (`"This field may not be blank."`), so the field genuinely has to
be filled in. This is the most likely cause of a "Save track" that silently
fails for a user who left the artist blank.

**⚠️ The audio limits in the UI do not match the backend.** The form says
*".mp3 or .wav, up to 20 MB"*. The API actually accepts **`.mp3`, `.wav`,
`.ogg`, `.m4a`, `.flac`** up to **50 MB** — verified live: a `.flac` upload
returns `201`. If the frontend enforces the stricter 20 MB / two-format rule
client-side, it is rejecting files the backend would have taken. Align the
helper text with the real limits, or keep the stricter rule deliberately and
know it is a frontend policy, not a server constraint.

- **Success response — `201 Created`:** the **full detail shape** (§4), so you
  can route straight to the track's page with what comes back.

```json
{
  "id": 12,
  "title": "Shiva Tandava",
  "artist": "Shankar Mahadevan",
  "cover_url": "https://cdn.test/c.png",
  "home_screen": true,
  "play_count": 0,
  "status": "inactive",
  "uploaded_at": "2026-09-08T07:59:10.954884Z",
  "audio_filename": "tandava.mp3",
  "home_cover_url": "https://cdn.test/c.png",
  "duration": 300.0
}
```

`duration` is read off the upload, not asked for — a duration typed by hand is
one that will eventually be wrong.

- **Error responses — all `400 Bad Request`:**

```jsonc
// required fields missing
{
  "title": ["This field is required."],
  "audio_file": ["No file was submitted."]
}

// artist omitted
{ "artist": ["This field is required."] }

// title present but blank/whitespace
{ "title": ["This field may not be blank."] }

// not an audio file
{ "audio_file": ["`.txt` is not an audio file. Upload one of .flac, .m4a, .mp3, .ogg, .wav."] }

// over the size limit
{ "audio_file": ["That file is 50MB. The limit is 50MB."] }

// status not one of the two
{ "status": ["\"archived\" is not a valid choice."] }
```

Every field error here is a **list of strings**, so `errors.title[0]` is safe.

(The oversize message reads oddly — "That file is 50MB. The limit is 50MB." —
because the size is floor-divided into whole megabytes. It is correct, just
unhelpful at the boundary; consider showing your own copy for this one case.)

- **Pagination:** n/a.

---

## 3. Edit a track

- **Name / purpose:** The *Edit* → *Save track* button. Partial update; every
  field is optional.
- **Method + path:** `PATCH /api/admin/media/<id>/`
- **Headers:** session cookie; `X-CSRFToken` **required**;
  `multipart/form-data` when sending a file, `application/json` otherwise.
- **Path params:** `id` — integer.
- **Request body:** the same seven fields as §2, all optional.

```json
{ "title": "Nirvana Shatakam (Renamed)" }
```

**Sending `audio_file` replaces the audio** — the old file is deleted from the
CDN and `audio_filename` and `duration` are updated from the new upload.
Omitting it leaves the existing audio alone, so renaming a track does not mean
re-uploading it.

**`cover` and `home_cover`: `null` clears, absent leaves alone.** Sending an
explicit `null` is how the form's remove button works; omitting the key entirely
keeps the current image. Same for every other field.

- **Success response — `200 OK`:** the full detail shape (§4), reflecting the
  edit. Verified live: after `PATCH {"audio_file": <new-take.mp3>}`,
  `audio_filename` becomes `"new-take.mp3"` and `duration` updates to the new
  file's length.

- **Error responses:** all the §2 field errors apply, plus:

```jsonc
// 404
{ "detail": "Track not found." }
```

- **Pagination:** n/a.

---

## 4. Get one track

- **Name / purpose:** The track's own page — the header card, the two switches,
  the play count and the delete card.
- **Method + path:** `GET /api/admin/media/<id>/`
- **Headers:** session cookie. No CSRF, no Content-Type.
- **Path params:** `id` — integer.
- **Query params:** none.
- **Request body:** none.
- **Success response — `200 OK`:**

```json
{
  "id": 1,
  "title": "Aditya Hridayam",
  "artist": "Ghantasala",
  "cover_url": null,
  "home_screen": false,
  "play_count": 3980,
  "status": "active",
  "uploaded_at": "2026-09-08T07:59:10.644275Z",
  "audio_filename": "aditya-hridayam.mp3",
  "home_cover_url": null,
  "duration": 421.0
}
```

Everything in the list row (§1), plus:

| Field | Notes |
|---|---|
| `audio_filename` | What the AUDIO FILE chip prints — the name of the file that was uploaded. Not the CDN's own identifier, which carries a folder and a generated suffix. `null` if unknown. |
| `home_cover_url` | The home-screen artwork. `null` when none. |
| `duration` | **Seconds, as a float** (`421.0`). Format as `MM:SS` client-side. `null` when unknown. |

Note there is **no nested usage list** on this screen and no delete guard: the
detail payload is flat and small, so it stays cheap however many plays a track
has.

- **Error responses:**

```jsonc
// 404
{ "detail": "Track not found." }
```

- **Pagination:** n/a.

---

## 5. Toggle status

- **Name / purpose:** The switch in the STATUS column. Writes `is_active` and
  nothing else.
- **Method + path:** `PATCH /api/admin/media/<id>/status/`
- **Headers:** session cookie; `X-CSRFToken` **required**;
  `Content-Type: application/json`.
- **Path params:** `id` — integer.
- **Request body:**

```json
{ "status": "inactive" }
```

`status` is required and must be `active` or `inactive`. Use this rather than
`PATCH <id>/` so a switch on a list screen cannot send a stale copy of every
other field back with it.

- **Success response — `200 OK`:** the **list row** shape (§1), not the detail —
  no `audio_filename`, `home_cover_url` or `duration`. Splice it straight into
  the table row.

```json
{
  "id": 11,
  "title": "Nirvana Shatakam (Renamed)",
  "artist": "Uma Mohan",
  "cover_url": null,
  "home_screen": false,
  "play_count": 0,
  "status": "inactive",
  "uploaded_at": "2026-09-08T07:59:10.811694Z"
}
```

The response carries no `summary`, so the tiles are **not** updated by this call
— adjust the two counts locally, or refetch the list.

Setting the status it already has is a no-op that still returns `200`.
**Switching a track off withholds it from the devotee app immediately** and does
nothing else: it stays in the library, keeps its plays, and keeps whether it was
featured, so switching it back on restores exactly the track that was withdrawn.

- **Error responses:**

```jsonc
// 400 — not one of the two
{ "status": ["\"archived\" is not a valid choice."] }

// 400 — field omitted
{ "status": ["This field is required."] }

// 404
{ "detail": "Track not found." }
```

- **Pagination:** n/a.

---

## 6. Toggle home screen

- **Name / purpose:** The *Add to app home screen* switch. Writes `is_home` and
  nothing else.
- **Method + path:** `PATCH /api/admin/media/<id>/home-screen/`
- **Headers:** session cookie; `X-CSRFToken` **required**;
  `Content-Type: application/json`.
- **Path params:** `id` — integer.
- **Request body:**

```json
{ "home_screen": true }
```

`home_screen` is a required boolean.

- **Success response — `200 OK`:** the list row shape (§1), same as §5.

**Featuring a track that is switched off is allowed** and does nothing visible —
the app's home screen reads the same active filter as the rest of its library.
It is deliberately not an error, so a track can be prepared before it goes live.
Do not block the switch in the UI on `status`.

- **Error responses:**

```jsonc
// 400 — field omitted
{ "home_screen": ["This field is required."] }

// 404
{ "detail": "Track not found." }
```

- **Pagination:** n/a.

---

## 7. Delete a track

- **Name / purpose:** The *Delete track* card at the bottom of the detail page.
- **Method + path:** `DELETE /api/admin/media/<id>/`
- **Headers:** session cookie; `X-CSRFToken` **required**. No Content-Type.
- **Path params:** `id` — integer.
- **Request body:** none.
- **Success response — `204 No Content`, empty body.** Do not attempt to parse
  JSON from it.
- **Error responses:**

```jsonc
// 404 — no such track, or already deleted
{ "detail": "Track not found." }
```

**There is no guard and no undo.** Unlike the Agent code screen — where a used
code cannot be deleted — a track is not evidence: nobody paid for it, no receipt
refers to it, and the only thing lost is the play count. The delete is real, and
it takes the audio and both images off the CDN with it. There is no `deletable`
flag on the detail payload because deleting is always allowed.

So **confirm destructively in the UI**, and point the admin at the STATUS toggle
instead: a track that is merely finished with should be switched to `inactive`,
which stops the app serving it and keeps its history.

- **Pagination:** n/a.

---

## 8. Field reference

**Row** (list, and both toggle responses):

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `title` | string | |
| `artist` | string | |
| `cover_url` | string \| `null` | Player art. `null` → render the letter tile. |
| `home_screen` | bool | `true` prints `Featured`. |
| `play_count` | int | Exact. The table rounds; the API does not. |
| `status` | `active` \| `inactive` | |
| `uploaded_at` | ISO datetime (UTC, `Z`) | |

**Detail** = Row + `audio_filename` (string \| `null`), `home_cover_url`
(string \| `null`), `duration` (float seconds \| `null`).

### `status` vs `home_screen` — the one thing to get right

They are independent, and the API enforces neither against the other:

- `status` answers **"is it in the app at all"**. Inactive withholds the track
  from the devotee app entirely.
- `home_screen` answers **"does it lead the app's home screen"**, among the
  tracks that are already live.

A track can be featured *and* inactive — that combination is legal, means "ready
but not yet live", and shows nothing to devotees. Never derive one switch from
the other, and never disable the home-screen switch because a track is inactive.

---

## 9. What the devotee app sees

Not part of this screen, but worth knowing, because it is what the STATUS toggle
actually controls. The app reads `GET /api/song/songs/` — a *different* endpoint
with a different shape:

```jsonc
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": {
    "songs": [
      {
        "id": 1,
        "title": "Live One",
        "artist": "A",
        "stream_url": "https://res.cloudinary.com/.../ac_mp3,br_128k/v1/songs/live.mp3",
        "duration": "00:10",          // "MM:SS" here, float seconds on the admin API
        "uploaded_at": "2026-09-08T08:01:18.334846+00:00",
        "media": null,
        "home_media": null,
        "is_home": false,
        "is_active": true,
        "play_count": 0
      }
    ]
  }
}
```

Three differences that matter:

1. **`results` is an object wrapping a `songs` array**, not an array. A client
   written against the admin list's `results: [...]` will break here.
2. **Inactive tracks are invisible.** Verified live: with 4 tracks in the
   library and one switched off, the app list returned 3, and `GET
   /api/song/songs/<inactive id>/` returned **404**. That is the STATUS toggle
   doing its job.
3. **Every row carries a signed, expiring `stream_url`.** The admin list
   deliberately does not — signing twenty URLs it will never play would be waste.

`POST /api/song/songs/<id>/play/` is what writes `play_count`: it returns
**`204 No Content`** and increments the counter (verified: 0 → 1). It is called
when playback *starts*, so the PLAYS column answers "how often is this reached
for", not "how often was it heard to the end". Nothing on the admin screen
writes this field.

---

## 10. Verification

Every status code, response body and error body in this document was captured
from a live run on 2026-09-08. Read paths were exercised against the running
backend; the write paths (create with and without cover art, edit, audio
replacement, both toggles, delete) ran against an isolated test database with
the ten tracks from the screenshot rebuilt in it, so no production rows or CDN
files were touched. Cloudinary and Bunny were patched out, the way the existing
suite does it.

The screen's regression suite passes:

```bash
TEST_DB_NAME=test_temple_<yourname> python manage.py test temple_admin.test_media
```

**31/31.** Use your own `TEST_DB_NAME` so two sessions do not collide over
`test_temple`.

Three things to carry into the frontend work:

1. **`artist` is required by the API but unstarred in the form** (§2) — the most
   likely cause of a failing save.
2. **The audio limits in the helper text are stricter than the server's** (§2) —
   `.ogg`, `.m4a` and `.flac` are accepted, and the ceiling is 50 MB, not 20.
3. **Delete has no guard and no undo** (§7) — unlike Agent codes.
