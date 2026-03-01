import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useCredits } from "./useCredits"; // Reaproveita seu hook de saldo

export function useGameActivation() {
  const [loading, setLoading] = useState(false);
  const { refreshCredits } = useCredits(); // Para atualizar o saldo na tela logo depois de gastar

  const activateGame = async (gameId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Faça login para jogar!");
        return false;
      }

      // Chama a função segura do Banco de Dados
      const { data, error } = await supabase.rpc('consume_credit', {
        user_id_param: user.id,
        game_id_param: gameId
      });

      if (error) throw error;

      if (data.success) {
        // Sucesso!
        console.log("Jogo ativado:", data.message);
        await refreshCredits(); // Atualiza o numerozinho do saldo lá em cima
        return true;
      } else {
        // Sem saldo
        alert("Ops! " + data.message); // Vai mostrar "Saldo insuficiente"
        return false;
      }

    } catch (err) {
      console.error("Erro ao ativar:", err);
      alert("Erro ao tentar ativar o jogo.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { activateGame, loading };
}