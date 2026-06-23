import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import SaintTable from "../../components/saint/SaintTable";
import SaintModal from "../../components/saint/SaintModal";
import SaintService, { type Saint } from "../../services/saintService";

export default function SaintsPage() {
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);

  const loadSaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SaintService.getAll();
      setSaints(data);
    } catch (err) {
      console.error("Error cargando santos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaints();
  }, [loadSaints]);

  const handleCreate = () => {
    setSelectedSaint(null);
    setModalOpen(true);
  };

  const handleEdit = (saint: Saint) => {
    setSelectedSaint(saint);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar santo?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await SaintService.delete(id);
      Swal.fire("Eliminado", "El santo fue eliminado correctamente", "success");
      loadSaints();
    } catch {
      Swal.fire("Error", "No se pudo eliminar el santo", "error");
    }
  };

  return (
    <>
      <PageMeta title="Santos | AdminCapuchinos" description="Gestión de santos y beatos" />

      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Módulo Santos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registro de santos y beatos
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          {loading ? (
            <p className="py-10 text-center text-gray-500">Cargando...</p>
          ) : (
            <SaintTable
              saints={saints}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNew={handleCreate}
            />
          )}
        </div>

        <SaintModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={loadSaints}
          initialData={selectedSaint}
        />
      </div>
    </>
  );
}
