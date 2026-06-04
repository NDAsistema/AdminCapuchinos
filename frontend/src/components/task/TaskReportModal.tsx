import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import FroalaEditorComponent from "react-froala-wysiwyg";
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";
import "froala-editor/js/plugins.pkgd.min.js";
import TaskService from "../../services/taskServices";
import { API_URL } from "../../config/env";

interface Props {
  isOpen: boolean;
  parentTask: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskReportModal({ isOpen, parentTask, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && parentTask) {
      setTitle(`Informe: ${parentTask.title}`);
      setContent("");
    }
  }, [isOpen, parentTask]);

  const froalaConfig = {
    placeholderText: "Redacta tu informe aquí...",
    heightMin: 280,
    imageUploadURL: `${API_URL}/attachments/upload-task-image`,
    requestHeaders: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    toolbarButtons: ["bold", "italic", "underline", "|", "formatOL", "formatUL", "|", "insertLink", "insertImage"],
  };

  const handleSubmit = async () => {
    if (!parentTask?.id || !content.trim()) {
      Swal.fire("Atención", "Escribe el contenido del informe", "warning");
      return;
    }

    setLoading(true);
    try {
      await TaskService.submitReport(parentTask.id, { title, content });
      Swal.fire("Enviado", "Tu informe fue enviado y está pendiente de revisión", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "No se pudo enviar el informe", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !parentTask) return null;

  return (
    <div className="fixed modal-capuchinos inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6">
        <div className="flex justify-between border-b pb-4 mb-4">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase">Nuevo informe</p>
            <h2 className="text-xl font-bold dark:text-white">Responder: {parentTask.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-gray-400">
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Título del informe</label>
          <input
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Contenido *</label>
          <div className="border rounded-lg overflow-hidden dark:border-gray-600">
            <FroalaEditorComponent tag="textarea" config={froalaConfig} model={content} onModelChange={setContent} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar informe"}
          </button>
        </div>
      </div>
    </div>
  );
}
