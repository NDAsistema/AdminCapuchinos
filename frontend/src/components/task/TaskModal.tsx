import React, { useState, useEffect } from 'react';
import Select from 'react-select'; 
import Swal from 'sweetalert2';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/js/plugins.pkgd.min.js'; 
import FroalaEditorComponent from 'react-froala-wysiwyg';
import { useAuth } from '../UserProfile/AuthProvider';
import { usePermissions } from '../../hooks/usePermissions';
import brotherService from '../../services/brotherService';
import GroupService from '../../services/GroupService';
import TaskService from '../../services/taskServices';
import { API_URL } from '../../config/env';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    isLeaderMode?: boolean;
}

export const TaskModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialData, isLeaderMode }) => {
    const { user } = useAuth();
    const { isGroupLeader } = usePermissions();
    const leaderMode = isLeaderMode ?? isGroupLeader;
    
    // Campos Básicos
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    
    // Lógica de Asignación
    const [typeAssing, setTypeAssing] = useState('1'); // 0: Todos, 1: Persona, 2: Grupo
    const [selectedOptions, setSelectedOptions] = useState<any[]>([]); 
    const [options, setOptions] = useState<{value: string, label: string}[]>([]); 
    
    // Lógica de Tiempos y Recurrencia
    const [dueDate, setDueDate] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceRule, setRecurrenceRule] = useState('weekly');

    const [touched, setTouched] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const isEdit = !!initialData?.id;

    const customSelectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: touched && typeAssing !== '0' && selectedOptions.length === 0 ? '#ef4444' : '#d1d5db',
            borderRadius: '0.5rem',
            padding: '0.1rem',
            '&:hover': { borderColor: '#3b82f6' }
        }),
        menu: (base: any) => ({ ...base, backgroundColor: '#ffffff', zIndex: 9999 }),
        multiValue: (base: any) => ({ ...base, backgroundColor: '#eff6ff', borderRadius: '0.375rem' }),
        multiValueLabel: (base: any) => ({ ...base, color: '#1e40af', fontWeight: '600' })
    };

    const froalaConfig = {
        placeholderText: 'Escribe las instrucciones detalladas aquí...',
        heightMin: 250,
        imageUploadURL: `${API_URL}/attachments/upload-task-image`,
        requestHeaders: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        toolbarButtons: ['bold', 'italic', 'underline', '|', 'formatOL', 'formatUL', '|', 'insertLink', 'insertImage', 'undo', 'redo']
    };

    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setContent('');
            setSelectedOptions([]);
            setTouched(false);
            setPriority('medium');
            setTypeAssing('1');
            setDueDate('');
            setIsRecurring(false);
            return;
        }

        if (!initialData?.id) return;

        setLoadingDetail(true);
        TaskService.getTaskDetail(initialData.id)
            .then((detail) => {
                setTitle(detail.title || '');
                setContent(detail.content || '');
                setPriority((detail.priority as any) || 'medium');
                const assignType =
                    detail.assigned_type != null ? String(detail.assigned_type) : '1';
                setTypeAssing(assignType);
                setDueDate(detail.due_date ? String(detail.due_date).split('T')[0] : '');
                setIsRecurring(!!detail.is_recurring);
                setRecurrenceRule(detail.recurrence_rule || 'weekly');

                const assignments = (detail as any).assignments || [];
                if (Number(detail.assigned_type) === 0) {
                    setSelectedOptions([]);
                } else if (assignments.length > 0) {
                    const typeNum = Number(detail.assigned_type);
                    setSelectedOptions(
                        assignments
                            .filter((a: any) => a.assigned_type === typeNum)
                            .map((a: any) => ({
                                value: String(a.assigned_id),
                                label: a.assigned_name || `ID ${a.assigned_id}`,
                            }))
                    );
                } else if (detail.assigned_ids?.length) {
                    setSelectedOptions(
                        detail.assigned_ids.map((id: number) => ({
                            value: String(id),
                            label: `ID ${id}`,
                        }))
                    );
                } else {
                    setSelectedOptions([]);
                }
            })
            .catch((err) => {
                console.error('Error cargando tarea:', err);
                Swal.fire('Error', 'No se pudo cargar la tarea para editar', 'error');
            })
            .finally(() => setLoadingDetail(false));
    }, [isOpen, initialData?.id]);

    useEffect(() => {
        if (!isOpen || !user || typeAssing === '0') return;

        const loadOptions = async () => {
            try {
                let data: any[] = [];
                if (user.type_user === 1) { 
                    const groupsRes = await GroupService.getAll();
                    const groupsList = Array.isArray(groupsRes)
                        ? groupsRes
                        : groupsRes?.[0] || [];
                    data = typeAssing === '1'
                        ? await brotherService.getAllBrothers()
                        : groupsList;
                } else if (user.type_user === 3) {
                    data = typeAssing === '1'
                        ? await brotherService.findUsersInCommsScope()
                        : await GroupService.findGroupsForCommunicationUser();
                } else if (leaderMode) {
                    data = typeAssing === '1'
                        ? await brotherService.findMembersInLedGroups()
                        : await GroupService.findGroupsForGroupLeader();
                } else if (user.type_user === 4) {
                    data = await brotherService.findBrothersForGuardian(); 
                    setTypeAssing('1'); 
                }

                setOptions(data.map(item => ({ 
                    value: String(item.brotherId ?? item.id), 
                    label: item.name_group || item.name_brother || item.name || 'Sin nombre'
                })));

                if (isEdit && selectedOptions.length > 0) {
                    setSelectedOptions((prev) =>
                        prev.map((sel) => {
                            const match = data.find(
                                (item) => String(item.brotherId ?? item.id) === sel.value
                            );
                            if (!match) return sel;
                            return {
                                value: sel.value,
                                label:
                                    match.name_group ||
                                    match.name_brother ||
                                    match.name ||
                                    sel.label,
                            };
                        })
                    );
                }
            } catch (error) {
                console.error("Error cargando opciones", error);
            }
        };
        loadOptions();
    }, [typeAssing, user, isOpen, leaderMode, isEdit]);

    const handleSave = async () => {
        setTouched(true);
        // Si no es "Todos", validamos que haya seleccionados
        const noSelection = typeAssing !== '0' && selectedOptions.length === 0;

        if (!title.trim() || !content.trim() || noSelection) {
            Swal.fire('Atención', 'Por favor completa los campos requeridos', 'warning');
            return;
        }

        const payload = {
            title,
            content,
            priority,
            assigned_type: parseInt(typeAssing),
            assigned_ids: typeAssing === '0' ? [] : selectedOptions.map(opt => parseInt(opt.value)),
            due_date: dueDate || null,
            is_recurring: isRecurring ? 1 : 0,
            recurrence_rule: isRecurring ? recurrenceRule : null,
            task_origin: user?.type_user // Guardamos el nivel de quien crea (Admin, Comms, etc)
        };

        try {
            if (isEdit) {
                await TaskService.updateTask(initialData.id, payload);
                Swal.fire('¡Éxito!', 'Tarea actualizada', 'success');
            } else {
                await TaskService.createTask(payload);
                Swal.fire('¡Éxito!', 'Tarea asignada correctamente', 'success');
            }
            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire('Error', 'No se pudo procesar la tarea', 'error');
        }
    };

    if (!isOpen) return null;

    if (loadingDetail && isEdit) {
        return (
            <div className="fixed modal-capuchinos inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
                    <p className="text-gray-500">Cargando tarea...</p>
                </div>
            </div>
        );
    }

    const canChooseAssignType =
        user?.type_user === 1 || user?.type_user === 3 || leaderMode;
    const isLeaderOnlyAssign = leaderMode && user?.type_user === 2;

    return (
        <div className="fixed modal-capuchinos inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl p-6 max-h-[95vh] overflow-y-auto">
                
                <div className="flex justify-between border-b pb-4 mb-4 text-left">
                    <h2 className="text-xl font-bold dark:text-white">
                        {isEdit ? 'Editar Tarea Maestra' : 'Configurar Nueva Tarea'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl transition-colors">&times;</button>
                </div>

                <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Título de la Tarea *</label>
                            <input 
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                                value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="Ej: Reporte de Asistencia Semanal"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Prioridad</label>
                            <select 
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                                value={priority} onChange={e => setPriority(e.target.value as any)}
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">Instrucciones y Requisitos *</label>
                        <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                            <FroalaEditorComponent tag='textarea' config={froalaConfig} model={content} onModelChange={(m: string) => setContent(m)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        {/* Columna: Asignación */}
                        <div className="space-y-4">
                            {canChooseAssignType && (
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-200 mb-1">Destinatarios:</label>
                                    <select 
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                                        value={typeAssing}
                                        onChange={e => { setTypeAssing(e.target.value); setSelectedOptions([]); }}
                                    >
                                        {!isLeaderOnlyAssign && (
                                            <option value="0">Todos los Usuarios (Global)</option>
                                        )}
                                        <option value="1">
                                            {isLeaderOnlyAssign
                                                ? "Personas individuales"
                                                : "Personas Específicas"}
                                        </option>
                                        <option value="2">
                                            {isLeaderOnlyAssign
                                                ? "Todo el grupo"
                                                : "Grupos Seleccionados"}
                                        </option>
                                    </select>
                                </div>
                            )}

                            {typeAssing !== '0' && (
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                        {typeAssing === '1'
                                            ? 'Seleccionar Personas *'
                                            : isLeaderOnlyAssign
                                              ? 'Seleccionar grupo *'
                                              : 'Seleccionar Grupos *'}
                                    </label>
                                    <Select
                                        isMulti={!(isLeaderOnlyAssign && typeAssing === '2')}
                                        placeholder="Buscar..."
                                        options={options}
                                        styles={customSelectStyles}
                                        value={
                                            isLeaderOnlyAssign && typeAssing === '2'
                                                ? selectedOptions[0] ?? null
                                                : selectedOptions
                                        }
                                        onChange={(val: any) => {
                                            if (isLeaderOnlyAssign && typeAssing === '2') {
                                                setSelectedOptions(val ? [val] : []);
                                            } else {
                                                setSelectedOptions(val || []);
                                            }
                                        }}
                                        isClearable
                                        closeMenuOnSelect={!(isLeaderOnlyAssign && typeAssing === '2')}
                                        className="dark:text-gray-800"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Columna: Tiempos y Recurrencia */}
                        <div className="space-y-4 border-l dark:border-gray-700 pl-6">
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-200 mb-1">Fecha Límite (Opcional)</label>
                                <input 
                                    type="date" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                                    value={dueDate} onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" id="recurrent" className="w-4 h-4"
                                    checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                                />
                                <label htmlFor="recurrent" className="text-sm font-medium dark:text-gray-200 cursor-pointer">¿Es una tarea recurrente?</label>
                            </div>
                            {isRecurring && (
                                <select 
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                                    value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value)}
                                >
                                    <option value="daily">Diariamente</option>
                                    <option value="weekly">Semanalmente</option>
                                    <option value="monthly">Mensualmente</option>
                                    <option value="yearly">Anualmente</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl dark:bg-gray-700 dark:text-white transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
                        {isEdit ? 'Guardar Cambios' : 'Lanzar Tarea'}
                    </button>
                </div>
            </div>
        </div>
    );
};