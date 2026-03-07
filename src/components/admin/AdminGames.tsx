import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Gamepad2, Star, Info } from "lucide-react";

const GAME_TEMPLATES = [
  { id: 'quiz', name: 'Quiz Interativo', category: 'Educativo', status: 'Ativo', popularidade: 'Alta' },
  { id: 'roulette', name: 'Roleta de Prêmios', category: 'Sorteio', status: 'Ativo', popularidade: 'Muito Alta' },
  { id: 'memory', name: 'Jogo da Memória', category: 'Interativo', status: 'Ativo', popularidade: 'Média' },
  { id: 'balloon', name: 'Estoura Balão', category: 'Ação', status: 'Ativo', popularidade: 'Alta' },
];

export default function AdminGames() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Catálogo de Jogos</h1>
          <p className="text-slate-500 mt-1">Gerencie os templates disponíveis na plataforma.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_TEMPLATES.map((game) => (
            <Card key={game.id} className="border-slate-200 overflow-hidden hover:shadow-md transition-all group">
              <div className={`h-2 w-full ${game.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-slate-800">{game.name}</CardTitle>
                <Gamepad2 className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Categoria:</span>
                    <span className="font-medium text-slate-700">{game.category}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Popularidade:</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={14} fill="currentColor" />
                      <span className="font-medium text-slate-700">{game.popularidade}</span>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center justify-between">
                    <Badge variant={game.status === 'Ativo' ? 'default' : 'secondary'}>
                      {game.status}
                    </Badge>
                    <button className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
                      <Info size={14} /> Detalhes
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}