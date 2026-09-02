-- RecoverAI
-- Demo / Synthetic Data
-- DO NOT use real customer information.

-- ============================================================
-- MERCHANT
-- ============================================================

insert into merchants (
id,
name,
email,
currency
)
values (
'00000000-0000-0000-0000-000000000001',
'Demo Merchant',
'[merchant@recoverai.demo](mailto:merchant@recoverai.demo)',
'INR'
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

insert into customers (
id,
merchant_id,
name,
email,
phone
)
values
(
'00000000-0000-0000-0000-000000000101',
'00000000-0000-0000-0000-000000000001',
'Rahul Sharma',
'[rahul@example.demo](mailto:rahul@example.demo)',
'+919900000001'
),
(
'00000000-0000-0000-0000-000000000102',
'00000000-0000-0000-0000-000000000001',
'Ananya Rao',
'[ananya@example.demo](mailto:ananya@example.demo)',
'+919900000002'
),
(
'00000000-0000-0000-0000-000000000103',
'00000000-0000-0000-0000-000000000001',
'Arjun Mehta',
'[arjun@example.demo](mailto:arjun@example.demo)',
'+919900000003'
),
(
'00000000-0000-0000-0000-000000000104',
'00000000-0000-0000-0000-000000000001',
'Priya Nair',
'[priya@example.demo](mailto:priya@example.demo)',
'+919900000004'
),
(
'00000000-0000-0000-0000-000000000105',
'00000000-0000-0000-0000-000000000001',
'Vikram Singh',
'[vikram@example.demo](mailto:vikram@example.demo)',
'+919900000005'
),
(
'00000000-0000-0000-0000-000000000106',
'00000000-0000-0000-0000-000000000001',
'Sneha Iyer',
'[sneha@example.demo](mailto:sneha@example.demo)',
'+919900000006'
),
(
'00000000-0000-0000-0000-000000000107',
'00000000-0000-0000-0000-000000000001',
'Karan Patel',
'[karan@example.demo](mailto:karan@example.demo)',
'+919900000007'
),
(
'00000000-0000-0000-0000-000000000108',
'00000000-0000-0000-0000-000000000001',
'Meera Kapoor',
'[meera@example.demo](mailto:meera@example.demo)',
'+919900000008'
),
(
'00000000-0000-0000-0000-000000000109',
'00000000-0000-0000-0000-000000000001',
'Rohan Desai',
'[rohan@example.demo](mailto:rohan@example.demo)',
'+919900000009'
),
(
'00000000-0000-0000-0000-000000000110',
'00000000-0000-0000-0000-000000000001',
'Aisha Khan',
'[aisha@example.demo](mailto:aisha@example.demo)',
'+919900000010'
);

-- ============================================================
-- SUCCESSFUL TRANSACTIONS
-- ============================================================

insert into transactions (
id,
merchant_id,
customer_id,
amount,
currency,
status,
razorpay_payment_id,
payment_method,
created_at
)
values
(
'00000000-0000-0000-0000-000000001001',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000101',
2499.00,
'INR',
'SUCCESS',
'pay_demo_1001',
'UPI',
now() - interval '12 days'
),
(
'00000000-0000-0000-0000-000000001002',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000101',
2499.00,
'INR',
'SUCCESS',
'pay_demo_1002',
'UPI',
now() - interval '8 days'
),
(
'00000000-0000-0000-0000-000000001003',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000101',
2499.00,
'INR',
'SUCCESS',
'pay_demo_1003',
'CARD',
now() - interval '5 days'
),
(
'00000000-0000-0000-0000-000000001004',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000102',
4999.00,
'INR',
'SUCCESS',
'pay_demo_1004',
'CARD',
now() - interval '14 days'
),
(
'00000000-0000-0000-0000-000000001005',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000103',
1299.00,
'INR',
'SUCCESS',
'pay_demo_1005',
'UPI',
now() - interval '20 days'
);

-- ============================================================
-- FAILED TRANSACTIONS
-- ============================================================

insert into transactions (
id,
merchant_id,
customer_id,
amount,
currency,
status,
payment_method,
failure_reason,
created_at
)
values
(
'00000000-0000-0000-0000-000000002001',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000101',
2499.00,
'INR',
'FAILED',
'UPI',
'Insufficient funds',
now() - interval '2 hours'
),
(
'00000000-0000-0000-0000-000000002002',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000104',
3499.00,
'INR',
'FAILED',
'CARD',
'Card payment declined',
now() - interval '5 hours'
),
(
'00000000-0000-0000-0000-000000002003',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000105',
1799.00,
'INR',
'FAILED',
'UPI',
'Payment timeout',
now() - interval '8 hours'
),
(
'00000000-0000-0000-0000-000000002004',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000106',
5999.00,
'INR',
'FAILED',
'CARD',
'Bank declined transaction',
now() - interval '1 day'
),
(
'00000000-0000-0000-0000-000000002005',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000107',
899.00,
'INR',
'FAILED',
'UPI',
'Transaction timed out',
now() - interval '2 days'
);

-- ============================================================
-- ABANDONED CHECKOUTS
-- ============================================================

insert into checkout_sessions (
id,
merchant_id,
customer_id,
amount,
currency,
status,
abandoned_at,
created_at
)
values
(
'00000000-0000-0000-0000-000000003001',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000102',
4999.00,
'INR',
'ABANDONED',
now() - interval '3 hours',
now() - interval '4 hours'
),
(
'00000000-0000-0000-0000-000000003002',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000108',
2999.00,
'INR',
'ABANDONED',
now() - interval '7 hours',
now() - interval '8 hours'
),
(
'00000000-0000-0000-0000-000000003003',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000109',
7499.00,
'INR',
'ABANDONED',
now() - interval '1 day',
now() - interval '1 day 1 hour'
);

-- ============================================================
-- FAILED SUBSCRIPTIONS
-- ============================================================

insert into subscriptions (
id,
merchant_id,
customer_id,
amount,
currency,
status,
razorpay_subscription_id,
next_billing_at,
failure_reason,
created_at
)
values
(
'00000000-0000-0000-0000-000000004001',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000103',
1299.00,
'INR',
'PAST_DUE',
'sub_demo_1001',
now() + interval '20 days',
'Payment method declined',
now() - interval '2 days'
),
(
'00000000-0000-0000-0000-000000004002',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000110',
799.00,
'INR',
'PAST_DUE',
'sub_demo_1002',
now() + interval '18 days',
'Insufficient funds',
now() - interval '1 day'
);

-- ============================================================
-- RECOVERY OPPORTUNITIES
-- ============================================================

insert into opportunities (
id,
merchant_id,
customer_id,
opportunity_type,
status,
amount,
currency,
source_transaction_id,
source_checkout_id,
source_subscription_id,
failure_reason,
recovery_probability,
recommended_action,
detected_at
)
values
(
'00000000-0000-0000-0000-000000005001',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000101',
'FAILED_PAYMENT',
'RECOMMENDED',
2499.00,
'INR',
'00000000-0000-0000-0000-000000002001',
null,
null,
'Insufficient funds',
82.00,
'CREATE_PAYMENT_LINK',
now() - interval '2 hours'
),
(
'00000000-0000-0000-0000-000000005002',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000104',
'FAILED_PAYMENT',
'OPEN',
3499.00,
'INR',
'00000000-0000-0000-0000-000000002002',
null,
null,
'Card payment declined',
64.00,
'RETRY_PAYMENT',
now() - interval '5 hours'
),
(
'00000000-0000-0000-0000-000000005003',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000102',
'ABANDONED_CHECKOUT',
'OPEN',
4999.00,
'INR',
null,
'00000000-0000-0000-0000-000000003001',
null,
null,
71.00,
'SEND_RECOVERY_MESSAGE',
now() - interval '3 hours'
),
(
'00000000-0000-0000-0000-000000005004',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000108',
'ABANDONED_CHECKOUT',
'OPEN',
2999.00,
'INR',
null,
'00000000-0000-0000-0000-000000003002',
null,
null,
59.00,
'SEND_RECOVERY_MESSAGE',
now() - interval '7 hours'
),
(
'00000000-0000-0000-0000-000000005005',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000103',
'FAILED_SUBSCRIPTION',
'OPEN',
1299.00,
'INR',
null,
null,
'00000000-0000-0000-0000-000000004001',
'Payment method declined',
88.00,
'CREATE_PAYMENT_LINK',
now() - interval '2 days'
),
(
'00000000-0000-0000-0000-000000005006',
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000000106',
'FAILED_PAYMENT',
'OPEN',
5999.00,
'INR',
'00000000-0000-0000-0000-000000002004',
null,
null,
'Bank declined transaction',
43.00,
'NO_ACTION',
now() - interval '1 day'
);

-- ============================================================
-- AI ANALYSIS
-- ============================================================

insert into ai_analyses (
id,
opportunity_id,
merchant_id,
provider,
model,
diagnosis,
reasoning,
recovery_probability,
recommended_action,
evidence
)
values (
'00000000-0000-0000-0000-000000006001',
'00000000-0000-0000-0000-000000005001',
'00000000-0000-0000-0000-000000000001',
'gemini',
'demo-model',
'The payment failed because the customer did not have sufficient funds at the time of payment.',
'The customer has successfully completed multiple previous payments. This suggests the failure may be temporary. Creating a fresh payment link gives the customer another opportunity to complete the payment.',
82.00,
'CREATE_PAYMENT_LINK',
'[
"Customer has 3 previous successful payments",
"Customer has a recent successful payment history",
"Failure reason indicates insufficient funds",
"Payment amount is ₹2,499"
]'::jsonb
);

