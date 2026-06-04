import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../components/UserProfile/AuthProvider";
import { TaskFilters } from "../../components/task/TaskFilters";
import { TaskTable } from "../../components/task/tasktable";
import { CommsInformesPanel } from "../../components/task/CommsInformesPanel";
import { TaskModal } from "../../components/task/TaskModal";
import { TaskViewModal } from "../../components/task/TaskViewModal";
import { TaskReportModal } from "../../components/task/TaskReportModal";
import { TaskReviewModal } from "../../components/task/TaskReviewModal";
import TaskService, { type TaskListView } from "../../services/taskServices";
import { usePermissions } from "../../hooks/usePermissions";

export default function Tasks() {
    const { user } = useAuth();
    const { isAdmin, isCommunications, isStandard } = usePermissions();

    const [activeTab, setActiveTab] = useState<TaskListView>("reportes");
    const [filters, setFilters] = useState({ groupId: "", userId: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [taskList, setTaskList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [viewTaskId, setViewTaskId] = useState<number | null>(null);
    const [reportParentTask, setReportParentTask] = useState<any>(null);
    const [reviewReportId, setReviewReportId] = useState<number | null>(null);

    const showWorkspaceTabs = isAdmin || isCommunications;
    const showFilters = showWorkspaceTabs && activeTab === "reportes";
    const showCreateButton = (isAdmin || isCommunications) && activeTab === "gestion";

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params: { view?: TaskListView; groupId?: string; userId?: string } = {};
            if (showWorkspaceTabs) {
                params.view = activeTab;
                if (activeTab === "reportes") {
                    params.groupId = filters.groupId;
                    params.userId = filters.userId;
                }
            }
            const response = await TaskService.getAllTask(params);
            setTaskList(Array.isArray(response) ? response : []);
        } catch (err: any) {
            console.error("Error loading tasks:", err);
            setTaskList([]);
            const msg = err?.response?.data?.message || err?.message;
            if (msg && msg !== "Error al obtener tareas") {
                console.warn("Tareas:", msg);
            }
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters, showWorkspaceTabs]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks, refreshKey]);

    const handleRefresh = () => setRefreshKey((prev) => prev + 1);

    const handleCreate = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleEdit = (task: any) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleView = (task: any) => {
        if (isStandard || activeTab !== "reportes") {
            setViewTaskId(task.id);
        } else {
            setReviewReportId(task.id);
        }
    };

    const handleSubmitReportFromList = (task: any) => {
        setReportParentTask(task);
    };

    const handleSubmitReportFromView = (task: any) => {
        setViewTaskId(null);
        setReportParentTask(task);
    };

    const pageTitle = isAdmin
        ? "Modulo de Tareas Administrador"
        : isCommunications
          ? "Modulo de Tareas — Comunicaciones"
          : "Mis Tareas Asignadas";

    const tableView = isStandard ? "assigned" : activeTab;

    return (
        <div className="col-span-12 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">{pageTitle}</h1>
                    {isStandard && (
                        <p className="text-sm text-gray-500 mt-1">
                            Revisa la tarea asignada y envía tu informe para aprobación.
                        </p>
                    )}
                </div>

                {showWorkspaceTabs && (
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab("reportes")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === "reportes"
                                    ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600"
                                    : "text-gray-500"
                            }`}
                        >
                            {isCommunications ? "Reportes de usuarios" : "Reportes Usuarios"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("gestion")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === "gestion"
                                    ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600"
                                    : "text-gray-500"
                            }`}
                        >
                            Mis Informes / Gestión
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2">
                {showFilters && (
                    <div className="mb-6 px-4 pt-4">
                        <TaskFilters onFilterChange={setFilters} />
                    </div>
                )}

                {showCreateButton && (
                    <div className="mb-4 flex justify-end px-4">
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            + Crear Nueva Tarea
                        </button>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl p-4">
                    {isCommunications && activeTab === "gestion" ? (
                        <CommsInformesPanel
                            key={refreshKey}
                            informes={taskList}
                            loading={loading}
                            onEdit={handleEdit}
                        />
                    ) : (
                        <TaskTable
                            key={refreshKey}
                            view={tableView}
                            tasks={taskList}
                            loading={loading}
                            userType={user?.type_user}
                            onEdit={handleEdit}
                            onView={handleView}
                            onSubmitReport={isStandard ? handleSubmitReportFromList : undefined}
                            onReview={
                                (isAdmin || isCommunications) && activeTab === "reportes"
                                    ? setReviewReportId
                                    : undefined
                            }
                            readOnly={isStandard}
                        />
                    )}
                </div>
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleRefresh}
                initialData={selectedTask}
            />

            <TaskViewModal
                isOpen={!!viewTaskId}
                taskId={viewTaskId}
                onClose={() => setViewTaskId(null)}
                onSubmitReport={handleSubmitReportFromView}
            />

            <TaskReportModal
                isOpen={!!reportParentTask}
                parentTask={reportParentTask}
                onClose={() => setReportParentTask(null)}
                onSuccess={handleRefresh}
            />

            <TaskReviewModal
                isOpen={!!reviewReportId}
                reportId={reviewReportId}
                onClose={() => setReviewReportId(null)}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
