import type { ActionStatus, OpportunityStatus, OpportunityType, RecommendedAction } from "./recover-types";

export function inr(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}

export const opportunityTypeLabel: Record<OpportunityType, string> = {
  FAILED_PAYMENT: "Failed Payment",
  ABANDONED_CHECKOUT: "Abandoned Checkout",
  FAILED_SUBSCRIPTION: "Failed Subscription",
};

export const actionLabel: Record<RecommendedAction, string> = {
  RETRY_PAYMENT: "Retry Payment",
  SEND_RECOVERY_MESSAGE: "Send Recovery Message",
  CREATE_PAYMENT_LINK: "Create Payment Link",
  NO_ACTION: "No Action",
};

export const opportunityStatusLabel: Record<OpportunityStatus, string> = {
  OPEN: "Open",
  RECOMMENDED: "Recommended",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  EXECUTING: "Executing",
  RECOVERED: "Recovered",
  REJECTED: "Rejected",
};

export const actionStatusLabel: Record<ActionStatus, string> = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  EXECUTING: "Executing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  VERIFIED: "Verified",
};

export function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (Number.isNaN(mins)) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
