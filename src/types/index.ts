// ============================================================
// NexaOS – Core Type Definitions
// ============================================================

export type ID = string;

// ── Common ──────────────────────────────────────────────────

export type Status = 'active' | 'inactive' | 'archived';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'SGD' | 'AED';

// ── Settings ─────────────────────────────────────────────────

export interface AppSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;
  phone?: string;
  website?: string;
  address?: string;
  logoUrl: string | null;
  currency: Currency;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    deadlines: boolean;
    overdueInvoices: boolean;
    newLeads: boolean;
    completedTasks: boolean;
  };
}

// ── Client ────────────────────────────────────────────────────

export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'churned';

export interface Client {
  id: ID;
  companyName: string;
  name?: string; // alias for companyName
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  address: string;
  city: string;
  country: string;
  status: ClientStatus;
  totalRevenue: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  avatar?: string;
}

// ── Lead ─────────────────────────────────────────────────────

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type LeadSource = 'website' | 'referral' | 'linkedin' | 'email' | 'cold-call' | 'event' | 'ad' | 'other';

export interface Lead {
  id: ID;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: LeadStage;
  status?: LeadStage; // alias
  source: LeadSource;
  value: number;
  probability: number;
  followUpDate: string | null;
  assignedTo: ID | null;
  notes: string;
  activities: LeadActivity[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface LeadActivity {
  id: ID;
  type: 'note' | 'call' | 'email' | 'meeting' | 'status-change';
  content: string;
  createdAt: string;
  userId: ID;
}

export interface Activity {
  id: ID;
  clientId?: ID | null;
  projectId?: ID | null;
  type: string;
  title?: string;
  description?: string;
  content?: string;
  createdAt: string;
  userId?: ID;
}

// ── Project ───────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';

export interface Project {
  id: ID;
  name: string;
  description: string;
  clientId: ID | null;
  status: ProjectStatus;
  priority: Priority;
  budget: number;
  spent: number;
  startDate: string;
  dueDate: string;
  completedDate?: string | null;
  endDate?: string | null;
  teamMembers: ID[];
  tags: string[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  color: string;
}

export interface Milestone {
  id: ID;
  title: string;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
}

// ── Task ─────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface Task {
  id: ID;
  title: string;
  description: string;
  projectId: ID | null;
  assigneeId: ID | null;
  status: TaskStatus;
  priority: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Invoice ───────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: ID;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxRate?: number;
}

export interface Invoice {
  id: ID;
  invoiceNumber: string;
  number?: string; // alias
  total?: number;  // alias / computed
  clientId: ID;
  projectId: ID | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  items: InvoiceItem[];
  discount: number;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payment ───────────────────────────────────────────────────

export type PaymentMethod = 'bank-transfer' | 'upi' | 'cash' | 'card' | 'other';

export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: ID;
  clientId: ID;
  invoiceId: ID | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionDate: string;
  date?: string; // alias
  referenceNumber: string;
  reference?: string; // alias
  notes: string;
  createdAt: string;
}

// ── Team Member ───────────────────────────────────────────────

export type TeamRole = 'owner' | 'admin' | 'manager' | 'member';

export interface TeamMember {
  id: ID;
  name: string;
  email: string;
  role: TeamRole;
  department: string;
  phone: string;
  avatar: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  projectIds: ID[];
  taskIds: ID[];
  projectsCount?: number;
  tasksCount?: number;
}

// ── Automation ────────────────────────────────────────────────

export type AutomationTrigger =
  | 'lead-created'
  | 'invoice-overdue'
  | 'task-completed'
  | 'project-completed'
  | 'client-added'
  | 'invoice-paid'
  | 'lead-won'
  | 'task-created';

export type AutomationAction =
  | 'create-task'
  | 'add-to-overdue'
  | 'update-project-progress'
  | 'send-notification'
  | 'create-activity'
  | 'send-welcome'
  | 'mark-lead-contacted';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater-than' | 'less-than' | 'is-empty';
  value: string;
}

export interface AutomationExecution {
  id: ID;
  triggeredAt: string;
  status: 'success' | 'failed' | 'skipped';
  details: string;
}

export interface Automation {
  id: ID;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  condition?: AutomationCondition | null;
  action: AutomationAction;
  actionConfig?: Record<string, string>;
  isActive: boolean;
  executions: AutomationExecution[];
  createdAt: string;
  updatedAt: string;
  executionCount?: number;
  lastRunStatus?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history?: any[];
}

// ── Document ──────────────────────────────────────────────────

export type DocumentCategory = 'contract' | 'proposal' | 'report' | 'invoice' | 'general' | 'other';

export interface Document {
  id: ID;
  name: string;
  category: DocumentCategory;
  clientId: ID | null;
  projectId: ID | null;
  size: number;
  mimeType: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Notification ──────────────────────────────────────────────

export type NotificationType =
  | 'deadline'
  | 'overdue-invoice'
  | 'new-lead'
  | 'completed-task'
  | 'project-update'
  | 'automation'
  | 'payment'
  | 'general';

export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

// ── Store State ───────────────────────────────────────────────

export interface AppStore {
  // Data
  settings: AppSettings;
  clients: Client[];
  leads: Lead[];
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
  payments: Payment[];
  team: TeamMember[];
  teamMembers?: TeamMember[];
  automations: Automation[];
  documents: Document[];
  notifications: Notification[];
  activities?: Activity[];

  // UI State
  sidebarCollapsed: boolean;
  mobileSidebarOpen?: boolean;
  theme: 'light' | 'dark';
  isLoading: boolean;

  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed?: (collapsed: boolean) => void;
  setMobileSidebarOpen?: (open: boolean) => void;
  toggleMobileSidebar?: () => void;

  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: ID, updates: Partial<Client>) => void;
  deleteClient: (id: ID) => void;

  // Lead Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'activities'>) => Lead;
  updateLead: (id: ID, updates: Partial<Lead>) => void;
  deleteLead: (id: ID) => void;
  addLeadActivity: (leadId: ID, activity: Omit<LeadActivity, 'id' | 'createdAt'>) => void;

  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: ID, updates: Partial<Project>) => void;
  deleteProject: (id: ID) => void;

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: ID, updates: Partial<Task>) => void;
  deleteTask: (id: ID) => void;

  // Invoice Actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: ID, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: ID) => void;

  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  updatePayment: (id: ID, updates: Partial<Payment>) => void;
  deletePayment: (id: ID) => void;

  // Team Actions
  addTeamMember: (member: Omit<TeamMember, 'id' | 'joinedAt'>) => TeamMember;
  updateTeamMember: (id: ID, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: ID) => void;

  // Automation Actions
  addAutomation: (automation: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'executions'>) => Automation;
  updateAutomation: (id: ID, updates: Partial<Automation>) => void;
  deleteAutomation: (id: ID) => void;
  executeAutomation: (id: ID) => void;

  // Document Actions
  addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Document;
  deleteDocument: (id: ID) => void;

  // Notification Actions
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: ID) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Data Management
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;

  // Helpers
  generateId?: () => string;

  // Internal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerAutomations: (trigger: string, data: any) => void;
}
