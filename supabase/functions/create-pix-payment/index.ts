import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface para tipar a resposta do Mercado Pago e evitar 'any'
interface MPPreferenceResponse {
  init_point: string;
  [key: string]: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) throw new Error("Token ausente no cabeçalho");

    // Validação do usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
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

    // Tipagem da resposta da API externa
    const mpData = (await mpRes.json()) as MPPreferenceResponse;
    
    return new Response(JSON.stringify({ init_point: mpData.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    // Tratamento seguro de erro sem 'any'
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro fatal na função:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});