# RecoverAI — Database Schema

## 1. Database Overview

RecoverAI uses **PostgreSQL through Supabase** as its primary database.

The database stores:

* Merchant accounts
* Customers
* Transactions
* Checkout sessions
* Subscriptions
* Revenue recovery opportunities
* Recovery actions
* AI analyses
* Audit events

The database is the source of truth for application state.

The AI agent must not directly modify database records. Database mutations must happen through controlled server-side functions or validated application operations.

---

# 2. Entity Relationship Overview

```text
                         ┌───────────────┐
                         │   merchants   │
                         └───────┬───────┘
                                 │
               ┌─────────────────┼─────────────────┐
               │                 │                 │
               ▼                 ▼                 ▼
        ┌────────────┐    ┌──────────────┐   ┌──────────────┐
        │ customers  │    │transactions  │   │ audit_logs   │
        └─────┬──────┘    └──────┬───────┘   └──────────────┘
              │                  │
              │                  │
              ├──────────────┐   │
              │              │   │
              ▼              ▼   ▼
        ┌────────────┐  ┌──────────────┐
        │ checkouts  │  │ opportunities│
        └────────────┘  └──────┬───────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ recovery_actions│
                       └─────────────────┘
```

---

# 3. Database Conventions

## IDs

Use UUIDs for primary keys.

Example:

```text
id UUID PRIMARY KEY
```

Use PostgreSQL UUID generation where supported.

## Timestamps

Use:

```text
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Store timestamps in UTC.

## Money

Monetary values should use:

```text
NUMERIC(12,2)
```

Do not use floating-point types for money.

Example:

```text
amount NUMERIC(12,2)
```

## Currency

Store ISO-style currency codes as text.

Example:

```text
INR
USD
```

The MVP will primarily use INR.

---

# 4. Merchants

## Table

```text
merchants
```

Stores merchant/business information.

### Columns

| Column        | Type        | Constraints      | Description            |
| ------------- | ----------- | ---------------- | ---------------------- |
| id            | UUID        | PK               | Merchant ID            |
| auth_user_id  | UUID        | UNIQUE, NOT NULL | Supabase Auth user ID  |
| business_name | TEXT        | NOT NULL         | Merchant/business name |
| email         | TEXT        | NOT NULL         | Merchant email         |
| currency      | TEXT        | DEFAULT 'INR'    | Default currency       |
| created_at    | TIMESTAMPTZ | NOT NULL         | Creation time          |
| updated_at    | TIMESTAMPTZ | NOT NULL         | Last update            |

### Relationship

```text
Supabase Auth User
        │
        ▼
    merchants
```

A merchant owns all application data associated with that merchant.

---

# 5. Customers

## Table

```text
customers
```

Stores customers belonging to a merchant.

### Columns

| Column                  | Type          | Constraints | Description                   |
| ----------------------- | ------------- | ----------- | ----------------------------- |
| id                      | UUID          | PK          | Customer ID                   |
| merchant_id             | UUID          | FK          | Merchant owner                |
| external_customer_id    | TEXT          | NULLABLE    | Optional external provider ID |
| name                    | TEXT          | NOT NULL    | Customer name                 |
| email                   | TEXT          | NOT NULL    | Customer email                |
| phone                   | TEXT          | NULLABLE    | Customer phone                |
| total_transactions      | INTEGER       | DEFAULT 0   | Number of transactions        |
| successful_transactions | INTEGER       | DEFAULT 0   | Successful transactions       |
| total_spend             | NUMERIC(12,2) | DEFAULT 0   | Lifetime spend                |
| created_at              | TIMESTAMPTZ   | NOT NULL    | Creation time                 |
| updated_at              | TIMESTAMPTZ   | NOT NULL    | Last update                   |

### Relationship

```text
merchant
   │
   └── customers
