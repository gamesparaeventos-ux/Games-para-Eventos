import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Lida com a requisição de segurança (CORS)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 2. Validação do Token (JWT) vindo do frontend [cite: 12, 29]
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado: Token ausente");

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // 
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("JWT ERROR:", authError); // [cite: 13, 23]
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Pega o valor enviado pelo frontend e garante que seja número [cite: 14, 30]
    const { amount } = await req.json();
    const value = Number(amount);

    if (!value || value < 1) { // Valor mínimo de R$ 1,00 [cite: 2, 14, 30]
      return new Response(JSON.stringify({ error: "O valor mínimo é R$ 1,00" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Criação do pagamento no Mercado Pago [cite: 31]
    const externalReference = crypto.randomUUID();
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transaction_amount: value,
        payment_method_id: "pix",
        description: "Créditos - Games para Eventos",
        external_reference: externalReference,
        payer: { email: user.email }
      })
    });

    const payment = await mpResponse.json();

    // 5. Verifica se o Mercado Pago aceitou (Evita Bad Request)
    if (!mpResponse.ok) {
      console.error("MP ERROR:", payment); // [cite: 17, 23]
      throw new Error(payment.message || "Erro ao gerar pagamento no Mercado Pago");
    }

    // 6. Salva o registro no seu banco de dados [cite: 18, 33]
    const { error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: value,
        status: payment.status,
        payment_method: "pix",
        mp_payment_id: String(payment.id),
        mp_external_reference: externalReference,
        pix_qr_code: payment.point_of_interaction.transaction_data.qr_code,
        pix_qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64
      });

    if (dbError) console.error("DB ERROR:", dbError); // [cite: 18, 23]

    // 7. Retorna os dados do PIX para o frontend [cite: 33]
    return new Response(JSON.stringify({
      qr_code: payment.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64,
      status: payment.status
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("EDGE FUNCTION ERROR:", msg); // [cite: 19, 23]
    
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});