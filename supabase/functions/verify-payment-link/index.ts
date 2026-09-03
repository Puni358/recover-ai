import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Required environment variables are missing.",
        },
        500,
      );
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        {
          success: false,
          error: "Missing authorization header.",
        },
        401,
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
      },
    );

    /*
     * 1. Authenticate merchant
     */
    const {
      data: {
        user,
      },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          success: false,
          error: "Unauthorized.",
        },
        401,
      );
    }

    const body = await req.json();

    const opportunityId = body?.opportunityId;
    const recoveryActionId = body?.recoveryActionId;

    if (!opportunityId || !recoveryActionId) {
      return jsonResponse(
        {
          success: false,
          error:
            "opportunityId and recoveryActionId are required.",
        },
        400,
      );
    }

    /*
     * 2. Find merchant belonging to authenticated user
     */
    const {
      data: merchant,
      error: merchantError,
    } = await supabase
      .from("merchants")
      .select("id, name, currency, execution_mode")
      .eq("user_id", user.id)
      .single();

    if (merchantError || !merchant) {
      return jsonResponse(
        {
          success: false,
          error: "Merchant account not found.",
        },
        404,
      );
    }

    if (merchant.execution_mode !== "RAZORPAY_TEST") {
      return jsonResponse(
        {
          success: false,
          error:
            "Razorpay Test Mode is not enabled for this merchant.",
        },
        400,
      );
    }

    /*
     * 3. Load opportunity
     */
    const {
      data: opportunity,
      error: opportunityError,
    } = await supabase
      .from("opportunities")
      .select(
        `
        id,
        merchant_id,
        customer_id,
        amount,
        recommended_action,
        status
      `,
      )
      .eq("id", opportunityId)
      .eq("merchant_id", merchant.id)
      .single();

    if (opportunityError || !opportunity) {
      return jsonResponse(
        {
          success: false,
          error: "Opportunity not found.",
        },
        404,
      );
    }

    /*
     * 4. Load recovery action
     */
    const {
      data: recoveryAction,
      error: recoveryActionError,
    } = await supabase
      .from("recovery_actions")
      .select("*")
      .eq("id", recoveryActionId)
      .eq("opportunity_id", opportunityId)
      .eq("merchant_id", merchant.id)
      .single();

    if (recoveryActionError || !recoveryAction) {
      return jsonResponse(
        {
          success: false,
          error: "Recovery action not found.",
        },
        404,
      );
    }

    /*
     * 5. Validate recovery action
     */
    if (
      recoveryAction.action_type !==
      "CREATE_PAYMENT_LINK"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "This recovery action is not a Payment Link action.",
        },
        400,
      );
    }

    if (
      recoveryAction.execution_mode !==
      "RAZORPAY_TEST"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "This recovery action is not configured for Razorpay Test Mode.",
        },
        400,
      );
    }

    if (!recoveryAction.external_reference) {
      return jsonResponse(
        {
          success: false,
          error:
            "No Razorpay Payment Link is associated with this recovery action.",
        },
        400,
      );
    }

    /*
     * 6. Ask Razorpay for the current Payment Link state
     */
    const razorpayAuth = btoa(
      `${razorpayKeyId}:${razorpayKeySecret}`,
    );

    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payment_links/${encodeURIComponent(
        recoveryAction.external_reference,
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${razorpayAuth}`,
          "Content-Type": "application/json",
        },
      },
    );

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay verification error:",
        razorpayData,
      );

      return jsonResponse(
        {
          success: false,
          error:
            razorpayData?.error?.description ??
            "Failed to verify Razorpay Payment Link.",
        },
        502,
      );
    }

    /*
     * 7. Do NOT mark the opportunity recovered merely
     * because the Payment Link exists.
     *
     * Razorpay must report that the link has actually
     * been paid.
     */
    const amountExpected = Number(
      recoveryAction.amount ?? opportunity.amount,
    );

    const amountPaid =
      Number(razorpayData.amount_paid ?? 0) / 100;

    const isPaid =
      razorpayData.status === "paid" &&
      amountPaid >= amountExpected;

    if (!isPaid) {
      return jsonResponse({
        success: true,
        recovered: false,
        status: razorpayData.status ?? "unknown",
        amountPaid,
        amountExpected,
        paymentLinkId:
          razorpayData.id ??
          recoveryAction.external_reference,
        shortUrl:
          razorpayData.short_url ?? null,
        message:
          "Payment has not been completed yet. Recovery remains in EXECUTING state.",
      });
    }

    /*
     * 8. Payment is genuinely successful.
     *
     * Update the recovery action first.
     */
    const {
      error: actionUpdateError,
    } = await supabase
      .from("recovery_actions")
      .update({
        status: "VERIFIED",
        verified_at: new Date().toISOString(),
        result_message:
          `Payment verified via Razorpay: ₹${amountPaid.toFixed(2)} recovered`,
      })
      .eq("id", recoveryAction.id)
      .eq("merchant_id", merchant.id);

    if (actionUpdateError) {
      throw actionUpdateError;
    }

    /*
     * 9. Mark opportunity as recovered.
     */
    const {
      error: opportunityUpdateError,
    } = await supabase
      .from("opportunities")
      .update({
        status: "RECOVERED",
      })
      .eq("id", opportunity.id)
      .eq("merchant_id", merchant.id);

    if (opportunityUpdateError) {
      throw opportunityUpdateError;
    }

    /*
     * 10. Append immutable audit event.
     */
    const {
      error: auditError,
    } = await supabase
      .from("audit_logs")
      .insert({
        merchant_id: merchant.id,
        opportunity_id: opportunity.id,
        recovery_action_id: recoveryAction.id,
        event_type: "RECOVERY_VERIFIED",
        message:
          "Recovery verified successfully through Razorpay.",
        metadata: {
          actor: "RAZORPAY",
          customer_id: opportunity.customer_id,
          action: "CREATE_PAYMENT_LINK",
          payment_link_id:
            razorpayData.id ??
            recoveryAction.external_reference,
          payment_status: razorpayData.status,
          amount_expected: amountExpected,
          amount_paid: amountPaid,
          razorpay_payment_id:
            razorpayData.payments?.[0]?.payment_id ??
            null,
        },
      });

    if (auditError) {
      throw auditError;
    }

    return jsonResponse({
      success: true,
      recovered: true,
      status: "paid",
      amountPaid,
      amountExpected,
      paymentLinkId:
        razorpayData.id ??
        recoveryAction.external_reference,
      shortUrl:
        razorpayData.short_url ?? null,
      message:
        `Recovery verified. ₹${amountPaid.toFixed(2)} successfully recovered.`,
    });
  } catch (error) {
    console.error(
      "verify-payment-link error:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected verification error.",
      },
      500,
    );
  }
});
