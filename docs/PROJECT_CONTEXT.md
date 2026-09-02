# RecoverAI — Project Context

## 1. Product Overview

RecoverAI is an AI-powered revenue recovery platform for merchants.

The system identifies revenue that is at risk due to payment failures, abandoned checkouts, and failed subscriptions. It analyzes the available transaction and customer context, diagnoses the likely cause, calculates the probability of successful recovery, recommends an appropriate recovery action, and executes approved actions.

The goal is not simply to show merchants where revenue is being lost.

The goal is to help merchants **recover that revenue** through an AI-assisted, explainable, and controlled workflow.

### Core Value Proposition

> RecoverAI turns lost-revenue detection into an actionable AI recovery workflow.

Instead of:

```text
Revenue Lost
     ↓
Analytics Dashboard
     ↓
Merchant sees the problem
```

RecoverAI aims to provide:

```text
Revenue at Risk
       ↓
AI detects opportunity
       ↓
AI diagnoses problem
       ↓
AI calculates recovery probability
       ↓
AI recommends safest action
       ↓
Merchant approval
       ↓
Recovery action
       ↓
Verify outcome
       ↓
Record recovered revenue
```

---

## 2. Target User

### Primary User

Online merchants and businesses that process customer payments.

The merchant uses RecoverAI to:

* Understand revenue leakage.
* Find recoverable payment failures.
* Identify abandoned checkout opportunities.
* Recover failed subscriptions.
* Review AI recommendations.
* Approve or reject recovery actions.
* Track recovered revenue.
* Understand why the AI made each recommendation.
* Review a complete audit trail.

---

## 3. Core Problem

Merchants lose revenue for reasons that do not necessarily mean the customer intended to stop purchasing.

Examples include:

* Temporary payment failures.
* Gateway or network errors.
* Customer payment-method issues.
* Abandoned checkout sessions.
* Failed recurring subscription payments.

Traditional dashboards may show that a payment failed, but the merchant still has to manually determine:

1. Why did it fail?
2. Is the customer likely to complete the payment?
3. Should we retry?
4. Should we send a payment reminder?
5. Should we create a payment link?
6. When should we take the action?
7. Did the recovery actually succeed?

RecoverAI aims to automate this decision-making process while keeping sensitive actions controlled and auditable.

---

## 4. MVP Scope

The RecoverAI MVP will focus on three revenue-recovery scenarios.

### 4.1 Failed Payment Recovery

When a payment fails:

```text
Payment Failure
      ↓
Analyze failure
      ↓
Analyze customer history
      ↓
Calculate recovery probability
      ↓
Recommend action
      ↓
Merchant approval
      ↓
Retry / recovery action
      ↓
Verify result
```

Example:

```text
Order: ORD-92831
Amount: ₹4,999

Failure:
Temporary gateway timeout

Customer history:
6 previous successful payments

Recovery probability:
82%

Recommended action:
Retry payment
```

---

### 4.2 Abandoned Checkout Recovery

When a customer starts checkout but does not complete payment:

```text
Checkout Started
       ↓
Customer leaves
       ↓
AI evaluates opportunity
       ↓
Recovery probability
       ↓
Personalized recovery action
       ↓
Customer returns
       ↓
Payment completed
```

Potential actions may include:

* Payment reminder.
* Recovery message.
* Payment link.

---

### 4.3 Failed Subscription Recovery

When a recurring subscription payment fails:

```text
Subscription Payment Failed
          ↓
Analyze customer history
          ↓
Identify failure reason
          ↓
Calculate recovery probability
          ↓
Recommend recovery action
          ↓
Merchant approval if required
          ↓
Retry / payment link / reminder
          ↓
Verify recovery
```

---

## 5. AI Agent

RecoverAI is an **AI agent**, not simply a chatbot.

The AI agent should be capable of using application tools to gather information, reason about revenue opportunities, recommend actions, and participate in recovery workflows.

### Agent Workflow

```text
DETECT
  ↓
DIAGNOSE
  ↓
ANALYZE
  ↓
SCORE
  ↓
RECOMMEND
  ↓
APPROVE
  ↓
EXECUTE
  ↓
VERIFY
  ↓
AUDIT
```

### Agent Responsibilities

The AI agent can:

* Find failed payments.
* Find abandoned checkouts.
* Find failed subscriptions.
* Retrieve customer payment history.
* Analyze failure reasons.
* Calculate recovery probability.
* Recommend recovery actions.
* Explain recommendations.
* Request merchant approval.
* Trigger approved recovery tools.
* Verify recovery results.
* Record the outcome.

