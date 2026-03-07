import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { supabase } from "../../lib/supabase";
import { Save, Globe, DollarSign, ShieldCheck, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    platform_name: "",
    support_email: "",
    maintenance_mode: false,
    event_price: 97,
    currency: "BRL",
    launch_discount: false,
    require_email_verification: true,
    notify_new_sale: true,
    notify_new_lead: false
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        // Removido 'error' que não estava sendo utilizado para corrigir o aviso do ESLint
        const { data } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "platform_config")
          .maybeSingle();
        
        if (data?.value) {
          setConfig(data.value);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ 
          key: "platform_config", 
          value: config,
          description: "Configurações gerais do sistema" 
        });

      if (error) throw error;
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-slate-900 font-bold">
          Carregando configurações...
        </div>
      </AdminLayout>
    );
  }

  // Classe atualizada para garantir fundo BRANCO e texto PRETO absoluto
  const inputClass = "w-full mt-1 p-2 !bg-white !text-black border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações do Sistema</h1>
            <p className="text-slate-500 mt-1">Gerencie as regras de negócio e preferências da plataforma.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-200"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Alterações
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Gerais */}
          <Card className="border-slate-200 shadow-sm !bg-white">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-50">
              <Globe className="text-blue-500" size={20} />
              <CardTitle className="text-lg font-bold !text-slate-900">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Nome da Plataforma</label>
                <input 
                  type="text" 
                  value={config.platform_name}
                  onChange={e => setConfig({...config, platform_name: e.target.value})}
                  className={inputClass}
                  placeholder="Ex: Rei do Marketing"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">E-mail de Suporte</label>
                <input 
                  type="email" 
                  value={config.support_email}
                  onChange={e => setConfig({...config, support_email: e.target.value})}
                  className={inputClass}
                  placeholder="suporte@empresa.com"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Modo de Manutenção</span>
                  <span className="text-xs text-slate-500">Bloqueia o acesso de clientes temporariamente.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.maintenance_mode}
                  onChange={e => setConfig({...config, maintenance_mode: e.target.checked})}
                  className="w-6 h-6 accent-purple-600 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Regras Financeiras */}
          <Card className="border-slate-200 shadow-sm !bg-white">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-50">
              <DollarSign className="text-emerald-500" size={20} />
              <CardTitle className="text-lg font-bold !text-slate-900">Regras Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Preço por Evento (R$)</label>
                <input 
                  type="number" 
                  value={config.event_price}
                  onChange={e => setConfig({...config, event_price: Number(e.target.value)})}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-800">Desconto de Lançamento (10%)</span>
                  <span className="text-xs text-emerald-600 font-medium">Aplica desconto em novas recargas.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.launch_discount}
                  onChange={e => setConfig({...config, launch_discount: e.target.checked})}
                  className="w-6 h-6 accent-emerald-600 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="border-slate-200 shadow-sm !bg-white">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-50">
              <ShieldCheck className="text-orange-500" size={20} />
              <CardTitle className="text-lg font-bold !text-slate-900">Segurança e Integrações</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Exigir Verificação de E-mail</span>
                  <span className="text-xs text-slate-500">Novos clientes devem validar o e-mail para usar créditos.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.require_email_verification}
                  onChange={e => setConfig({...config, require_email_verification: e.target.checked})}
                  className="w-6 h-6 accent-purple-600 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="border-slate-200 shadow-sm !bg-white">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-50">
              <Bell className="text-purple-500" size={20} />
              <CardTitle className="text-lg font-bold !text-slate-900">Notificações de Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between p-2">
                <span className="text-sm font-medium text-slate-700">Aviso de Nova Venda</span>
                <input 
                  type="checkbox" 
                  checked={config.notify_new_sale}
                  onChange={e => setConfig({...config, notify_new_sale: e.target.checked})}
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between p-2 border-t border-slate-50">
                <span className="text-sm font-medium text-slate-700">Aviso de Novo Lead</span>
                <input 
                  type="checkbox" 
                  checked={config.notify_new_lead}
                  onChange={e => setConfig({...config, notify_new_lead: e.target.checked})}
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}