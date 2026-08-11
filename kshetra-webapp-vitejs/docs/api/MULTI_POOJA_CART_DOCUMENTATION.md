# Multi-Pooja Cart System - Comprehensive Documentation

## Overview

The booking system supports adding multiple poojas (both normal and special) to a cart before checkout. Users can book different poojas for different dates and multiple user lists in a single transaction.

All three key responses — **View Cart**, **Checkout**, and **View Orders** — share the same grouped `poojas[]` structure: items with the same pooja are collapsed into one entry with a `dates[]` list inside. Different poojas remain as separate entries.

### Key Features

- **Multi-Item Cart**: Add multiple poojas to cart before checkout
- **Multi-Date Booking**: Add a single pooja for multiple dates in one request using `selected_dates` / `special_pooja_date_ids`
- **Grouped Responses**: Cart, Checkout and Orders all return data grouped by pooja → dates → users
- **Order Grouping**: Multiple orders created per checkout, linked by `order_group_id`
- **Agent Code at Checkout**: Places order as COD (no discount, real prices retained)
- **Online/Offline Pricing**: `status=false` → `online_price`; `status=true` → `offline_price`
- **Duplicate Prevention**: Cannot add same pooja+date+user_list combination twice
- **Single Payment**: One Razorpay payment for all orders in a group
- **COD Support**: Cash on Delivery for agent code bookings

---

## Database Schema

### PoojaCheckout (Cart Container)
```
id, user, status (True=Active / False=Completed), applied_agent_code, created_at
```

### PoojaCheckoutLine (Cart Items)
```
id, checkout, pooja, special_pooja_date, selected_date, user_list, user_attribute,
status (False = online_price, True = offline_price)
```

### PoojaOrder (Created after Checkout)
```
id, user, status, pooja_status, poojari, total, additional_charges, payment_method,
order_group_id, is_primary_order, group_razorpay_order_id,
applied_agent_code, razorpay_order_id, razorpay_payment_id, razorpay_signature,
refund_amount, refund_status, razorpay_refund_id, refund_reason, created_at, modified_at
```

### PoojaOrderLine (Order Items)
```
id, order, pooja, special_pooja_date, selected_date, user_list, user_attribute,
counter_person_name, counter_person_nakshatram, counter_line_group, remarks,
price, status (confirmed / cancelled / refunded),
pooja_status (pending / completed / cancelled),
poojari, assigned_by, assigned_at, complete_by, completed_by, completed_at
```

A line is one **booking** — one pooja, for one person, on one date — and it is
the unit the temple actually performs, so it carries its own execution state:

* `status` is the **money** (confirmed / cancelled / refunded);
  `pooja_status` is the **work** (pending / completed / cancelled).
* `poojari` is assigned per booking, not per order. Two poojas in the same
  order routinely belong to two different poojaris.
* `PoojaOrder.pooja_status` and `PoojaOrder.poojari` still exist, but both are
  now **roll-ups** of the lines: the order reads `completed` only when every
  booking standing on it does, and names a poojari only when they all agree.

The back office reads and writes these through
[`/api/admin/bookings/`](../docs/api/pooja-bookings.md).

### Pooja Model (Pricing)
```
id, name, category, online_price (DecimalField), offline_price (DecimalField),
special_pooja, media_url, ...
```

### SpecialPoojaDate Model (Pricing Override)
```
id, pooja, date, time, online_price (DecimalField, nullable),
offline_price (DecimalField, nullable), ...
```

---

## Pricing Logic

### Online vs Offline Pricing

Each Pooja has two price fields:
- `online_price` — used when `status=false` (online booking)
- `offline_price` — used when `status=true` (at-temple/offline booking)

SpecialPoojaDate can optionally override both prices. If a special date's price is null, the base pooja price is used.

### Effective Price Calculation

