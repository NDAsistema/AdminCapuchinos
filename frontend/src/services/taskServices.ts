import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export type TaskListView = 'reportes' | 'gestion';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Task {
  id?: number;
  parent_task_id?: number | null;
  title: string;
  content: string;
  task_origin?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_type?: number;
  assigned_ids?: number[];
  due_date?: string | null;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  userName?: string;
  groupName?: string;
  parent_title?: string;
  review_status?: ReviewStatus | null;
  review_comment?: string | null;
  my_report_id?: number | null;
  my_review_status?: ReviewStatus | null;
  my_review_comment?: string | null;
  relatedReports?: Task[];
  parent?: Task;
  myReport?: Task;
  canSubmit?: boolean;
  canReview?: boolean;
}

export interface TaskListParams {
  view?: TaskListView;
  groupId?: string;
  userId?: string;
}

class TaskService {
  async getAllTask(params: TaskListParams = {}): Promise<Task[]> {
    const response = await api.get('/tasks', { params });
    const payload = response.data;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  async getTaskDetail(id: number): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  }

  async createTask(taskData: Partial<Task>): Promise<any> {
    const response = await api.post('/tasks', taskData);
    return response.data;
  }

  async submitReport(parentTaskId: number, data: { content: string; title?: string }): Promise<any> {
    const response = await api.post(`/tasks/${parentTaskId}/submit-report`, data);
    return response.data;
  }

  async reviewReport(reportId: number, action: 'approve' | 'reject', comment?: string): Promise<any> {
    const response = await api.patch(`/tasks/reports/${reportId}/review`, { action, comment });
    return response.data;
  }
}

export default new TaskService();
