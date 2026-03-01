import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
    },
    manualPagination: true, 
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        onPaginationChange(updater(pagination));
      } else {
        onPaginationChange(updater);
      }
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-4 font-semibold whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-2 text-slate-500 font-medium">Carregando dados...</p>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id} 
                    className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500">
          Página <span className="font-medium text-slate-900">{table.getState().pagination.pageIndex + 1}</span> de{" "}
          <span className="font-medium text-slate-900">{table.getPageCount()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage() || isLoading} className="p-2 border rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronsLeft className="w-4 h-4" /></button>
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage() || isLoading} className="p-2 border rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage() || isLoading} className="p-2 border rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage() || isLoading} className="p-2 border rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronsRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}