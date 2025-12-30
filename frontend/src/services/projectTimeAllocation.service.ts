import api from './api';

export interface ProjectTimeAllocation {
  id: string;
  timeEntryId: string;
  projectId: string;
  hours: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface AllocationInput {
  projectId: string;
  hours: number;
  description?: string;
}

export interface ProjectTimeStats {
  projectId: string;
  projectName: string;
  totalHours: number;
  allocations: {
    id: string;
    hours: number;
    description?: string;
    date: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

const projectTimeAllocationService = {
  getAllocationsForTimeEntry: async (timeEntryId: string): Promise<ProjectTimeAllocation[]> => {
    const response = await api.get(`/project-time-allocations/time-entry/${timeEntryId}`);
    return response.data;
  },

  setAllocationsForTimeEntry: async (
    timeEntryId: string,
    allocations: AllocationInput[]
  ): Promise<ProjectTimeAllocation[]> => {
    const response = await api.post(`/project-time-allocations/time-entry/${timeEntryId}`, {
      allocations,
    });
    return response.data;
  },

  deleteAllocation: async (allocationId: string): Promise<void> => {
    await api.delete(`/project-time-allocations/${allocationId}`);
  },

  getProjectTimeStats: async (
    startDate?: string,
    endDate?: string,
    projectId?: string
  ): Promise<ProjectTimeStats[]> => {
    const response = await api.get('/project-time-allocations/stats', {
      params: { startDate, endDate, projectId },
    });
    return response.data;
  },
};

export default projectTimeAllocationService;
