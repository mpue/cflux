import api from './api';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string | null;
  taskType: string;
  cronExpression: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  isSystemTask: boolean;
  config: Record<string, any> | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunMessage: string | null;
  nextRunAt: string | null;
  runCount: number;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  executions?: ScheduledTaskExecution[];
}

export interface ScheduledTaskExecution {
  id: string;
  taskId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  message: string | null;
  details: Record<string, any> | null;
  affectedCount: number;
}

class ScheduledTaskService {
  async getTasks(params?: { status?: string; taskType?: string }): Promise<ScheduledTask[]> {
    const { data } = await api.get('/scheduled-tasks', { params });
    return data;
  }

  async getTask(id: string): Promise<ScheduledTask> {
    const { data } = await api.get(`/scheduled-tasks/${id}`);
    return data;
  }

  async updateTask(id: string, updates: Partial<Pick<ScheduledTask, 'cronExpression' | 'status' | 'name' | 'description' | 'config'>>): Promise<ScheduledTask> {
    const { data } = await api.put(`/scheduled-tasks/${id}`, updates);
    return data;
  }

  async triggerTask(id: string): Promise<{ message: string; task: ScheduledTask }> {
    const { data } = await api.post(`/scheduled-tasks/${id}/trigger`);
    return data;
  }

  async getTaskExecutions(id: string, limit?: number): Promise<ScheduledTaskExecution[]> {
    const { data } = await api.get(`/scheduled-tasks/${id}/executions`, {
      params: limit ? { limit } : undefined,
    });
    return data;
  }
}

export const scheduledTaskService = new ScheduledTaskService();
