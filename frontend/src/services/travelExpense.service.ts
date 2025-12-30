const API_URL = process.env.REACT_APP_API_URL || '';

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
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async getAllTravelExpenses(): Promise<TravelExpense[]> {
    const response = await fetch(`${API_URL}/api/travel-expenses`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Reisekosten');
    }

    return response.json();
  }

  async getTravelExpenseById(id: string): Promise<TravelExpense> {
    const response = await fetch(`${API_URL}/api/travel-expenses/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Reisekosten');
    }

    return response.json();
  }

  async createTravelExpense(data: CreateTravelExpenseData): Promise<TravelExpense> {
    const response = await fetch(`${API_URL}/api/travel-expenses`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Erstellen der Reisekosten');
    }

    return response.json();
  }

  async updateTravelExpense(id: string, data: Partial<CreateTravelExpenseData>): Promise<TravelExpense> {
    const response = await fetch(`${API_URL}/api/travel-expenses/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Aktualisieren der Reisekosten');
    }

    return response.json();
  }

  async deleteTravelExpense(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/travel-expenses/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Löschen der Reisekosten');
    }
  }

  async approveTravelExpense(id: string): Promise<TravelExpense> {
    const response = await fetch(`${API_URL}/api/travel-expenses/${id}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Genehmigen der Reisekosten');
    }

    return response.json();
  }

  async rejectTravelExpense(id: string, rejectionReason?: string): Promise<TravelExpense> {
    const response = await fetch(`${API_URL}/api/travel-expenses/${id}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rejectionReason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Ablehnen der Reisekosten');
    }

    return response.json();
  }
}

export const travelExpenseService = new TravelExpenseService();