```python
def get_effective_price(pooja, special_pooja_date=None, is_offline=False):
    if pooja.special_pooja and special_pooja_date:
        if is_offline and special_pooja_date.offline_price:
            return special_pooja_date.offline_price
        if not is_offline and special_pooja_date.online_price:
            return special_pooja_date.online_price
    return pooja.offline_price if is_offline else pooja.online_price
```

Agent code does NOT affect pricing — it only changes the payment method to COD. Real prices are always retained.

---

## Shared Response Shape — `poojas[]`

All three endpoints (cart, checkout, orders) return data using the same `poojas[]` structure. Same-pooja items are merged into a single entry; different poojas are separate entries.

```
poojas: [
  {
    pooja: { id, name, online_price, offline_price, special_pooja, media_url, category* },
    pooja_total: "...",
    dates: [
      {
        selected_date: "YYYY-MM-DD" | null,
        special_pooja_date: { id, date, time, online_price, offline_price } | null,

        # cart extras:
        date_total: "...",

        # order/checkout extras:
        order_id: ...,
        order_status: "...",
        pooja_status: "...",
        order_total: "...",
        additional_charges: "...",

        users: [
          {
            # cart:
            cart_line_id: ...,
            effective_price: "...",
            status: bool,

            # order/checkout:
            order_line_id: ...,
            price: "...",
            line_status: "...",

            # both:
            user_list: { id, name },
            user_attribute: { id, nakshatram: { id, name } } | null
          }
        ]
      }
    ]
  }
]
```

> `category` is included in the `pooja` object for cart responses only.

---

## API Endpoints

### 1. View Cart

**`GET /api/booking/cart/`**

Returns the active cart grouped by pooja → dates → users.

**Response**:
```json
{
    "total_items": 6,
    "total_amount": "3000.00",
    "poojas": [
        {
            "pooja": {
                "id": 45,
                "name": "Ganapathi Pooja",
                "online_price": "500.00",
                "offline_price": "450.00",
                "special_pooja": false,
                "media_url": "https://cdn.example.com/ganapathi.jpg",
                "category": {"id": 2, "name": "Daily Poojas"}
            },
            "pooja_total": "2000.00",
            "dates": [
                {
                    "selected_date": "2026-03-01",
                    "special_pooja_date": null,
                    "date_total": "1000.00",
                    "users": [
                        {
                            "cart_line_id": 123,
                            "user_list": {"id": 10, "name": "John Doe"},
                            "user_attribute": {
                                "id": 15,
                                "nakshatram": {"id": 3, "name": "Ashwini"}
                            },
                            "status": false,
                            "effective_price": "500.00"
                        },
                        {
                            "cart_line_id": 124,
                            "user_list": {"id": 11, "name": "Jane Smith"},
                            "user_attribute": {
                                "id": 16,
                                "nakshatram": {"id": 5, "name": "Rohini"}
                            },
                            "status": false,
                            "effective_price": "500.00"
                        }
                    ]
                },
                {
                    "selected_date": "2026-03-08",
                    "special_pooja_date": null,
                    "date_total": "1000.00",
                    "users": [
                        {
                            "cart_line_id": 125,
                            "user_list": {"id": 10, "name": "John Doe"},
                            "user_attribute": {"id": 15, "nakshatram": {"id": 3, "name": "Ashwini"}},
                            "status": false,
                            "effective_price": "500.00"
                        },
                        {
                            "cart_line_id": 126,
                            "user_list": {"id": 11, "name": "Jane Smith"},
                            "user_attribute": {"id": 16, "nakshatram": {"id": 5, "name": "Rohini"}},
                            "status": false,
                            "effective_price": "500.00"
                        }
                    ]
                }
            ]
        },
        {
            "pooja": {
                "id": 46,
                "name": "Vishnu Pooja",
                "online_price": "600.00",
                "offline_price": "550.00",
                "special_pooja": false,
                "media_url": "https://cdn.example.com/vishnu.jpg",
                "category": {"id": 2, "name": "Daily Poojas"}
            },
            "pooja_total": "1100.00",
            "dates": [
                {
                    "selected_date": "2026-03-01",
                    "special_pooja_date": null,
                    "date_total": "1100.00",
                    "users": [...]
                }
            ]
        }
    ]
}
```