### Example Agent Tools

```text
get_failed_payments()
get_customer_history(customer_id)
get_checkout_history(customer_id)
get_subscription_history(customer_id)

calculate_recovery_probability(data)

recommend_recovery_action(data)

retry_payment(transaction_id)

send_recovery_message(customer_id)

create_payment_link(customer_id, amount)

verify_payment(transaction_id)

record_recovery(opportunity_id, amount)
```

The exact implementation of these tools will be defined in `AI_AGENT.md`.

---

## 6. Human-in-the-Loop

RecoverAI should not allow the AI model to have unrestricted control over payment operations.

The architecture separates:

```text
AI Intelligence
       +
Backend Safety Rules
       +
Merchant Approval
```

The AI may recommend an action, but the backend determines whether the action is allowed.

For sensitive recovery actions, the merchant can approve or reject the recommendation.

Example:

```text
AI Recommendation

Retry payment

Recovery probability: 82%

Reason:
Temporary gateway failure and strong customer payment history.

Safety:
Maximum retries: 2

        ↓

[ APPROVE ]    [ REJECT ]
```

Backend validation must always override an AI recommendation if the action violates a safety rule.

---

## 7. Safety Principles

RecoverAI must follow bounded and controlled recovery behavior.

Initial MVP safety rules include:

* Do not modify the original transaction amount.
* Do not expose sensitive payment information.
* Do not execute unauthorized payment actions.
* Limit payment retries.
* Respect minimum intervals between retries.
* Do not retry transactions that are permanently failed.
* Validate every recovery action on the backend.
* Record every significant AI and recovery event.
* Require merchant approval where appropriate.
* Treat AI recommendations as recommendations, not unrestricted commands.

---

## 8. Technology Stack

### Frontend

* React / Next.js depending on the selected frontend implementation.
* TypeScript.
* Tailwind CSS.
* shadcn/ui where appropriate.
* Recharts for analytics and visualization.

### Backend

Supabase will be the primary backend platform.

The project should use Supabase capabilities where appropriate, including:

* Supabase PostgreSQL.
* Supabase Authentication.
* Supabase Edge Functions for server-side operations where required.
* Supabase Row Level Security where appropriate.

Business logic should not be placed directly inside frontend components.

Sensitive operations and secrets must remain server-side.

### Database

PostgreSQL hosted through Supabase.

### AI

OpenAI API will power the AI reasoning layer.

The AI agent will interact with controlled application tools rather than directly accessing the database or payment provider.

### Payments

Razorpay Test Mode may be used for demonstrating payment-related workflows.

The MVP may use synthetic data and simulated recovery outcomes where real payment integration would introduce unnecessary risk or complexity.

### Version Control

GitHub.

---

## 9. Data Strategy

The MVP will primarily use synthetic merchant data to ensure that the complete product can be demonstrated reliably.

The synthetic dataset should contain realistic examples of:

* Customers.
* Successful transactions.
* Failed transactions.
* Failure reasons.
* Abandoned checkouts.
* Subscription failures.
* Recovery opportunities.
* Recovery actions.
* Recovery outcomes.

The dataset should contain intentionally recoverable scenarios so the AI agent can demonstrate meaningful decisions.

Example:

```text
Customer:
Rahul

Transaction:
₹4,999

Previous successful payments:
6

Current status:
Failed

Failure reason:
Gateway timeout

Recovery probability:
82%

Recommended action:
Retry payment

Result:
Recovered
```

---

## 10. Razorpay Integration Strategy

Razorpay integration should be treated as an enhancement to the core MVP rather than a dependency for the entire application.

The application must remain fully demonstrable using synthetic data and simulated recovery flows.

If Razorpay Test Mode integration is stable, it can be used to demonstrate a real payment/recovery flow.

The architecture should therefore support:

```text
                Recovery Action
                      ↓
          ┌───────────┴───────────┐
          ↓                       ↓
   Simulation Mode         Razorpay Test Mode
```

The demo should not fail if the external payment integration is unavailable.

---

## 11. Core Product Pages

The MVP contains five primary pages.

### Dashboard

Purpose:

Give the merchant an immediate overview of revenue recovery.

Key information:

* Recovered revenue.
* Revenue at risk.
* Recovery rate.
* Number of opportunities.
* Revenue by opportunity type.
* Recent AI actions.

