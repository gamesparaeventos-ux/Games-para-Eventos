// @ts-expect-error: Deno std library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Supabase JS import via npm
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interfaces para evitar o uso de 'any'
interface MPWebhookBody {
  data?: { id: string };
  resource?: string;
  type?: string;
  topic?: string;
}

interface MPPaymentData {
  external_reference: string;
  status: string;
  id: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = (await req.json()) as MPWebhookBody;
    console.log("Notificação recebida do Mercado Pago:", body);

    const paymentId = body.data?.id || body.resource?.split('/').pop();
    const type = body.type || body.topic;

    if (type === "payment" || type === "merchant_order") {
      
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`,
        },
      });

      if (!mpRes.ok) throw new Error("Erro ao consultar pagamento no Mercado Pago");
      
      const paymentData = (await mpRes.json()) as MPPaymentData;
      const externalReference = paymentData.external_reference; 
      const status = paymentData.status;

      console.log(`Pagamento ${paymentId} está com status: ${status}`);

      if (status === "approved") {
        const { data: payment, error: pError } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("id", externalReference)
          .single();

        if (pError || !payment) throw new Error("Pagamento não encontrado no banco de dados");

        if (payment.status === "approved") {
          return new Response(JSON.stringify({ message: "Pagamento já processado" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        // A. Atualiza a tabela 'payments'
        await supabaseAdmin
          .from("payments")
          .update({ 
            status: "approved", 
            mp_payment_id: paymentId?.toString(),
            approved_at: new Date().toISOString() 
          })
          .eq("id", externalReference);

        // B. Adiciona os créditos (Removida a variável 'profile' não utilizada)
        const { error: profError } = await supabaseAdmin
          .rpc('increment_user_credits', { 
            user_id_input: payment.user_id, 
            amount_to_add: 1 
          });

        if (profError) throw profError;

        // C. Registra em 'credit_transactions'
        await supabaseAdmin
          .from("credit_transactions")
          .insert({
            user_id: payment.user_id,
            type: "purchase",
            amount: 1,
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

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro no Webhook:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});