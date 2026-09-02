# RecoverAI — System Architecture

## 1. Architecture Overview

RecoverAI is a web-based AI revenue recovery platform.

The system is composed of five major layers:

```text
┌───────────────────────────────────────────────┐
│                  MERCHANT                    │
│              Web Application                │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                 FRONTEND                      │
│         React / Next.js + TypeScript          │
│                                               │
│ Dashboard │ Opportunities │ AI Agent │ Audit │
└───────────────────────┬───────────────────────┘
                        │
                 Supabase Client
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                  SUPABASE                     │
│                                               │
│  Authentication                               │
│  PostgreSQL Database                          │
│  Row Level Security                            │
│  Edge Functions                                │
│  Realtime (optional)                           │
└──────────────┬────────────────┬───────────────┘
               │                │
               │                ▼
               │       ┌──────────────────────┐
               │       │      AI AGENT        │
               │       │                      │
               │       │ Detect               │
               │       │ Diagnose             │
               │       │ Score                │
               │       │ Recommend            │
               │       │ Execute              │
               │       │ Verify               │
               │       └──────────┬───────────┘
               │                  │
               │                  ▼
               │       ┌──────────────────────┐
               │       │   RECOVERY TOOLS     │
               │       │                      │
               │       │ Retry Payment        │
               │       │ Send Reminder        │
               │       │ Create Payment Link  │
               │       │ Verify Payment       │
               │       │ Record Recovery      │
               │       └──────────┬───────────┘
               │                  │
               │                  ▼
               │       ┌──────────────────────┐
               │       │  RAZORPAY TEST MODE  │
               │       └──────────────────────┘
               │
               ▼
        PostgreSQL Data
```

---

# 2. Architectural Principles

RecoverAI follows these principles:

### 2.1 Single Source of Truth

Project documentation in `/docs` defines the intended architecture, APIs, database structure, and AI behavior.

### 2.2 Separation of Concerns

Each layer has a specific responsibility.

```text
Frontend
→ User interface and user interaction

Supabase
→ Authentication, database and server-side infrastructure

Edge Functions
→ Secure server-side business logic and integrations

AI Agent
→ Reasoning, analysis and recommendations

Recovery Tools
→ Controlled execution of approved actions

Razorpay
→ External payment infrastructure
```

### 2.3 Backend Authority

The AI agent can recommend actions, but it cannot bypass backend safety rules.

The backend is authoritative.

```text
AI Recommendation
        ↓
Backend Validation
        ↓
Allowed?
   ┌────┴────┐
   │         │
  YES        NO
   │         │
   ▼         ▼
Execute    Reject
```

### 2.4 Auditability

Important system and AI events must be recorded in the database.

### 2.5 External Integration Isolation

Razorpay integration must be isolated from the rest of the application.

The application must remain demonstrable using simulation mode if Razorpay Test Mode is unavailable.

---

# 3. Frontend Architecture

The frontend provides the merchant-facing interface.

Recommended structure:

```text
frontend/
│
├── app/ or src/
│   ├── pages/
│   ├── components/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   └── types/
│
└── ...
```

The exact structure may depend on whether the frontend uses Next.js or React/Vite.

## Frontend Responsibilities

The frontend is responsible for:

* Rendering dashboards.
* Displaying revenue metrics.
* Displaying recovery opportunities.
* Displaying AI recommendations.
* Accepting merchant input.
* Sending API/function requests.
* Displaying recovery status.
* Displaying audit events.
* Handling loading and error states.

The frontend must NOT:

* Store secret API keys.
* Directly call protected Razorpay APIs.
* Execute unrestricted recovery actions.
* Contain sensitive business logic that should be server-side.
* Decide whether a recovery action is allowed.

---

# 4. Supabase Architecture

Supabase is the primary backend platform.

It provides:

```text
Supabase
│
├── Authentication
│
├── PostgreSQL
│
├── Row Level Security
│
├── Edge Functions
│
└── Realtime (optional)
```

