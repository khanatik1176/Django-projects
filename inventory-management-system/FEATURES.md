# Bhandar — Complete Feature Guide

**Product:** Bhandar (ভ) — Inventory OS for Bangladesh retail & wholesale  
**Audience:** Grocery / kirana shops, wholesale distributors, multi-branch retailers  
**Currency & timezone:** BDT (৳) · Asia/Dhaka  

Use this document as your reference for what the system can do today.

---

## 1. Product overview

Bhandar is a full shop operating system, not only a stock spreadsheet:

- Multi-warehouse inventory
- Counter POS with Cash / bKash / Nagad / Udhar
- Hal Khata (neighborhood credit ledger)
- Purchase & sales order workflows
- FEFO perishable batches & clearance
- Loyalty memberships + points + offers
- Shop finance cashbook
- Role-based access and activity audit

**Brand:** Bhandar · mark **ভ** · green `#0b6e4f`

---

## 2. Authentication & accounts

| Feature | What it does |
|--------|----------------|
| **Register** | Name, email, phone, password → account starts as **PENDING** (cannot log in until approved) |
| **Login** | Email + password → JWT tokens |
| **Logout** | Ends session / blacklists refresh token |
| **Password reset** | Email OTP → verify → set new password (from login or profile) |
| **Account statuses** | `PENDING` · `ACTIVE` · `BANNED` |
| **Approve / Ban / Unban** | Done by admins in Configuration |
| **Profile** (`/profile`) | Edit name, phone, picture; change password via OTP |

Default new-user role: **Viewer** until an admin assigns another role.

---

## 3. Landing page (`/`)

Public marketing site for Bhandar:

- Hero, product pillars (POS, Hal Khata, Clearance / FEFO)
- Module overview, how-it-works, audience, pricing, FAQ
- Highlight marquee of core capabilities
- Live-style stock board preview
- Chat assistant widget
- Sign in / Sign up CTAs

---

## 4. Dashboard shell

- Persistent **sidebar** + top header
- Mobile drawer navigation
- **Configuration** only appears if you have config permission

---

## 5. All dashboard modules

### 5.1 Dashboard — `/dashboard`

- KPI cards: warehouses, units on hand, inventory value, low stock, expiring soon, open POs / SOs
- Charts: stock by warehouse, top products, movement trends
- Quick links into stock, products, POs, SOs
- **Role desk** modal — shop insights tailored to Administrator / Manager / Warehouse Staff
- Clickable insight actions (reorder → PO, expiry → clearance, etc.)

---

### 5.2 Counter POS — `/pos`

Walk-in checkout for the shop counter.

- Scan / search products into a cart
- Pick warehouse; see available stock; FEFO note for perishables
- Override unit price (e.g. clearance)
- Payments: **নগদ Cash · bKash · Nagad · উধার Udhar**
- **Phone lookup** — enter customer phone → load membership, points, discounts, udhar balance
- Optional customer from dropdown; required for Udhar
- Live totals: subtotal → membership discount → offer discount → payable
- Redeem loyalty offers with points
- Checkout creates sales order, issues stock, records payment/credit, awards points
- After sale: **invoice modal** (print / open in Invoice Bank)

---

### 5.3 Invoice Bank — `/invoices` · `/invoices/[id]`

- Stores every Counter POS invoice
- Search by invoice no., customer, phone
- Columns: date, customer, warehouse, payment method, items, total
- View full invoice (line items, rates, totals)
- Print receipt (sidebar/header hidden when printing)

---

### 5.4 Customers — `/customers`

Central customer management:

- Create / edit: name, phone, address, credit limit, notes
- Assign **membership** tier
- **Ban / Unban** (active vs banned)
- See points, lifetime points, udhar due, effective credit limit
- Search + filter Active / Banned

---

### 5.5 Products — `/products`

Product master data:

- Name, SKU, barcode, category, brand, supplier, UOM
- Cost price & selling price (BDT)
- Perishable flag + shelf life (days)
- Create / edit / activate / deactivate
- Quick-create Category, Brand, Supplier from the form

