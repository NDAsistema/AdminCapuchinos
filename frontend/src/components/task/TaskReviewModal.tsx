import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import TaskService from "../../services/taskServices";

interface Props {
  isOpen: boolean;
  reportId: number | null;
  reviewMode?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskReviewModal({ isOpen, reportId, reviewMode = false, onClose, onSuccess }: Props) {
  const [report, setReport] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !reportId) return;
    setLoading(true);
    setError("");
    setReport(null);
    TaskService.getTaskDetail(reportId)
      .then((data) => {
        setReport(data);
        setComment("");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "No se pudo cargar el informe");
      })
      .finally(() => setLoading(false));
  }, [isOpen, reportId]);

  const handleReview = async (action: "approve" | "reject") => {
    if (!reportId) return;

    if (action === "reject" && !comment.trim()) {
      Swal.fire("Atención", "Indica un comentario al rechazar el informe", "warning");
      return;
    }

    setLoading(true);
    try {
      await TaskService.reviewReport(reportId, action, comment);
      Swal.fire(
        "Listo",
        action === "approve" ? "Informe aprobado" : "Informe rechazado",
        "success"
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "No se pudo revisar", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed modal-capuchinos inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between border-b pb-4 mb-4">
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase">Revisión de informe</p>
            <h2 className="text-xl font-bold dark:text-white">{report?.title}</h2>
            <p className="text-sm text-gray-500">
              De: {report?.userName || "—"} · Tarea:{" "}
              {report?.parent_title || report?.parent?.title || "—"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-gray-400">
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-center py-10">Cargando...</p>
        ) : error ? (
          <p className="text-center py-10 text-red-500">{error}</p>
        ) : report ? (
          <>
            <div
              className="prose prose-sm max-w-none dark:prose-invert border rounded-xl p-4 mb-4"
              dangerouslySetInnerHTML={{ __html: report.content || "" }}
            />

            {report.review_status === "pending" && reviewMode ? (
              <>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                  Comentario (obligatorio si rechazas)
                </label>
                <textarea
                  className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[80px]"
                  placeholder="Observaciones para el usuario..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">
                    Cerrar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleReview("reject")}
                    className="px-5 py-2 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleReview("approve")}
                    className="px-5 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                  >
                    Aprobar
                  </button>
                </div>
              </>
            ) : report.review_status && report.review_status !== "pending" ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <p className="font-bold">
                  Estado: {report.review_status === "approved" ? "Aprobado" : "Rechazado"}
                </p>
                {report.review_comment && (
                  <p className="text-sm mt-2 text-gray-600">{report.review_comment}</p>
                )}
              </div>
            ) : (
              <div className="flex justify-end mt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">
                  Cerrar
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