**Empty Cart Response**:
```json
{
    "total_items": 0,
    "total_amount": "0.00",
    "poojas": []
}
```

---

### 2. Add Items to Cart

**`POST /api/booking/cart/`**

Adds a single pooja for one or more users across one or more dates. The same `user_list_ids` are applied to every date — each (date × user_list) combination becomes a separate cart line internally.

#### Fields

| Field | Type | When required | Notes |
|---|---|---|---|
| `pooja_id` | Integer | Always | Must be an active pooja |
| `user_list_ids` | List[Integer] | Always | Applied to every date supplied |
| `selected_date` | String (YYYY-MM-DD) | Regular pooja, single date | Legacy single-date format |
| `selected_dates` | List[String] | Regular pooja, multi-date | e.g. `["2026-03-01","2026-03-08"]` |
| `special_pooja_date_id` | Integer | Special pooja, single date | Legacy single-date format |
| `special_pooja_date_ids` | List[Integer] | Special pooja, multi-date | IDs of `SpecialPoojaDate` records |
| `status` | Boolean | Optional (default `false`) | `false` = online_price, `true` = offline_price |

#### Request — Regular Pooja, single date
```json
{
    "pooja_id": 45,
    "user_list_ids": [10, 11],
    "selected_date": "2026-03-01",
    "status": false
}
```

#### Request — Regular Pooja, multiple dates
```json
{
    "pooja_id": 45,
    "user_list_ids": [10, 11],
    "selected_dates": ["2026-03-01", "2026-03-08", "2026-03-15"],
    "status": false
}
```
Creates **6 cart lines** (3 dates × 2 users).

#### Request — Special Pooja, single date
```json
{
    "pooja_id": 67,
    "user_list_ids": [10],
    "special_pooja_date_id": 89,
    "status": true
}
```

#### Request — Special Pooja, multiple dates
```json
{
    "pooja_id": 67,
    "user_list_ids": [10, 11],
    "special_pooja_date_ids": [89, 90, 91],
    "status": true
}
```
Creates **6 cart lines** (3 special dates × 2 users).

#### Success Response
```json
{
    "message": "Added 6 item(s) to cart",
    "created_lines": [
        {
            "id": 123,
            "pooja": 45,
            "pooja_details": {
                "id": 45,
                "name": "Ganapathi Pooja",
                "category": 2,
                "category_name": "Daily Poojas",
                "online_price": "500.00",
                "offline_price": "450.00",
                "status": true,
                "banner_desc": "",
                "card_desc": "",
                "captions_desc": "",
                "special_pooja": false,
                "special_pooja_dates": [],
                "media_url": "https://...",
                "banner_url": "https://..."
            },
            "special_pooja_date": null,
            "special_pooja_date_details": null,
            "selected_date": "2026-03-01",
            "user_list": 10,
            "user_list_details": {
                "id": 10,
                "name": "John Doe",
                "user": 1,
                "attributes": [
                    {
                        "id": 15,
                        "user_list": 10,
                        "nakshatram": 3,
                        "nakshatram_name": "Ashwini"
                    }
                ]
            },
            "status": false,
            "effective_price": "500.00"
        }
    ],
    "skipped_duplicates": [],
    "items_added": 6,
    "total_cart_items": 6
}
```

#### Duplicate Detection Response
```json
{
    "message": "Added 4 item(s) to cart. Skipped 2 duplicate(s)",
    "created_lines": [{...}, {...}, {...}, {...}],
    "skipped_duplicates": ["John Doe (2026-03-01)", "Jane Smith (2026-03-01)"],
    "items_added": 4,
    "total_cart_items": 10
}
```

#### Error Responses

