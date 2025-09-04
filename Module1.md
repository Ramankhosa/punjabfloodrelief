
# SRS — Auth (Simple Signup & Login without OTP) + Relief Group Registration (with OTP)

## 1) Overview

* **Goal:** Let any user create an account and log in with **email/phone + password** (no OTP).
* **Extra flow:** When a user wants to **register a Relief Group** (Gov/NGO/Independent squad), require **OTP verification of the group representative’s phone** and **ID proof** to reduce impersonation.

## 2) In Scope / Out of Scope

* **In scope:**

  * Simple signup (no OTP), login, logout, password reset (email or SMS link).
  * Relief Group registration: OTP on representative’s phone + ID proof upload + moderation.
* **Out of scope:** Team capability inventory, task assignment, dashboards (separate modules).

## 3) Assumptions & Constraints

* **Low bandwidth, mobile-first.** Page budgets: **Login ≤140 KB gz**, **Signup ≤170 KB gz**.
* **No third-party fonts**, system font stack, inline SVG only.
* **PII minimization:** hash phone at rest; encrypt ID files.
* **Languages:** Punjabi default; Hindi/English toggle.

## 4) Roles

* **User** (default) — can file incidents (if needed) and later request group registration.
* **Group Representative** — the user who registers a Relief Group (must OTP-verify + upload ID).
* **Moderator/Admin** — verifies groups, manages flags.

---

## 5) Functional Requirements

### 5.1 Simple Signup (no OTP)

* **FR-SU1**: Accept **email** *or* **phone** + **password** (8–64 chars, strength meter).
* **FR-SU2**: Normalize contacts:

  * Email RFC-compliant;
  * Phone normalized to **E.164** (`+91…`) if provided.
* **FR-SU3**: Store **one primary login identifier** (email or phone) + optional secondary.
* **FR-SU4**: Create user; send **welcome email/SMS** (non-blocking).
* **FR-SU5**: **No OTP** here. If phone provided, mark as *unverified* (can be verified later in profile).

### 5.2 Login (no OTP)

* **FR-L1**: Login with email/phone + password.
* **FR-L2**: Issue **Access JWT (≤15 min)** + **Refresh token (≤14 days, rotating)**.
* **FR-L3**: Device “remember me” (persist refresh token).
* **FR-L4**: Brute-force protection: 5 bad attempts → 15-min lockout; show generic error.

### 5.3 Password Reset (no OTP)

* **FR-PR1**: “Forgot password” → send **reset link** via email (preferred) or SMS deep-link if phone-only.
* **FR-PR2**: Token TTL 30 min; single-use; after success, revoke old sessions.

### 5.4 Relief Group Registration (OTP + ID Proof)

* **FR-RG1**: Entry point: `/relief-group/register` (requires logged-in user).
* **FR-RG2**: **Step 1 — Representative Verification**

  * Capture **rep\_name**, **rep\_phone**; send **6-digit OTP** (TTL 5 min; rate-limit 3/min, 10/day).
  * Verify OTP (SMS; voice fallback). Store verified timestamp **bound to this application**.
* **FR-RG3**: **Step 2 — Group Details**

  * `group_name` (2–120), `org_type` (`government` | `ngo` | `independent`),
  * `registration_number` (optional for gov/ngo),
  * `home_base` (district/tehsil; optional GPS),
  * `contact_email` (optional), `contact_phone` (defaults to rep\_phone),
  * `intended_operations` (checkboxes: rescue, medical, animal care, relief distribution, shelter, logistics),
  * `service_area` (multi-select districts/tehsils).
* **FR-RG4**: **Step 3 — ID Proof**

  * Upload **Rep ID** (Aadhaar/Driving License/Org ID). **≤300 KB**, JPEG/PNG/PDF.
  * Optional: **Org letter/cert** (for NGO/Gov).
  * Client-side compression (max long edge 1280px; JPEG \~0.65).
* **FR-RG5**: **Moderation**

  * Application states: `submitted` → `pending_review` → `verified` | `rejected` | `needs_more_info`.
  * Admin console shows: rep OTP status, ID thumbnails, duplicate detection (same phone/email).
  * On `verified`, user gains **role: group\_rep** and can create a team in the Team Registry module.
* **FR-RG6**: **Security flags**

  * Deny-list numbers; velocity checks; suspicious pattern alerts to Admin.

### 5.5 Audit & Privacy

* **FR-AU1**: Log events: signup, login, failed login, reset request, OTP send/verify, file upload, moderation decisions.
* **FR-AU2**: ID viewing is RBAC-gated and logged.

---

## 6) Non-Functional Requirements

* **Performance:** FCP <1.5s; TTI <3s (Fast 3G).
* **Reliability:** OTP provider A with call fallback provider B.
* **Security:** TLS 1.2+; bcrypt/argon2 for passwords; JWT rotation; CSRF on form posts; CORS pinned.
* **Accessibility:** WCAG AA; Punjabi default; 44×44px targets.

---

## 7) Data Model (Auth scope)

**users**

