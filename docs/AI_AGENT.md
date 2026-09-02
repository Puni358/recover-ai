# RecoverAI — AI Agent Specification

## 1. Purpose

The RecoverAI AI Agent is responsible for analyzing merchant revenue data, identifying potential recovery opportunities, diagnosing revenue loss, estimating recovery probability, recommending recovery actions, and explaining its recommendations.

The AI Agent uses the **Gemini API** as its language model.

Gemini is accessed only through server-side Supabase Edge Functions.

The AI Agent does not have unrestricted access to the database or payment systems.

---

# 2. Agent Philosophy

RecoverAI should behave like a revenue recovery employee rather than a chatbot.

A chatbot primarily answers questions.

RecoverAI should:

```text
OBSERVE
   ↓
ANALYZE
   ↓
REASON
   ↓
RECOMMEND
   ↓
REQUEST APPROVAL
   ↓
EXECUTE
   ↓
VERIFY
   ↓
LEARN FROM RESULT
```

The agent should use real application data rather than inventing information.

---

# 3. Agent Responsibilities

The agent can:

* Analyze failed payments.
* Analyze abandoned checkouts.
* Analyze failed subscriptions.
* Retrieve customer history.
* Diagnose payment problems.
* Estimate recovery probability.
* Recommend recovery actions.
* Explain recommendations.
* Answer merchant questions about revenue leakage.
* Identify high-value recovery opportunities.
* Select appropriate application tools.
* Initiate approved recovery workflows.
* Verify recovery outcomes.
* Record relevant audit events.

---

# 4. Agent Restrictions

The AI Agent must NOT:

* Execute arbitrary SQL.
* Directly access PostgreSQL credentials.
* Directly access Supabase service-role credentials.
* Directly call Razorpay using secrets.
* Change transaction amounts.
* Approve its own recommendations.
* Bypass merchant approval.
* Bypass backend safety rules.
* Mark revenue as recovered without verification.
* Invent transaction information.
* Invent customer information.
* Invent payment results.
* Claim a recovery succeeded without a verified result.

The backend is always authoritative.

---

# 5. Agent Architecture

```text
                    MERCHANT
                       │
                       ▼
                  FRONTEND
                       │
                       ▼
             SUPABASE EDGE FUNCTION
                       │
                       ▼
                  AI AGENT
                       │
                 Gemini API
                       │
                       ▼
              Tool Selection
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
      Database       Analysis     Recovery
       Tools          Tools         Tools
         │             │             │
         └─────────────┼─────────────┘
                       │
                       ▼
                Backend Validation
                       │
                       ▼
               Merchant Approval
                       │
                       ▼
                Recovery Engine
                       │
                 ┌─────┴─────┐
                 ▼           ▼
             Simulation   Razorpay
                           Test API
```

---

# 6. Gemini's Role

Gemini is responsible for reasoning over structured information provided by RecoverAI.

Gemini receives relevant data such as:

```text
Transaction information
Customer history
Failure reason
Checkout information
Subscription information
Previous recovery attempts
Current opportunity state
Available recovery actions
Safety constraints
```

Gemini should return structured decisions rather than unrestricted prose whenever performing an analysis.

---

# 7. Agent Workflow

## Step 1 — Detect

The system identifies potentially recoverable revenue.

Examples:

```text
Failed payment
Abandoned checkout
Failed subscription
```

Detection may be performed by application logic rather than the LLM.

The AI agent can then analyze detected opportunities.

---

# 8. Step 2 — Gather Context

The agent retrieves relevant information using tools.

Example:

```text
get_customer_history(customer_id)
```

The tool may return:

```json
{
  "customerId": "uuid",
  "totalTransactions": 7,
  "successfulTransactions": 6,
  "failedTransactions": 1,
  "totalSpend": 34994
}
```

The agent should use this information when determining recovery likelihood.

---

# 9. Step 3 — Diagnose

The agent analyzes the available information to determine the likely cause of the revenue loss.

Example:

```text
Failure:
GATEWAY_TIMEOUT

Customer history:
6 successful payments

Previous retry:
None
```

Possible diagnosis:

```text
Temporary payment gateway failure.
Customer has a strong successful payment history.
```

The diagnosis must be based only on available information.

If there is insufficient information, the agent should state that rather than inventing a diagnosis.

