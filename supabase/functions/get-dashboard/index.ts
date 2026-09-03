import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // ========================================================
    // AUTHENTICATED USER
    // ========================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: userError?.message ?? "No authenticated user",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ========================================================
    // MERCHANT
    // ========================================================

    const {
      data: merchant,
      error: merchantError,
    } = await supabase
      .from("merchants")
      .select("id, name, email, currency")
      .eq("user_id", user.id)
      .single();

    if (merchantError || !merchant) {
      return new Response(
        JSON.stringify({
          error: "Merchant not found",
          details: merchantError?.message ?? "No merchant",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const merchantId = merchant.id;

    // ========================================================
    // SUCCESSFUL REVENUE
    // ========================================================

    const {
      data: successfulTransactions,
      error: transactionError,
    } = await supabase
      .from("transactions")
      .select("amount")
      .eq("merchant_id", merchantId)
      .eq("status", "SUCCESS");

    if (transactionError) {
      throw new Error(
        `Transactions query failed: ${transactionError.message}`
      );
    }

    const totalRevenue =
      successfulTransactions?.reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      ) ?? 0;

    // ========================================================
    // OPEN OPPORTUNITIES
    // ========================================================

    const {
      data: opportunities,
      error: opportunitiesError,
    } = await supabase
      .from("opportunities")
      .select(`
        id,
        amount,
        opportunity_type,
        status,
        failure_reason,
        recovery_probability,
        recommended_action,
        customer_id,
        source_transaction_id,
        source_checkout_id,
        source_subscription_id,
        created_at
      `)
      .eq("merchant_id", merchantId)
      .in("status", [
        "OPEN",
        "ANALYZING",
        "RECOMMENDED",
        "APPROVED",
        "EXECUTING",
        "RECOVERED",
        "REJECTED",
      ])
      .order("created_at", {
        ascending: false,
      });

    if (opportunitiesError) {
      throw new Error(
        `Opportunities query failed: ${opportunitiesError.message}`
      );
    }

    // ========================================================
    // LOAD CUSTOMERS
    // ========================================================

    const customerIds = [
      ...new Set(
        (opportunities ?? [])
          .map((opportunity) => opportunity.customer_id)
          .filter(Boolean)
      ),
    ];

    let customers: any[] = [];

    if (customerIds.length > 0) {
      const {
        data,
        error: customersError,
      } = await supabase
        .from("customers")
        .select(
          "id, name, email, phone"
        )
        .in("id", customerIds);

      if (customersError) {
        throw new Error(
          `Customers query failed: ${customersError.message}`
        );
      }

      customers = data ?? [];
    }

    // ========================================================
    // LOAD SOURCE TRANSACTIONS
    // ========================================================

    const transactionIds = [
      ...new Set(
        (opportunities ?? [])
          .map(
            (opportunity) =>
              opportunity.source_transaction_id
          )
          .filter(Boolean)
      ),
    ];

    let sourceTransactions: any[] = [];

    if (transactionIds.length > 0) {
      const {
        data,
        error: sourceTransactionsError,
      } = await supabase
        .from("transactions")
        .select(`
          id,
          amount,
          status,
          payment_method,
          failure_reason,
          created_at
        `)
        .in("id", transactionIds);

      if (sourceTransactionsError) {
        throw new Error(
          `Source transactions query failed: ${sourceTransactionsError.message}`
        );
      }

      sourceTransactions = data ?? [];
    }

    // ========================================================
    // LOAD AI ANALYSES
    // ========================================================

    const opportunityIds = (opportunities ?? []).map(
      (opportunity) => opportunity.id
    );

    let aiAnalyses: any[] = [];

    if (opportunityIds.length > 0) {
      const {
        data,
        error: aiError,
      } = await supabase
        .from("ai_analyses")
        .select(`
          id,
          opportunity_id,
          reasoning,
          recovery_probability,
          recommended_action,
          created_at
        `)
        .in("opportunity_id", opportunityIds)
        .order("created_at", {
          ascending: false,
        });

      if (aiError) {
        throw new Error(
          `AI analyses query failed: ${aiError.message}`
        );
      }

      aiAnalyses = data ?? [];
    }

    // ========================================================
    // ENRICH OPPORTUNITIES
    // ========================================================

    const enrichedOpportunities =
      (opportunities ?? []).map((opportunity) => {
        const customer = customers.find(
          (item) =>
            item.id === opportunity.customer_id
        );

        const transaction =
          sourceTransactions.find(
            (item) =>
              item.id ===
              opportunity.source_transaction_id
          );

        const analysis = aiAnalyses.find(
          (item) =>
            item.opportunity_id === opportunity.id
        );

        return {
          ...opportunity,

          customer: customer ?? null,

          transaction: transaction ?? null,

          ai_analysis: analysis
            ? {
                reasoning: analysis.reasoning,
                recovery_probability:
                  analysis.recovery_probability,
                recommended_action:
                  analysis.recommended_action,
              }
            : null,
        };
      });

    // ========================================================
    // REVENUE AT RISK
    // ========================================================

    const revenueAtRisk =
      enrichedOpportunities.reduce(
        (sum, opportunity) =>
          sum + Number(opportunity.amount),
        0
      );

    // ========================================================
    // RECOVERED REVENUE
    // ========================================================

    const {
      data: recoveredOpportunities,
      error: recoveredError,
    } = await supabase
      .from("opportunities")
      .select("id, amount")
      .eq("merchant_id", merchantId)
      .eq("status", "RECOVERED");

    if (recoveredError) {
      throw new Error(
        `Recovered opportunities query failed: ${recoveredError.message}`
      );
    }

    const recoveredRevenue =
      recoveredOpportunities?.reduce(
        (sum, opportunity) =>
          sum + Number(opportunity.amount),
        0
      ) ?? 0;

    const recoveredCount =
      recoveredOpportunities?.length ?? 0;

    // ========================================================
    // TOTAL OPPORTUNITIES
    // ========================================================

    const {
      count: opportunityCount,
      error: countError,
    } = await supabase
      .from("opportunities")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("merchant_id", merchantId);

    if (countError) {
      throw new Error(
        `Opportunity count failed: ${countError.message}`
      );
    }

    const recoveryRate =
      opportunityCount && opportunityCount > 0
        ? (recoveredCount / opportunityCount) * 100
        : 0;

    // ========================================================
    // FINAL RESPONSE
    // ========================================================

    return new Response(
      JSON.stringify({
        merchant,

        metrics: {
          totalRevenue,
          revenueAtRisk,
          recoveredRevenue,
          opportunityCount:
            opportunityCount ?? 0,
          recoveredCount,
          recoveryRate: Number(
            recoveryRate.toFixed(1)
          ),
        },

        topOpportunities:
          enrichedOpportunities.slice(0, 6),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "get-dashboard error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
