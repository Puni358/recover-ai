# RecoverAI — API Contract

## 1. API Overview

RecoverAI uses Supabase as its backend platform.

The frontend communicates with server-side functionality through Supabase Edge Functions and controlled database access.

The API contract defines the expected operations, inputs, outputs, and error behavior.

AI agents and frontend agents must follow this contract rather than inventing new endpoints or response formats.

---

# 2. Architecture

```text
Frontend
    │
    ▼
Supabase Client
    │
    ├───────────────┐
    │               │
    ▼               ▼
Supabase DB     Edge Functions
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
        Gemini   Recovery   Razorpay
                   Engine     Test API
```

---

# 3. Authentication

Authentication is handled by Supabase Auth.

The frontend obtains an authenticated Supabase session.

Authenticated requests should include the user's session automatically through the Supabase client.

Server-side functions must validate authentication before accessing merchant-specific data.

---

# 4. API Response Convention

Successful responses should use a consistent structure.

Example:

```json
{
  "success": true,
  "data": {}
}
```

Errors should use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

# 5. Dashboard API

## Get Dashboard Metrics

### Function

```text
get-dashboard
```

### Purpose

Returns the merchant's primary revenue recovery metrics.

### Input

No additional input beyond the authenticated merchant session.

### Response

```json
{
  "success": true,
  "data": {
    "recoveredRevenue": 137420,
    "revenueAtRisk": 482000,
    "recoveryRate": 28.4,
    "totalOpportunities": 82,
    "opportunities": {
      "failedPayments": {
        "count": 43,
        "amount": 172000
      },
      "abandonedCheckouts": {
        "count": 28,
        "amount": 74000
      },
      "failedSubscriptions": {
        "count": 11,
        "amount": 38000
      }
    }
  }
}
```

---

# 6. Opportunities API

## Get Opportunities

### Function

```text
get-opportunities
```

### Purpose

Returns revenue recovery opportunities for the authenticated merchant.

### Optional Filters

```text
type
status
limit
offset
```

### Example

```json
{
  "type": "FAILED_PAYMENT",
  "status": "RECOMMENDED",
  "limit": 20,
  "offset": 0
}
```

### Response

```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "uuid",
        "type": "FAILED_PAYMENT",
        "customer": {
          "id": "uuid",
          "name": "Rahul",
          "email": "rahul@example.com"
        },
        "amount": 4999,
        "currency": "INR",
        "status": "RECOMMENDED",
        "recoveryProbability": 82,
        "diagnosis": "Temporary gateway timeout",
        "recommendedAction": "RETRY_PAYMENT",
        "recommendationReason": "Customer has 6 previous successful payments."
      }
    ],
    "total": 43
  }
}
```

---

# 7. Opportunity Details API

## Get Opportunity

### Function

```text
get-opportunity
```

### Input

```json
{
  "opportunityId": "uuid"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "FAILED_PAYMENT",
    "amount": 4999,
    "currency": "INR",
    "status": "RECOMMENDED",

    "customer": {
      "id": "uuid",
      "name": "Rahul",
      "email": "rahul@example.com"
    },

    "transaction": {
      "id": "uuid",
      "status": "FAILED",
      "failureReason": "GATEWAY_TIMEOUT",
      "retryCount": 0
    },

    "aiAnalysis": {
      "diagnosis": "Temporary gateway timeout",
      "recoveryProbability": 82,
      "recommendedAction": "RETRY_PAYMENT",
      "reason": "Customer has 6 previous successful payments."
    }
  }
}
```

---

# 8. AI Analysis API

## Analyze Opportunity

### Function

```text
analyze-opportunity
```

### Purpose

Runs the AI analysis workflow for a recovery opportunity.

### Input

```json
{
  "opportunityId": "uuid"
}
```

### Internal Workflow

```text
Opportunity
     ↓
Retrieve transaction
     ↓
Retrieve customer history
     ↓
Retrieve relevant checkout/subscription data
     ↓
Normalize data
     ↓
Gemini AI
     ↓
Structured analysis
     ↓
Validate AI response
     ↓
Store analysis
     ↓
Create audit event
```

### Response

```json
{
  "success": true,
  "data": {
    "opportunityId": "uuid",
    "diagnosis": "Temporary gateway timeout",
    "recoveryProbability": 82,
    "recommendedAction": "RETRY_PAYMENT",
    "reason": "Customer has 6 successful previous payments and the failure appears temporary."
  }
}
```

---

# 9. AI Agent API

## Ask Agent

### Function

```text
agent-chat
```

### Purpose

Allows the merchant to ask RecoverAI questions about their revenue recovery data.

### Input