-- ============================================================
-- RECOVERY ACTION
-- ============================================================

insert into recovery_actions (
id,
opportunity_id,
merchant_id,
action_type,
status,
execution_mode,
amount,
currency,
result_message
)
values (
'00000000-0000-0000-0000-000000007001',
'00000000-0000-0000-0000-000000005001',
'00000000-0000-0000-0000-000000000001',
'CREATE_PAYMENT_LINK',
'PENDING_APPROVAL',
'SIMULATION',
2499.00,
'INR',
'Awaiting merchant approval.'
);

-- ============================================================
-- AUDIT TRAIL
-- ============================================================

insert into audit_logs (
merchant_id,
opportunity_id,
recovery_action_id,
event_type,
message,
metadata,
created_at
)
values
(
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000005001',
null,
'OPPORTUNITY_DETECTED',
'Failed payment identified as a revenue recovery opportunity.',
'{"amount":2499,"type":"FAILED_PAYMENT"}'::jsonb,
now() - interval '2 hours'
),
(
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000005001',
null,
'AI_ANALYSIS_COMPLETED',
'RecoverAI completed analysis and generated a recovery recommendation.',
'{"probability":82,"recommended_action":"CREATE_PAYMENT_LINK"}'::jsonb,
now() - interval '110 minutes'
),
(
'00000000-0000-0000-0000-000000000001',
'00000000-0000-0000-0000-000000005001',
'00000000-0000-0000-0000-000000007001',
'RECOVERY_RECOMMENDED',
'RecoverAI recommended creating a payment link.',
'{"amount":2499}'::jsonb,
now() - interval '105 minutes'
);