```

A customer belongs to exactly one merchant in the MVP.

---

# 6. Transactions

## Table

```text
transactions
```

Stores payment transaction information.

### Columns

| Column                  | Type          | Constraints   | Description                     |
| ----------------------- | ------------- | ------------- | ------------------------------- |
| id                      | UUID          | PK            | Transaction ID                  |
| merchant_id             | UUID          | FK            | Merchant owner                  |
| customer_id             | UUID          | FK            | Customer                        |
| external_transaction_id | TEXT          | NULLABLE      | Payment provider transaction ID |
| order_id                | TEXT          | NULLABLE      | Merchant order ID               |
| amount                  | NUMERIC(12,2) | NOT NULL      | Transaction amount              |
| currency                | TEXT          | DEFAULT 'INR' | Currency                        |
| status                  | TEXT          | NOT NULL      | Payment status                  |
| payment_method          | TEXT          | NULLABLE      | Payment method                  |
| failure_reason          | TEXT          | NULLABLE      | Failure category                |
| retry_count             | INTEGER       | DEFAULT 0     | Number of retries               |
| last_retry_at           | TIMESTAMPTZ   | NULLABLE      | Last retry time                 |
| paid_at                 | TIMESTAMPTZ   | NULLABLE      | Successful payment time         |
| created_at              | TIMESTAMPTZ   | NOT NULL      | Creation time                   |
| updated_at              | TIMESTAMPTZ   | NOT NULL      | Last update                     |

### Transaction Status

Allowed values:

```text
PENDING
SUCCESS
FAILED
REFUNDED
CANCELLED
```

### Failure Reasons

Initial supported categories:

```text
GATEWAY_TIMEOUT
NETWORK_ERROR
INSUFFICIENT_FUNDS
PAYMENT_METHOD_ERROR
BANK_DECLINED
AUTHENTICATION_FAILED
UNKNOWN
```

The exact failure reason may be more specific internally, but the AI should reason over normalized categories.

---

# 7. Checkout Sessions

## Table

```text
checkout_sessions
```

Stores checkout activity for detecting abandoned checkouts.

### Columns

| Column       | Type          | Constraints   | Description                 |
| ------------ | ------------- | ------------- | --------------------------- |
| id           | UUID          | PK            | Checkout ID                 |
| merchant_id  | UUID          | FK            | Merchant owner              |
| customer_id  | UUID          | FK, NULLABLE  | Customer if identified      |
| session_id   | TEXT          | UNIQUE        | Checkout session identifier |
| amount       | NUMERIC(12,2) | NOT NULL      | Cart/checkout amount        |
| currency     | TEXT          | DEFAULT 'INR' | Currency                    |
| status       | TEXT          | NOT NULL      | Checkout status             |
| started_at   | TIMESTAMPTZ   | NOT NULL      | Checkout start              |
| abandoned_at | TIMESTAMPTZ   | NULLABLE      | Time considered abandoned   |
| completed_at | TIMESTAMPTZ   | NULLABLE      | Completion time             |
| created_at   | TIMESTAMPTZ   | NOT NULL      | Creation time               |
| updated_at   | TIMESTAMPTZ   | NOT NULL      | Last update                 |

### Checkout Status

```text
STARTED
ABANDONED
COMPLETED
EXPIRED
```

---

# 8. Subscriptions

## Table

```text
subscriptions
```

Stores recurring subscription information.

### Columns

| Column                   | Type          | Constraints   | Description          |
| ------------------------ | ------------- | ------------- | -------------------- |
| id                       | UUID          | PK            | Subscription ID      |
| merchant_id              | UUID          | FK            | Merchant owner       |
| customer_id              | UUID          | FK            | Customer             |
| external_subscription_id | TEXT          | NULLABLE      | External provider ID |
| plan_name                | TEXT          | NOT NULL      | Subscription plan    |
| amount                   | NUMERIC(12,2) | NOT NULL      | Recurring amount     |
| currency                 | TEXT          | DEFAULT 'INR' | Currency             |
| status                   | TEXT          | NOT NULL      | Subscription status  |
| next_billing_at          | TIMESTAMPTZ   | NULLABLE      | Next billing date    |
| failed_payment_count     | INTEGER       | DEFAULT 0     | Number of failures   |
| last_payment_failed_at   | TIMESTAMPTZ   | NULLABLE      | Last failed payment  |
| created_at               | TIMESTAMPTZ   | NOT NULL      | Creation time        |
| updated_at               | TIMESTAMPTZ   | NOT NULL      | Last update          |

### Subscription Status

```text
ACTIVE
PAST_DUE
CANCELLED
PAUSED
```

---

# 9. Recovery Opportunities

## Table

```text
opportunities
```

This is the central table for RecoverAI.

Each record represents a potential revenue-recovery opportunity.

### Columns

| Column                | Type          | Constraints   | Description              |
| --------------------- | ------------- | ------------- | ------------------------ |
| id                    | UUID          | PK            | Opportunity ID           |
| merchant_id           | UUID          | FK            | Merchant owner           |
| customer_id           | UUID          | FK            | Customer                 |
| transaction_id        | UUID          | FK, NULLABLE  | Related transaction      |
| checkout_id           | UUID          | FK, NULLABLE  | Related checkout         |
| subscription_id       | UUID          | FK, NULLABLE  | Related subscription     |
| type                  | TEXT          | NOT NULL      | Opportunity type         |
| amount                | NUMERIC(12,2) | NOT NULL      | Revenue at risk          |
| currency              | TEXT          | DEFAULT 'INR' | Currency                 |
| status                | TEXT          | NOT NULL      | Opportunity status       |
| recovery_probability  | NUMERIC(5,2)  | NULLABLE      | AI probability           |
| ai_diagnosis          | TEXT          | NULLABLE      | AI-generated explanation |
| recommended_action    | TEXT          | NULLABLE      | Recommended recovery     |
| recommendation_reason | TEXT          | NULLABLE      | Human-readable reason    |
| detected_at           | TIMESTAMPTZ   | NOT NULL      | Detection time           |
| resolved_at           | TIMESTAMPTZ   | NULLABLE      | Resolution time          |
| created_at            | TIMESTAMPTZ   | NOT NULL      | Creation time            |
| updated_at            | TIMESTAMPTZ   | NOT NULL      | Last update              |

---

# 10. Opportunity Types

Allowed values:

```text
FAILED_PAYMENT
ABANDONED_CHECKOUT
FAILED_SUBSCRIPTION
```

---

# 11. Opportunity Status

Allowed values:

```text
PENDING
ANALYZING
RECOMMENDED
APPROVED
REJECTED
EXECUTING
RECOVERED
FAILED
EXPIRED
```

Typical lifecycle:

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

Alternative paths:

```text
PENDING → REJECTED
PENDING → EXPIRED

