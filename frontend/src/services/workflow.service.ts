import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: WorkflowStep[];
  templateLinks?: any[];
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  type: 'APPROVAL' | 'NOTIFICATION' | 'CONDITION' | 'DELAY';
  order: number;
  approverUserIds?: string;
  approverGroupIds?: string;
  requireAllApprovers: boolean;
  config?: string;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  invoiceId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  currentStepId?: string;
  startedAt: string;
  completedAt?: string;
  workflow?: Workflow;
  steps?: WorkflowInstanceStep[];
}

export interface WorkflowInstanceStep {
  id: string;
  instanceId: string;
  stepId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedById?: string;
  approvedAt?: string;
  comment?: string;
  step?: WorkflowStep;
  approvedBy?: any;
}

export const workflowService = {
  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/workflows');
    return response.data;
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  async createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
    const response = await api.put(`/workflows/${id}`, data);
    return response.data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  // Workflow Steps
  async createWorkflowStep(workflowId: string, data: Partial<WorkflowStep>): Promise<WorkflowStep> {
    const response = await api.post(`/workflows/${workflowId}/steps`, data);
    return response.data;
  },

  async updateWorkflowStep(id: string, data: Partial<WorkflowStep>): Promise<WorkflowStep> {
    const response = await api.put(`/workflows/steps/${id}`, data);
    return response.data;
  },

  async deleteWorkflowStep(id: string): Promise<void> {
    await api.delete(`/workflows/steps/${id}`);
  },

  // Template Links
  async linkWorkflowToTemplate(templateId: string, workflowId: string, order: number): Promise<any> {
    const response = await api.post('/workflows/template-links', {
      templateId,
      workflowId,
      order,
    });
    return response.data;
  },

  async unlinkWorkflowFromTemplate(templateId: string, workflowId: string): Promise<void> {
    await api.delete(`/workflows/template-links/${templateId}/${workflowId}`);
  },

  async getTemplateWorkflows(templateId: string): Promise<any[]> {
    const response = await api.get(`/workflows/templates/${templateId}`);
    return response.data;
  },

  // Workflow Instances
  async getInvoiceWorkflowInstances(invoiceId: string): Promise<WorkflowInstance[]> {
    const response = await api.get(`/workflows/invoices/${invoiceId}/instances`);
    return response.data;
  },

  async approveWorkflowStep(instanceStepId: string, userId: string, comment?: string): Promise<WorkflowInstanceStep> {
    const response = await api.post(`/workflows/instances/steps/${instanceStepId}/approve`, {
      userId,
      comment,
    });
    return response.data;
  },

  async rejectWorkflowStep(instanceStepId: string, userId: string, comment?: string): Promise<WorkflowInstanceStep> {
    const response = await api.post(`/workflows/instances/steps/${instanceStepId}/reject`, {
      userId,
      comment,
    });
    return response.data;
  },

  async checkInvoiceApproval(invoiceId: string): Promise<{ canApprove: boolean; allCompleted: boolean; anyRejected: boolean }> {
    const response = await api.get(`/workflows/invoices/${invoiceId}/check-approval`);
    return response.data;
  },

  async getMyPendingApprovals(): Promise<any[]> {
    const response = await api.get('/workflows/my-approvals');
    return response.data;
  },
};
