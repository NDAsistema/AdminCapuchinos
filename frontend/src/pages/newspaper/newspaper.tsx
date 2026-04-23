import { useState, useEffect } from "react";
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
        const data = await NewspaperService.getAllNewspapers(); 
        setNewspaper(data);
        setLoading(false);
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
        if (window.confirm("¿Estás seguro de eliminar esta noticia?")) {
            fetchNewspaper();
        }
    };

    useEffect(() => { fetchNewspaper(); }, []);

    return (
        <div className="col-span-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Modulo Noticias</h1>
                
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2">
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

            <NewspaperModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchNewspaper}
                initialData={selectedNews} 
            />
        </div>
    );
}