| Scenario | Response |
|---|---|
| Missing `user_list_ids` | `{"error": "user_list_ids is a required field"}` |
| Invalid pooja ID | `{"error": "Invalid pooja ID"}` |
| Cart size exceeded | `{"error": "Cart size limit exceeded. Maximum 50 items allowed."}` |
| Empty dates list | `{"error": "\"selected_dates\" must be a non-empty list"}` |
| Invalid special date ID | `{"error": "Invalid or unavailable special pooja date: 99"}` |

---

### 3. Remove Item from Cart

**`DELETE /api/booking/cart/{cart_line_id}/`**

Removes a single cart line. Use `cart_line_id` from the `users[].cart_line_id` field in the View Cart response.

**Response**: `HTTP 204 No Content`

**Error**: `{"error": "Item not found in cart"}`

---

### 4. Clear Cart

**`DELETE /api/booking/cart/clear/`**

Removes all items from the active cart and clears any applied agent code.

**Response**:
```json
{
    "message": "Cart cleared successfully",
    "items_removed": 6
}
```

---

### 5. Checkout (Create Orders)

**`POST /api/booking/checkout/`**

Processes the cart and creates orders grouped by `(pooja_id, date)`. Returns the same `poojas[]` grouped structure.

**Request — with agent code (COD)**:
```json
{"agent_code": "TEMPLE2024"}
```

**Request — without agent code (Razorpay)**:
```json
{}
```

#### Order Grouping Logic

Cart lines are grouped into separate `PoojaOrder` records by `(pooja_id, date)`. All orders from the same checkout are linked by a shared `order_group_id`.

```
Cart contents:
  Pooja A, Date 2026-03-01, Users [John, Jane]   → Order 101 (2 lines)
  Pooja A, Date 2026-03-08, Users [John, Jane]   → Order 102 (2 lines)
  Pooja B, Date 2026-03-01, Users [John]         → Order 103 (1 line)

All 3 orders linked by order_group_id
Single Razorpay payment for combined total
```

#### Success Response — Razorpay

```json
{
    "order_group_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "payment_method": "razorpay",
    "razorpay_order_id": "order_MXJ9K8L2N3P4Q5",
    "amount": 200000,
    "currency": "INR",
    "key": "rzp_test_xxxxxxxxxx",
    "group_total": "2000.00",
    "group_status": "pending",
    "poojas": [
        {
            "pooja": {
                "id": 45,
                "name": "Ganapathi Pooja",
                "online_price": "500.00",
                "offline_price": "450.00",
                "special_pooja": false,
                "media_url": "https://..."
            },
            "pooja_total": "2000.00",
            "dates": [
                {
                    "order_id": 101,
                    "order_status": "pending",
                    "pooja_status": "pending",
                    "order_total": "1000.00",
                    "additional_charges": "0.00",
                    "selected_date": "2026-03-01",
                    "special_pooja_date": null,
                    "users": [
                        {
                            "order_line_id": 201,
                            "user_list": {"id": 10, "name": "John Doe"},
                            "user_attribute": {"id": 15, "nakshatram": {"id": 3, "name": "Ashwini"}},
                            "price": "500.00",
                            "line_status": "confirmed"
                        },
                        {
                            "order_line_id": 202,
                            "user_list": {"id": 11, "name": "Jane Smith"},
                            "user_attribute": {"id": 16, "nakshatram": {"id": 5, "name": "Rohini"}},
                            "price": "500.00",
                            "line_status": "confirmed"
                        }
                    ]
                },
                {
                    "order_id": 102,
                    "order_status": "pending",
                    "pooja_status": "pending",
                    "order_total": "1000.00",
                    "additional_charges": "0.00",
                    "selected_date": "2026-03-08",
                    "special_pooja_date": null,
                    "users": [...]
                }
            ]
        }
    ]
}
```

#### Success Response — COD (Agent Code)

