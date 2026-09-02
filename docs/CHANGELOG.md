# RecoverAI — Changelog

This file records important project changes, completed milestones, architecture decisions, and implementation updates.

All AI agents should check this file before making changes that may affect existing functionality.

---

## Version Format

Use:

`v0.x`

* `v0.1` — Initial foundation
* `v0.2` — Database/backend
* `v0.3` — AI agent
* `v0.4` — Recovery workflows
* `v0.5` — Razorpay integration
* `v1.0` — Final hackathon MVP

During development, changes can also be recorded under **Unreleased**.

---

# Unreleased

## Added

* Project documentation and source-of-truth structure
* Product requirements and MVP scope
* System architecture
* Supabase/PostgreSQL database schema
* API contract
* Gemini AI agent specification
* Feature checklist
* Simulation-first recovery strategy
* Razorpay Test Mode integration strategy

## Changed

* AI provider selected as **Google Gemini**
* Backend platform selected as **Supabase**
* Database selected as **Supabase PostgreSQL**
* Payment infrastructure selected as **Razorpay**
* Synthetic data selected as the primary demo dataset

## Decisions

### AI Provider

Gemini is responsible for:

* Diagnosing revenue-loss opportunities
* Reasoning about customer/payment context
* Estimating recovery probability
* Recommending recovery actions
* Explaining recommendations

Gemini must **not** directly access the database or Razorpay credentials.

All Gemini API calls must happen server-side through Supabase Edge Functions.

### Backend

Supabase is the backend platform and provides:

* PostgreSQL database
* Authentication
* Row Level Security
* Edge Functions
* Optional Realtime functionality

### Payment Integration

Razorpay Test Mode will be used where practical.

If live integration becomes unstable or consumes too much development time, the application must fall back to simulation mode without breaking the demo.

### Human Approval

The AI agent recommends actions but does not independently execute financially meaningful recovery actions.

The intended flow is:

`Detect → Diagnose → Recommend → Approve → Validate → Execute → Verify → Audit`

---

# Development Milestones

## v0.1 — Documentation Foundation

**Status:** Completed

* [x] `PROJECT_CONTEXT.md`
* [x] `ARCHITECTURE.md`
* [x] `DATABASE_SCHEMA.md`
* [x] `API_CONTRACT.md`
* [x] `AI_AGENT.md`
* [x] `FEATURES.md`
* [x] `CHANGELOG.md`

---

## v0.2 — Project Foundation

**Status:** Planned

* [ ] Initialize frontend
* [ ] Configure Supabase project
* [ ] Configure environment variables
* [ ] Create PostgreSQL tables
* [ ] Add indexes
* [ ] Configure Row Level Security
* [ ] Create synthetic demo data
* [ ] Create initial Edge Functions
* [ ] Verify frontend ↔ Supabase connection

---

## v0.3 — AI Agent

**Status:** Planned

* [ ] Configure Gemini API
* [ ] Create server-side Gemini client
* [ ] Implement structured AI output
* [ ] Implement opportunity analysis
* [ ] Implement failure diagnosis
* [ ] Implement recovery probability estimation
* [ ] Implement action recommendation
* [ ] Add backend validation of AI output
* [ ] Add AI Agent UI

---

## v0.4 — Recovery Workflow

**Status:** Planned

* [ ] Opportunity detection
* [ ] Merchant approval flow
* [ ] Safety validation
* [ ] Recovery action execution
* [ ] Payment verification
* [ ] Recovery result recording
* [ ] Recovered revenue calculation
* [ ] Audit trail

---

## v0.5 — Razorpay Integration

**Status:** Planned

* [ ] Configure Razorpay Test Mode
* [ ] Add server-side Razorpay credentials
* [ ] Implement Payment Link creation
* [ ] Implement test payment flow
* [ ] Implement webhook handling
* [ ] Validate webhook signatures
* [ ] Connect successful payments to recovery records
* [ ] Verify end-to-end recovery flow

---

## v1.0 — Hackathon MVP

**Status:** Planned

The final demo should support:

1. Merchant opens dashboard
2. RecoverAI identifies a revenue opportunity
3. Merchant opens the opportunity
4. AI explains why revenue may be lost
5. AI recommends a recovery action
6. Merchant approves the action
7. Backend validates the action
8. Recovery action executes
9. Payment/recovery outcome is verified
10. Dashboard updates recovered revenue
11. Audit trail records the complete process

### Demo Requirements

* [ ] Dashboard looks production-ready
* [ ] AI reasoning is understandable
* [ ] Recovery workflow is clearly visible
* [ ] No exposed API keys
* [ ] Error states handled
* [ ] Simulation fallback works
* [ ] Razorpay Test Mode works if stable
* [ ] Demo data looks realistic
* [ ] Recovery amount updates visibly
* [ ] Audit trail demonstrates accountability

---

# Important Change Log Entries

### 2026-09-02 — Architecture Decision

**Decision:** Use Supabase as the backend platform.

**Reason:** Provides PostgreSQL, authentication, Row Level Security, and server-side Edge Functions in one platform suitable for a 24-hour MVP.

---

### 2026-09-02 — AI Decision

**Decision:** Use Google Gemini as the AI provider.

**Reason:** Suitable for the hackathon MVP and available with a developer/free usage tier.

**Restriction:** Gemini API keys must remain server-side.

---

### 2026-09-02 — Payment Decision

**Decision:** Use Razorpay Test Mode for payment-related demonstrations.

**Fallback:** Simulation mode must remain available.

---

### 2026-09-02 — Safety Decision

**Decision:** AI recommendations require backend validation and merchant approval before meaningful recovery actions are executed.

---

# Rules for Updating This File

AI agents should add an entry when they:

* Introduce a major feature
* Change architecture
* Change database structure
* Change an API contract
* Change the AI provider
* Change a major integration
* Remove or replace functionality
* Make an important security decision
* Discover a limitation that affects future development

Do **not** record every tiny styling or formatting change.

Each meaningful entry should explain:

**What changed → Why it changed → What other parts may be affected**

---

# Current Source of Truth

For conflicts between project documents:

1. `.ai/RULES.md`
2. `PROJECT_CONTEXT.md`
3. `ARCHITECTURE.md`
4. `DATABASE_SCHEMA.md`
5. `API_CONTRACT.md`
6. `AI_AGENT.md`
7. `FEATURES.md`
8. `CHANGELOG.md`

Implementation must follow the latest agreed architecture and contracts.

