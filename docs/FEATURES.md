# RecoverAI — Feature Tracker

## Status Legend

* `[ ]` Not started
* `[~]` In progress
* `[x]` Completed
* `[-]` Deferred / Not part of MVP

---

# 1. Project Foundation

* `[x]` GitHub repository created
* `[x]` Project folder structure created
* `[x]` Project context documentation
* `[x]` System architecture documentation
* `[x]` Database schema documentation
* `[x]` API contract documentation
* `[x]` AI agent specification
* `[ ]` Supabase project configured
* `[ ]` Environment variables configured
* `[ ]` `.env.example` created
* `[ ]` Supabase database migrations created
* `[ ]` Database seeded with synthetic data

---

# 2. Authentication

## Merchant Authentication

* `[ ]` Merchant signup
* `[ ]` Merchant login
* `[ ]` Merchant logout
* `[ ]` Authenticated session handling
* `[ ]` Merchant profile
* `[ ]` Protected dashboard routes
* `[ ]` Supabase Row Level Security policies

---

# 3. Dashboard

## Core Metrics

* `[ ]` Recovered revenue
* `[ ]` Revenue at risk
* `[ ]` Recovery rate
* `[ ]` Total recovery opportunities
* `[ ]` Failed payment opportunities
* `[ ]` Abandoned checkout opportunities
* `[ ]` Failed subscription opportunities

## Dashboard Visualizations

* `[ ]` Revenue recovery chart
* `[ ]` Opportunity distribution chart
* `[ ]` Recovery performance chart
* `[ ]` Recent AI actions
* `[ ]` Recent recovery activity

## Dashboard UX

* `[ ]` Loading states
* `[ ]` Empty states
* `[ ]` Error states
* `[ ]` Responsive layout
* `[ ]` Visual polish
* `[ ]` Micro-interactions / animations

---

# 4. Revenue Opportunities

## Opportunity Listing

* `[ ]` Display opportunities
* `[ ]` Filter by type
* `[ ]` Filter by status
* `[ ]` Sort by revenue amount
* `[ ]` Sort by recovery probability
* `[ ]` Display customer information
* `[ ]` Display revenue at risk
* `[ ]` Display recovery probability
* `[ ]` Display recommended action

## Opportunity Types

* `[ ]` Failed payment opportunities
* `[ ]` Abandoned checkout opportunities
* `[ ]` Failed subscription opportunities

---

# 5. Opportunity Details

* `[ ]` Opportunity details page
* `[ ]` Customer information
* `[ ]` Transaction information
* `[ ]` Failure reason
* `[ ]` Customer payment history
* `[ ]` AI diagnosis
* `[ ]` Recovery probability
* `[ ]` Recommended action
* `[ ]` Recommendation explanation
* `[ ]` Safety constraints
* `[ ]` Current recovery status
* `[ ]` Previous recovery attempts

---

# 6. AI Agent

## Agent Interface

* `[ ]` AI Agent page
* `[ ]` Merchant chat input
* `[ ]` AI response display
* `[ ]` Loading state
* `[ ]` Error handling
* `[ ]` Suggested questions

## Agent Capabilities

* `[ ]` Analyze revenue leakage
* `[ ]` Find failed payment opportunities
* `[ ]` Find abandoned checkout opportunities
* `[ ]` Find failed subscription opportunities
* `[ ]` Retrieve customer history
* `[ ]` Diagnose payment failures
* `[ ]` Calculate recovery probability
* `[ ]` Recommend recovery action
* `[ ]` Explain recommendations
* `[ ]` Prioritize recovery opportunities

## Agent Tools

* `[ ]` `get_failed_payments`
* `[ ]` `get_customer_history`
* `[ ]` `get_checkout_history`
* `[ ]` `get_subscription_history`
* `[ ]` `calculate_recovery_probability`
* `[ ]` `diagnose_payment_failure`
* `[ ]` `recommend_recovery_action`
* `[ ]` `retry_payment`
* `[ ]` `send_recovery_message`
* `[ ]` `create_payment_link`
* `[ ]` `verify_payment`
* `[ ]` `record_recovery`

---