```json
{
    "message": "Cash on Delivery orders placed successfully!",
    "order_group_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "payment_method": "cod",
    "group_total": "1000.00",
    "group_status": "confirmed",
    "applied_agent_code": {"id": 5, "name": "TEMPLE2024"},
    "poojas": [
        {
            "pooja": {
                "id": 45,
                "name": "Ganapathi Pooja",
                "online_price": "500.00",
                "offline_price": "450.00",
                "special_pooja": false,
                "media_url": "https://..."
            },
            "pooja_total": "1000.00",
            "dates": [
                {
                    "order_id": 101,
                    "order_status": "confirmed",
                    "pooja_status": "pending",
                    "order_total": "500.00",
                    "additional_charges": "0.00",
                    "selected_date": "2026-03-01",
                    "special_pooja_date": null,
                    "users": [
                        {
                            "order_line_id": 201,
                            "user_list": {"id": 10, "name": "John Doe"},
                            "user_attribute": {"id": 15, "nakshatram": {"id": 3, "name": "Ashwini"}},
                            "price": "500.00",
                            "line_status": "confirmed"
                        }
                    ]
                },
                {
                    "order_id": 102,
                    "order_status": "confirmed",
                    "pooja_status": "pending",
                    "order_total": "500.00",
                    "additional_charges": "0.00",
                    "selected_date": "2026-03-08",
                    "special_pooja_date": null,
                    "users": [...]
                }
            ]
        }
    ]
}
```

#### Checkout Error Responses

| Scenario | Response |
|---|---|
| Cart is empty | `{"error": "Cart is empty"}` |
| No active cart | `{"error": "No active cart found for the user"}` |
| Invalid agent code | `{"error": "Invalid or inactive agent code"}` |

---

### 6. Verify Payment

**`POST /api/booking/verify-payment/`**

Verifies Razorpay payment signature and confirms all orders in the group. Clears the cart on success.

**Request**:
```json
{
    "razorpay_order_id": "order_MXJ9K8L2N3P4Q5",
    "razorpay_payment_id": "pay_N1O2P3Q4R5S6T7",
    "razorpay_signature": "abc123def456..."
}
```

**Success Response**:
```json
{
    "status": "Payment successful and orders confirmed.",
    "order_group_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "orders_confirmed": 3
}
```

**What happens internally**:
1. Razorpay signature verified
2. Primary order located by `razorpay_order_id`
3. All orders in group updated to `status='confirmed'`
4. Cart lines deleted, checkout marked as completed
5. Applied agent code cleared from checkout

**Error Responses**:

| Scenario | HTTP | Response |
|---|---|---|
| Order not found | 404 | `{"error": "Order not found"}` |
| Invalid signature | 400 | `{"error": "<exception message>"}` |

---

### 7. View User Orders

**`GET /api/booking/orders/`**

Returns all orders for the authenticated user, grouped by `order_group_id`. Within each group, orders sharing the same pooja are merged into one `poojas[]` entry with multiple `dates[]`.

**Query Parameters**:
- `filter`: `upcoming` | `completed` | `cancelled` (optional)
- `order_group_id`: filter to a specific group (optional)
- `razorpay_order_id`: filter by Razorpay order ID — matches either `razorpay_order_id` or `group_razorpay_order_id` (optional)