---

###AI Provider

Gemini API is the AI provider for the RecoverAI MVP.

Gemini is accessed exclusively from server-side Supabase Edge Functions.

The Gemini API key must never be exposed to the frontend.

## Gemini Responsibilities

Gemini is responsible for:

* Revenue analysis.
* Payment failure diagnosis.
* Recovery probability estimation.
* Recovery action recommendation.
* Natural-language explanations.
* Agent tool selection where applicable.

## Gemini Restrictions

Gemini does NOT directly:

* Access PostgreSQL.
* Execute arbitrary SQL.
* Call Razorpay directly.
* Modify recovery state.
* Approve its own recommendations.
* Bypass backend safety rules.

## Server-Side Responsibility

All database access, recovery execution, authorization, and safety validation are handled by server-side application logic.

The relationship is:

```text
Frontend
    ↓
Supabase Edge Function
    ↓
Gemini API
    ↓
Structured AI Response
    ↓
Backend Validation
    ↓
Supabase Database / Recovery Tools
```

Gemini provides intelligence and recommendations.

The application backend remains authoritative over data, permissions, state changes, and payment operations.


# 5. Authentication

Supabase Auth will manage merchant authentication.

Initial MVP:

```text
Merchant
   ↓
Supabase Auth
   ↓
Authenticated Session
   ↓
Merchant Dashboard
```

Each authenticated merchant should be associated with a merchant record.

Database access should be protected using Row Level Security where appropriate.

---

# 6. Database Architecture

PostgreSQL stores the primary application data.

High-level relationship:

```text
MERCHANT
   │
   ├───────────────┐
   │               │
   ▼               ▼
CUSTOMERS      AUDIT LOGS
   │
   ▼
TRANSACTIONS
   │
   ▼
OPPORTUNITIES
   │
   ▼
RECOVERY ACTIONS
```

The exact database schema is defined in:

```text
docs/DATABASE_SCHEMA.md
```

No AI agent should invent database tables without updating the database schema documentation.

---

# 7. Edge Functions

Supabase Edge Functions are used for operations that require server-side execution.

Examples:

```text
/api/agent
/api/recovery
/api/razorpay
```

These are conceptual responsibilities. The final implementation may use different function names.

Edge Functions may handle:

* AI API calls.
* Recovery execution.
* Razorpay API calls.
* Sensitive business logic.
* Backend validation.
* Audit logging.
* Payment verification.

Secrets such as API keys must remain server-side.

---

# 8. AI Agent Architecture

The AI agent is implemented as a controlled reasoning layer.

It does not directly access the database or payment provider without going through approved application tools.

High-level flow:

```text
Merchant Request
       ↓
AI Agent
       ↓
Determine required information
       ↓
Call Tool
       ↓
Receive Structured Result
       ↓
Reason / Analyze
       ↓
Call Additional Tool if needed
       ↓
Generate Recommendation
       ↓
Merchant Approval
       ↓
Execute Tool
       ↓
Verify Result
       ↓
Record Audit Event
```

---

# 9. AI Agent Tool Architecture

The agent uses controlled tools.

## Data Retrieval Tools

```text
get_failed_payments()
get_customer_history(customer_id)
get_checkout_history(customer_id)
get_subscription_history(customer_id)
```

These tools retrieve structured application data.

---

## Analysis Tools

```text
calculate_recovery_probability(data)
diagnose_payment_failure(data)
recommend_recovery_action(data)
```

These tools help transform raw application data into structured decisions.

---

## Recovery Tools

```text
retry_payment(transaction_id)

send_recovery_message(customer_id)

create_payment_link(customer_id, amount)

verify_payment(transaction_id)

record_recovery(opportunity_id, amount)
```

Recovery tools must perform backend validation before execution.

---

# 10. AI Decision Flow

Example failed-payment workflow:

