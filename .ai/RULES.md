# RecoverAI — AI Development Rules

This file contains the mandatory rules for every AI agent working on RecoverAI.

Before modifying the project, an AI agent MUST read this file and the relevant documentation in `/docs`.

---

# 1. Project Identity

**Project:** RecoverAI

**Purpose:**
RecoverAI is an autonomous revenue recovery agent for merchants.

It identifies revenue that may be lost, analyzes the reason, recommends a safe recovery action, executes the action after approval, verifies the outcome, and records the result.

Core workflow:

```text
Detect
  ↓
Diagnose
  ↓
Score
  ↓
Recommend
  ↓
Merchant Approval
  ↓
Validate
  ↓
Execute
  ↓
Verify
  ↓
Audit
```

The primary goal is to demonstrate a convincing, safe, end-to-end revenue recovery workflow within the hackathon MVP.

---

# 2. Read Before Coding

Before making changes, read:

```text
.ai/RULES.md
docs/PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/FEATURES.md
```

Then read the documentation relevant to your task.

### Database work

Read:

```text
docs/DATABASE_SCHEMA.md
```

### API/backend work

Read:

```text
docs/API_CONTRACT.md
```

### AI work

Read:

```text
docs/AI_AGENT.md
```

### Existing project history

Read:

```text
docs/CHANGELOG.md
```

Never assume undocumented behavior.

---

# 3. Source of Truth

The documentation is the project's source of truth.

Do not invent:

* Database tables
* API endpoints
* Status values
* Recovery actions
* AI tools
* Environment variables
* Business rules
* Architecture patterns

If the implementation conflicts with the documentation, stop and determine which should be updated.

Do not silently introduce a new architecture.

---

# 4. Architecture Rules

The intended architecture is:

```text
Merchant
   ↓
Frontend
   ↓
Supabase
   ├── Authentication
   ├── PostgreSQL
   └── Edge Functions
          ├── Gemini API
          └── Razorpay Test API
```

### Responsibilities

**Frontend**

Responsible for:

* UI
* User interactions
* Displaying data
* Calling backend functions

The frontend must NOT contain:

* Gemini API keys
* Razorpay secret keys
* Sensitive business logic
* Database credentials

---

**Supabase**

Responsible for:

* Database
* Authentication
* Row Level Security
* Server-side Edge Functions
* Backend business logic

---

**Gemini**

Responsible for:

* Reasoning
* Diagnosis
* Analysis
* Recovery probability estimation
* Action recommendations
* Natural-language explanations

Gemini is NOT the backend.

---

**Razorpay**

Responsible for:

* Payment infrastructure
* Test payments
* Payment Links
* Payment status
* Webhooks

---

# 5. Security Rules

These rules are mandatory.

### Never expose secrets

Never place these in frontend code:

```text
GEMINI_API_KEY
RAZORPAY_KEY_SECRET
SUPABASE_SERVICE_ROLE_KEY
```

Only public/client-safe configuration may be exposed to the frontend.

---

### Server-side AI calls

The architecture must remain:

```text
Frontend
   ↓
Supabase Edge Function
   ↓
Gemini API
```

Never:

```text
Frontend
   ↓
Gemini API
```

---

### Server-side Razorpay calls

Sensitive Razorpay operations must happen server-side.

Never expose Razorpay secret credentials to the browser.

---

### Never trust AI output

AI output is treated as an untrusted recommendation.

The backend must validate:

* Requested action
* Opportunity status
* Merchant authorization
* Customer/payment context
* Allowed recovery action
* Recovery amount
* Current payment state

before executing an action.

---

# 6. AI Agent Rules

The AI agent must follow:

```text
Observe → Analyze → Recommend → Wait for Approval
```

The AI agent must NOT:

* Approve its own recommendation
* Execute arbitrary database queries
* Access database credentials
* Access Razorpay secret credentials
* Modify database records directly
* Invent payment information
* Invent recovery results
* Claim a payment succeeded without verification
* Execute unsupported recovery actions