**Response**:
```json
[
    {
        "order_group_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "payment_method": "razorpay",
        "group_total": "2000.00",
        "group_status": "confirmed",
        "razorpay_order_id": "order_MXJ9K8L2N3P4Q5",
        "razorpay_payment_id": "pay_N1O2P3Q4R5S6T7",
        "refund_status": "none",
        "refund_amount": "0.00",
        "applied_agent_code": null,
        "created_at": "2026-02-18T10:30:00Z",
        "poojas": [
            {
                "pooja": {
                    "id": 45,
                    "name": "Ganapathi Pooja",
                    "online_price": "500.00",
                    "offline_price": "450.00",
                    "special_pooja": false,
                    "media_url": "https://..."
                },
                "pooja_total": "2000.00",
                "dates": [
                    {
                        "order_id": 101,
                        "order_status": "confirmed",
                        "pooja_status": "pending",
                        "order_total": "1000.00",
                        "additional_charges": "0.00",
                        "selected_date": "2026-03-01",
                        "special_pooja_date": null,
                        "users": [
                            {
                                "order_line_id": 201,
                                "user_list": {"id": 10, "name": "John Doe"},
                                "user_attribute": {
                                    "id": 15,
                                    "nakshatram": {"id": 3, "name": "Ashwini"}
                                },
                                "price": "500.00",
                                "line_status": "confirmed"
                            },
                            {
                                "order_line_id": 202,
                                "user_list": {"id": 11, "name": "Jane Smith"},
                                "user_attribute": {
                                    "id": 16,
                                    "nakshatram": {"id": 5, "name": "Rohini"}
                                },
                                "price": "500.00",
                                "line_status": "confirmed"
                            }
                        ]
                    },
                    {
                        "order_id": 102,
                        "order_status": "confirmed",
                        "pooja_status": "pending",
                        "order_total": "1000.00",
                        "additional_charges": "0.00",
                        "selected_date": "2026-03-08",
                        "special_pooja_date": null,
                        "users": [...]
                    }
                ]
            }
        ]
    }
]
```

**`group_status` resolution**:
- `pending` if any order in the group is still pending
- `cancelled` if all orders are cancelled
- Otherwise, the primary order's status

---

### 8. Admin — View All Orders

**`GET /api/booking/admin/orders/`** *(Admin only)*

Returns all users' orders using the same grouped `poojas[]` structure as the user orders endpoint, with an additional `user_details` field per group. Supports pagination and filtering.

**Query Parameters**:
- `status`: filter by order status
- `order_group_id`: filter to a specific group (optional)
- `razorpay_order_id`: filter by Razorpay order ID (optional)
- `page` / `page_size`: pagination (default page_size=10)

**Response** (each group entry includes):
```json
{
    "order_group_id": "...",
    "payment_method": "razorpay",
    "group_total": "2000.00",
    "group_status": "confirmed",
    "razorpay_order_id": "...",
    "razorpay_payment_id": "...",
    "refund_status": "none",
    "refund_amount": "0.00",
    "applied_agent_code": null,
    "user_details": {
        "id": 1,
        "email": "user@example.com",
        "phone_number": "+919876543210"
    },
    "created_at": "2026-02-18T10:30:00Z",
    "poojas": [...]
}
```

---

### 9. Agent Code Management

#### List Agent Codes — `GET /api/booking/agent-codes/`

**Query Parameters**: `status` (`active` / `inactive` / `expired`), `name` (search)

```json
{
    "count": 1,
    "results": [
        {
            "id": 5,
            "name": "TEMPLE2024",
            "purpose": "New Year Special",
            "validity": "2026-12-31T23:59:59Z",
            "status": "active",
            "created_at": "2026-01-01T00:00:00Z"
        }
    ]
}
```

#### Create Agent Code — `POST /api/booking/agent-codes/`

```json
{
    "name": "TEMPLE2024",
    "purpose": "New Year Special",
    "validity": "2026-12-31T23:59:59Z",
    "status": "active"
}
```

---

## Complete Workflow Examples

### Scenario 1: Same Pooja, Multiple Dates (Multi-Date Booking)

**Step 1**: Add one pooja for 3 dates in a single request
```http
POST /api/booking/cart/
{
    "pooja_id": 45,
    "user_list_ids": [10, 11],
    "selected_dates": ["2026-03-01", "2026-03-08", "2026-03-15"],
    "status": false
}
```
→ Creates **6 cart lines** (3 dates × 2 users)

