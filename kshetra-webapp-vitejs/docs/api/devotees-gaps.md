# Devotees — integration gaps

What the Devotees screen was designed to do that `/api/admin/devotees/` does not
support, what was cut to wire it to the real endpoint, and what is left open.

Verified against `templeapp_backend/temple_project` on 18 Aug 2026:
`temple_admin/devotee_views.py`, `temple_admin/urls.py`, `rbac/permission_map.py`
(lines 323-348), `rbac/module_map.py` (line 549), `rbac/roles.py`,
`temple_user/views.py`. See [devotees.md](devotees.md) for the contract itself.

**Contents**

1. [Capabilities cut from the screen](#1-capabilities-cut-from-the-screen)
2. [Behaviour the API changed](#2-behaviour-the-api-changed)
3. [Not yet built](#3-not-yet-built)
4. [Settled — no gap](#4-settled--no-gap)

---

## 1. Capabilities cut from the screen

Three controls in the DC prototype have no endpoint behind them. All three are
removed rather than left disabled: a disabled control implies the capability is
coming, and for two of the three it deliberately is not.

### Edit contact details — **cut, needs a backend decision**

`Edit details` on the detail header wrote `phone` and `email` in local state.
There is no admin write path for either. The only endpoint that touches a
devotee's own record is `PATCH /api/admin/devotees/<id>/status/`, whose
serializer (`DevoteeStatusSerializer`) accepts `status` and nothing else.

This is the one cut that is a **real capability loss** versus the design, and
the only item here worth taking to backend. Everything else in this section is
working as intended.

### Edit / add / remove family members — **cut, correctly**

The prototype's family editor wrote `UserList` rows. `temple_user/views.py:251`
`UserListViewSet` is self-scoped in two places:

```python
def get_queryset(self):
    return UserList.objects.filter(user=self.request.user)

def perform_update(self, serializer):
    if serializer.instance.user != self.request.user:
        raise PermissionDenied("You can only update your own lists")
```

An admin cannot reach another account's family profiles through it at all. These
are the devotee's own records, maintained from the app's family screen. The card
is now read-only, and gained what the API does carry and the prototype did not:
`is_self`, `dob`, and `nakshatrams` as a list rather than one string.

### Delete account — **cut, correctly**

No `DELETE` route, and no `delete` capability on the `devotees` module in
`rbac/module_map.py`. Suspension exists precisely so a delete does not: a devotee
who paid at the counter has to stay attributable afterwards.

The prototype's lifecycle card enabled Delete only when the account had no
orders, and explained itself in a note. That note now explains the absence
instead, which is the honest version — the constraint is not "no orders yet", it
is that accounts are never deleted.

---

## 2. Behaviour the API changed

Not gaps — places where the wired screen behaves differently from the mock, on
purpose. Recorded because each one looks like a regression from the prototype.

| | Prototype | Wired |
|---|---|---|
| Search, status, sort, paging | Client-side over the loaded fixture | Server-side. The list is paged, so filtering loaded rows would report one page's matches as the whole screen |
| Tiles | Recomputed from the filtered rows | The server's `summary`, counted over the search but **not** the status filter — which is what keeps a tile a way *back* to the other two |
| Zero-count tile | Hidden when no row had that status | Always shown. The server always returns all three, and a missing Suspended tile reads as "not loaded" rather than "none" |
| FAMILY / BOOKINGS columns | `family.length` / `bookings.length` | `family_count` / `booking_count`. The list row carries the figures, not the records — that is what makes them sortable |
| Booking history | One table, `type: Pooja \| Store` | Two lists. `recent_bookings` and `recent_orders` are different records with different columns, and the API sends them separately |

### The two booking figures disagree, legitimately

`booking_count` (the BOOKINGS column) excludes cancelled and refunded lines.
`recent_bookings` (the detail list) includes them. The count answers *how much
have they booked*; the list answers *what has happened on this account*.

The history card captions this rather than reconciling it. If it ever reads as a
bug to an operator, the fix is wording, not arithmetic.

---

## 3. Not yet built

### Cross-links into the detail

The open account is in the URL as `?devotee=<id>`, so a detail is linkable from
anywhere. Nothing links to it yet. Two surfaces already hold the id:

- **Pooja Orders** detail — `OrderCustomer.id` (`shared/order-feed/domain/order-feed.ts:57`)
- **Store Orders** detail — the same shared type

Both are `null` on a counter walk-in, which is the correct render: a walk-in has
no account to link to.

### Links *out* of the detail

`DevoteeDetailPanel` takes `onOpenPoojaOrder` / `onOpenShopOrder`, and the screen
does not pass them — so the rows in Recent activity are inert. Wiring them means
routing to the order screens with a detail pre-opened, which those screens do not
currently accept from the URL.

### Pooja Bookings has no devotee id

The bookings feed's `booked_by` carries `{ name, phone_number, staff_name }` and
no id, so the bookings drawer cannot link to a devotee without a backend change.
A phone-search deep link would work, but matches more than one account.

### Dashboard tile

A devotees total/active/suspended tile is one call to the same `summary`, and
Reports Manager can already read it. Deliberately left out — it is a new surface,
not part of wiring this screen.

---

## 4. Settled — no gap

Checked and found consistent; recorded so they are not re-investigated.

- **All three endpoints exist and are tested.** `DevoteeListView`,
  `DevoteeDetailView`, `DevoteeStatusView`, routed in `temple_admin/urls.py`,
  mounted at `api/admin/` by `temple_project/urls.py:34`, with 57 tests in
  `temple_admin/test_devotees.py`.
- **Permission codenames match.** `rbac/constants.py` has `APP_LABEL = "rbac"`,
  so the console's `rbac.view_devotees` / `rbac.manage_devotees` are literal.
- **The nav gate matches the module map's `read` capability** — all four of
  `view_devotees`, `view_customuser`, `view_userlist`, `view_userattribute`.
  `view_userattribute` is one the list view alone does not need, but granting
  `read` without it would open a table whose rows 403 when clicked.
  `rbac.access_admin_portal` is required by all three views and is not restated
  in `nav.ts`, because every console route already implies it.
- **Reports Manager reads but cannot suspend.** `rbac/roles.py:292` grants
  `VIEW_DEVOTEES` and withholds `MANAGE_DEVOTEES`; the lifecycle card renders its
  button only under `can(PERMISSIONS.manageDevotees)`.
- **The status call is idempotent** (`if devotee.is_active != active`) and
  returns the row in table shape, re-read through the annotated queryset.
- **A staff or poojari id is a 404**, not a served row — the queryset filters
  `role=ROLE_TEMPLE_USER`.
