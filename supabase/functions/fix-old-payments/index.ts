// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore
serve(async (req: any) => {
  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-ignore
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    // @ts-ignore
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

    // 1. Busca todas as transações pendentes
    const { data: pendentes } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending");

    if (!pendentes || pendentes.length === 0) {
      return new Response("Nenhuma transação pendente encontrada.");
    }

    let corrigidos = 0;

    // 2. Para cada pendente, pergunta pro Mercado Pago
    for (const trx of pendentes) {
      // Se não tiver ID da transação, pula
      if (!trx.id) continue;

      // Busca pagamentos que tenham esse external_reference (ID da nossa transaction)
      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${trx.id}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      const mpData = await mpRes.json();
      // Pega o primeiro pagamento encontrado (se houver)
      const payment = mpData.results?.[0];

      if (payment && payment.status === "approved") {
        console.log(`Corrigindo transação ${trx.id}...`);
        
        // Atualiza status
        await supabase
          .from("transactions")
          .update({ status: "approved", payment_id: String(payment.id) })
          .eq("id", trx.id);

        // Dá o crédito
        await supabase.rpc("increment_credits", { 
            user_id_param: trx.user_id, 
            amount_param: 1 
        });
        
        corrigidos++;
      }
    }

    return new Response(`Processo finalizado. ${corrigidos} pagamentos corrigidos.`);

  } catch (err: any) {
    return new Response("Erro: " + err.message, { status: 500 });
  }
});