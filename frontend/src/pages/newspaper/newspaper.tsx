import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import NewspaperService from "../../services/newspaperServices";
import { NewspaperModal } from "../../components/NewspaperComponents/NewspaperModal";
import { NewspaperTable } from "../../components/NewspaperComponents/NewspaperTable";

export default function Newspaper() {
    const [newspaper, setNewspaper] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState<any>(null);

    const fetchNewspaper = async () => {
        setLoading(true);
        try {
            const data = await NewspaperService.getAllNewspapers(); 
            setNewspaper(data);
        } catch (error) {
            console.error("Error al cargar noticias:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (news: any) => {
        setSelectedNews(news);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedNews(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        Swal.fire({
            title: "¿Estás seguro de eliminar esta noticia?",
            text: "No podrás revertir esto",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, ¡eliminar!",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await NewspaperService.deleteNews(id);
                    Swal.fire({
                        title: "¡Eliminado!",
                        text: "La noticia ha sido eliminada.",
                        icon: "success"
                    });
                    fetchNewspaper();
                } catch (error) {
                    Swal.fire({
                        title: "Error",
                        text: "No se pudo eliminar la noticia.",
                        icon: "error"
                    });
                }
            }
        });
    };

    useEffect(() => { fetchNewspaper(); }, []);

    return (
        <div className="col-span-12 p-4">
            <h1 className="text-2xl font-bold dark:text-white">Módulo de Noticias</h1>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
                <NewspaperTable 
                    newspaper={newspaper} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                    onNew={handleCreate}
                />
            </div>

            <NewspaperModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchNewspaper}
                initialData={selectedNews} 
            />
        </div>
    );
}