import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function AdminFaq() {
  const queryClient = useQueryClient();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, is_active, sort_order, created_at, updated_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as FaqItem[];
    },
  });

  const activeCount = useMemo(() => faqs.filter((item) => item.is_active).length, [faqs]);

  const createFaqMutation = useMutation({
    mutationFn: async () => {
      const parsedSort = Number(sortOrder);

      const { error } = await supabase.from("faqs").insert({
        question: question.trim(),
        answer: answer.trim(),
        is_active: true,
        sort_order: Number.isNaN(parsedSort) ? 0 : parsedSort,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setQuestion("");
      setAnswer("");
      setSortOrder("0");
      setFeedback({ type: "success", text: "Pergunta criada com sucesso." });
      await queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (error) => {
      console.error("Erro ao criar FAQ:", error);
      setFeedback({ type: "error", text: "Não foi possível criar a pergunta." });
    },
  });

  const toggleFaqMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("faqs")
        .update({
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async () => {
      setFeedback({ type: "success", text: "FAQ atualizado com sucesso." });
      await queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar FAQ:", error);
      setFeedback({ type: "error", text: "Não foi possível atualizar a FAQ." });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setFeedback({ type: "success", text: "Pergunta removida com sucesso." });
      await queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (error) => {
      console.error("Erro ao remover FAQ:", error);
      setFeedback({ type: "error", text: "Não foi possível remover a pergunta." });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!question.trim() || !answer.trim()) {
      setFeedback({ type: "error", text: "Preencha a pergunta e a resposta." });
      return;
    }

    createFaqMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Perguntas Frequentes</h1>
          <p className="text-slate-500 mt-1">Cadastre e gerencie as perguntas que aparecem na aba Ajuda do cliente.</p>
        </div>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.35fr] gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Nova pergunta</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pergunta</label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500 bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder="Ex: Como funcionam os créditos?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Resposta</label>
                  <textarea
                    rows={5}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500 resize-none bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder="Digite a resposta completa..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ordem</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500 bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder="0"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createFaqMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors disabled:opacity-70"
                >
                  {createFaqMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {createFaqMutation.isPending ? "Salvando..." : "Adicionar pergunta"}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Perguntas cadastradas</CardTitle>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black border border-blue-100">
                {activeCount} Ativas
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-sm text-slate-500">Carregando perguntas...</div>
              ) : faqs.length === 0 ? (
                <div className="text-sm text-slate-500">Nenhuma pergunta cadastrada ainda.</div>
              ) : (
                faqs.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{item.question}</div>
                        <div className="text-sm text-slate-500 mt-2 whitespace-pre-wrap break-words">
                          {item.answer}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteFaqMutation.mutate(item.id)}
                        disabled={deleteFaqMutation.isPending}
                        className="shrink-0 p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        title="Remover pergunta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-medium text-slate-500">
                        Ordem: <strong>{item.sort_order}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleFaqMutation.mutate({ id: item.id, is_active: !item.is_active })}
                        disabled={toggleFaqMutation.isPending}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          item.is_active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {item.is_active ? "Ativa" : "Inativa"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}