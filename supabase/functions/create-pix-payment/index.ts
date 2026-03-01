import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    console.log("Auth Header recebido:", authHeader ? "Sim" : "Não");

    if (!authHeader) throw new Error("Token ausente no cabeçalho");

    // Validação manual do usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("Erro Auth:", authError);
      return new Response(JSON.stringify({ error: "Sessão inválida", details: authError }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { amount } = await req.json();

    const { data: payment, error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({ user_id: user.id, amount, status: "pending" })
      .select().single();

    if (dbError) throw dbError;

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ title: "Créditos SaaS", quantity: 1, unit_price: amount, currency_id: "BRL" }],
        external_reference: payment.id,
        notification_url: "https://tglnjxmudguztgtusefj.supabase.co/functions/v1/mercadopago-webhook",
      }),
    });

    const mpData = await mpRes.json();
    return new Response(JSON.stringify({ init_point: mpData.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Erro fatal na função:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});