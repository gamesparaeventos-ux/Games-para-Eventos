// @ts-expect-error: Deno std library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Supabase JS import via npm
import { createClient } from "npm:@supabase/supabase-js";

// Interfaces para garantir tipagem segura e evitar 'any'
interface MPWebhookBody {
  data?: { id: string };
  id?: string;
}

interface MPPaymentDetails {
  status: string;
  external_reference: string;
  transaction_amount: number;
}

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
    const url = new URL(req.url);

    // Captura o ID do pagamento via Query Params
    let paymentId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    // Se não estiver na URL, tenta capturar no Body (POST)
    if (!paymentId && req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as MPWebhookBody;
      paymentId = body?.data?.id || body?.id;
    }

    // Se ainda assim não houver ID, encerra com 200 (evita retentativas infinitas do MP)
    if (!paymentId) return new Response("OK", { status: 200 });

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    if (!mpRes.ok) return new Response("OK", { status: 200 });

    const payment = (await mpRes.json()) as MPPaymentDetails;
    
    // Só processa se estiver aprovado
    if (payment.status !== "approved") return new Response("OK", { status: 200 });

    const internalPaymentId = payment.external_reference;
    const amount = Math.floor(payment.transaction_amount);

    if (!internalPaymentId) return new Response("OK", { status: 200 });

    // Executa a função SQL atômica no banco de dados
    const { error: rpcError } = await supabase.rpc("approve_payment_and_credit", {
      payment_id_input: internalPaymentId,
      mp_payment_id_input: paymentId.toString(),
      amount_input: amount,
    });

    if (rpcError) {
      console.error("Erro ao executar RPC:", rpcError.message);
    }

    return new Response("OK", { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro interno no Webhook:", msg);
    // Retornamos 200 para o Mercado Pago não ficar reenviando o mesmo erro
    return new Response("OK", { status: 200 });
  }
});