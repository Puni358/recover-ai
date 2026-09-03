import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODEL = "gemini-3.6-flash";

type Opportunity = {
  id: string;
  customer_id: string;
  amount: number;
  opportunity_type: string;
  status: string;
  recommended_action: string | null;
  recovery_probability: number | null;
  failure_reason: string | null;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
};

type Transaction = {
  id: string;
  customer_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  failure_reason: string | null;
  created_at: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return json(
        { error: "Method not allowed." },
        405,
      );
    }

    const authHeader =
      req.headers.get("Authorization");

    if (!authHeader) {
      return json(
        { error: "Missing authorization." },
        401,
      );
    }

    const geminiApiKey =
      Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return json(
        {
          error:
            "Gemini is not configured. GEMINI_API_KEY is missing.",
        },
        500,
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return json(
        {
          error:
            "Supabase environment is not configured.",
        },
        500,
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return json(
        {
          error: "Invalid JSON request body.",
        },
        400,
      );
    }

    const question =
      typeof (body as { question?: unknown })
        ?.question === "string"
        ? (
            body as {
              question: string;
            }
          ).question.trim()
        : "";

    if (!question) {
      return json(
        {
          error: "Question is required.",
        },
        400,
      );
    }

    if (question.length > 1000) {
      return json(
        {
          error: "Question is too long.",
        },
        400,
      );
    }

    /*
     * Authenticated Supabase client.
     */
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Authentication failed:",
        userError,
      );

      return json(
        {
          error:
            "Invalid or expired session.",
        },
        401,
      );
    }

    /*
     * Merchant.
     */
    const {
      data: merchant,
      error: merchantError,
    } = await supabase
      .from("merchants")
      .select("id, name, currency")
      .eq("user_id", user.id)
      .maybeSingle();

    if (merchantError) {
      console.error(
        "Merchant lookup failed:",
        merchantError,
      );

      return json(
        {
          error:
            "Unable to load merchant context.",
        },
        500,
      );
    }

    if (!merchant) {
      return json(
        {
          error:
            "No merchant is linked to this account.",
        },
        404,
      );
    }

    /*
     * Opportunities.
     */
    const {
      data: opportunities,
      error: opportunitiesError,
    } = await supabase
      .from("opportunities")
      .select(
        [
          "id",
          "customer_id",
          "amount",
          "opportunity_type",
          "status",
          "recommended_action",
          "recovery_probability",
          "failure_reason",
          "created_at",
        ].join(", "),
      )
      .eq("merchant_id", merchant.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (opportunitiesError) {
      console.error(
        "Opportunity lookup failed:",
        opportunitiesError,
      );

      return json(
        {
          error:
            "Unable to load opportunity data.",
        },
        500,
      );
    }

    const safeOpportunities =
      (opportunities ?? []) as Opportunity[];

    /*
     * Customers.
     */
    const customerIds = [
      ...new Set(
        safeOpportunities
          .map(
            (opportunity) =>
              opportunity.customer_id,
          )
          .filter(Boolean),
      ),
    ];

    let customers: Customer[] = [];

    if (customerIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("customers")
        .select(
          "id, name, email",
        )
        .in(
          "id",
          customerIds,
        );

      if (error) {
        console.error(
          "Customer lookup failed:",
          error,
        );
      } else {
        customers =
          (data ?? []) as Customer[];
      }
    }

    /*
     * Transactions.
     */
    const {
      data: transactions,
      error: transactionsError,
    } = await supabase
      .from("transactions")
      .select(
        [
          "id",
          "customer_id",
          "amount",
          "status",
          "payment_method",
          "failure_reason",
          "created_at",
        ].join(", "),
      )
      .eq(
        "merchant_id",
        merchant.id,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(100);

    if (transactionsError) {
      console.error(
        "Transaction lookup failed:",
        transactionsError,
      );
    }

    const safeTransactions =
      (transactions ?? []) as Transaction[];

    const customerMap = new Map(
      customers.map(
        (customer) => [
          customer.id,
          customer,
        ],
      ),
    );

    /*
     * Grounded opportunity context.
     */
    const opportunityContext =
      safeOpportunities.map(
        (opportunity) => {
          const customer =
            customerMap.get(
              opportunity.customer_id,
            );

          const customerTransactions =
            safeTransactions.filter(
              (transaction) =>
                transaction.customer_id ===
                opportunity.customer_id,
            );

          const successfulPayments =
            customerTransactions.filter(
              (transaction) =>
                transaction.status ===
                "SUCCESS",
            );

          return {
            id: opportunity.id,
            customer:
              customer?.name ??
              "Unknown customer",
            amount:
              Number(
                opportunity.amount ?? 0,
              ),
            type:
              opportunity.opportunity_type,
            status:
              opportunity.status,
            recommended_action:
              opportunity.recommended_action,
            recovery_probability:
              opportunity.recovery_probability,
            failure_reason:
              opportunity.failure_reason,
            customer_history: {
              successful_payments:
                successfulPayments.length,
              total_transactions:
                customerTransactions.length,
              recent_transactions:
                customerTransactions
                  .slice(0, 5)
                  .map(
                    (transaction) => ({
                      amount:
                        Number(
                          transaction.amount ??
                            0,
                        ),
                      status:
                        transaction.status,
                      payment_method:
                        transaction.payment_method,
                      failure_reason:
                        transaction.failure_reason,
                    }),
                  ),
            },
          };
        },
      );

    const activeOpportunities =
      safeOpportunities.filter(
        (opportunity) =>
          ![
            "RECOVERED",
            "REJECTED",
          ].includes(
            opportunity.status,
          ),
      );

    const revenueAtRisk =
      activeOpportunities.reduce(
        (sum, opportunity) =>
          sum +
          Number(
            opportunity.amount ?? 0,
          ),
        0,
      );

    const recoveredOpportunities =
      safeOpportunities.filter(
        (opportunity) =>
          opportunity.status ===
          "RECOVERED",
      );

    const recoveredRevenue =
      recoveredOpportunities.reduce(
        (sum, opportunity) =>
          sum +
          Number(
            opportunity.amount ?? 0,
          ),
        0,
      );

    /*
     * IMPORTANT:
     *
     * Keep answers concise so the Agent doesn't
     * generate a giant response. This also makes
     * the UI much easier to read during the demo.
     */
    const systemPrompt = `
You are RecoverAI, an AI revenue recovery agent for a merchant.

GROUNDING:
- Use ONLY facts explicitly present in the supplied merchant data.
- Treat database values as authoritative.
- Never invent or infer facts about customers, payments, intent, causes, timing, or outcomes.
- Do not turn a failure reason into a claim about why it happened beyond the recorded reason.
- Do not infer that a problem is temporary, permanent, fixable, intentional, or accidental unless the data explicitly says so.
- Do not claim a customer will pay, return, respond, or convert.
- Recovery probability is a model score, not a guarantee.

WHEN PRIORITIZING:
- Consider ONLY active opportunities: exclude RECOVERED and REJECTED.
- Prefer the opportunity with the highest recovery probability.
- Use amount at risk as a secondary consideration.
- Give ONE clear recommendation unless the merchant asks for a comparison.
- Include customer, amount, recovery probability, and recommended action when available.

WHEN DISCUSSING AN OPPORTUNITY:
- Include the customer, amount, recovery probability, failure reason, and recommended action when available.
- If payment history is relevant, report only the supplied transaction counts unless the merchant explicitly asks for transaction amounts or payment methods.
- Never summarize multiple transactions into a broader claim unless the supplied data explicitly supports that exact claim. 
- Explain why the opportunity matters using observable data only.
- Do not add assumptions about customer intent or future behavior.

WHEN DISCUSSING REVENUE:
- Distinguish clearly between revenue at risk and recovered revenue.
- Revenue at risk means active opportunity amounts that have not been recovered or rejected.
- Recovered revenue means opportunities explicitly marked RECOVERED.
- Never describe revenue at risk as guaranteed recoverable revenue.

SAFETY:
- Never claim that you executed an action.
- Never claim that a payment link was sent.
- Never claim that a customer was charged.
- Never claim that a payment succeeded unless the supplied data explicitly says so.
- Merchant approval and execution are controlled by the RecoverAI workflow.

RESPONSE STYLE:
- Maximum 120 words.
- Use plain text only.
- Do not use Markdown.
- Do not use ** for emphasis.
- Do not use * for bullets.
- Use simple labels such as "Customer:", "Amount:", and "Recovery probability:".
- Keep important numbers readable without special formatting.
- Use short paragraphs or simple line-separated facts.
- Be concise, specific, and decisive.
- Do not repeat the question.
- If the supplied data does not support an answer, say that clearly instead of guessing.

MERCHANT:
${JSON.stringify(merchant)}

SUMMARY:
${JSON.stringify({
  active_opportunities:
    activeOpportunities.length,
  revenue_at_risk:
    revenueAtRisk,
  recovered_count:
    recoveredOpportunities.length,
  recovered_revenue:
    recoveredRevenue,
})}

OPPORTUNITIES:
${JSON.stringify(
  opportunityContext,
)}
`;

    console.log(
      "RecoverAI → Gemini:",
      GEMINI_MODEL,
    );

    console.log(
      "Question:",
      question,
    );

    /*
     * Gemini request.
     */
    const geminiResponse =
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "x-goog-api-key":
              geminiApiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },

            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: question,
                  },
                ],
              },
            ],

            generationConfig: {
              temperature: 0.15,
              maxOutputTokens: 1200,
            },
          }),
        },
      );

    /*
     * Gemini API error.
     */
    if (!geminiResponse.ok) {
      const errorText =
        await geminiResponse.text();

      console.error(
        "Gemini API error:",
        geminiResponse.status,
        errorText,
      );

      let parsedError: unknown =
        null;

      try {
        parsedError =
          JSON.parse(errorText);
      } catch {
        // Ignore JSON parsing failure.
      }

      const apiMessage =
        typeof parsedError ===
          "object" &&
        parsedError !== null &&
        "error" in parsedError
          ? (
              parsedError as {
                error?: {
                  message?: string;
                };
              }
            ).error?.message
          : null;

      return json(
        {
          error:
            apiMessage ??
            `Gemini API returned HTTP ${geminiResponse.status}.`,
          provider: "Gemini",
          model: GEMINI_MODEL,
        },
        502,
      );
    }

    const geminiData =
      await geminiResponse.json();

    /*
     * Log finish reason for debugging.
     */
    const candidate =
      geminiData?.candidates?.[0];

    console.log(
      "Gemini finish reason:",
      candidate?.finishReason ??
        "UNKNOWN",
    );

    /*
     * Extract every text part.
     */
    const parts =
      candidate?.content?.parts;

    const answer =
      Array.isArray(parts)
        ? parts
            .map(
              (
                part: {
                  text?: string;
                },
              ) =>
                typeof part.text ===
                "string"
                  ? part.text
                  : "",
            )
            .join("")
            .trim()
        : "";

    if (!answer) {
      console.error(
        "Gemini returned no text:",
        JSON.stringify(
          geminiData,
        ),
      );

      return json(
        {
          error:
            "Gemini returned an empty response.",
          model: GEMINI_MODEL,
          finishReason:
            candidate?.finishReason ??
            null,
        },
        502,
      );
    }

    /*
     * Return the COMPLETE answer.
     */
    console.log(
      "Gemini answer length:",
      answer.length,
    );

    return json({
      answer,
      model: GEMINI_MODEL,
      grounded: true,

      context: {
        opportunities:
          activeOpportunities.length,
        revenueAtRisk,
        recoveredRevenue,
      },
    });
  } catch (error) {
    console.error(
      "AI agent unexpected error:",
      error,
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected AI agent error.",
      },
      500,
    );
  }
});

function json(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}
