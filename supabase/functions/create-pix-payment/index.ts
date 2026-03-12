import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Token ausente" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const packageId = body?.package_id;

    let value = 0;

    if (packageId === "credits_1") {
      value = 0.5; // teste
    } else if (body?.amount) {
      value = Number(body.amount);
    }

    if (!Number.isFinite(value) || value < 0.5) {
      return new Response(JSON.stringify({ error: "Valor inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpAccessToken =
      Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MP_ACCESS_TOKEN");

    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: "Token do Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook`;

    const { data: internalPayment, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: value,
        status: "pending",
      })
      .select("id, user_id, amount, status")
      .single();

    if (insertError || !internalPayment) {
      return new Response(JSON.stringify({ error: "Não foi possível criar pagamento interno" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction_amount: value,
        payment_method_id: "pix",
        description: "Compra de 1 crédito - Games para Eventos",
        external_reference: String(internalPayment.id),
        notification_url: webhookUrl,
        payer: {
          email: user.email,
        },
      }),
    });

    const mpData = await mpResponse.json().catch(() => null);

    if (!mpResponse.ok || !mpData?.id) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "error" })
        .eq("id", internalPayment.id);

      console.error("Erro Mercado Pago create-payment:", mpData);

      return new Response(
        JSON.stringify({
          error: mpData?.message || mpData?.error || "Erro ao criar pagamento no Mercado Pago",
          details: mpData,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        mp_payment_id: String(mpData.id),
        status: mpData.status || "pending",
      })
      .eq("id", internalPayment.id);

    if (updateError) {
      console.error("Erro ao atualizar pagamento interno:", updateError.message);
    }

    const qrData = mpData?.point_of_interaction?.transaction_data;

    return new Response(
      JSON.stringify({
        init_point: qrData?.ticket_url ?? null,
        payment_id: internalPayment.id,
        mp_payment_id: String(mpData.id),
        qr_code: qrData?.qr_code ?? null,
        qr_code_base64: qrData?.qr_code_base64 ?? null,
        ticket_url: qrData?.ticket_url ?? null,
        status: mpData.status ?? "pending",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    console.error("Erro create-payment:", msg);

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});