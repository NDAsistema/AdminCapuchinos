import { useState, useEffect } from "react";
import GroupService from "../../../services/GroupService";
import Swal from "sweetalert2";

interface AssignedMember {
    id: string;
    name: string;
    activity: string;
    isLeader: boolean;
}

export default function ModalAssingGroup({ isOpen, onClose, onSuccess, groupId, groupName }: any) {
    const [brothers, setBrothers] = useState<any[]>([]);
    const [assignedMembers, setAssignedMembers] = useState<AssignedMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string>("");

    useEffect(() => {
        if (isOpen && groupId) {
            const loadBrothers = async () => {
                try {
                    setIsLoading(true);
                    setErrors("");
                    const response = await GroupService.getListBrotherAssing(groupId);
                    
                    // 1. Cargamos todos los hermanos disponibles para el Select
                    setBrothers(response.data.data || []);

                    // 2. Cargamos los ya asignados usando los nombres de columna de tu DB
                    const currentMembers = response.data.listBrotherAssing || [];
                    
                    const mappedMembers: AssignedMember[] = currentMembers.map((m: any) => ({
                        // Usamos id_brotther porque así viene en tu console.log
                        id: m.id_brotther ? m.id_brotther.toString() : "", 
                        name: m.name || "",
                        activity: m.activity || "",
                        // Convertimos el valor 1/0 de la DB a boolean
                        isLeader: m.leader === 1 
                    }));

                    setAssignedMembers(mappedMembers);
                } catch (error) {
                    console.error("Error al cargar datos:", error);
                    setErrors("No se pudo cargar la lista de personal.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadBrothers();
        } else {
            // Limpiar al cerrar
            setAssignedMembers([]);
            setBrothers([]);
            setErrors("");
        }
    }, [isOpen, groupId]);

    const handleAddMember = (id: string) => {
        if (!id) return;
        const person = brothers.find(b => b.id.toString() === id);
        
        if (person && !assignedMembers.find(m => m.id === id)) {
            setAssignedMembers([...assignedMembers, {
                id: person.id.toString(),
                name: `${person.name} ${person.last_name || ''}`,
                activity: "",
                // Si la tabla está vacía, el primero que agregas es líder por defecto
                isLeader: assignedMembers.length === 0
            }]);
        }
    };

    const handleRemoveMember = (id: string) => {
        setAssignedMembers(assignedMembers.filter(m => m.id !== id));
    };

    const updateMember = (id: string, field: keyof AssignedMember, value: any) => {
        setAssignedMembers(assignedMembers.map(m => {
            if (m.id === id) {
                return { ...m, [field]: value };
            }
            // Lógica de Radio Button: solo un líder a la vez
            if (field === 'isLeader' && m.id !== id) {
                return { ...m, isLeader: false };
            }
            return m;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const leader = assignedMembers.find(m => m.isLeader);
        
        if (assignedMembers.length > 0 && !leader) {
            setErrors("Debes seleccionar un líder para el grupo.");
            return;
        }

        try {
            setIsLoading(true);
            const dataToSend = {
                groupId: groupId,
                members: assignedMembers.map(m => ({
                    id: m.id,
                    activity: m.activity,
                    isLeader: m.isLeader ? 1 : 0
                }))
            };

            const result = await GroupService.assignMembersToGroup(dataToSend);
            
            if (result.success) {
                Swal.fire({
                    title: '¡Guardado!',
                    text: 'Personal asignado correctamente.',
                    icon: "success",
                    confirmButtonColor: '#3085d6',
                });
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error("Error en submit:", error);
            setErrors(error.response?.data?.message || "Error al procesar la asignación");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-capuchinos fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b dark:border-gray-700 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestionar Equipo</h2>
                        <p className="text-sm text-blue-600 font-medium">Grupo: {groupName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8">
                    {errors && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                            {errors}
                        </div>
                    )}

                    {/* Selector */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Seleccionar Personal</label>
                        <select 
                            onChange={(e) => handleAddMember(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            value=""
                            disabled={isLoading}
                        >
                            <option value="">Haga clic para buscar...</option>
                            {brothers.map(b => {
                                const isAdded = assignedMembers.some(m => m.id === b.id.toString());
                                return (
                                    <option key={b.id} value={b.id} disabled={isAdded}>
                                        {b.name} {b.last_name} {isAdded ? " (Seleccionado)" : ""}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Tabla de Asignados */}
                    <div className="border dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50/30">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Nombre</th>
                                    <th className="px-4 py-3 font-bold">Actividad</th>
                                    <th className="px-4 py-3 font-bold text-center">Líder</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {assignedMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No hay personal seleccionado</td>
                                    </tr>
                                ) : (
                                    assignedMembers.map(member => (
                                        <tr key={member.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium dark:text-white">{member.name}</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Actividad..."
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                                                    value={member.activity}
                                                    onChange={(e) => updateMember(member.id, 'activity', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="radio" 
                                                    name="isLeaderGroup"
                                                    checked={member.isLeader}
                                                    onChange={() => updateMember(member.id, 'isLeader', true)}
                                                    className="w-4 h-4 text-blue-600 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleRemoveMember(member.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={onClose} 
                            className="flex-1 py-3 font-semibold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={isLoading || assignedMembers.length === 0}
                            className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg disabled:opacity-50 transition-all"
                        >
                            {isLoading ? "Procesando..." : `Confirmar Asignación (${assignedMembers.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}