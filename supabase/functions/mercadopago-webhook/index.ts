import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Lida com a requisição de pre-flight do navegador (CORS)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 2. Inicializa o cliente Admin do Supabase (ignora RLS para atualizar saldo)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3. Captura os dados enviados pelo Mercado Pago
    const body = await req.json();
    console.log("Notificação recebida do Mercado Pago:", body);

    // O Mercado Pago envia o ID do pagamento de duas formas comuns
    const paymentId = body.data?.id || body.resource?.split('/').pop();
    const type = body.type || body.topic;

    // Só processamos se for uma atualização de pagamento
    if (type === "payment" || type === "merchant_order") {
      
      // 4. Busca os detalhes reais do pagamento na API do Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`,
        },
      });

      if (!mpRes.ok) throw new Error("Erro ao consultar pagamento no Mercado Pago");
      
      const paymentData = await mpRes.json();
      const externalReference = paymentData.external_reference; // Este é o ID da nossa tabela 'payments'
      const status = paymentData.status;

      console.log(`Pagamento ${paymentId} está com status: ${status}`);

      // 5. Se o pagamento foi aprovado, liberamos os créditos
      if (status === "approved") {
        
        // Busca o registro do pagamento pendente no seu banco
        const { data: payment, error: pError } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("id", externalReference)
          .single();

        if (pError || !payment) throw new Error("Pagamento não encontrado no banco de dados");

        // Evita processar o mesmo pagamento duas vezes
        if (payment.status === "approved") {
          return new Response(JSON.stringify({ message: "Pagamento já processado anteriormente" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        // --- INÍCIO DA TRANSAÇÃO LÓGICA ---

        // A. Atualiza a tabela 'payments'
        await supabaseAdmin
          .from("payments")
          .update({ 
            status: "approved", 
            mp_payment_id: paymentId.toString(),
            approved_at: new Date().toISOString() 
          })
          .eq("id", externalReference);

        // B. Adiciona os créditos no 'profiles' do usuário
        // Aqui você define a lógica: Ex: se pagou 0,50 adiciona 1 crédito, ou se pagou 97 adiciona um pacote.
        // Vou assumir que 1 pagamento aprovado = +1 no saldo de créditos.
        const { data: profile, error: profError } = await supabaseAdmin
          .rpc('increment_user_credits', { 
            user_id_input: payment.user_id, 
            amount_to_add: 1 // Altere conforme sua regra de negócio
          });

        if (profError) throw profError;

        // C. Registra em 'credit_transactions' para o histórico
        await supabaseAdmin
          .from("credit_transactions")
          .insert({
            user_id: payment.user_id,
            type: "purchase",
            amount: 1, // Quantidade de créditos
            reference_id: payment.id,
            description: "Compra via Mercado Pago (Pix/Cartão)"
          });

        console.log(`Créditos liberados com sucesso para o usuário: ${payment.user_id}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error("Erro no Webhook:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});