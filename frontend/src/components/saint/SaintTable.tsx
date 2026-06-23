import { useMemo, useState } from "react";

interface Props {
  saints: any[];
  onEdit: (saint: any) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}

const TYPE_LABELS: Record<number, string> = {
  1: "Santo",
  2: "Beato",
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function SaintTable({ saints, onEdit, onDelete, onNew }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return saints.filter(
      (item) =>
        item.title?.toLowerCase().includes(term) ||
        TYPE_LABELS[item.type]?.toLowerCase().includes(term)
    );
  }, [saints, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onNew}
          className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand-600"
        >
          + Nuevo Santo
        </button>
      </div>

      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Buscar por nombre o tipo..."
          className="block w-full rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-4 text-sm text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                Nacimiento
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                Muerte
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                  No hay santos registrados
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                          —
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold uppercase text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      {TYPE_LABELS[item.type] ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(item.date_birth)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(item.date_death)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="text-xs font-bold uppercase text-gray-400 hover:text-brand-500"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="text-xs font-bold uppercase text-gray-400 hover:text-red-500"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentPage(i + 1)}
              className={`h-8 w-8 rounded-lg text-xs font-bold ${
                currentPage === i + 1
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