# 7. Recovery Workflow

## Merchant Approval

* `[ ]` Display AI recommendation
* `[ ]` Display recovery probability
* `[ ]` Display diagnosis
* `[ ]` Display recommendation reason
* `[ ]` Display safety constraints
* `[ ]` Approve action
* `[ ]` Reject action

## Backend Validation

* `[ ]` Verify authentication
* `[ ]` Verify merchant ownership
* `[ ]` Verify opportunity state
* `[ ]` Verify action type
* `[ ]` Verify retry limits
* `[ ]` Verify retry interval
* `[ ]` Verify transaction eligibility
* `[ ]` Verify amount
* `[ ]` Prevent duplicate execution

## Recovery Execution

* `[ ]` Simulation mode
* `[ ]` Recovery execution
* `[ ]` Recovery result handling
* `[ ]` Payment verification
* `[ ]` Mark opportunity recovered
* `[ ]` Mark opportunity failed
* `[ ]` Update recovery metrics

---

# 8. Razorpay Integration

## Test Mode

* `[ ]` Create Razorpay Test API credentials
* `[ ]` Store Razorpay secrets securely
* `[ ]` Test API connection
* `[ ]` Create Payment Link
* `[ ]` Store Razorpay external reference
* `[ ]` Handle test payment
* `[ ]` Verify payment result

## Webhooks

* `[ ]` Create webhook endpoint
* `[ ]` Verify webhook signature
* `[ ]` Handle payment link events
* `[ ]` Update transaction status
* `[ ]` Update recovery status
* `[ ]` Create audit event
* `[ ]` Ensure webhook idempotency

## Fallback

* `[ ]` Simulation mode works without Razorpay
* `[ ]` Demo remains functional if Razorpay is unavailable

---

# 9. Audit Trail

* `[ ]` Audit trail page
* `[ ]` Display event timeline
* `[ ]` Display timestamps
* `[ ]` Display actor
* `[ ]` Display event type
* `[ ]` Display human-readable message
* `[ ]` Display relevant metadata

## Events

* `[ ]` Opportunity detected
* `[ ]` AI analysis started
* `[ ]` AI analysis completed
* `[ ]` AI recommendation created
* `[ ]` Merchant approved
* `[ ]` Merchant rejected
* `[ ]` Recovery started
* `[ ]` Recovery succeeded
* `[ ]` Recovery failed
* `[ ]` Payment verified
* `[ ]` Opportunity resolved

---

# 10. Synthetic Data

* `[ ]` Create merchant seed data
* `[ ]` Create customer seed data
* `[ ]` Create successful transactions
* `[ ]` Create failed transactions
* `[ ]` Create abandoned checkout data
* `[ ]` Create failed subscription data
* `[ ]` Create recovery opportunities
* `[ ]` Create historical recovery actions
* `[ ]` Create realistic AI analysis examples

## Demo Data Requirements

At least one highly convincing end-to-end recovery case should exist.

Example:

```text
Customer: Rahul
Order: ORD-92831
Amount: ₹4,999

Previous successful payments: 6
Current failure: Gateway timeout

Recovery probability: 82%

Recommended action:
RETRY_PAYMENT

Expected demo result:
Recovery successful
₹4,999 recovered
```

---

# 11. AI Safety

* `[ ]` Gemini API key stored server-side
* `[ ]` Structured Gemini output
* `[ ]` AI response validation
* `[ ]` Allowed action validation
* `[ ]` Recovery probability validation
* `[ ]` No arbitrary SQL access
* `[ ]` No direct Razorpay access from Gemini
* `[ ]` Backend authorization
* `[ ]` Merchant approval
* `[ ]` Retry limits
* `[ ]` Recovery verification
* `[ ]` Audit logging

---

# 12. Error Handling

* `[ ]` Gemini unavailable
* `[ ]` Gemini invalid response
* `[ ]` Supabase database error
* `[ ]` Unauthorized request
* `[ ]` Opportunity not found
* `[ ]` Invalid opportunity state
* `[ ]` Recovery validation failure
* `[ ]` Razorpay API error
* `[ ]` Razorpay webhook error
* `[ ]` Payment verification failure
* `[ ]` Duplicate recovery request