---

### 5.6 Warehouses — `/warehouses`

- Multiple hubs / branches / godowns
- Name, code, address, contact, phone
- Set **default** warehouse
- Activate / deactivate
- Edit warehouse details

---

### 5.7 Stock — `/stock`

- Stock per product × warehouse: on-hand, reserved, available
- Reorder level & max stock
- Health filters: Expiring soon, Low, Adequate, Good, Out of stock
- **Receive stock** with optional batch + expiry
- Manage modal: thresholds, adjust, top-up, write-off (admin/manager gated)
- Warehouse filter; Create PO shortcut for low stock

---

### 5.8 Clearance — `/clearance`

Perishable margin protection:

- Near-expiry batches with **suggested ছাড় %** and clearance price
- Dead stock (little / no recent movement)
- **Sell at clearance** → opens POS with markdown price
- **Write off** expired stock

---

### 5.9 Transfers — `/transfers`

- Move stock between warehouses
- Status: Pending → Completed / Cancelled
- Filters: status, from warehouse, to warehouse
- Complete or cancel pending transfers

---

### 5.10 Movements — `/movements`

Immutable inventory history:

- Types: Receipt, Issue, Adjustment, Transfer In, Transfer Out
- Quantity before / after
- Filters: type, warehouse, search
- Reference & notes columns

---

### 5.11 Purchase Orders — `/purchase-orders`

Supplier inbound flow:

- Status: Draft → Submitted → Partially Received / Received / Cancelled
- Create with supplier, warehouse, line items
- Submit, cancel
- **Receive** (full or partial) with batch # + expiry for perishables
- Cost price can update on receive

---

### 5.12 Sales Orders — `/sales-orders`

Wholesale / outbound flow:

- Status: Draft → Confirmed → Partially Fulfilled / Fulfilled / Cancelled
- Confirm **reserves** stock; fulfill line by line; cancel releases reservation
- Optional Hal Khata customer picker (fills name / phone)
- Shows reserved quantities where available

---

### 5.13 Hal Khata — `/udhar`

Neighborhood credit book:

- List customers with outstanding balances
- Collect payment (Cash / bKash / Nagad / Bank)
- Credit transaction ledger (sale / payment / adjustment)
- Edit credit limit
- Assign membership; adjust points; view points history
- Create customers from this screen

---

### 5.14 Memberships — `/memberships` (admin / config permission)

#### Built-in tiers

| Tier | Typical discount | Points / ৳100 | Auto-upgrade (lifetime pts) |
|------|------------------|---------------|------------------------------|
| **Silver** | 2% | 1 | 0 |
| **Gold** | 5% | 1.5 | 500 |
| **Loyal** | 7% | 2 | 1,500 |
| **Platinum** | 10% | 3 | 4,000 |

Admins can also create **custom** memberships.

#### Per tier settings

- Discount %
- Points per ৳100 spent
- Min lifetime points (auto-upgrade threshold)
- Extra udhar credit limit bonus
- Color, sort order, benefits text, active flag
- System tiers cannot be deleted (can deactivate)

#### Loyalty offers

Offer types:

- Percent off
- Fixed ৳ off
- Bonus points
- Freebie / perk

Also: points cost to redeem, min points balance, membership-restricted or all members, optional start/end dates.

#### Points behaviour

- Earn on POS sales for members
- Redeem offers at checkout
- Manual adjust from Hal Khata
- Auto-upgrade with bonus points (never auto-downgrades)
- Ledger types: Earn · Redeem · Bonus · Adjust · Upgrade

---

### 5.15 Finance — `/finance`

Shop cashbook:

- Summary: revenue, expenses, udhar outstanding, method breakdown
- **Payments** list with filters (type, method)
- **Expenses** CRUD (rent, utilities, salary, transport, supplies, maintenance, other)
- Payment methods: Cash, bKash, Nagad, Bank, Credit

---

### 5.16 Reports — `/reports`

- Stock valuation (BDT)
- ABC analysis
- Movement summary
- Filters: warehouse, start date, end date
- Charts for each report

