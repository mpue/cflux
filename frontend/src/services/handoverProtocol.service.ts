import api from './api';

export type HandoverProtocolType = 'HANDOVER' | 'RETURN';
export type HandoverProtocolStatus = 'DRAFT' | 'SIGNED' | 'CANCELLED';
export type HandoverItemKind = 'DEVICE' | 'TOOL' | 'EQUIPMENT' | 'OTHER';
export type EquipmentCondition = 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';

export const CONDITION_LABELS: Record<EquipmentCondition, string> = {
  NEW: 'Neu',
  GOOD: 'Gut',
  FAIR: 'Gebraucht',
  DAMAGED: 'Beschädigt',
};

export const TYPE_LABELS: Record<HandoverProtocolType, string> = {
  HANDOVER: 'Übergabe',
  RETURN: 'Rücknahme',
};

export const STATUS_LABELS: Record<HandoverProtocolStatus, string> = {
  DRAFT: 'Entwurf',
  SIGNED: 'Unterschrieben',
  CANCELLED: 'Storniert',
};

export const KIND_LABELS: Record<HandoverItemKind, string> = {
  DEVICE: 'Gerät',
  TOOL: 'Werkzeug',
  EQUIPMENT: 'Ausrüstung',
  OTHER: 'Sonstiges',
};

export interface HandoverProtocolItem {
  id: string;
  protocolId: string;
  kind: HandoverItemKind;
  deviceId?: string | null;
  toolId?: string | null;
  equipmentId?: string | null;
  name: string;
  category?: string | null;
  serialNumber?: string | null;
  inventoryNumber?: string | null;
  condition: EquipmentCondition;
  accessories?: string | null;
  notes?: string | null;
}

export interface HandoverProtocol {
  id: string;
  protocolNumber: string;
  type: HandoverProtocolType;
  status: HandoverProtocolStatus;
  userId?: string | null;
  employeeId?: string | null;
  handoverDate: string;
  location?: string | null;
  notes?: string | null;
  issuedById: string;
  signedAt?: string | null;
  signedDocumentPath?: string | null;
  pdfPath?: string | null;
  pdfGeneratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: HandoverProtocolItem[];
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber?: string | null;
    department?: string | null;
    position?: string | null;
  } | null;
  issuedBy?: { id: string; firstName: string; lastName: string; email: string };
}

export interface HandoverItemInput {
  kind?: HandoverItemKind;
  deviceId?: string | null;
  toolId?: string | null;
  equipmentId?: string | null;
  name?: string;
  category?: string | null;
  serialNumber?: string | null;
  inventoryNumber?: string | null;
  condition?: EquipmentCondition;
  accessories?: string | null;
  notes?: string | null;
}

export interface CreateProtocolInput {
  type: HandoverProtocolType;
  userId?: string | null;
  employeeId?: string | null;
  handoverDate?: string;
  location?: string | null;
  notes?: string | null;
  items: HandoverItemInput[];
}

class HandoverProtocolService {
  async getAll(filters?: {
    userId?: string;
    deviceId?: string;
    type?: HandoverProtocolType;
    status?: HandoverProtocolStatus;
    search?: string;
  }): Promise<HandoverProtocol[]> {
    const response = await api.get('/handover-protocols', { params: filters });
    return response.data;
  }

  async getMine(): Promise<HandoverProtocol[]> {
    const response = await api.get('/handover-protocols/mine');
    return response.data;
  }

  async getById(id: string): Promise<HandoverProtocol> {
    const response = await api.get(`/handover-protocols/${id}`);
    return response.data;
  }

  async create(input: CreateProtocolInput): Promise<HandoverProtocol> {
    const response = await api.post('/handover-protocols', input);
    return response.data;
  }

  async update(
    id: string,
    data: {
      handoverDate?: string;
      location?: string | null;
      notes?: string | null;
      items?: Array<{ id: string; condition?: EquipmentCondition; accessories?: string | null; notes?: string | null }>;
    }
  ): Promise<HandoverProtocol> {
    const response = await api.put(`/handover-protocols/${id}`, data);
    return response.data;
  }

  /** Markiert das Protokoll als unterschrieben; optional mit eingescanntem Beleg. */
  async sign(id: string, signedDocument?: File | null): Promise<HandoverProtocol> {
    if (signedDocument) {
      const form = new FormData();
      form.append('signedDocument', signedDocument);
      const response = await api.post(`/handover-protocols/${id}/sign`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await api.post(`/handover-protocols/${id}/sign`, {});
    return response.data;
  }

  async cancel(id: string, reason?: string): Promise<HandoverProtocol> {
    const response = await api.post(`/handover-protocols/${id}/cancel`, { reason });
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/handover-protocols/${id}`);
  }

  /** Lädt das PDF als Blob (Anzeige oder Download im Browser). */
  async getPdf(id: string): Promise<Blob> {
    const response = await api.get(`/handover-protocols/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  }

  /**
   * Lädt den eingescannten, unterschriebenen Beleg. Der Upload-Pfad ist nicht
   * öffentlich abrufbar, der Zugriff läuft deshalb über die API.
   */
  async getSignedDocument(id: string): Promise<Blob> {
    const response = await api.get(`/handover-protocols/${id}/signed-document`, { responseType: 'blob' });
    return response.data;
  }
}

export const handoverProtocolService = new HandoverProtocolService();