APPROVED → FAILED
EXECUTING → FAILED
```

---

# 12. Recovery Actions

## Table

```text
recovery_actions
```

Stores every attempted recovery action.

### Columns

| Column             | Type          | Constraints | Description                |
| ------------------ | ------------- | ----------- | -------------------------- |
| id                 | UUID          | PK          | Action ID                  |
| merchant_id        | UUID          | FK          | Merchant owner             |
| opportunity_id     | UUID          | FK          | Related opportunity        |
| action_type        | TEXT          | NOT NULL    | Action type                |
| status             | TEXT          | NOT NULL    | Action status              |
| amount             | NUMERIC(12,2) | NULLABLE    | Amount involved            |
| approved_by        | UUID          | NULLABLE    | Merchant/auth user         |
| approved_at        | TIMESTAMPTZ   | NULLABLE    | Approval time              |
| executed_at        | TIMESTAMPTZ   | NULLABLE    | Execution time             |
| completed_at       | TIMESTAMPTZ   | NULLABLE    | Completion time            |
| result             | TEXT          | NULLABLE    | Execution result           |
| error_message      | TEXT          | NULLABLE    | Error if failed            |
| external_reference | TEXT          | NULLABLE    | External payment reference |
| created_at         | TIMESTAMPTZ   | NOT NULL    | Creation time              |
| updated_at         | TIMESTAMPTZ   | NOT NULL    | Last update                |

---

# 13. Recovery Action Types

Initial supported values:

```text
RETRY_PAYMENT
SEND_RECOVERY_MESSAGE
CREATE_PAYMENT_LINK
```

Future possibilities:

```text
UPDATE_PAYMENT_METHOD
OFFER_INCENTIVE
CONTACT_CUSTOMER
```

Future action types are outside the MVP.

---

# 14. Recovery Action Status

Allowed values:

```text
PENDING_APPROVAL
APPROVED
REJECTED
EXECUTING
SUCCEEDED
FAILED
CANCELLED
```

---

# 15. AI Analyses

## Table

```text
ai_analyses
```

Stores structured AI analysis results.

This separates AI analysis from the opportunity itself.

### Columns

| Column               | Type         | Constraints | Description                     |
| -------------------- | ------------ | ----------- | ------------------------------- |
| id                   | UUID         | PK          | Analysis ID                     |
| merchant_id          | UUID         | FK          | Merchant owner                  |
| opportunity_id       | UUID         | FK          | Related opportunity             |
| model                | TEXT         | NOT NULL    | AI model used                   |
| diagnosis            | TEXT         | NULLABLE    | Diagnosis                       |
| recovery_probability | NUMERIC(5,2) | NULLABLE    | Probability                     |
| recommended_action   | TEXT         | NULLABLE    | Recommendation                  |
| reasoning_summary    | TEXT         | NULLABLE    | Safe human-readable explanation |
| input_snapshot       | JSONB        | NULLABLE    | Structured analysis input       |
| output_snapshot      | JSONB        | NULLABLE    | Structured AI output            |
| created_at           | TIMESTAMPTZ  | NOT NULL    | Analysis time                   |

### Important

Do not store hidden chain-of-thought.

`reasoning_summary` must contain a concise explanation suitable for the merchant.

Example:

```text
Payment failed because of a temporary gateway timeout.
The customer has completed 6 previous payments successfully.
Similar temporary failures have historically recovered after retry.
```

---

# 16. Audit Logs

## Table

```text
audit_logs
```

Stores the history of important actions.

### Columns

| Column             | Type        | Constraints  | Description           |
| ------------------ | ----------- | ------------ | --------------------- |
| id                 | UUID        | PK           | Audit event ID        |
| merchant_id        | UUID        | FK           | Merchant owner        |
| opportunity_id     | UUID        | FK, NULLABLE | Related opportunity   |
| recovery_action_id | UUID        | FK, NULLABLE | Related action        |
| event_type         | TEXT        | NOT NULL     | Event type            |
| actor_type         | TEXT        | NOT NULL     | Who/what caused event |
| actor_id           | UUID        | NULLABLE     | User/agent ID         |
| message            | TEXT        | NOT NULL     | Human-readable event  |
| metadata           | JSONB       | NULLABLE     | Structured metadata   |
| created_at         | TIMESTAMPTZ | NOT NULL     | Event time            |

---

# 17. Audit Event Types

Initial supported values:

```text
OPPORTUNITY_DETECTED
AI_ANALYSIS_STARTED
AI_ANALYSIS_COMPLETED
AI_RECOMMENDATION_CREATED

