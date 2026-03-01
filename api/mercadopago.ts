import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface WebhookRequest {
  body: {
    data?: { id: string | number };
    id?: string | number;
  };
}

interface WebhookResponse {
  status: (code: number) => WebhookResponse;
  send: (body: string) => WebhookResponse;
  json: (body: unknown) => WebhookResponse;
}

export default async function handleMercadoPagoWebhook(req: WebhookRequest, res: WebhookResponse) {
  const paymentId = req.body?.data?.id || req.body?.id;

  if (!paymentId) {
    return res.status(200).send('OK');
  }

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });

    if (!mpResponse.ok) throw new Error('Falha ao validar no Mercado Pago');
    const paymentData = await mpResponse.json();

    if (paymentData.status === 'approved') {
      const userId = paymentData.external_reference; 
      const amount = Math.floor(paymentData.transaction_amount);

      await supabase
        .from('payments')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('mp_payment_id', paymentId.toString());

      await supabase.rpc('add_user_credits', {
        user_id_input: userId,
        amount_input: amount
      });

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'AUTO_PAYMENT_APPROVED',
        target: 'credits',
        details: { payment_id: paymentId, amount: amount }
      });
    }

    return res.status(200).json({ success: true });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ERRO WEBHOOK]:', errorMessage);
    return res.status(400).json({ error: errorMessage });
  }
}