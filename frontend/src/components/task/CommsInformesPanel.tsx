import { useState } from "react";
import type { Task } from "../../services/taskServices";

interface Props {
  informes: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
}

function StatusBadge({ status }: { status: number }) {
  if (status === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
      Completado
    </span>
  );
}

function TaskRow({
  task,
  onEdit,
  showUser,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  showUser?: boolean;
}) {
  return (
    <tr className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
      <td className="px-4 py-3">
        <span className="font-bold text-gray-800 dark:text-gray-100 uppercase text-xs">
          {task.title}
        </span>
      </td>
      <td className="px-4 py-3">
        {showUser ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
              {task.userName?.charAt(0) || "U"}
            </div>
            <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
              {task.userName || "Usuario Desconocido"}
            </span>
          </div>
        ) : (
          <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
            {task.groupName || "Individual / Libre"}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <StatusBadge status={task.status ?? 1} />
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {task.created_at ? new Date(task.created_at as string).toLocaleDateString() : "---"}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
            title="Editar informe"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export function CommsInformesPanel({ informes, loading, onEdit }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" />
        <p className="mt-2 text-gray-500 font-medium">Cargando informes...</p>
      </div>
    );
  }

  if (!informes.length) {
    return (
      <div className="py-16 text-center text-gray-400 italic">
        No tienes informes creados. Usa &quot;+ Crear Nuevo Informe&quot; para asignar tareas a tu fraternidad.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {informes.map((informe) => {
        const isOpen = expandedId === informe.id;
        const related = informe.relatedReports ?? [];

        return (
          <div
            key={informe.id}
            className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : (informe.id as number))}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                  Mi informe
                </p>
                <p className="font-bold text-gray-900 dark:text-white truncate">{informe.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Destino: {informe.groupName || "General"} ·{" "}
                  {related.length}{" "}
                  {related.length === 1 ? "reporte relacionado" : "reportes relacionados"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={informe.status ?? 1} />
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    Tareas / reportes de usuarios vinculados
                  </h4>
                  <button
                    type="button"
                    onClick={() => onEdit(informe)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Editar informe
                  </button>
                </div>

                {related.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-400 uppercase text-[10px] tracking-wider bg-gray-50 dark:bg-gray-900/50">
                          <th className="px-4 py-2 font-bold">Detalle del reporte</th>
                          <th className="px-4 py-2 font-bold">Hermano / Usuario</th>
                          <th className="px-4 py-2 font-bold text-center">Estado</th>
                          <th className="px-4 py-2 font-bold">Fecha</th>
                          <th className="px-4 py-2 font-bold text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {related.map((report) => (
                          <TaskRow key={report.id} task={report} onEdit={onEdit} showUser />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic py-6 text-center bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                    Aún no hay reportes de usuarios para este informe.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
