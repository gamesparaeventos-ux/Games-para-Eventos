// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
    const url = new URL(req.url);

    let paymentId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    if (!paymentId && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      paymentId = body?.data?.id || body?.id;
    }

    if (!paymentId) return new Response("OK", { status: 200 });

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    if (!mpRes.ok) return new Response("OK", { status: 200 });

    const payment = await mpRes.json();
    if (payment.status !== "approved") return new Response("OK", { status: 200 });

    const internalPaymentId = payment.external_reference;
    const amount = Math.floor(payment.transaction_amount);

    if (!internalPaymentId) return new Response("OK", { status: 200 });

    // Chama a função atômica e segura que criamos no SQL
    await supabase.rpc("approve_payment_and_credit", {
      payment_id_input: internalPaymentId,
      mp_payment_id_input: paymentId.toString(),
      amount_input: amount,
    });

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("OK", { status: 200 });
  }
});