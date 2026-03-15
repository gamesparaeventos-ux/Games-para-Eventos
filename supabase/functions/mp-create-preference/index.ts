import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Token ausente" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const jwtPayload = parseJwt(token);

    const userId = jwtPayload?.sub;
    const userEmail = jwtPayload?.email;

    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mpAccessToken =
      Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MP_ACCESS_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Supabase não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: "Token do Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const packageId = body?.package_id;

    let value = 0;
    let title = "Compra de crédito - Games para Eventos";

    if (packageId === "credits_1") {
      value = 0.5;
      title = "1 crédito - Games para Eventos";
    } else if (body?.amount) {
      value = Number(body.amount);
    }

    if (!Number.isFinite(value) || value <= 0) {
      return new Response(JSON.stringify({ error: "Valor inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: internalPayment, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        amount: value,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !internalPayment) {
      console.error("Erro ao criar pagamento interno:", insertError);
      return new Response(JSON.stringify({ error: "Não foi possível criar pagamento interno" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idempotencyKey = crypto.randomUUID();
    const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

    const payload = {
      items: [
        {
          id: packageId || "credits_1",
          title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: value,
        },
      ],
      payer: {
        email: userEmail,
      },
      external_reference: String(internalPayment.id),
      notification_url: webhookUrl,
    };

    console.log("Payload mp-create-preference:", JSON.stringify(payload));

    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const preferenceData = await preferenceResponse.json().catch(() => null);

    console.error("Resposta Mercado Pago mp-create-preference:", preferenceData);

    if (!preferenceResponse.ok || !preferenceData?.id) {
      return new Response(
        JSON.stringify({
          error:
            preferenceData?.message ||
            preferenceData?.error ||
            "Erro ao criar preferência no Mercado Pago",
          details: preferenceData,
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
        mp_preference_id: String(preferenceData.id),
      })
      .eq("id", internalPayment.id);

    if (updateError) {
      console.error("Erro ao salvar mp_preference_id:", updateError);
    }

    return new Response(
      JSON.stringify({
        init_point: preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point ?? null,
        payment_id: internalPayment.id,
        mp_preference_id: String(preferenceData.id),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    console.error("Erro mp-create-preference:", msg);

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});