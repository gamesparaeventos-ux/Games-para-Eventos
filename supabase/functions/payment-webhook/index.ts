// @ts-expect-error: Deno std library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Supabase JS import via npm
import { createClient } from "npm:@supabase/supabase-js";

interface MPWebhookBody {
  action?: string;
  api_version?: string;
  data?: { id?: string };
  id?: string;
  live_mode?: boolean;
  type?: string;
  topic?: string;
  resource?: string;
}

interface MPPaymentDetails {
  id: string | number;
  status: string;
  external_reference?: string;
  transaction_amount?: number;
}

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const mpAccessToken =
      Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MP_ACCESS_TOKEN");

    if (!mpAccessToken) {
      console.error("Token do Mercado Pago não configurado no webhook");
      return new Response("OK", { status: 200 });
    }

    const url = new URL(req.url);

    let rawBody: MPWebhookBody = {};
    if (req.method === "POST") {
      rawBody = (await req.json().catch(() => ({}))) as MPWebhookBody;
    }

    console.log("Webhook query:", Object.fromEntries(url.searchParams.entries()));
    console.log("Webhook body:", rawBody);

    let paymentId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      rawBody?.data?.id ||
      rawBody?.id ||
      null;

    // fallback: extrai do resource, ex. https://api.mercadopago.com/v1/payments/123456789
    if (!paymentId && rawBody?.resource) {
      const match = rawBody.resource.match(/\/payments\/(\d+)/);
      if (match?.[1]) {
        paymentId = match[1];
      }
    }

    if (!paymentId) {
      console.warn("Webhook recebido sem paymentId");
      return new Response("OK", { status: 200 });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const payment = (await mpRes.json().catch(() => null)) as MPPaymentDetails | null;

    console.log("Pagamento consultado no MP:", payment);

    if (!mpRes.ok || !payment) {
      console.error("Falha ao consultar pagamento no Mercado Pago:", payment);
      return new Response("OK", { status: 200 });
    }

    const mpPaymentId = String(payment.id);
    const status = payment.status;
    const internalPaymentId = payment.external_reference?.toString().trim();

    if (!internalPaymentId) {
      console.error("Pagamento sem external_reference:", payment);
      return new Response("OK", { status: 200 });
    }

    const { data: existingPayment, error: existingError } = await supabase
      .from("payments")
      .select("id, status, mp_payment_id")
      .eq("id", internalPaymentId)
      .maybeSingle();

    if (existingError || !existingPayment) {
      console.error("Pagamento interno não encontrado:", internalPaymentId, existingError?.message);
      return new Response("OK", { status: 200 });
    }

    if (existingPayment.status === "approved") {
      console.log("Pagamento já aprovado anteriormente:", internalPaymentId);
      return new Response("OK", { status: 200 });
    }

    if (status === "approved") {
      const { error: rpcError } = await supabase.rpc("approve_payment_and_credit", {
        payment_id_input: internalPaymentId,
        mp_payment_id_input: mpPaymentId,
        amount_input: 1,
      });

      if (rpcError) {
        console.error("Erro ao executar RPC approve_payment_and_credit:", rpcError.message);
      } else {
        console.log("Pagamento aprovado e crédito adicionado:", {
          internalPaymentId,
          mpPaymentId,
        });
      }

      return new Response("OK", { status: 200 });
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status,
        mp_payment_id: mpPaymentId,
      })
      .eq("id", internalPaymentId);

    if (updateError) {
      console.error("Erro ao atualizar status do pagamento:", updateError.message);
    }

    return new Response("OK", { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro interno no webhook:", msg);
    return new Response("OK", { status: 200 });
  }
});