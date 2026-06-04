interface TableProps {
  view: "reportes" | "gestion" | "assigned";
  tasks: any[];
  loading: boolean;
  userType?: number;
  onEdit?: (task: any) => void;
  onView?: (task: any) => void;
  onSubmitReport?: (task: any) => void;
  onReview?: (reportId: number) => void;
  readOnly?: boolean;
}

function ReviewBadge({ status, hasReport }: { status?: string | null; hasReport?: boolean }) {
  if (!hasReport && !status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
        Sin enviar
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
        Pendiente revisión
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
        Aprobado
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        Rechazado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
      Asignada
    </span>
  );
}

export function TaskTable({
  view,
  tasks,
  loading,
  userType,
  onEdit,
  onView,
  onSubmitReport,
  onReview,
  readOnly,
}: TableProps) {
  const isAssignedView = view === "assigned";
  const isReportsView = view === "reportes";

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" />
        <p className="mt-2 text-gray-500 font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-gray-400 uppercase text-[10px] tracking-wider">
            <th className="px-6 py-3 font-bold">
              {isAssignedView ? "Tarea asignada" : "Detalle del informe"}
            </th>
            <th className="px-6 py-3 font-bold">
              {isReportsView ? "Hermano / Usuario" : isAssignedView ? "Asignado por" : "Destinatario"}
            </th>
            <th className="px-6 py-3 font-bold text-center">Estado</th>
            <th className="px-6 py-3 font-bold">Fecha</th>
            <th className="px-6 py-3 font-bold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tasks?.length > 0 ? (
            tasks.map((task) => (
              <tr
                key={task.id}
                className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm"
              >
                <td className="px-6 py-4 rounded-l-2xl">
                  <span className="font-bold text-gray-800 dark:text-gray-100 uppercase text-xs block">
                    {task.title}
                  </span>
                  {isReportsView && task.parent_title && (
                    <span className="text-[10px] text-gray-400">Tarea: {task.parent_title}</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {isReportsView || isAssignedView ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                        {task.userName?.charAt(0) || "U"}
                      </div>
                      <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                        {task.userName || "—"}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold">
                      {task.groupName || "General"}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-center">
                  {isAssignedView ? (
                    <ReviewBadge status={task.my_review_status} hasReport={!!task.my_report_id} />
                  ) : isReportsView ? (
                    <ReviewBadge status={task.review_status} hasReport />
                  ) : (
                    <ReviewBadge status={null} hasReport={false} />
                  )}
                </td>

                <td className="px-6 py-4 text-gray-500 text-xs">
                  {task.created_at ? new Date(task.created_at).toLocaleDateString() : "—"}
                </td>

                <td className="px-6 py-4 text-right rounded-r-2xl">
                  <div className="flex justify-end gap-1">
                    {onView && (
                      <button
                        type="button"
                        title="Ver"
                        onClick={() => onView(task)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                      >
                        <EyeIcon />
                      </button>
                    )}

                    {isAssignedView && !task.my_report_id && onSubmitReport && (
                      <button
                        type="button"
                        title="Enviar informe"
                        onClick={() => onSubmitReport(task)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl"
                      >
                        <PlusIcon />
                      </button>
                    )}

                    {isReportsView && task.review_status === "pending" && onReview && (
                      <button
                        type="button"
                        title="Revisar"
                        onClick={() => onReview(task.id)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl"
                      >
                        <CheckIcon />
                      </button>
                    )}

                    {isReportsView && task.review_status !== "pending" && onReview && (
                      <button
                        type="button"
                        title="Ver revisión"
                        onClick={() => onReview(task.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                      >
                        <EyeIcon />
                      </button>
                    )}

                    {!readOnly && !isAssignedView && !isReportsView && onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl"
                      >
                        <EditIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-20 text-center text-gray-400 italic">
                {isAssignedView
                  ? "No tienes tareas asignadas."
                  : "No se encontraron registros."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