* `user_id (uuid, pk)`
* `primary_login` (`email` | `phone`)
* `email (unique, nullable)`
* `phone_e164 (unique, nullable)`
* `password_hash`
* `roles (string[])`  // e.g., `["user"]`, later add `group_rep`, `dispatcher`, `admin`
* `phone_verified_at (nullable)`
* `created_at`, `last_login_at`, `is_active`

**sessions**

* `session_id`, `user_id`, `refresh_token_hash`, `device_fingerprint`, `ip`, `ua`, `expires_at`, `revoked_at`

**password\_resets**

* `user_id`, `token_hash`, `expires_at`, `used_at`

**relief\_groups**

* `group_id (uuid, pk)`
* `group_name`, `org_type`, `registration_number`
* `home_district_code`, `home_tehsil_code`, `home_lat`, `home_lon`
* `contact_email`, `contact_phone_e164`
* `intended_operations (string[])`
* `service_area (jsonb)`
* `status (enum: submitted|pending_review|verified|rejected|needs_more_info)`
* `created_by_user_id`, `created_at`, `updated_at`

**group\_representatives**

* `group_id (fk)`, `user_id (fk)`, `rep_name`, `rep_phone_e164`, `otp_verified_at`

**documents**

* `doc_id`, `group_id`, `user_id`, `type (rep_id|org_cert)`, `file_url`, `checksum`, `size_bytes`, `created_at`
  *(stored encrypted at rest; presigned upload)*

**audit\_logs**

* `log_id`, `actor_user_id`, `action`, `target_type`, `target_id`, `metadata(jsonb)`, `created_at`

---

## 8) API Endpoints (v1)

### Simple Auth (no OTP)

* `POST /api/auth/signup`
  **Body:** `{ email?, phone?, password }`
  **201:** `{ userId }`
* `POST /api/auth/login`
  **Body:** `{ identifier, password }`  // identifier = email or phone
  **200:** `{ accessToken, refreshToken }`
* `POST /api/auth/logout`
  **Body:** `{ refreshToken }`
* `POST /api/auth/refresh`
  **Body:** `{ refreshToken }` → rotates token.
* `POST /api/auth/password-reset/request`
  **Body:** `{ identifier }`
* `POST /api/auth/password-reset/confirm`
  **Body:** `{ token, newPassword }`

### Relief Group Registration (OTP + ID)

* `POST /api/relief-groups/otp/request`
  **Body:** `{ repPhone }` → `{ status:"sent", channel:"sms" }`
* `POST /api/relief-groups/otp/verify`
  **Body:** `{ repPhone, code }` → `{ otpToken }`  // short-lived proof
* `POST /api/uploads/presign`
  **Body:** `{ fileName, contentType, scope:"group-doc" }` → `{ uploadUrl, fileUrl, maxBytes }`
* `POST /api/relief-groups`
  **Auth:** Access JWT
  **Body:** `{ otpToken, groupDetails..., repName, repPhone, docUrls[] }`
  **201:** `{ groupId, status:"pending_review" }`
* `GET /api/relief-groups/:id`  (owner/admin)
* `POST /api/relief-groups/:id/moderate` (admin)
  **Body:** `{ decision:"verified"|"rejected"|"needs_more_info", note }`

---

## 9) UI/UX (low-bandwidth)

### Login

* Identifier field (email/phone) + password.
* “Forgot password” link → reset via email/SMS link.
* No OTP prompts here.

### Signup

* Pick **email** or **phone** path; password; name (optional now).
* After signup, land on profile with CTA “Register a Relief Group”.

### Relief Group Registration (three small screens)

1. **Verify Representative**: phone + OTP; voice fallback link after first failure.
2. **Group Details**: name, type, optional reg no., base, operations, service area.
3. **ID Upload**: camera/gallery/PDF, auto-compress; submit → “Pending review”.

---

## 10) Security & Privacy

* Passwords: **argon2/bcrypt** (strong parameters); ban common passwords.
* JWT: short access, rotating refresh with reuse detection.
* Rate limits on login, signup, OTP; captcha after repeated failures.
* ID docs encrypted (KMS); strict RBAC; detailed access logs.
* Phones hashed at rest; do not store OTP codes (store HMAC + TTL).

---

## 11) Performance Targets

* Login page **≤140 KB gz**, Signup **≤170 KB gz** (including CSS/JS).
* FCP <1.5s, TTI <3s (Fast-3G).
* No web fonts; tree-shaken components; defer non-critical JS; PWA caching.

---

## 12) Acceptance Criteria (DoD)

* ✓ Users can **signup/login without OTP** and reset passwords.
* ✓ Relief Group registration **requires OTP** on rep phone + **ID upload**; produces a **pending** application.
* ✓ Admin can verify/reject; verified reps get `group_rep` role.
* ✓ All security controls (rate limits, encryption, audit) in place.
* ✓ Pages meet size/perf budgets; Punjabi default.

---

## 13) Risks & Mitigations

* **Password fatigue / forgotten passwords:** provide both email and SMS reset links; keep reset friction low.
* **Abuse via mass signups:** throttle + captcha + IP/device heuristics.
* **Fake groups with stolen IDs:** manual moderation + duplicate detection (same phone/email/reg no.) + deny-lists.

