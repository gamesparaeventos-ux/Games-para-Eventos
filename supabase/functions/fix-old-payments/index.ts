// @ts-expect-error: Deno std library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Supabase JS import via esm.sh
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MPResponse {
  results?: Array<{
    id: number;
    status: string;
  }>;
}

// @ts-expect-error: Serve definition for Deno
serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Busca todas as transações pendentes
    const { data: pendentes, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending");

    if (fetchError) throw fetchError;

    if (!pendentes || pendentes.length === 0) {
      return new Response("Nenhuma transação pendente encontrada.");
    }

    let corrigidos = 0;

    // 2. Para cada pendente, consulta o Mercado Pago
    for (const trx of pendentes) {
      if (!trx.id) continue;

      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${trx.id}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      const mpData = (await mpRes.json()) as MPResponse;
      const payment = mpData.results?.[0];

      if (payment && payment.status === "approved") {
        // Atualiza o status na tabela de transações
        await supabase
          .from("transactions")
          .update({ status: "approved", payment_id: String(payment.id) })
          .eq("id", trx.id);

        // Incrementa os créditos via RPC
        await supabase.rpc("increment_credits", {
            user_id_param: trx.user_id,
            amount_param: 1
        });

        corrigidos++;
      }
    }

    return new Response(`Processo finalizado. ${corrigidos} pagamentos corrigidos.`);

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response("Erro: " + errorMessage, { status: 500 });
  }
});