import api from './api';

export type TravelExpenseType = 'FLIGHT' | 'TRAIN' | 'CAR' | 'TAXI' | 'ACCOMMODATION' | 'MEALS' | 'OTHER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TravelExpense {
  id: string;
  userId: string;
  type: TravelExpenseType;
  date: string;
  description: string;
  destination?: string;
  purpose?: string;
  distance?: number;
  vehicleType?: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: RequestStatus;
  approverId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateTravelExpenseData {
  type: TravelExpenseType;
  date: string;
  description: string;
  destination?: string;
  purpose?: string;
  distance?: number;
  vehicleType?: string;
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: string;
}

class TravelExpenseService {
  async getAllTravelExpenses(): Promise<TravelExpense[]> {
    const response = await api.get<TravelExpense[]>('/travel-expenses');
    return response.data;
  }

  async getTravelExpenseById(id: string): Promise<TravelExpense> {
    const response = await api.get<TravelExpense>(`/travel-expenses/${id}`);
    return response.data;
  }

  async createTravelExpense(data: CreateTravelExpenseData): Promise<TravelExpense> {
    const response = await api.post<TravelExpense>('/travel-expenses', data);
    return response.data;
  }

  async updateTravelExpense(id: string, data: Partial<CreateTravelExpenseData>): Promise<TravelExpense> {
    const response = await api.put<TravelExpense>(`/travel-expenses/${id}`, data);
    return response.data;
  }

  async deleteTravelExpense(id: string): Promise<void> {
    const response = await api.delete(`/travel-expenses/${id}`);
    return response.data;
  }

  async approveTravelExpense(id: string): Promise<TravelExpense> {
    const response = await api.post<TravelExpense>(`/travel-expenses/${id}/approve`, {});
    return response.data;
  }

  async rejectTravelExpense(id: string, rejectionReason?: string): Promise<TravelExpense> {
    const response = await api.post<TravelExpense>(`/travel-expenses/${id}/reject`, { rejectionReason });
    return response.data;
  }
}

export const travelExpenseService = new TravelExpenseService();
