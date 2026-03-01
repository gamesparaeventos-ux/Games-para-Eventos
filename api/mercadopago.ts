const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handleMercadoPagoWebhook(req: any, res: any) {
  // 1. Captura do ID do pagamento
  const paymentId = req.body?.data?.id || req.body?.id;

  if (!paymentId) {
    return res.status(200).send('OK');
  }

  try {
    // 2. Consulta de Verificação no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });

    if (!mpResponse.ok) throw new Error('Falha ao validar no Mercado Pago');
    const paymentData = await mpResponse.json();

    if (paymentData.status === 'approved') {
      const userId = paymentData.external_reference; 
      const amount = Math.floor(paymentData.transaction_amount);

      // 3. Atualização do Pagamento
      await supabase
        .from('payments')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('mp_payment_id', paymentId.toString());

      // 4. Adição de Créditos (Usando a função SQL segura)
      await supabase.rpc('add_user_credits', {
        user_id_input: userId,
        amount_input: amount
      });

      // 5. Registro na Auditoria
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'AUTO_PAYMENT_APPROVED',
        target: 'credits',
        details: { payment_id: paymentId, amount: amount }
      });
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    // Resolve o erro de tipo 'desconhecido'
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ERRO WEBHOOK]:', errorMessage);
    return res.status(400).json({ error: errorMessage });
  }
}

module.exports = handleMercadoPagoWebhook;