---

# 10. Step 4 — Calculate Recovery Probability

The system produces a recovery probability between 0 and 100.

Example:

```text
Recovery probability: 82%
```

For the MVP, this can be implemented using a combination of deterministic scoring rules and AI reasoning.

The probability should not be presented as a scientifically validated prediction model.

It should be described as:

> AI-estimated recovery probability.

Example factors:

```text
Previous successful payments
Failure type
Previous recovery success
Transaction amount
Retry count
Customer activity
Time since failure
```

---

# 11. Step 5 — Recommend Action

The agent selects from a limited set of supported actions.

Initial actions:

```text
RETRY_PAYMENT
SEND_RECOVERY_MESSAGE
CREATE_PAYMENT_LINK
NO_ACTION
```

Example:

```text
Problem:
Temporary gateway timeout

Recovery probability:
82%

Recommended action:
RETRY_PAYMENT
```

The agent must not invent unsupported action types.

---

# 12. Step 6 — Explain Recommendation

Every recommendation should include a concise explanation suitable for the merchant.

Example:

```text
Payment failed because of a temporary gateway timeout.

The customer has successfully completed 6 previous payments.

No previous retry has been attempted.

Estimated recovery probability is 82%.

Recommended action:
Retry the payment.
```

The explanation should contain relevant evidence.

It should not expose hidden chain-of-thought.

---

# 13. Step 7 — Merchant Approval

For sensitive actions, the recommendation is shown to the merchant.

Example:

```text
AI Recommendation

Retry payment

Amount:
₹4,999

Recovery probability:
82%

Reason:
Temporary gateway failure and strong customer payment history.

Safety:
Maximum retries: 2

Current retries:
0

[ APPROVE ]    [ REJECT ]
```

The merchant makes the final decision.

---

# 14. Step 8 — Backend Validation

After approval, the recovery request goes through backend validation.

```text
Merchant Approval
       ↓
Backend Validation
       ↓
Merchant owns opportunity?
       ↓
Opportunity eligible?
       ↓
Action supported?
       ↓
Retry limit satisfied?
       ↓
Retry interval satisfied?
       ↓
Amount unchanged?
       ↓
Execute
```

The AI cannot bypass this process.

---

# 15. Step 9 — Execute

The recovery engine executes the approved action.

Possible execution modes:

```text
SIMULATION
RAZORPAY_TEST
```

Example:

```text
Approved
   ↓
Retry / Payment Link
   ↓
External payment system
   ↓
Result
```

---

# 16. Step 10 — Verify

The system must verify whether the recovery actually succeeded.

Example:

```text
Recovery executed
       ↓
Check payment status
       ↓
Payment successful?
   ┌───┴───┐
  YES      NO
   │        │
   ▼        ▼
RECOVERED  FAILED
```

Only verified successful recoveries may increase recovered revenue.

---

# 17. Step 11 — Audit

Important events must be recorded.

Example:

```text
AI_ANALYSIS_STARTED
AI_ANALYSIS_COMPLETED
AI_RECOMMENDATION_CREATED
MERCHANT_APPROVED
RECOVERY_STARTED
RECOVERY_SUCCEEDED
PAYMENT_VERIFIED
```

The audit system must preserve the sequence of events.

---

# 18. Agent Tools

## 18.1 get_failed_payments

Purpose:

Retrieve failed payment opportunities for a merchant.

Input:

```json
{
  "merchantId": "uuid"
}
```

Output:

```json
{
  "payments": [
    {
      "transactionId": "uuid",
      "customerId": "uuid",
      "amount": 4999,
      "failureReason": "GATEWAY_TIMEOUT",
      "retryCount": 0
    }
  ]
}
```

---

# 19. get_customer_history

Purpose:

Retrieve relevant customer payment history.

Input:

```json
{
  "customerId": "uuid"
}
```

Output:

```json
{
  "customerId": "uuid",
  "totalTransactions": 7,
  "successfulTransactions": 6,
  "failedTransactions": 1,
  "totalSpend": 34994,
  "recentTransactions": []
}
```

---

# 20. get_checkout_history

Purpose:

Retrieve checkout behavior relevant to abandoned checkout recovery.

Input:

```json
{
  "customerId": "uuid"
}
```

Output:

```json
{
  "checkouts": [
    {
      "sessionId": "checkout_123",
      "amount": 7999,
      "status": "ABANDONED",
      "startedAt": "2026-09-02T10:00:00Z"
    }
  ]
}
```

---

# 21. get_subscription_history

Purpose:

Retrieve subscription information for failed subscription recovery.

Input:

```json
{
  "customerId": "uuid"
}
```

Output:

```json
{
  "subscriptions": [
    {
      "subscriptionId": "uuid",
      "planName": "Pro",
      "amount": 999,
      "status": "PAST_DUE",
      "failedPaymentCount": 1
    }
  ]
}
```

---

# 22. diagnose_payment_failure

Purpose:

Analyze the available payment information and identify the likely failure category.

Input:

```json
{
  "failureReason": "GATEWAY_TIMEOUT",
  "retryCount": 0,
  "customerHistory": {
    "successfulTransactions": 6,
    "failedTransactions": 1
  }
}
```

Output:

```json
{
  "diagnosis": "Temporary gateway timeout",
  "category": "TEMPORARY_FAILURE"
}
```

---

# 23. calculate_recovery_probability

Purpose:

Estimate the likelihood that the recommended recovery action will succeed.

Input:

```json
{
  "failureCategory": "TEMPORARY_FAILURE",
  "successfulTransactions": 6,
  "failedTransactions": 1,
  "retryCount": 0
}
```

Output:

```json
{
  "probability": 82,
  "confidence": 0.82
}
```

The output must be treated as an estimate, not a guaranteed prediction.

---

# 24. recommend_recovery_action

Purpose:

Select the most appropriate supported recovery action.

Input:

```json
{
  "opportunityType": "FAILED_PAYMENT",
  "recoveryProbability": 82,
  "failureCategory": "TEMPORARY_FAILURE",
  "retryCount": 0
}
```

Output:

```json
{
  "action": "RETRY_PAYMENT",
  "reason": "Temporary failure with strong customer payment history."
}
```

---

# 25. retry_payment

Purpose:

Execute an approved payment retry.

This tool must NOT be directly executable by Gemini without passing backend authorization and safety validation.

Input:

```json
{
  "opportunityId": "uuid"
}
```

Backend validation must verify:

```text
Merchant authorization
Opportunity ownership
Approved status
Supported action
Retry count
Retry interval
Transaction state
```

Output:

```json
{
  "success": true,
  "status": "RECOVERED",
  "amountRecovered": 4999
}
```

or:

```json
{
  "success": false,
  "status": "FAILED",
  "amountRecovered": 0
}
```

---

# 26. send_recovery_message

Purpose:

Send a recovery message or reminder.

For the MVP, this may be simulated.

Input:

```json
{
  "opportunityId": "uuid"
}
```

Output:

```json
{
  "success": true,
  "status": "SENT"
}
```

The application should not claim that a real message was delivered when simulation mode is active.

---

# 27. create_payment_link

Purpose:

Create a Razorpay Test Mode Payment Link for an eligible recovery opportunity.

Input:

```json
{
  "opportunityId": "uuid"
}
```

The backend retrieves the amount from the database.

The frontend and AI must not provide an arbitrary recovery amount.

Output:

```json
{
  "success": true,
  "paymentLinkId": "plink_xxxxx",
  "paymentLink": "https://rzp.io/i/xxxxx",
  "mode": "RAZORPAY_TEST"
}
```

The Razorpay secret key must remain server-side.

---

# 28. verify_payment

Purpose:

Verify the outcome of a recovery action.

Input:

```json
{
  "opportunityId": "uuid"
}
```

Output:

```json
{
  "status": "RECOVERED",
  "amountRecovered": 4999
}
```

or:

```json
{
  "status": "FAILED",
  "amountRecovered": 0
}
```

---

# 29. record_recovery

Purpose:

Record a verified recovery.

Input:

```json
{
  "opportunityId": "uuid",
  "amountRecovered": 4999
}
```

The backend must verify that the recovery was actually successful before recording the recovered amount.

---

# 30. Agent Response Contract

When Gemini analyzes an opportunity, the preferred response format is structured JSON.

Example:

```json
{
  "diagnosis": "Temporary gateway timeout",
  "failureCategory": "TEMPORARY_FAILURE",
  "recoveryProbability": 82,
  "recommendedAction": "RETRY_PAYMENT",
  "reason": "Customer has 6 previous successful payments and no previous retry has been attempted.",
  "confidence": 0.82
}
```

The backend must validate the response before storing or acting on it.

---

# 31. Allowed Actions

Gemini may only recommend:

```text
RETRY_PAYMENT
SEND_RECOVERY_MESSAGE
CREATE_PAYMENT_LINK
NO_ACTION
```

Any other value must be rejected by the backend.

---

# 32. Probability Rules

The MVP should enforce:

```text
0 <= recoveryProbability <= 100
```

Values outside this range are invalid.

The UI should display the value as an AI estimate.

Avoid language such as:

```text
"Guaranteed to recover"
"Will definitely succeed"
```

Prefer:

```text
"AI-estimated recovery probability: 82%"
```

---

# 33. AI Failure Handling

If Gemini is unavailable:

```text
Gemini API
    ↓
Error
    ↓
Application returns controlled error
    ↓
Existing opportunities remain available
```

The application must not fabricate an AI response.

The merchant should be informed that AI analysis is temporarily unavailable.

---

# 34. Invalid AI Response Handling

If Gemini returns malformed or invalid structured output:

```text
Gemini Response
      ↓
Schema Validation
      ↓
Invalid
      ↓
Reject response
      ↓
Create AI error log
      ↓
Do not execute recovery
```

The system must never execute a recovery action from an unvalidated AI response.

---

# 35. Prompting Strategy

The Gemini system prompt should establish:

* RecoverAI's purpose.
* Available tools.
* Supported actions.
* Safety restrictions.
* Required output format.
* Requirement to use provided data only.
* Requirement to state uncertainty.
* Requirement not to invent data.

The system prompt should NOT encourage the model to reveal hidden chain-of-thought.

Instead, request concise decision explanations based on observable evidence.

---

# 36. Agent Memory

The MVP does not require long-term conversational memory.

The agent should retrieve relevant information from the database when needed.

Example:

```text
Merchant asks:
"Which customers should we recover first?"

        ↓

Agent retrieves:
Failed opportunities
Customer history
Amounts
Recovery probabilities
Previous attempts

        ↓

Agent ranks opportunities
```

Database state is the source of truth.

---

# 37. Agent Prioritization

When multiple opportunities exist, the agent may prioritize based on factors such as:

```text
Recovery probability
Revenue amount
Customer history
Failure type
Time sensitivity
Previous recovery attempts
```

Example:

```text
Opportunity A
₹4,999
82% probability

Opportunity B
₹15,000
42% probability

Opportunity C
₹7,500
91% probability
```

The agent may prioritize Opportunity C because it combines meaningful revenue with high recovery probability.

The exact prioritization algorithm may evolve during implementation.

---

# 38. Example End-to-End Agent Run

```text
Merchant:
"Find recoverable revenue from today's failed payments."

        ↓

AI Agent

        ↓

get_failed_payments()

        ↓

43 failed payments found

        ↓

For high-value / eligible opportunities:

get_customer_history()

        ↓

diagnose_payment_failure()

        ↓

calculate_recovery_probability()

        ↓

recommend_recovery_action()

        ↓

Results:

31 high-probability opportunities

₹1.72L potentially recoverable

        ↓

Merchant reviews recommendations

        ↓

Merchant approves selected actions

        ↓

Backend safety validation

        ↓

Recovery execution

        ↓

Verification

        ↓

Audit logging

        ↓

Dashboard updates
```

---

# 39. Important Security Boundary

The most important architectural rule is:

```text
                    GEMINI
                      │
                "I recommend X"
                      │
                      ▼
             BACKEND VALIDATION
                      │
              "Is X allowed?"
                      │
                ┌─────┴─────┐
                ▼           ▼
               YES          NO
                │           │
                ▼           ▼
           EXECUTE        REJECT
```

Gemini provides intelligence.

The backend provides authority.

---

# 40. Source of Truth

This document defines the intended behavior of the RecoverAI AI Agent.

AI coding agents must read this document before modifying agent-related code.

Changes to:

* Agent tools.
* Supported actions.
* AI response structure.
* Safety rules.
* Gemini integration.
* Agent workflow.

must be reflected in this document.

Implementation and documentation should remain synchronized.