MERCHANT_APPROVED
MERCHANT_REJECTED

RECOVERY_STARTED
RECOVERY_SUCCEEDED
RECOVERY_FAILED

PAYMENT_VERIFIED
OPPORTUNITY_RESOLVED
```

---

# 18. Actor Types

Allowed values:

```text
MERCHANT
AI_AGENT
SYSTEM
WEBHOOK
```

Example:

```text
actor_type = AI_AGENT
```

for an AI-generated recommendation.

---

# 19. Relationships

## Merchant → Customers

```text
merchants.id
      ↓
customers.merchant_id
```

One merchant can have many customers.

---

## Customer → Transactions

```text
customers.id
      ↓
transactions.customer_id
```

One customer can have many transactions.

---

## Customer → Checkouts

```text
customers.id
      ↓
checkout_sessions.customer_id
```

A customer can have multiple checkout sessions.

---

## Customer → Subscriptions

```text
customers.id
      ↓
subscriptions.customer_id
```

A customer can have multiple subscriptions over time.

---

## Transactions → Opportunities

```text
transactions.id
      ↓
opportunities.transaction_id
```

A transaction may generate a recovery opportunity.

---

## Checkouts → Opportunities

```text
checkout_sessions.id
      ↓
opportunities.checkout_id
```

An abandoned checkout may generate a recovery opportunity.

---

## Subscriptions → Opportunities

```text
subscriptions.id
      ↓
opportunities.subscription_id
```

A failed subscription payment may generate a recovery opportunity.

---

## Opportunities → Recovery Actions

```text
opportunities.id
      ↓
recovery_actions.opportunity_id
```

One opportunity can have multiple recovery attempts.

---

## Opportunities → AI Analyses

```text
opportunities.id
      ↓
ai_analyses.opportunity_id
```

An opportunity can have multiple AI analyses.

---

## Opportunities → Audit Logs

```text
opportunities.id
      ↓
