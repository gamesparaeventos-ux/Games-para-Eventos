import { createClient } from '@supabase/supabase-js';

// 1. Usamos o '!' no final para o erro de 'string | undefined' sumir
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 2. Definimos req e res como ': any' para o erro de 'any implícito' sumir
export default async function handler(req: any, res: any) {
  const paymentId = req.body?.data?.id || req.body?.id;
  if (!paymentId) return res.status(200).send('OK');

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const paymentData = await mpResponse.json();

    if (paymentData.status === 'approved') {
      const preferenceId = paymentData.preference_id;
      const userId = paymentData.external_reference;
      const amount = paymentData.transaction_amount;

      // 3. Atualiza o status usando o ID da preferência que vimos na sua tabela
      await supabase
        .from('payments')
        .update({ 
          status: 'approved', 
          mp_payment_id: paymentId.toString(),
          approved_at: new Date().toISOString() 
        })
        .eq('mp_preference_id', preferenceId);

      // 4. Soma os créditos (A lógica que subiu seu saldo para 241!)
      await supabase.rpc('add_user_credits', {
        user_id_input: userId,
        amount_input: amount
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    // 5. Definimos como ': any' para o erro de 'desconhecido' sumir
    console.error('[ERRO]:', error?.message || error);
    return res.status(400).json({ error: 'Erro interno' });
  }
}