import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        { error: "Supabase environment is not configured" },
        500,
      );
    }

    if (!razorpayKeyId || !razorpayKeySecret) {
      return jsonResponse(
        { error: "Razorpay credentials are not configured" },
        500,
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();

    const opportunityId = body?.opportunityId;
    const recoveryActionId = body?.recoveryActionId;

    if (!opportunityId || !recoveryActionId) {
      return jsonResponse(
        {
          error:
            "opportunityId and recoveryActionId are required",
        },
        400,
      );
    }

    // Make sure this user owns the merchant.
    const { data: merchant, error: merchantError } =
      await supabase
        .from("merchants")
        .select("id, name, currency, execution_mode")
        .eq("user_id", user.id)
        .single();

    if (merchantError || !merchant) {
      return jsonResponse(
        { error: "Merchant not found" },
        404,
      );
    }

    if (merchant.execution_mode !== "RAZORPAY_TEST") {
      return jsonResponse(
        {
          error:
            "Merchant execution mode is not RAZORPAY_TEST",
        },
        400,
      );
    }

    // Load the opportunity.
    const { data: opportunity, error: opportunityError } =
      await supabase
        .from("opportunities")
        .select(
          `
          id,
          merchant_id,
          customer_id,
          amount,
          currency,
          status,
          recommended_action
        `,
        )
        .eq("id", opportunityId)
        .eq("merchant_id", merchant.id)
        .single();

    if (opportunityError || !opportunity) {
      return jsonResponse(
        { error: "Opportunity not found" },
        404,
      );
    }

    if (opportunity.recommended_action !== "CREATE_PAYMENT_LINK") {
      return jsonResponse(
        {
          error:
            "This opportunity does not recommend CREATE_PAYMENT_LINK",
        },
        400,
      );
    }

    // Load the recovery action.
    const { data: recoveryAction, error: actionError } =
      await supabase
        .from("recovery_actions")
        .select(
          `
          id,
          opportunity_id,
          merchant_id,
          action_type,
          status,
          execution_mode,
          amount,
          currency,
          external_reference,
          result_message
        `,
        )
        .eq("id", recoveryActionId)
        .eq("opportunity_id", opportunityId)
        .eq("merchant_id", merchant.id)
        .single();

    if (actionError || !recoveryAction) {
      return jsonResponse(
        { error: "Recovery action not found" },
        404,
      );
    }

    if (recoveryAction.execution_mode !== "RAZORPAY_TEST") {
      return jsonResponse(
        {
          error:
            "Recovery action is not configured for RAZORPAY_TEST",
        },
        400,
      );
    }

    if (recoveryAction.action_type !== "CREATE_PAYMENT_LINK") {
      return jsonResponse(
        {
          error:
            "Recovery action is not CREATE_PAYMENT_LINK",
        },
        400,
      );
    }

    /*
     * Idempotency:
     * If RecoverAI already created a Razorpay Payment Link for this
     * recovery action, don't create a duplicate.
     */
    if (recoveryAction.external_reference) {
      const existingResponse = await fetch(
        `https://api.razorpay.com/v1/payment_links/${encodeURIComponent(
          recoveryAction.external_reference,
        )}`,
        {
          method: "GET",
          headers: {
            Authorization:
              "Basic " +
              btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
          },
        },
      );

      if (existingResponse.ok) {
        const existingLink = await existingResponse.json();

        return jsonResponse({
          success: true,
          existing: true,
          paymentLink: {
            id: existingLink.id,
            shortUrl: existingLink.short_url,
            status: existingLink.status,
            amount: Number(existingLink.amount ?? 0) / 100,
            currency: existingLink.currency,
          },
        });
      }
    }

    // Load customer details.
    const { data: customer, error: customerError } =
      await supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("id", opportunity.customer_id)
        .eq("merchant_id", merchant.id)
        .single();

    if (customerError || !customer) {
      return jsonResponse(
        { error: "Customer not found" },
        404,
      );
    }

    const amount = Math.round(
      Number(recoveryAction.amount) * 100,
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse(
        { error: "Invalid recovery amount" },
        400,
      );
    }

    /*
     * Razorpay reference_id has a maximum length of 40 characters.
     */
    const referenceId =
      `REC-${recoveryAction.id}`.slice(0, 40);

    const razorpayPayload: Record<string, unknown> = {
      amount,
      currency: recoveryAction.currency || "INR",
      accept_partial: false,
      reference_id: referenceId,
      description:
        `RecoverAI recovery payment - ${customer.name}`,
      reminder_enable: false,
      notes: {
        opportunity_id: opportunity.id,
        recovery_action_id: recoveryAction.id,
        merchant_id: merchant.id,
      },
      customer: {
        name: customer.name,
      },
    };

    if (customer.email) {
      (
        razorpayPayload.customer as Record<string, unknown>
      ).email = customer.email;
    }

    if (customer.phone) {
      (
        razorpayPayload.customer as Record<string, unknown>
      ).contact = customer.phone;
    }

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/payment_links",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(razorpayPayload),
      },
    );

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay Payment Link creation failed:",
        razorpayData,
      );

      return jsonResponse(
        {
          error:
            razorpayData?.error?.description ??
            "Razorpay failed to create the payment link",
        },
        razorpayResponse.status,
      );
    }

    const paymentLinkId = razorpayData.id;
    const shortUrl = razorpayData.short_url;

    if (!paymentLinkId || !shortUrl) {
      return jsonResponse(
        {
          error:
            "Razorpay returned an invalid payment link response",
        },
        502,
      );
    }

    const resultMessage =
      `Payment link created: ${shortUrl}`;

    const { error: updateError } =
      await supabase
        .from("recovery_actions")
        .update({
          status: "EXECUTING",
          executed_at: new Date().toISOString(),
          external_reference: paymentLinkId,
          result_message: resultMessage,
          failure_reason: null,
        })
        .eq("id", recoveryAction.id)
        .eq("merchant_id", merchant.id);

    if (updateError) {
      console.error(
        "Failed to save Razorpay reference:",
        updateError,
      );

      return jsonResponse(
        {
          error:
            "Payment link was created, but RecoverAI could not save the result",
          paymentLink: {
            id: paymentLinkId,
            shortUrl,
          },
        },
        500,
      );
    }

    return jsonResponse({
      success: true,
      existing: false,
      paymentLink: {
        id: paymentLinkId,
        shortUrl,
        status: razorpayData.status,
        amount: Number(razorpayData.amount ?? amount) / 100,
        currency:
          razorpayData.currency ??
          recoveryAction.currency ??
          "INR",
      },
    });
  } catch (error) {
    console.error("create-payment-link error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      },
      500,
    );
  }
});