---

### Revenue Opportunities

Purpose:

Show revenue that RecoverAI believes may be recoverable.

Categories:

* Failed payments.
* Abandoned checkouts.
* Failed subscriptions.

Each opportunity should display:

* Customer.
* Amount.
* Problem.
* Recovery probability.
* Recommended action.
* Status.

---

### AI Agent

Purpose:

Demonstrate the agent's reasoning and tool-based behavior.

Example merchant query:

> Why did we lose revenue today?

The agent should analyze actual application data and respond using structured information.

Example:

```text
I analyzed today's payment activity.

Revenue at risk:
₹2.84L

Potentially recoverable:
₹1.72L

Primary source:
Failed payments

I identified 31 customers with a high probability
of successful recovery.

Recommended next step:
Retry eligible temporary payment failures.
```

The agent should be able to show the reasoning behind recommendations without exposing hidden chain-of-thought.

---

### Recovery Action

Purpose:

Allow the merchant to inspect and approve/reject an AI recommendation.

The page should show:

* Opportunity ID.
* Customer.
* Amount.
* Failure reason.
* AI diagnosis.
* Recovery probability.
* Recommended action.
* Safety constraints.
* Current status.
* Approve button.
* Reject button.

After successful execution:

```text
Recovery successful

₹4,999 recovered
```

The dashboard metrics should update accordingly.

---

### Audit Trail

Purpose:

Provide transparency into AI and recovery activity.

Example:

```text
10:42:11
AI detected payment failure

10:42:13
Customer history analyzed

10:42:14
Recovery probability calculated: 82%

10:42:15
Action recommended: RETRY_PAYMENT

10:43:02
Merchant approved action

10:43:05
Recovery executed

10:43:09
Payment verified

10:43:09
₹4,999 recovered
```

---

## 12. Product Metrics

The dashboard should focus on metrics that communicate business impact.

### Revenue Recovered

Total revenue successfully recovered by RecoverAI.

### Revenue at Risk

Revenue associated with currently unresolved recovery opportunities.

### Recovery Rate

Percentage of eligible revenue opportunities successfully recovered.

### Recovery Opportunities

Number of currently actionable opportunities.

### Recovery Probability

AI-estimated likelihood that a recovery action will succeed.

---

## 13. Project Architecture Principles

The project should follow these principles:

### Separation of Concerns

Frontend, backend/business logic, database, AI agent, and payment integrations should have clearly defined responsibilities.

### API Contracts

Frontend and backend communication must follow the definitions in `API_CONTRACT.md`.

### Database Contract

Database tables and relationships must follow `DATABASE_SCHEMA.md`.

### AI Boundaries

The AI agent must use controlled tools and must not directly perform unrestricted database or payment operations.

### Auditability

Important AI decisions and recovery actions must be recorded.

### Safety

Backend validation is authoritative.

### Reliability

The application should remain functional when external integrations are unavailable.

### Simplicity

The MVP should prioritize a small number of polished workflows over a large number of incomplete features.

---

## 14. MVP Success Criteria

The MVP is successful when a judge can follow this complete workflow:

```text
Merchant opens RecoverAI
        ↓
Sees ₹ revenue at risk
        ↓
Opens recovery opportunity
        ↓
Views AI diagnosis
        ↓
Sees recovery probability
        ↓
Understands recommended action
        ↓
Approves action
        ↓
Recovery executes
        ↓
Payment/recovery succeeds
        ↓
Recovered revenue increases
        ↓
Audit trail records the entire process
```

The entire flow should be demonstrable within a few minutes.

---

## 15. Non-Goals

The 24-hour MVP will NOT attempt to build:

* Full accounting software.
* Full ERP functionality.
* Production payment processing.
* Advanced fraud detection.
* Complex machine-learning infrastructure.
* Multi-country tax systems.
* Complete CRM functionality.
* Dozens of recovery scenarios.
* Fully autonomous unrestricted payment execution.

These may be considered future extensions but are outside the MVP.

---

## 16. Development Philosophy

RecoverAI should be developed as a modular AI-assisted software project.

Different AI tools may work on different parts of the project.

All AI agents must use the documentation in `/docs` and `/.ai` as the project's source of truth.

No AI agent should assume undocumented architecture or modify unrelated functionality without justification.

When a feature changes the architecture, API, database, or agent behavior, the relevant documentation must be updated.

The goal is to make the project understandable to a new AI agent without requiring the entire conversation history.