```text
Payment Failed
      │
      ▼
get_customer_history()
      │
      ▼
Analyze previous transactions
      │
      ▼
diagnose_payment_failure()
      │
      ▼
calculate_recovery_probability()
      │
      ▼
82%
      │
      ▼
recommend_recovery_action()
      │
      ▼
RETRY_PAYMENT
      │
      ▼
Merchant Approval
      │
      ▼
Backend Safety Validation
      │
      ├───────────────┐
      │               │
    Allowed        Rejected
      │               │
      ▼               ▼
Execute            Stop
      │
      ▼
Verify Payment
      │
      ▼
Recovered?
   ┌──┴──┐
  YES    NO
   │      │
   ▼      ▼
Record   Record
Recovery Failure
```

---

# 11. Recovery Engine

The recovery engine is responsible for executing approved actions.

It must not blindly follow an AI recommendation.

Example:

```text
AI:
Retry payment

        ↓

Recovery Engine:

Is transaction eligible?
        ↓
Is failure temporary?
        ↓
Retry count < maximum?
        ↓
Minimum retry interval satisfied?
        ↓
Merchant approval present?
        ↓
Execute
```

Only when all required conditions are satisfied should the action execute.

---

# 12. Safety Layer

The safety layer sits between the AI agent and recovery execution.

```text
                AI
                 │
                 ▼
       ┌───────────────────┐
       │   SAFETY LAYER    │
       │                   │
       │ Authorization     │
       │ Retry limits      │
       │ Timing limits     │
       │ Amount validation │
       │ Action validation │
       └─────────┬─────────┘
                 │
                 ▼
          Recovery Tool
```

The AI must never be able to bypass this layer.

---

# 13. Merchant Approval Flow

For sensitive recovery actions:

```text
AI Recommendation
       ↓
Merchant sees:
       ↓
Problem
Amount
Diagnosis
Recovery Probability
Recommended Action
Safety Constraints
       ↓
┌──────────────┐
│   APPROVE    │
└──────┬───────┘
       ↓
Backend validation
       ↓
Recovery execution
```

If rejected:

```text
Merchant Rejects
       ↓
Opportunity marked REJECTED
       ↓
Audit event created
```

---

# 14. Audit Architecture

Every significant event should produce an audit record.

Example:

```text
AI_DETECTED
AI_ANALYZED
AI_RECOMMENDED
MERCHANT_APPROVED
MERCHANT_REJECTED
RECOVERY_STARTED
RECOVERY_SUCCEEDED
RECOVERY_FAILED
PAYMENT_VERIFIED
```

Example flow:

```text
Opportunity Created
       ↓
AI_DETECTED
       ↓
AI_ANALYZED
       ↓
AI_RECOMMENDED
       ↓
MERCHANT_APPROVED
       ↓
RECOVERY_STARTED
       ↓
PAYMENT_VERIFIED
       ↓
RECOVERY_SUCCEEDED
```

The audit trail should contain timestamps and relevant structured metadata.

---

# 15. Razorpay Integration

Razorpay should be isolated behind a payment integration layer.

```text
RecoverAI
    │
    ▼
Payment Service
    │
    ├───────────────┐
    │               │
    ▼               ▼
Simulation      Razorpay
Mode            Test Mode
```

The rest of the application should not depend directly on Razorpay-specific implementation details.

This allows the demo to use simulated recovery when necessary.

---

# 16. Simulation Mode

The MVP must support a simulation mode.

Example:

```text
Recovery requested
       ↓
Simulation enabled?
   ┌───┴────┐
  YES       NO
   │         │
   ▼         ▼
Simulate   Razorpay
success    Test Mode
   │         │
   └────┬────┘
        ▼
Verify result
        ↓
Record outcome
```

Simulation mode exists primarily for:

* Reliable demonstrations.
* Development.
* Testing.
* Fallback when external APIs are unavailable.

The UI should clearly indicate when a recovery is simulated.

---

# 17. Data Flow

## Normal Dashboard Flow

