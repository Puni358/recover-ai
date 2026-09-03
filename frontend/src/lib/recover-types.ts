export type OpportunityType = "FAILED_PAYMENT" | "ABANDONED_CHECKOUT" | "FAILED_SUBSCRIPTION";

export type RecommendedAction =
  | "RETRY_PAYMENT"
  | "SEND_RECOVERY_MESSAGE"
  | "CREATE_PAYMENT_LINK"
  | "NO_ACTION";

export type OpportunityStatus =
  | "OPEN"
  | "RECOMMENDED"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "EXECUTING"
  | "RECOVERED"
  | "REJECTED";

export type ActionStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "VERIFIED";

export type ExecutionMode = "SIMULATION" | "RAZORPAY_TEST";

export interface Customer {
  id: string;
  name: string;
  email: string;
  successfulPayments: number;
  lifetimeValue: number;
}

export interface Opportunity {
  id: string;
  customerId: string;
  amount: number;
  opportunityType: OpportunityType;
  status: OpportunityStatus;
  paymentMethod?: string;
  failureReason?: string;
  recoveryProbability: number;
  recommendedAction: RecommendedAction;
  aiReasoning: string;
  actionRationale: string;
  createdAt: string;
}

export interface RecoveryAction {
  id: string;
  opportunityId: string;
  customerId: string;
  action: RecommendedAction;
  amount: number;
  status: ActionStatus;
  executionMode: ExecutionMode;
  createdAt: string;
  result?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: "AI Agent" | "Merchant" | "RecoverAI";
  event: string;
  opportunityId?: string;
  customerName?: string;
  action?: string;
  result?: string;
}

export interface Merchant {
  id: string;
  name: string;
  currency: string;
  executionMode: ExecutionMode;
}
