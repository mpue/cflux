export enum ChecklistType {
  ONBOARDING = 'ONBOARDING',
  OFFBOARDING = 'OFFBOARDING',
  AUDIT = 'AUDIT',
  MAINTENANCE = 'MAINTENANCE',
  PROJECT = 'PROJECT',
  CUSTOM = 'CUSTOM',
}

export enum ChecklistItemType {
  CHECKBOX = 'CHECKBOX',
  TEXT = 'TEXT',
  DATE = 'DATE',
  SIGNATURE = 'SIGNATURE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  PHOTO = 'PHOTO',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
}

export enum ChecklistStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  type: ChecklistType;
  category?: string;
  isActive: boolean;
  estimatedDuration?: number;
  responsibleRole?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items?: ChecklistItem[];
  instances?: ChecklistInstance[];
  _count?: {
    items: number;
    instances: number;
  };
}

export interface ChecklistItem {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  order: number;
  itemType: ChecklistItemType;
  required: boolean;
  assignedRole?: string;
  dueAfterDays?: number;
  dueDayOffset?: number;
  conditionalParentId?: string;
  showIfParentValue?: string;
  externalLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistInstance {
  id: string;
  templateId: string;
  template?: ChecklistTemplate;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: ChecklistStatus;
  startDate: string;
  targetEndDate?: string;
  completedDate?: string;
  totalItems: number;
  completedItems: number;
  progressPercent: number;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  notes?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  completions?: ChecklistItemCompletion[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItemCompletion {
  id: string;
  instanceId: string;
  itemId: string;
  item?: ChecklistItem;
  completed: boolean;
  completedAt?: string;
  completedById?: string;
  completedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  boolValue?: boolean;
  jsonValue?: any;
  fileUrl?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  type: ChecklistType;
  category?: string;
  estimatedDuration?: number;
  responsibleRole?: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  type?: ChecklistType;
  category?: string;
  estimatedDuration?: number;
  responsibleRole?: string;
  isActive?: boolean;
}

export interface CreateTemplateItemDto {
  templateId: string;
  title: string;
  description?: string;
  order: number;
  itemType: ChecklistItemType;
  required?: boolean;
  assignedRole?: string;
  dueAfterDays?: number;
  dueDayOffset?: number;
  conditionalParentId?: string;
  showIfParentValue?: string;
  externalLink?: string;
}

export interface UpdateTemplateItemDto {
  title?: string;
  description?: string;
  order?: number;
  itemType?: ChecklistItemType;
  required?: boolean;
  assignedRole?: string;
  dueAfterDays?: number;
  dueDayOffset?: number;
  conditionalParentId?: string;
  showIfParentValue?: string;
}

export interface CreateInstanceDto {
  templateId: string;
  userId: string;
  assignedToId?: string;
  startDate?: string;
  targetEndDate?: string;
  notes?: string;
  projectId?: string;
}

export interface UpdateInstanceDto {
  status?: ChecklistStatus;
  targetEndDate?: string;
  assignedToId?: string;
  notes?: string;
}

export interface CompleteItemDto {
  instanceId: string;
  itemId: string;
  completed: boolean;
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  boolValue?: boolean;
  jsonValue?: any;
  fileUrl?: string;
  comment?: string;
}

export interface ChecklistStatistics {
  totalTemplates: number;
  activeTemplates: number;
  totalInstances: number;
  inProgressInstances: number;
  completedInstances: number;
  overdueInstances: number;
}
