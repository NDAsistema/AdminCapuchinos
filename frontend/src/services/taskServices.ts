import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

export interface Task {
  id?: number;
  title: string;
  content: string;
  task_origin: number; // 1:Admin, 2:Comms, etc.
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_type: number; // 0: Todos, 1: Persona, 2: Grupo
  assigned_ids: number[]; // Ahora es un array de IDs
  due_date?: string | null;
  is_recurring: boolean;
  recurrence_rule?: string | null;
}

class TaskService {
  async getAllTask(filters = {}): Promise<Task[]> {
    const response = await api.get('/tasks', { params: filters });
    return response.data.data; 
  }

  async createTask(taskData: Partial<Task>): Promise<any> {
    const response = await api.post('/tasks', taskData);
    return response.data;
  }

}

export default new TaskService();