**Step 2**: View cart — Ganapathi Pooja appears once with 3 dates inside it
```http
GET /api/booking/cart/
```
```json
{
    "total_items": 6,
    "total_amount": "3000.00",
    "poojas": [
        {
            "pooja": {"id": 45, "name": "Ganapathi Pooja", "online_price": "500.00", "offline_price": "450.00", ...},
            "pooja_total": "3000.00",
            "dates": [
                {"selected_date": "2026-03-01", "date_total": "1000.00", "users": [...]},
                {"selected_date": "2026-03-08", "date_total": "1000.00", "users": [...]},
                {"selected_date": "2026-03-15", "date_total": "1000.00", "users": [...]}
            ]
        }
    ]
}
```

**Step 3**: Checkout
```http
POST /api/booking/checkout/
{}
```
→ Creates **3 orders** (one per date), all linked by `order_group_id`. Single Razorpay payment.

**Step 4**: Pay via Razorpay frontend SDK

**Step 5**: Verify payment
```http
POST /api/booking/verify-payment/
{
    "razorpay_order_id": "...",
    "razorpay_payment_id": "...",
    "razorpay_signature": "..."
}
```
→ All 3 orders confirmed, cart cleared

**Step 6**: View orders — Ganapathi Pooja appears once with 3 confirmed dates
```http
GET /api/booking/orders/
```

---

### Scenario 2: Multiple Different Poojas

**Step 1**: Add Pooja A for 2 people (online booking)
```http
POST /api/booking/cart/
{"pooja_id": 45, "user_list_ids": [10, 11], "selected_date": "2026-03-01", "status": false}
```

**Step 2**: Add Pooja B for 1 person (offline/at-temple booking)
```http
POST /api/booking/cart/
{"pooja_id": 46, "user_list_ids": [10], "selected_date": "2026-03-01", "status": true}
```

**Step 3**: Checkout — 2 orders created (one per pooja), linked by `order_group_id`

**Cart / Checkout / Orders** — both poojas appear as **separate entries** in `poojas[]`:
```json
{
    "poojas": [
        {"pooja": {"name": "Ganapathi Pooja"}, "dates": [...]},
        {"pooja": {"name": "Vishnu Pooja"}, "dates": [...]}
    ]
}
```

---

### Scenario 3: Agent Using Agent Code (COD)

**Step 1**: Add poojas to cart (agent code is NOT provided here)
```http
POST /api/booking/cart/
{"pooja_id": 45, "user_list_ids": [10, 11, 12], "selected_dates": ["2026-03-01", "2026-03-08"], "status": true}
```

**Step 2**: Checkout with agent code
```http
POST /api/booking/checkout/
{"agent_code": "TEMPLE2024"}
```
→ Orders immediately confirmed with real prices, payment_method = `cod`

---

## Key Business Rules

### Cart
- Maximum **50 lines** per cart
- Duplicate check: cannot add same `(pooja + date + user_list)` twice — skipped silently and reported in `skipped_duplicates`
- `status=false` → `online_price` is used; `status=true` → `offline_price` is used
- Agent code is applied at **checkout**, not when adding to cart
- Cart persists until checkout completes or is manually cleared

### Orders
- Cart lines grouped by `(pooja_id, date)` → one `PoojaOrder` per group
- All orders from a checkout share one `order_group_id`
- The **primary order** (`is_primary_order=true`) holds the `razorpay_order_id`
- COD orders (`agent_code` provided) are **immediately confirmed** at checkout
- Razorpay orders are confirmed only after successful `POST /verify-payment/`
- Cart is cleared only after payment verification (not at checkout time for Razorpay)

### Agent Code
- Applied at checkout, not during cart add
- Does **NOT** apply any discount — real prices are retained
- Automatically triggers `payment_method='cod'`
- Auto-expires based on `validity` date

### Pricing
- Each pooja has `online_price` and `offline_price`
- `status=false` (online booking) → uses `online_price`
- `status=true` (offline/at-temple booking) → uses `offline_price`
- SpecialPoojaDate can optionally override both prices; if null, base pooja price is used
- `additional_charges` on PoojaOrder is always `0.00` (legacy field retained for compatibility)

---

## Response Field Reference

### `poojas[]` entry (all three endpoints)