```json
{
  "message": "Why did we lose revenue today?"
}
```

### Example Response

```json
{
  "success": true,
  "data": {
    "message": "I analyzed today's recovery data. Revenue at risk is ₹4.82L, with failed payments representing the largest opportunity.",
    "insights": [
      {
        "type": "FAILED_PAYMENT",
        "count": 43,
        "amount": 172000
      }
    ],
    "suggestedAction": "Review high-probability failed payment opportunities."
  }
}
```

The AI agent may call approved application tools to obtain the information required to answer.

The AI agent must not directly execute arbitrary SQL.

---

# 10. Approve Recovery

## Approve Opportunity

### Function

```text
approve-recovery
```

### Purpose

Records merchant approval for a recommended recovery action.

### Input

```json
{
  "opportunityId": "uuid"
}
```

### Backend Validation

The server must verify:

* Merchant owns the opportunity.
* Opportunity exists.
* Opportunity is eligible for approval.
* AI recommendation exists.
* Recommended action is supported.
* Opportunity has not already been resolved.

### Response

```json
{
  "success": true,
  "data": {
    "opportunityId": "uuid",
    "status": "APPROVED",
    "approvedAt": "2026-09-02T12:00:00Z"
  }
}
```

An audit event must be created.

---

# 11. Reject Recovery

## Reject Opportunity

### Function

```text
reject-recovery
```

### Input

```json
{
  "opportunityId": "uuid"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "opportunityId": "uuid",
    "status": "REJECTED"
  }
}
```

An audit event must be created.

---

# 12. Execute Recovery

## Execute Recovery

### Function

```text
execute-recovery
```

### Purpose

Executes an approved recovery action.

### Input

```json
{
  "opportunityId": "uuid"
}
```

### Required Validation

Before execution:

```text
Authenticated?
     ↓
Merchant owns opportunity?
     ↓
Opportunity approved?
     ↓
Action supported?
     ↓
Safety rules satisfied?
     ↓
Retry limits satisfied?
     ↓
Execute
```

If any validation fails, execution must stop.

### Response

Successful simulated recovery:

```json
{
  "success": true,
  "data": {
    "opportunityId": "uuid",
    "status": "RECOVERED",
    "amountRecovered": 4999,
    "currency": "INR",
    "mode": "SIMULATION"
  }
}
```

Successful Razorpay recovery:

```json
{
  "success": true,
  "data": {
    "opportunityId": "uuid",
    "status": "EXECUTING",
    "mode": "RAZORPAY_TEST",
    "externalReference": "plink_xxxxx"
  }
}
```

The opportunity should only become `RECOVERED` after successful verification.

---

# 13. Create Razorpay Payment Link

## Create Payment Link

### Function

```text
create-payment-link
```

### Purpose

Creates a Razorpay Test Mode Payment Link for an eligible recovery opportunity.

### Input

```json
{
  "opportunityId": "uuid"
}
```

The server retrieves the amount and customer information from the database.

The frontend must not provide an arbitrary amount for a recovery operation.

### Internal Flow

```text
Opportunity
     ↓
Validate merchant ownership
     ↓
Validate approved recovery
     ↓
Retrieve amount from database
     ↓
Create Razorpay Payment Link
     ↓
Store external reference
     ↓
Return payment link
```

### Response

```json
{
  "success": true,
  "data": {
    "opportunityId": "uuid",
    "paymentLinkId": "plink_xxxxx",
    "paymentLink": "https://rzp.io/i/xxxxx",
    "mode": "RAZORPAY_TEST"
  }
}
```

The Razorpay secret key must never be exposed to the frontend.

---

# 14. Razorpay Webhook

## Payment Event Webhook

### Function

```text
razorpay-webhook
```

### Purpose

Receives Razorpay webhook events and updates the corresponding recovery workflow.

### Example Events

```text
payment_link.paid
payment_link.cancelled
payment_link.expired
```

The exact event support may be expanded later.

### Flow

```text
Razorpay
    ↓
Webhook
    ↓
Verify webhook signature
    ↓
Identify payment/recovery
    ↓
Update transaction/recovery state
    ↓
Update opportunity
    ↓
Record audit event
```

Webhook processing must be idempotent.

Repeated webhook delivery must not create duplicate recovery records or double-count recovered revenue.

---

# 15. Verify Recovery

## Verify Recovery

### Function

```text
verify-recovery
```

### Purpose

Confirms whether an attempted recovery actually succeeded.

### Input

```json
{
  "opportunityId": "uuid"
}
```

### Response

Successful:

```json
{
  "success": true,
  "data": {
    "status": "RECOVERED",
    "amountRecovered": 4999
  }
}
```

