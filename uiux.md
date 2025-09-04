
# PLR (Punjab Flood Relief) — Design System & UX Principles, done.

## 1) Brand & Visual Language

**Goals:** calm, legible, high-contrast; emergency accents without alarm fatigue.

* **Palette (WCAG AA+)**

  * Primary Navy: `#0B2A3B` (headers, nav)
  * Surface Light: `#F7FAFC` (background)
  * Text Dark: `#111827`
  * Accent (Action/CTA): `#2563EB` (primary buttons/links)
  * Alert/Rescue: `#DC2626` (P0 warnings, life-risk)
  * Success: `#16A34A`
  * Warning: `#D97706`
  * Disabled/Muted: `#6B7280`
* **Typography**

  * System stack (no web fonts): `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans`
  * Base size 16–18 px; large touch targets (min 44×44 px)
* **Iconography**

  * Outline icons, single-color SVGs (inlined, tree-shaken). No icon fonts. Use **Lucide** subset only.

## 2) Layout & Interaction

* **Mobile-first** (<= 360 px wide). One **primary action per screen**.
* **3-step public intake**: (1) Need → (2) Location → (3) Contact.
* **Rescue team UI**: “My Tasks”, “Nearby Requests”, big **Accept / Deny** with reason.
* **High-contrast mode** toggle + **Punjabi default**, Hindi/English quick switch.
* **Safe defaults**: GPS *optional*, text search always available; offline submission queue.

---

# Low-Bandwidth & Performance Contract

**Targets (on a ₹6k Android over 3G/poor Wi-Fi):**

* First screen **HTML** < **50 KB** gzipped; total initial JS < **120 KB** gzipped.
* Time-to-Interactive < **3 s** (Fast 3G), FCP < **1.5 s**.
* No blocking web fonts, no carousels, no background videos.

**Tech levers (Cursor: enforce)**

* **Next.js + React Server Components** (RSC) to minimize client JS.
* **Tailwind** + **shadcn/ui** (tree-shaken). No CSS frameworks that ship huge bundles.
* **Code-splitting** per route; **defer** non-critical JS.
* **PWA** with Service Worker:

  * Cache shell (HTML/CSS/critical JS),
  * Cache POSTs (Background Sync) for poor connectivity,
  * “Offline—queued, will auto-send” banner.
* **Images/Uploads**

  * On-device compression: cap long edge **1280px**, JPEG \~**0.65** quality; target **<= 250 KB** per doc/photo.
  * Accept **JPG/PNG/PDF**; no HEIC (auto-convert client-side if present).
* **Maps**

  * Default to **mapless** (text location). Lazy-load a static map *preview* only on demand.
  * If needed: vector tiles, low-zoom; no satellite; size budget < **80 KB** on first map view.
* **Network**

  * Detect `navigator.connection.effectiveType` and **auto low-data mode** (strip images, no map).
  * Backoff/retry with jitter; store drafts locally.

---

# OTP & Identity Verification (Relief Worker Onboarding)

**Objective:** stop bad actors, keep UX simple. Phone is the *primary identity*, ID proof as a **verifiable attachment**.

## Flow (Worker)

1. **Enter phone** → request OTP.
2. **Enter 6-digit OTP** (auto-read via SMS Retriever on Android if possible).
3. **Registration form**:

   * Full name, org type (**Government / NGO / Independent**),
   * Org name (if any), role,
   * **Home base location** (district/tehsil, optional GPS),
   * **Live location**: collected from team lead app (optional at sign-up),
   * **Capabilities** (boats, first-aid, animal rescue, food, shelter, etc.), capacity numbers,
   * **ID proof upload** (Aadhaar/Driving License/Org ID) — front only.
4. **Moderation queue** (soft gate):

   * **Auto green** path if gov domain email or whitelisted org code provided.
   * Else **Pending Verification**: can view tasks but **must accept with ID on file**; dispatchers see “Unverified”.
5. **Re-verification** every 30 days or on suspicious activity.

## OTP API (stateless, rate-limited)

* `POST /api/auth/request-otp` → `{ phone }`

  * **Rate limit**: 3/min, 10/day/phone; IP throttling; device fingerprint if feasible.
  * Send via SMS (provider A) with fallback to voice call (provider B).
* `POST /api/auth/verify-otp` → `{ phone, code }`

  * Issues short-lived **Access JWT** + long-lived **Refresh** (rotating).
  * Store hashed phone; never store raw OTPs (HMAC + TTL in Redis).
* **Abuse controls**

  * Deny-list phones; velocity rules; captcha after N failures.
  * Lockout after 5 wrong codes for 15 minutes.

## ID Proof Handling

