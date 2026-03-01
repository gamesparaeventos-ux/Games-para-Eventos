import { Plus } from "lucide-react";

export function EventosPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="text-gray-500">
            Gerencie e acompanhe todos os seus eventos em um só lugar.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md">
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      {/* Lista */}
      <div className="border rounded-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Plus className="h-6 w-6 text-gray-400" />
        </div>

        <h3 className="text-lg font-semibold">
          Nenhum evento cadastrado
        </h3>

        <p className="text-sm text-gray-500 mt-2">
          Você ainda não criou nenhum evento. Clique no botão acima para começar.
        </p>
      </div>
    </div>
  );
}