Failed:

```json
{
  "success": true,
  "data": {
    "status": "FAILED",
    "amountRecovered": 0
  }
}
```

Recovered revenue must only be recorded after verification.

---

# 16. Audit API

## Get Audit Logs

### Function

```text
get-audit-logs
```

### Optional Input

```json
{
  "opportunityId": "uuid",
  "limit": 50,
  "offset": 0
}
```

### Response

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "eventType": "AI_RECOMMENDATION_CREATED",
        "actorType": "AI_AGENT",
        "message": "Recovery recommendation created: RETRY_PAYMENT",
        "createdAt": "2026-09-02T12:00:00Z"
      },
      {
        "id": "uuid",
        "eventType": "MERCHANT_APPROVED",
        "actorType": "MERCHANT",
        "message": "Merchant approved recovery action.",
        "createdAt": "2026-09-02T12:01:00Z"
      }
    ]
  }
}
```

---

# 17. Supported Recovery Actions

Initial supported actions:

```text
RETRY_PAYMENT
SEND_RECOVERY_MESSAGE
CREATE_PAYMENT_LINK
```

The backend must reject unsupported action types.

---

# 18. Recovery Modes

The system supports two execution modes.

```text
SIMULATION
RAZORPAY_TEST
```

### Simulation

Used for:

* Development.
* Demo reliability.
* Automated testing.
* Fallback when Razorpay integration is unavailable.

### Razorpay Test

Used for:

* Demonstrating actual payment-provider integration.
* Creating test Payment Links.
* Receiving test webhook events.
* Demonstrating an external payment workflow.

The current mode must be visible in relevant UI where appropriate.

---

# 19. Error Codes

Initial error codes:

```text
UNAUTHENTICATED
UNAUTHORIZED
NOT_FOUND
INVALID_REQUEST

OPPORTUNITY_NOT_ELIGIBLE
APPROVAL_REQUIRED
ACTION_NOT_SUPPORTED

RETRY_LIMIT_REACHED
RETRY_INTERVAL_NOT_MET

AI_SERVICE_ERROR
AI_INVALID_RESPONSE

RAZORPAY_ERROR
PAYMENT_VERIFICATION_FAILED

DATABASE_ERROR
INTERNAL_ERROR
```

---

# 20. HTTP / Function Status Semantics

Where HTTP responses are used:

```text
200
Successful request

201
Resource created

400
Invalid request

401
Unauthenticated

403
Unauthorized

404
Resource not found

409
Invalid state / conflicting operation

422
Validation failure

429
Rate limited

500
Internal server error
```

---

# 21. Security Rules

1. Supabase authentication must be checked for merchant-specific operations.
2. Merchant ownership must be verified server-side.
3. Service-role credentials must never be exposed to the frontend.
4. Razorpay secret credentials must remain server-side.
5. Gemini API keys must remain server-side.
6. The frontend must not provide authoritative transaction amounts for recovery operations.
7. AI-generated actions must pass backend validation.
8. Recovery operations must be idempotent where possible.
9. Webhook signatures must be validated.
10. Sensitive data must not be returned unnecessarily.

---

# 22. AI Output Contract

The AI agent should return structured data when performing recovery analysis.

Example:

```json
{
  "diagnosis": "Temporary gateway timeout",
  "recoveryProbability": 82,
  "recommendedAction": "RETRY_PAYMENT",
  "reason": "Customer has 6 previous successful payments and the failure appears temporary.",
  "confidence": 0.82
}
```

The backend must validate:

```text
recoveryProbability
recommendedAction
required fields
allowed action types
```

The AI response must never be trusted blindly.

---

# 23. AI Tool Contract

The AI agent may access controlled application tools.

Initial tools:

```text
get_failed_payments
get_customer_history
get_checkout_history
get_subscription_history

calculate_recovery_probability
diagnose_payment_failure
recommend_recovery_action

retry_payment
send_recovery_message
create_payment_link
verify_payment
record_recovery
```

Tools must enforce authentication, merchant ownership, authorization, and safety validation.

The AI model must never receive direct database credentials.

---

# 24. API Versioning

The initial MVP does not require multiple API versions.

If breaking changes are introduced later, use:

```text
/api/v1/
```

or an equivalent versioning strategy.

---

# 25. Source of Truth

This document is the authoritative API contract for RecoverAI.

Frontend agents must not invent API response structures.

Backend agents must not silently change API contracts.

If an API contract changes:

```text
Update API_CONTRACT.md
        ↓
Update implementation
        ↓
Update frontend integration
        ↓
Update CHANGELOG.md
```

Any breaking change must be explicitly documented.