audit_logs.opportunity_id
```

An opportunity can have many audit events.

---

# 20. Revenue Calculations

The dashboard should derive key metrics from database state rather than storing redundant totals whenever practical.

## Revenue at Risk

Revenue associated with unresolved opportunities.

Conceptually:

```text
Revenue At Risk =
SUM(opportunity.amount)
WHERE opportunity.status
IN (
    PENDING,
    ANALYZING,
    RECOMMENDED,
    APPROVED,
    EXECUTING
)
```

---

## Revenue Recovered

Revenue associated with successfully recovered opportunities.

```text
Revenue Recovered =
SUM(opportunity.amount)
WHERE opportunity.status = RECOVERED
```

---

## Recovery Rate

For the MVP:

```text
Recovery Rate =
Recovered Revenue
-----------------
Eligible Revenue
× 100
```

The exact dashboard query should be implemented consistently across the application.

---

# 21. Indexing

Important indexes should be created for frequently queried fields.

Recommended indexes:

```text
customers.merchant_id

transactions.merchant_id
transactions.customer_id
transactions.status
transactions.created_at

checkout_sessions.merchant_id
checkout_sessions.status
checkout_sessions.created_at

subscriptions.merchant_id
subscriptions.status

opportunities.merchant_id
opportunities.status
opportunities.type
opportunities.created_at

recovery_actions.opportunity_id
recovery_actions.status

ai_analyses.opportunity_id

audit_logs.merchant_id
audit_logs.opportunity_id
audit_logs.created_at
```

Composite indexes may be added after query patterns are known.

---

# 22. Row Level Security

Supabase Row Level Security should protect merchant-owned data.

Core principle:

```text
Authenticated Merchant
        ↓
Can access only their merchant data
```

A merchant must not be able to query another merchant's:

* Customers.
* Transactions.
* Checkouts.
* Subscriptions.
* Opportunities.
* Recovery actions.
* AI analyses.
* Audit logs.

Policies should generally use the authenticated Supabase user ID and the merchant's `auth_user_id`.

Server-side service-role operations may bypass RLS when necessary, but service-role credentials must never be exposed to the frontend.

---

# 23. Synthetic Data

The MVP should include synthetic data for development and demonstration.

Recommended approximate dataset:

```text
1 merchant

100–300 customers

1,000+ transactions

50+ failed payments

30+ abandoned checkouts

10+ failed subscriptions

50+ recovery opportunities
```

The exact numbers can change depending on performance and demo requirements.

Synthetic data should contain realistic recovery patterns.

---

# 24. Example Recovery Opportunity

Example record:

```json
{
  "type": "FAILED_PAYMENT",
  "amount": 4999,
  "currency": "INR",
  "status": "RECOMMENDED",
  "recovery_probability": 82.0,
  "ai_diagnosis": "Temporary gateway timeout",
  "recommended_action": "RETRY_PAYMENT",
  "recommendation_reason": "Customer has 6 previous successful payments and the failure appears temporary."
}
```

---

# 25. Example Recovery Lifecycle

```text
Transaction FAILED
        ↓
Opportunity CREATED
        ↓
AI ANALYSIS
        ↓
Recommendation created
        ↓
Merchant APPROVES
        ↓
Recovery Action CREATED
        ↓
Recovery EXECUTING
        ↓
Payment VERIFIED
        ↓
Opportunity RECOVERED
        ↓
Revenue metrics updated
        ↓
Audit trail completed
```

---

# 26. Database Safety Rules

The following rules apply to all application code and AI agents:

1. Never expose Supabase service-role credentials to the frontend.
2. Never allow the AI model to directly execute arbitrary SQL.
3. Never allow the AI model to directly modify payment records.
4. Validate all recovery actions server-side.
5. Never mark an opportunity as recovered before successful verification.
6. Never increase recovered revenue without a corresponding successful recovery record.
7. Preserve audit history.
8. Do not silently delete recovery or audit records.
9. Use transactions where multiple related records must change atomically.
10. Keep database schema changes documented.

---

# 27. Source of Truth

This document is the authoritative definition of the RecoverAI database structure.

Any AI agent modifying database-related code must read this document first.

If a new feature requires a schema change:

```text
Feature Requirement
       ↓
Update DATABASE_SCHEMA.md
       ↓
Create migration
       ↓
Apply migration
       ↓
Update affected application code
       ↓
Update FEATURES.md / CHANGELOG.md
```

Do not modify the database schema only in code without documenting the change.

