import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useCredits() {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (data) setCredits(data.credits);
    } catch (error) {
      console.error("Erro ao buscar saldo", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    
    // Agora o sistema escuta mudanças na tabela profiles em tempo real
    const channel = supabase
      .channel('saldo-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
          console.log("💰 Saldo atualizado no banco, refletindo na tela!");
          fetchCredits();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { 
    credits, 
    loading, 
    refreshCredits: fetchCredits
  };
}