```text
Merchant
   ↓
Frontend
   ↓
Supabase
   ↓
PostgreSQL
   ↓
Transactions / Opportunities / Recovery Data
   ↓
Frontend
   ↓
Dashboard
```

---

## AI Analysis Flow

```text
Merchant
   ↓
Frontend
   ↓
AI Edge Function
   ↓
AI Agent
   ↓
Application Tools
   ↓
Supabase Database
   ↓
Structured Data
   ↓
AI Agent
   ↓
Recommendation
   ↓
Frontend
```

---

## Recovery Flow

```text
Merchant
   ↓
Approve
   ↓
Frontend
   ↓
Recovery Edge Function
   ↓
Backend Safety Validation
   ↓
Recovery Engine
   ↓
Simulation / Razorpay
   ↓
Verify Result
   ↓
Update Database
   ↓
Create Audit Log
   ↓
Frontend
   ↓
Updated Revenue Metrics
```

---

# 18. Error Handling

Every external or asynchronous operation should handle failures.

Examples:

```text
AI API unavailable
    ↓
Display recoverable error
```

```text
Razorpay unavailable
    ↓
Use simulation mode if enabled
```

```text
Recovery fails
    ↓
Mark action FAILED
    ↓
Create audit event
    ↓
Do not count revenue as recovered
```

```text
Database error
    ↓
Do not report successful recovery
```

The system must never display recovered revenue unless the recovery result has been successfully recorded.

---

# 19. State Management

Recovery opportunities should have explicit states.

```text
PENDING
   ↓
ANALYZING
   ↓
RECOMMENDED
   ↓
APPROVED
   ↓
EXECUTING
   ↓
RECOVERED
```

Alternative outcomes:

```text
PENDING → REJECTED
PENDING → EXPIRED
APPROVED → FAILED
EXECUTING → FAILED
```

Frontend components should use these states rather than inferring status from unrelated fields.

---

# 20. Environment Variables

Secrets must never be committed to GitHub.

Expected environment variables may include:

```text
SUPABASE_URL
SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

OPENAI_API_KEY

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

Only public client-safe values may be exposed to the frontend.

Server-side secrets must remain inside Supabase Edge Functions or other secure server-side environments.

A `.env.example` file should document required variables without containing real secrets.

---

# 21. Development Architecture

Different AI tools may work on different parts of the project.

Recommended ownership:

```text
┌──────────────────────────┐
│       PROJECT DOCS       │
│        /docs + /.ai      │
└────────────┬─────────────┘
             │
     ┌───────┼────────┐
     ▼       ▼        ▼
 Frontend  Backend    AI
  Agent     Agent    Agent
     │       │        │
     ▼       ▼        ▼
frontend  Supabase  AI Tools
             │
             ▼
         Integrations
```

AI agents must read the project documentation before modifying code.

---

# 22. Source of Truth

The following files define the system:

```text
docs/PROJECT_CONTEXT.md
    ↓
Product definition

docs/ARCHITECTURE.md
    ↓
System architecture

docs/DATABASE_SCHEMA.md
    ↓
Database structure

docs/API_CONTRACT.md
    ↓
Frontend/backend communication

docs/AI_AGENT.md
    ↓
AI behavior and tools

docs/FEATURES.md
    ↓
Implementation status

.ai/RULES.md
    ↓
Rules for AI coding agents
```

When implementation and documentation disagree, the discrepancy must be resolved rather than silently ignored.

---

# 23. Core Demo Architecture

The primary hackathon demonstration should use one complete recovery workflow:

```text
Failed Payment
      ↓
RecoverAI detects opportunity
      ↓
Customer history retrieved
      ↓
AI diagnoses failure
      ↓
Recovery probability calculated
      ↓
AI recommends retry
      ↓
Merchant approves
      ↓
Safety checks
      ↓
Recovery executed
      ↓
Payment verified
      ↓
₹4,999 recovered
      ↓
Dashboard updated
      ↓
Audit trail updated
```

This workflow is the primary end-to-end success path for the MVP.