---

### 5.17 Activity Logs — `/activity-logs`

- Cross-module audit trail (POS checkout, receive, fulfill, ban, payments, etc.)
- Who did what, when, on which entity

---

### 5.18 Configuration — `/configuration` (config permission)

- **Users:** create, assign role, approve pending, ban / unban
- **Roles:** create custom roles with permission checkboxes
  - Manage users
  - Manage configuration
  - Manage inventory
  - Manage orders
  - View reports
- System roles cannot be deleted

---

### 5.19 Profile — `/profile`

- Personal details & profile picture
- Password change via OTP

---

## 6. Roles & permissions

| Role | Config | Inventory | Orders | Reports | Users |
|------|--------|-----------|--------|---------|-------|
| **Administrator** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Operations Manager** | — | ✓ | ✓ | ✓ | — |
| **Warehouse Staff** | — | ✓ | ✓ | — | — |
| **Viewer** | — | — | — | ✓ | — |

- Superusers bypass all gates
- Stock threshold / write-off style actions: Admin or Manager only
- Memberships page requires config permission
- Insights desk content changes by role

---

## 7. Bangladesh-specific features (summary)

- BDT pricing throughout
- Asia/Dhaka timezone
- Cash · bKash · Nagad · Bank · Udhar
- Hal Khata credit culture
- Bilingual UI cues (নগদ, উধার, ছাড়, …)
- FEFO for dairy / perishables
- Seed data for local FMCG-style catalogs (`seed_bangladesh`)

---

## 8. End-to-end shop flows

### A. Buy from supplier → shelf

1. Create product (optional perishable)
2. Create Purchase Order → Submit
3. Receive lines (add batch / expiry if perishable)
4. Stock & movements update automatically

### B. Counter sale with member

1. Customer exists with membership (Customers / Hal Khata)
2. POS → enter phone → Lookup
3. Scan items → see discount & points preview
4. Optional redeem offer
5. Pay Cash / bKash / Nagad / Udhar
6. Invoice generated → stored in Invoice Bank
7. Points earned; finance + stock updated

### C. Near-expiry clearance

1. Clearance page shows suggested discount
2. Sell at clearance → POS opens prefilled
3. Or write off if unsaleable

### D. Branch stock move

1. Transfers → create from A to B
2. Complete → transfer out/in movements recorded

---

## 9. Tech stack (for reference)

| Layer | Technologies |
|------|----------------|
| Backend | Django, Django REST Framework, SimpleJWT, django-filter |
| Apps | `accounts`, `products`, `inventory`, `orders`, `finance`, `core` |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion |
| Data | SQLite (dev) / PostgreSQL-ready |

API base: `/api/{accounts|products|inventory|orders|finance}/`

---

## 10. Quick route map

| Path | Screen |
|------|--------|
| `/` | Landing |
| `/login` · `/register` | Auth |
| `/dashboard` | Operations overview |
| `/pos` | Counter POS |
| `/invoices` | Invoice Bank |
| `/customers` | Customers |
| `/products` | Products |
| `/warehouses` | Warehouses |
| `/stock` | Stock |
| `/clearance` | Clearance |
| `/transfers` | Transfers |
| `/movements` | Movements |
| `/purchase-orders` | Purchase Orders |
| `/sales-orders` | Sales Orders |
| `/udhar` | Hal Khata |
| `/memberships` | Memberships & offers |
| `/finance` | Finance cashbook |
| `/reports` | Reports |
| `/activity-logs` | Activity Logs |
| `/configuration` | Users & roles |
| `/profile` | Profile |

---

## 11. What to remember when demoing

1. **Approve** new users in Configuration before they can log in  
2. Assign a **membership** on Customers, then sell on POS with **phone lookup**  
3. Use **Clearance → Sell at clearance** for perishable demos  
4. **Invoice Bank** holds every POS bill  
5. **Hal Khata** is for collections; **Finance** is the full cashbook  
6. **Memberships** page is where you design tiers & point offers  

---

*Generated from the current Bhandar codebase. Update this file when major features are added.*
