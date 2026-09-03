import type {
  AuditEvent,
  Customer,
  Merchant,
  Opportunity,
  RecoveryAction,
} from "./recover-types";

/**
 * Demo dataset shaped exactly like the backend payloads
 * (merchants / customers / opportunities / recovery_actions / audit_logs).
 * Swap this module for the Supabase-backed loaders (get-dashboard,
 * get-opportunities, ...) without touching any component.
 */

export const demoMerchant: Merchant = {
  id: "mch_9f21",
  name: "Nimbus Retail",
  currency: "INR",
  executionMode: "SIMULATION",
};

export const demoCustomers: Customer[] = [
  {
    id: "cus_rahul",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    successfulPayments: 7,
    lifetimeValue: 18420,
  },
  {
    id: "cus_priya",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    successfulPayments: 3,
    lifetimeValue: 9120,
  },
  {
    id: "cus_ananya",
    name: "Ananya Rao",
    email: "ananya.rao@example.com",
    successfulPayments: 2,
    lifetimeValue: 7400,
  },
  {
    id: "cus_meera",
    name: "Meera Kapoor",
    email: "meera.kapoor@example.com",
    successfulPayments: 1,
    lifetimeValue: 2999,
  },
  {
    id: "cus_arjun",
    name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    successfulPayments: 11,
    lifetimeValue: 14289,
  },
  {
    id: "cus_sneha",
    name: "Sneha Iyer",
    email: "sneha.iyer@example.com",
    successfulPayments: 0,
    lifetimeValue: 0,
  },
];

export const demoOpportunities: Opportunity[] = [
  {
    id: "opp_1",
    customerId: "cus_rahul",
    amount: 2499,
    opportunityType: "FAILED_PAYMENT",
    status: "RECOMMENDED",
    paymentMethod: "UPI",
    failureReason: "Insufficient funds",
    recoveryProbability: 82,
    recommendedAction: "CREATE_PAYMENT_LINK",
    aiReasoning:
      "The customer has successfully completed multiple previous payments. This suggests the failure may be temporary. Creating a fresh payment link gives the customer another opportunity to complete the payment.",
    actionRationale:
      "A fresh payment link gives the customer another opportunity to complete the payment without requiring the merchant to manually intervene.",
    createdAt: "2026-09-02T13:48:00.000Z",
  },
  {
    id: "opp_2",
    customerId: "cus_priya",
    amount: 3499,
    opportunityType: "FAILED_PAYMENT",
    status: "OPEN",
    paymentMethod: "Card",
    failureReason: "Card payment declined",
    recoveryProbability: 64,
    recommendedAction: "RETRY_PAYMENT",
    aiReasoning:
      "Card declines of this type are frequently transient issuer-side failures. A single retry within the safe retry window is the lowest-friction recovery path.",
    actionRationale:
      "Retrying the original payment avoids asking the customer to re-enter details and preserves the existing authorisation context.",
    createdAt: "2026-09-02T12:20:00.000Z",
  },
  {
    id: "opp_3",
    customerId: "cus_ananya",
    amount: 4999,
    opportunityType: "ABANDONED_CHECKOUT",
    status: "OPEN",
    recoveryProbability: 71,
    recommendedAction: "SEND_RECOVERY_MESSAGE",
    aiReasoning:
      "The checkout reached the payment step before it was abandoned, which signals strong purchase intent. A timely reminder with the saved cart is the highest-yield nudge.",
    actionRationale:
      "A recovery message moves no money and is safe to send, while restoring the customer directly into their saved checkout.",
    createdAt: "2026-09-02T11:05:00.000Z",
  },
  {
    id: "opp_4",
    customerId: "cus_meera",
    amount: 2999,
    opportunityType: "ABANDONED_CHECKOUT",
    status: "OPEN",
    recoveryProbability: 59,
    recommendedAction: "SEND_RECOVERY_MESSAGE",
    aiReasoning:
      "First-time customer who abandoned at the address step. Intent is moderate, so a single non-intrusive reminder is appropriate before any discounting.",
    actionRationale:
      "A recovery message keeps acquisition cost at zero and avoids discount leakage on a first order.",
    createdAt: "2026-09-02T10:32:00.000Z",
  },
  {
    id: "opp_5",
    customerId: "cus_arjun",
    amount: 1299,
    opportunityType: "FAILED_SUBSCRIPTION",
    status: "OPEN",
    failureReason: "Payment method declined",
    recoveryProbability: 88,
    recommendedAction: "CREATE_PAYMENT_LINK",
    aiReasoning:
      "Long-tenured subscriber with eleven consecutive successful charges. The mandate is stale rather than the intent — a payment link lets the customer refresh the method themselves.",
    actionRationale:
      "A payment link restores the subscription without cancelling the plan or exposing the merchant to a forced re-charge.",
    createdAt: "2026-09-02T09:14:00.000Z",
  },
  {
    id: "opp_6",
    customerId: "cus_sneha",
    amount: 5999,
    opportunityType: "FAILED_PAYMENT",
    status: "OPEN",
    paymentMethod: "Card",
    failureReason: "Bank declined transaction",
    recoveryProbability: 43,
    recommendedAction: "NO_ACTION",
    aiReasoning:
      "A hard bank decline on a first-time, high-value transaction carries elevated risk. Retrying is unlikely to succeed and may trigger issuer-side flags.",
    actionRationale:
      "No money-moving action is recommended. Keep the opportunity open for manual review by the risk team.",
    createdAt: "2026-09-02T08:41:00.000Z",
  },
];

export const demoActions: RecoveryAction[] = [
  {
    id: "act_seed_1",
    opportunityId: "opp_3",
    customerId: "cus_ananya",
    action: "SEND_RECOVERY_MESSAGE",
    amount: 4999,
    status: "PENDING_APPROVAL",
    executionMode: "SIMULATION",
    createdAt: "2026-09-02T11:07:00.000Z",
  },
];

export const demoAudit: AuditEvent[] = [
  {
    id: "aud_seed_3",
    timestamp: "2026-09-02T13:49:00.000Z",
    actor: "AI Agent",
    event: "Analyzed opportunity",
    opportunityId: "opp_1",
    customerName: "Rahul Sharma",
    action: "Create Payment Link",
    result: "82% recovery probability",
  },
  {
    id: "aud_seed_2",
    timestamp: "2026-09-02T11:07:00.000Z",
    actor: "AI Agent",
    event: "Recommended action",
    opportunityId: "opp_3",
    customerName: "Ananya Rao",
    action: "Send Recovery Message",
    result: "Awaiting merchant approval",
  },
  {
    id: "aud_seed_1",
    timestamp: "2026-09-02T09:15:00.000Z",
    actor: "RecoverAI",
    event: "Detected revenue opportunity",
    opportunityId: "opp_5",
    customerName: "Arjun Mehta",
    result: "Failed subscription · ₹1,299",
  },
];

export const demoTotalRevenue = 13795;