| Field | Cart | Checkout | Orders |
|---|---|---|---|
| `pooja.id/name/online_price/offline_price/special_pooja/media_url` | Yes | Yes | Yes |
| `pooja.category` | Yes | — | — |
| `pooja_total` | Yes | Yes | Yes |

### `dates[]` entry

| Field | Cart | Checkout | Orders |
|---|---|---|---|
| `selected_date` / `special_pooja_date` | Yes | Yes | Yes |
| `date_total` | Yes | — | — |
| `order_id` | — | Yes | Yes |
| `order_status` | — | Yes | Yes |
| `pooja_status` | — | Yes | Yes |
| `order_total` | — | Yes | Yes |
| `additional_charges` | — | Yes | Yes |

### `users[]` entry

| Field | Cart | Checkout | Orders |
|---|---|---|---|
| `user_list` / `user_attribute` | Yes | Yes | Yes |
| `cart_line_id` | Yes | — | — |
| `effective_price` | Yes | — | — |
| `status` (bool) | Yes | — | — |
| `order_line_id` | — | Yes | Yes |
| `price` | — | Yes | Yes |
| `line_status` | — | Yes | Yes |

### `special_pooja_date` object

| Field | Description |
|---|---|
| `id` | SpecialPoojaDate ID |
| `date` | Date string |
| `time` | Time string or null |
| `online_price` | Override online price or null |
| `offline_price` | Override offline price or null |

---

## Error Codes Reference

| HTTP | Message | Cause |
|---|---|---|
| 400 | `user_list_ids is a required field` | Missing field in cart add |
| 400 | `Invalid pooja ID` | Pooja not found or inactive |
| 400 | `Cart size limit exceeded. Maximum 50 items allowed.` | Too many lines |
| 400 | `"selected_dates" must be a non-empty list` | Empty dates array |
| 400 | `Invalid or unavailable special pooja date: {id}` | Bad special date ID |
| 400 | `Cart is empty` | Checkout with nothing in cart |
| 400 | `Invalid or inactive agent code` | Bad agent code at checkout |
| 404 | `Item not found in cart` | Invalid `cart_line_id` |
| 404 | `Order not found` | Invalid order during payment verify |
| 400 | `<exception message>` | Razorpay signature mismatch |

---

## Performance Notes

- All three `list` views use `select_related` + `prefetch_related` to avoid N+1 queries
- `_build_cart_poojas_list` and `_build_poojas_list` are pure Python grouping — no extra DB hits
- DB indexes on `PoojaCheckout(user, status)`, `PoojaOrder(order_group_id)`, `PoojaOrder(status)`, `PoojaOrderLine(selected_date)`, `Pooja(online_price)`, `Pooja(offline_price)`

---

## Changelog

### Version 4.0 (Current — March 2026)
- Replaced single `price` field with `online_price` and `offline_price` on Pooja and SpecialPoojaDate
- `status=false` uses `online_price`; `status=true` uses `offline_price`
- Removed hardcoded additional charge of 20.00
- Removed `additional_charges` from cart responses (field retained as `0.00` on orders for compatibility)
- Removed `additional_charges_total`, `date_additional_charges` from cart response
- Removed per-user `additional_charges` from cart user entries

### Version 3.0 (February 2026)
- Unified `poojas[]` grouped response across Cart, Checkout, and Orders
- Multi-date booking: `selected_dates` list and `special_pooja_date_ids` list in cart add
- Same pooja on different dates collapsed into single `poojas[]` entry with `dates[]` list
- Shared helper functions `_build_cart_poojas_list` and `_build_poojas_list`

### Version 2.0
- Multi-pooja cart support
- Order grouping by `(pooja_id, date)`
- Agent code at checkout level
- Duplicate detection and cart size limits
- Single Razorpay payment for multiple orders

### Version 1.0 (Legacy)
- Single pooja booking per transaction
- No cart or order grouping

---

*Last Updated: March 13, 2026*
*Version: 4.0.0*