AI probability values are estimates, not guaranteed predictions.

The agent must clearly distinguish between:

```text
Observed fact
Estimated probability
Recommendation
Verified result
```

---

# 7. Allowed Recovery Actions

The MVP supports only:

```text
RETRY_PAYMENT
SEND_RECOVERY_MESSAGE
CREATE_PAYMENT_LINK
NO_ACTION
```

Do not introduce additional financial actions without updating:

```text
docs/API_CONTRACT.md
docs/AI_AGENT.md
docs/FEATURES.md
```

and recording the decision in:

```text
docs/CHANGELOG.md
```

---

# 8. Human-in-the-Loop

The AI recommends.

The merchant approves.

The backend validates.

The system executes.

Correct:

```text
AI
 ↓
Recommendation
 ↓
Merchant
 ↓
Approval
 ↓
Backend Validation
 ↓
Execution
```

Incorrect:

```text
AI
 ↓
Automatic financial action
```

Never remove merchant approval from the core MVP workflow.

---

# 9. Database Rules

Supabase PostgreSQL is the source of truth for application data.

Agents must follow:

```text
docs/DATABASE_SCHEMA.md
```

Do not casually rename:

* Tables
* Columns
* Enums
* Status values
* Relationships

If a schema change is necessary:

1. Update `DATABASE_SCHEMA.md`
2. Update affected API contracts
3. Update affected AI specifications
4. Update implementation
5. Record the change in `CHANGELOG.md`

Prefer additive changes over destructive changes during the hackathon.

---

# 10. API Rules

All backend functions must follow:

```text
docs/API_CONTRACT.md
```

Do not change request/response structures without updating the contract.

Every backend operation should:

* Validate authentication
* Validate inputs
* Validate authorization
* Validate business rules
* Handle errors
* Return predictable responses
* Create audit records where required

---

# 11. Simulation Mode

Simulation Mode is a first-class MVP feature.

The application must be able to demonstrate the recovery workflow without depending completely on Razorpay Test Mode.

Use:

```text
SIMULATION
```

for predictable demonstrations.

Use:

```text
RAZORPAY_TEST
```

when the Razorpay Test Mode integration is available and stable.

The UI should make it clear when a recovery is simulated.

Never fake a successful real payment while presenting it as an actual Razorpay transaction.

---

# 12. Synthetic Data Rules

Synthetic data is allowed and expected for the hackathon.

Synthetic data should look realistic.

Examples:

```text
Failed payment
₹2,499
Customer: Rahul
Reason: Insufficient funds
Recovery probability: 68%
Recommended action: Payment Link
```

Do not use real customer payment information.

Do not commit real credentials, secrets, API keys, or sensitive customer data.

---

# 13. Frontend Rules

The UI should prioritize:

1. Clarity
2. Trust
3. Speed
4. Demonstrability
5. Visual polish

The dashboard should make the following immediately understandable:

* Revenue at risk
* Revenue recovered
* Recovery opportunities
* Recovery probability
* Recommended action
* Current recovery status

Avoid unnecessary screens and features.

Every page must support the core demo story.

---

# 14. AI UX Rules

AI explanations should be understandable to a merchant.

Avoid unnecessary technical language.

Bad:

```text
The Bayesian posterior indicates a 0.71 likelihood
based on historical feature distributions.
```

Better:

```text
This customer has successfully paid 4 of their last 5 invoices.
A payment retry has a high chance of recovering ₹2,499.
```

AI explanations should be:

* Concise
* Evidence-based
* Action-oriented
* Transparent about uncertainty

---

# 15. Error Handling

Never allow an error to silently fail.

Errors should be:

* Captured
* Logged when appropriate
* Returned clearly
* Recoverable where possible

For example:

```text
Razorpay unavailable
        ↓
Switch to Simulation Mode
        ↓
Continue demo safely
```

Do not fabricate external service responses to hide failures.

---

# 16. Code Quality Rules