The system must never report a recovery as successful if the result has not been verified.

---

# 13. UI / UX Polish

* `[ ]` Consistent design system
* `[ ]` Responsive desktop layout
* `[ ]` Responsive tablet layout
* `[ ]` Mobile basic support
* `[ ]` Loading animations
* `[ ]` Success animations
* `[ ]` Recovery success state
* `[ ]` AI thinking/loading state
* `[ ]` Toast notifications
* `[ ]` Confirmation states
* `[ ]` Error states
* `[ ]` Empty states
* `[ ]` Accessible buttons and controls
* `[ ]` Clear visual hierarchy

---

# 14. Demo Flow

The following workflow must work reliably from beginning to end:

* `[ ]` Merchant logs in
* `[ ]` Dashboard displays revenue metrics
* `[ ]` Merchant sees revenue at risk
* `[ ]` Merchant opens failed payment opportunity
* `[ ]` AI analysis is displayed
* `[ ]` Recovery probability is displayed
* `[ ]` AI recommendation is displayed
* `[ ]` Merchant approves recovery
* `[ ]` Backend validates action
* `[ ]` Recovery executes
* `[ ]` Payment/recovery is verified
* `[ ]` Opportunity becomes recovered
* `[ ]` Recovered revenue increases
* `[ ]` Audit trail updates
* `[ ]` Merchant can see the complete sequence

---

# 15. Hackathon MVP Priority

## P0 — Must Work

These features are essential.

* `[ ]` Dashboard
* `[ ]` Revenue opportunities
* `[ ]` Opportunity details
* `[ ]` AI diagnosis
* `[ ]` Recovery probability
* `[ ]` AI recommendation
* `[ ]` Merchant approval
* `[ ]` Backend safety validation
* `[ ]` Recovery execution
* `[ ]` Recovery verification
* `[ ]` Recovered revenue update
* `[ ]` Audit trail
* `[ ]` Synthetic data
* `[ ]` Gemini integration
* `[ ]` Simulation mode

---

## P1 — Strongly Recommended

* `[ ]` Razorpay Test Mode
* `[ ]` Razorpay Payment Links
* `[ ]` Razorpay webhooks
* `[ ]` AI Agent chat
* `[ ]` Opportunity filtering
* `[ ]` Recovery analytics
* `[ ]` Polished animations
* `[ ]` Merchant authentication

---

## P2 — Only If Time Allows

* `[ ]` Advanced agent prioritization
* `[ ]` Real-time updates
* `[ ]` Advanced customer segmentation
* `[ ]` Additional recovery actions
* `[ ]` Advanced analytics
* `[ ]` Automated recovery scheduling

---

# 16. Explicitly Out of Scope

These features should NOT be implemented during the 24-hour MVP unless the core product is already complete.

* `[-]` Full accounting system
* `[-]` Full ERP
* `[-]` Advanced fraud detection
* `[-]` Complex machine-learning training pipeline
* `[-]` Production payment processing
* `[-]` Multi-country tax system
* `[-]` Full CRM
* `[-]` Dozens of recovery strategies
* `[-]` Autonomous unrestricted payment execution
* `[-]` Complex merchant organization management

---

# 17. Definition of Done

A feature is considered complete only when:

1. The implementation works.
2. The frontend displays the correct state.
3. Backend validation exists where required.
4. Errors are handled.
5. Relevant audit events are recorded.
6. Documentation is updated if architecture/contracts change.
7. The feature does not break existing functionality.
8. The feature can be demonstrated reliably.

---

# 18. Current Development Priority

The project should generally be developed in this order:

```text
1. Supabase setup
       ↓
2. Database migration
       ↓
3. Synthetic data
       ↓
4. Frontend
       ↓
5. Core Supabase functions
       ↓
6. Gemini integration
       ↓
7. Recovery engine
       ↓
8. Razorpay Test Mode
       ↓
9. Audit trail
       ↓
10. UI polish
       ↓
11. Demo testing
```

Do not prioritize secondary features over completing the end-to-end recovery workflow.