* **Client-side compression**; redaction helper (blur everything but name & last 4 digits) **optional**.
* Encrypted at rest; access by **verified admins only**; all access logged.
* Retention: **90 days after disaster window** unless law requires longer; then purge.

---

# Resource & Team Registry (Design Hooks)

**Capabilities Vocabulary (checkboxes, no free-form for core fields):**

* **Rescue:** Boat (inflatable/motorized), Rope/Zip, Dive, Night Ops, Drone (visual/thermal)
* **Medical (Human):** First-aid, EMT, Ambulance, Doctor
* **Medical (Animal):** Vet, Animal Ambulance
* **Relief:** Cooked food, Dry ration kits, Water, **Plastic sheets**, Blankets, Hygiene kits, Sanitation
* **Shelter:** Human shelter capacity, Animal shelter capacity
* **Logistics:** Truck, Tractor, 4x4, Fuel, Generator, Lights
* **Comms:** VHF, Satellite phone

**Status model**

* Team: `available`, `busy`, `off-duty`, `out-of-area`, `unverified`
* Capability stock items have **counts** and **last\_updated** timestamps.

**Location**

* **Home base** (geocode once) + **current location** from team lead’s app (periodic, low-frequency pings; 2–5 min).

---

# Accept / Deny & Rerouting (Worker UX)

* **“My Tasks”** list sorted by priority & proximity.
* Each task: **Accept**, **Deny** (reason: `no capacity`, `too far`, `unsafe`, `not our capability`), or **Forward** to another team (with justification).
* Auto-reroute if **no ACK in X minutes** (configurable per category).
* Teams can broadcast **“Need supplies”** (e.g., fuel) to dispatch.

---

# Accessibility & Inclusivity

* **Language:** Punjabi default, Hindi/English toggles, all buttons phrased in plain language.
* **Contrast:** all text ≥ 4.5:1; focus states visible; support screen readers.
* **Motion:** no auto-animations; respect `prefers-reduced-motion`.
* **Large touch targets**; one action per screen for public form.

---

# Security & Privacy

* HTTPS everywhere; HSTS.
* JWT with short TTL; refresh rotation; revoke on device loss.
* CSRF for non-JSON forms; CORS locked to domains.
* PII minimization: hash phone; mask in logs; data retention policy.
* **Audit trails** for: OTP requests, ID proof access, task assignment/updates.

---

# Concrete deliverables for Cursor

## A) Tailwind tokens (tailwind.config extract)

```ts
// /app/tailwind.config.ts
theme: {
  extend: {
    colors: {
      navy:   '#0B2A3B',
      surface:'#F7FAFC',
      text:   '#111827',
      accent: '#2563EB',
      alert:  '#DC2626',
      success:'#16A34A',
      warn:   '#D97706',
      muted:  '#6B7280',
    }
  }
}
```

## B) Page weight budgets (enforce in CI)

* `/` (public intake step 1): **<= 170 KB gz** total, **<= 120 KB** JS.
* `/worker/login` (OTP): **<= 140 KB gz**, no map.
* Block builds if budgets exceeded.

## C) Routes & components

* Public:

  * `/report/[step]` → Stepper (Need, Location, Contact)
* Worker:

  * `/worker/login` → Phone + OTP
  * `/worker/register` → Form + ID upload (client compression)
  * `/worker/tasks` → My Tasks list
  * `/worker/tasks/[id]` → Details + Accept/Deny/Forward
* Admin/Dispatch:

  * `/dispatch/queue` → triage list with priority
  * `/dispatch/map` → optional map layer (lazy)

## D) API skeleton (Next.js route handlers)

* `POST /api/auth/request-otp`
* `POST /api/auth/verify-otp`
* `POST /api/workers/register` (Multipart; presigned upload)
* `GET /api/workers/me`
* `GET /api/tasks` / `POST /api/tasks/ack` / `POST /api/tasks/deny`
* `POST /api/uploads/presign` (ID proof, media)

## E) Client-side image compression (pseudo)

* Use `<input type="file" accept="image/*,application/pdf">`
* If image: draw to canvas at max 1280px, `toBlob('image/jpeg', 0.65)`
* Show final size before upload; reject > **300 KB**.


## Final “definition of done” for Cursor (MVP UI/UX)

* Passes budgets on CI, loads in <3s on throttled 3G.
* Fully usable with **no GPS** and **no map**.
* OTP + ID proof flow implemented with rate limits and moderation queue.
* Public intake takes **≤60 s**; worker Accept/Deny is **one tap** away.
* All text available in **Punjabi**, switchable.

If you want, I’ll follow up with **wireframe images** or a **minimal Next.js scaffold** (routes + components + API handlers + Tailwind config) to jumpstart coding.