Prefer:

* Simple code
* Small functions
* Clear names
* Reusable components
* Typed interfaces
* Explicit error handling
* Minimal dependencies

Avoid:

* Overengineering
* Unnecessary abstractions
* Duplicate logic
* Huge components
* Hardcoded secrets
* Dead code
* Unused dependencies

For a 24-hour hackathon, working and understandable code is more important than theoretical scalability.

---

# 17. Agent Ownership

When multiple AI agents are used, each agent should have a clearly defined scope.

Example:

```text
Frontend Agent
→ frontend/

Backend Agent
→ Supabase Edge Functions / backend/

Database Agent
→ database/

AI Agent
→ AI integration and agent logic

Documentation Agent
→ docs/
```

An agent should not modify another agent's area unless explicitly required.

If a cross-area change is necessary, document it clearly.

---

# 18. Before Editing

Every AI agent should answer internally:

```text
1. What am I changing?
2. Which files are involved?
3. Which documentation defines this behavior?
4. Could this break another part of the system?
5. Do I need to update an API/schema/documentation file?
```

Then make the smallest reasonable change.

---

# 19. After Editing

After implementation:

1. Check for syntax errors.
2. Check imports.
3. Check types.
4. Check affected API contracts.
5. Check database compatibility.
6. Check security implications.
7. Run available tests/build commands.
8. Update documentation if behavior changed.
9. Update `CHANGELOG.md` for meaningful architectural changes.

Never claim something works unless it has actually been tested.

---

# 20. Git Rules

Use small, meaningful commits.

Good:

```text
feat: add opportunities endpoint
feat: add recovery approval flow
feat: integrate Gemini analysis
fix: validate recovery amount
docs: update API contract
```

Avoid:

```text
update stuff
changes
final
final2
fixed
```

Before making a large change, check the current Git state.

Do not overwrite or delete another agent's work without understanding it.

---

# 21. Do Not Expand Scope

The MVP is intentionally limited.

Do not spend hackathon time building:

* Complex ML training pipelines
* Production-scale event streaming
* Advanced fraud detection
* Multi-country payment infrastructure
* Complex merchant billing
* Full CRM functionality
* Complex notification infrastructure
* Unnecessary analytics systems
* Features unrelated to revenue recovery

The goal is a convincing working MVP, not a complete fintech platform.

---

# 22. Priority Rule

When choosing between tasks, prioritize:

```text
P0 — Core Demo
P1 — Reliability & Polish
P2 — Nice-to-have
```

A beautiful working recovery flow is more valuable than ten unfinished features.

---

# 23. Core Demo Must Always Work

The most important scenario is:

```text
Failed Payment
      ↓
RecoverAI detects opportunity
      ↓
AI diagnoses failure
      ↓
Recovery probability shown
      ↓
AI recommends action
      ↓
Merchant approves
      ↓
Backend validates
      ↓
Recovery executes
      ↓
Payment/result verified
      ↓
Recovered revenue increases
      ↓
Audit trail updated
```

If a new feature threatens this flow, prioritize protecting the core flow.

---

# 24. Documentation Update Rule

If implementation changes behavior, update the appropriate documentation.

| Change                   | Update               |
| ------------------------ | -------------------- |
| Database                 | `DATABASE_SCHEMA.md` |
| API                      | `API_CONTRACT.md`    |
| AI behavior              | `AI_AGENT.md`        |
| Product scope            | `FEATURES.md`        |
| Architecture             | `ARCHITECTURE.md`    |
| Major decision           | `CHANGELOG.md`       |
| General project behavior | `PROJECT_CONTEXT.md` |

Documentation and implementation must remain consistent.

---

# 25. Final Rule

When uncertain:

**Do not guess.**

First inspect:

```text
.ai/RULES.md
docs/
existing implementation
Git history
```

Then choose the smallest solution consistent with the existing architecture.

RecoverAI should remain:

**Safe → Simple → Demonstrable → Explainable → Reliable**

