import { useEffect, useState } from "react";
import TaskService from "../../services/taskServices";

interface Props {
  isOpen: boolean;
  taskId: number | null;
  onClose: () => void;
  onSubmitReport?: (parentTask: any) => void;
}

export function TaskViewModal({ isOpen, taskId, onClose, onSubmitReport }: Props) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskId) return;
    setLoading(true);
    TaskService.getTaskDetail(taskId)
      .then(setTask)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  return (
    <div className="fixed modal-capuchinos inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4 border-b pb-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase">Tarea asignada</p>
            <h2 className="text-xl font-bold dark:text-white">{task?.title || "..."}</h2>
            {task?.due_date && (
              <p className="text-sm text-gray-500 mt-1">
                Fecha límite: {new Date(task.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-400">Cargando...</p>
        ) : task ? (
          <>
            <div
              className="prose prose-sm max-w-none dark:prose-invert border rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50"
              dangerouslySetInnerHTML={{ __html: task.content }}
            />

            {task.myReport && (
              <div className="mt-6 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Tu informe enviado</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                    task.myReport.review_status === "approved"
                      ? "bg-green-100 text-green-700"
                      : task.myReport.review_status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {task.myReport.review_status === "approved"
                    ? "Aprobado"
                    : task.myReport.review_status === "rejected"
                      ? "Rechazado"
                      : "Pendiente de revisión"}
                </span>
                {task.myReport.review_comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <strong>Comentario del revisor:</strong> {task.myReport.review_comment}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">
                Cerrar
              </button>
              {task.canSubmit && onSubmitReport && (
                <button
                  type="button"
                  onClick={() => onSubmitReport(task)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Redactar informe
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
