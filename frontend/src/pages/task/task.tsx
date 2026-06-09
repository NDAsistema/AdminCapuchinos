import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../components/UserProfile/AuthProvider";
import { TaskFilters } from "../../components/task/TaskFilters";
import { TaskTable } from "../../components/task/tasktable";
import { CommsInformesPanel } from "../../components/task/CommsInformesPanel";
import { TaskModal } from "../../components/task/TaskModal";
import { TaskViewModal } from "../../components/task/TaskViewModal";
import { TaskReportModal } from "../../components/task/TaskReportModal";
import { TaskReviewModal } from "../../components/task/TaskReviewModal";
import TaskService, { type TaskListView } from "../../services/taskServices";
import GroupService from "../../services/GroupService";
import { usePermissions } from "../../hooks/usePermissions";

export default function Tasks() {
    const { user } = useAuth();
    const { isAdmin, isCommunications, isStandard, isGroupLeader } = usePermissions();
    const [leaderWorkspace, setLeaderWorkspace] = useState(isGroupLeader);

    const [activeTab, setActiveTab] = useState<TaskListView>("reportes");
    const [filters, setFilters] = useState({ groupId: "", userId: "", brotherId: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [taskList, setTaskList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [viewTaskId, setViewTaskId] = useState<number | null>(null);
    const [reportParentTask, setReportParentTask] = useState<any>(null);
    const [reviewReportId, setReviewReportId] = useState<number | null>(null);
    const [reviewMode, setReviewMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isGroupLeader) {
            setLeaderWorkspace(true);
            return;
        }
        if (!isStandard) {
            setLeaderWorkspace(false);
            return;
        }
        GroupService.findGroupsForGroupLeader()
            .then((groups) => {
                const isLeader = Array.isArray(groups) && groups.length > 0;
                setLeaderWorkspace(isLeader);
                if (isLeader) setActiveTab("asignadas");
            })
            .catch(() => setLeaderWorkspace(false));
    }, [isGroupLeader, isStandard]);

    const showWorkspaceTabs = isAdmin || isCommunications || leaderWorkspace;
    const showFilters = showWorkspaceTabs && activeTab === "reportes";
    const showCreateButton =
        (isAdmin || isCommunications || leaderWorkspace) && activeTab === "gestion";
    const showAssignedSearch = isStandard && (!leaderWorkspace || activeTab === "asignadas");

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params: {
                view?: TaskListView;
                groupId?: string;
                userId?: string;
                brotherId?: string;
            } = {};
            if (showWorkspaceTabs && activeTab !== "asignadas") {
                params.view = activeTab;
                if (activeTab === "reportes") {
                    if (filters.groupId) params.groupId = filters.groupId;
                    if (filters.userId) params.userId = filters.userId;
                    if (filters.brotherId) params.brotherId = filters.brotherId;
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
        const openAssignedView =
            (isStandard && !leaderWorkspace) ||
            (leaderWorkspace && activeTab === "asignadas") ||
            activeTab === "gestion";

        if (openAssignedView) {
            setViewTaskId(task.id);
        } else {
            setReviewMode(false);
            setReviewReportId(task.id);
        }
    };

    const handleReview = (reportId: number) => {
        setReviewMode(true);
        setReviewReportId(reportId);
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
          : leaderWorkspace
            ? "Modulo tareas Lider de Grupo"
            : "Mis Tareas Asignadas";

    const tableView =
        leaderWorkspace && activeTab === "asignadas"
            ? "assigned"
            : isStandard && !leaderWorkspace
              ? "assigned"
              : activeTab === "asignadas"
                ? "assigned"
                : activeTab;

    const filteredTasks = useMemo(() => {
        if (!showAssignedSearch || !searchQuery.trim()) return taskList;

        const q = searchQuery.trim().toLowerCase();
        const statusText = (task: any) => {
            if (!task.my_report_id && !task.my_review_status) return "sin enviar";
            if (task.my_review_status === "pending") return "pendiente revisión";
            if (task.my_review_status === "approved") return "aprobado";
            if (task.my_review_status === "rejected") return "rechazado";
            return "";
        };

        return taskList.filter((task) => {
            const text = [
                task.title,
                task.userName,
                task.groupName,
                statusText(task),
                task.created_at ? new Date(task.created_at).toLocaleDateString() : "",
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return text.includes(q);
        });
    }, [showAssignedSearch, searchQuery, taskList]);

    const tableEmptyMessage =
        showAssignedSearch && searchQuery.trim() && taskList.length > 0
            ? "No hay tareas que coincidan con tu búsqueda."
            : undefined;

    return (
        <div className="col-span-12 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">{pageTitle}</h1>
                    {isStandard && !leaderWorkspace && (
                        <p className="text-sm text-gray-500 mt-1">
                            Revisa la tarea asignada y envía tu informe para aprobación.
                        </p>
                    )}
                    {leaderWorkspace && (
                        <p className="text-sm text-gray-500 mt-1">
                            Gestiona las tareas de tu grupo y revisa los informes de tus miembros.
                        </p>
                    )}
                </div>

                {showWorkspaceTabs && (
                    <div className="flex flex-wrap bg-gray-100 dark:bg-gray-700 p-1 rounded-xl gap-1">
                        {leaderWorkspace && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("asignadas")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === "asignadas"
                                        ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600"
                                        : "text-gray-500"
                                }`}
                            >
                                Mis Tareas
                            </button>
                        )}
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
                        <TaskFilters
                            onFilterChange={setFilters}
                            isLeaderMode={leaderWorkspace}
                        />
                    </div>
                )}

                {showAssignedSearch && (
                    <div className="mb-4 px-4 pt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">
                            Buscar tarea
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por título, asignado por, estado o fecha..."
                            className="w-full md:max-w-md bg-white dark:bg-gray-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 h-11 px-4"
                        />
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
                            tasks={filteredTasks}
                            loading={loading}
                            userType={user?.type_user}
                            emptyMessage={tableEmptyMessage}
                            onEdit={handleEdit}
                            onView={handleView}
                            onSubmitReport={
                                showAssignedSearch ? handleSubmitReportFromList : undefined
                            }
                            onReview={
                                (isAdmin || isCommunications || leaderWorkspace) &&
                                activeTab === "reportes"
                                    ? handleReview
                                    : undefined
                            }
                            readOnly={isStandard && activeTab !== "gestion"}
                        />
                    )}
                </div>
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleRefresh}
                initialData={selectedTask}
                isLeaderMode={leaderWorkspace}
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
                reviewMode={reviewMode}
                onClose={() => {
                    setReviewReportId(null);
                    setReviewMode(false);
                }}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
