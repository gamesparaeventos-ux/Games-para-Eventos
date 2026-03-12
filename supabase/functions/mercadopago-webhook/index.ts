import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const paymentId = body?.data?.id || body?.resource?.split("/").pop();
    const type = body?.type || body?.topic;

    if (!paymentId) {
      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders, status: 200 });
    }

    if (type === "payment" || type === "merchant_order") {
      const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MP_ACCESS_TOKEN");
      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!mpRes.ok) throw new Error("Erro ao consultar Mercado Pago");

      const paymentData = await mpRes.json();
      const status = paymentData.status;
      const externalReference = paymentData.external_reference;

      if (status === "approved") {
        let query = supabaseAdmin.from("payments").select("*");
        
        if (externalReference && externalReference !== "null") {
          query = query.eq("id", externalReference);
        } else {
          query = query.eq("mp_payment_id", paymentId.toString());
        }

        const { data: payment, error: pError } = await query.single();

        if (pError || !payment) throw new Error("Pagamento não encontrado no banco");

        if (payment.status === "approved") {
          return new Response(JSON.stringify({ message: "Já processado" }), { headers: corsHeaders, status: 200 });
        }

        await supabaseAdmin.from("payments").update({
          status: "approved",
          mp_payment_id: paymentId.toString(),
          approved_at: new Date().toISOString(),
        }).eq("id", payment.id);

        const { data: profile } = await supabaseAdmin.from("profiles").select("credits").eq("id", payment.user_id).single();
        const newCredits = (profile?.credits || 0) + 1;

        await supabaseAdmin.from("profiles").update({ credits: newCredits }).eq("id", payment.user_id);

        await supabaseAdmin.from("credit_transactions").insert({
          user_id: payment.user_id,
          type: "purchase",
          amount: 1,
          reference_id: payment.id,
          description: "Compra Aprovada",
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders, status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), { headers: corsHeaders, status: 400 });
  }
});