// ============================================================
// NexaOS – Zustand Store with LocalStorage Persistence
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  AppStore,
  AppSettings,
  Client,
  Lead,
  LeadActivity,
  Project,
  Task,
  Invoice,
  Payment,
  TeamMember,
  Automation,
  AutomationExecution,
  Document,
  Notification,
  ID,
} from '@/types';
import {
  defaultSettings,
  demoClients,
  demoLeads,
  demoProjects,
  demoTasks,
  demoInvoices,
  demoPayments,
  demoTeam,
  demoAutomations,
  demoDocuments,
  demoNotifications,
} from '@/lib/demo-data';

const now = () => new Date().toISOString();

export function calcInvoiceTotal(
  invoiceOrItems: any,
  maybeDiscount?: number
) {
  let items: Array<{ quantity: number; unitPrice: number; taxPercent: number }> = [];
  let discount = 0;

  if (Array.isArray(invoiceOrItems)) {
    items = invoiceOrItems;
    discount = maybeDiscount || 0;
  } else if (invoiceOrItems && typeof invoiceOrItems === 'object') {
    items = invoiceOrItems.items || [];
    discount = invoiceOrItems.discount || 0;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0),
    0
  );
  const tax = items.reduce(
    (sum, item) =>
      sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0) * ((Number(item?.taxPercent) || 0) / 100),
    0
  );
  const discountAmount = (subtotal + tax) * (discount / 100);
  const total = subtotal + tax - discountAmount;

  const result = {
    subtotal,
    tax,
    discountAmount,
    total,
    valueOf() {
      return total;
    },
    toString() {
      return String(total);
    },
  };

  return result as { subtotal: number; tax: number; discountAmount: number; total: number } & number;
}

function getInitialState() {
  const seededClients: Client[] = demoClients.map(c => ({
    ...c,
    name: c.companyName,
  }));

  const seededInvoices: Invoice[] = demoInvoices.map(i => ({
    ...i,
    number: i.invoiceNumber,
    total: calcInvoiceTotal(i).total,
  }));

  const seededPayments: Payment[] = demoPayments.map(p => ({
    ...p,
    date: p.transactionDate,
    reference: p.referenceNumber,
  }));

  const seededLeads: Lead[] = demoLeads.map(l => ({
    ...l,
    status: l.stage,
  }));

  const seededActivities = [
    { id: 'act-1', clientId: 'client-1', type: 'call', title: 'Q3 Strategy Call', content: 'Discussed project expansion roadmap.', createdAt: '2024-09-28T14:30:00Z' },
    { id: 'act-2', clientId: 'client-2', type: 'meeting', title: 'LMS Platform Demo', content: 'Demonstrated video module and test scores.', createdAt: '2024-09-25T11:00:00Z' },
    { id: 'act-3', clientId: 'client-3', type: 'note', title: 'Brand Guidelines Delivered', content: 'Client approved all finalized assets.', createdAt: '2024-08-25T16:00:00Z' },
    { id: 'act-4', clientId: 'client-4', type: 'email', title: 'Contract Signed', content: 'Received master agreement for Finance Dashboard.', createdAt: '2024-10-01T09:00:00Z' },
  ];

  return {
    settings: {
      ...defaultSettings,
      phone: defaultSettings.companyPhone,
      website: defaultSettings.companyWebsite,
      address: defaultSettings.companyAddress,
    },
    clients: seededClients,
    leads: seededLeads,
    projects: demoProjects,
    tasks: demoTasks,
    invoices: seededInvoices,
    payments: seededPayments,
    team: demoTeam,
    teamMembers: demoTeam,
    automations: demoAutomations,
    documents: demoDocuments,
    notifications: demoNotifications,
    activities: seededActivities,
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    theme: 'light' as const,
    isLoading: false,
  };
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      generateId: () => nanoid(8),

      // ── Settings ──────────────────────────────────────────────────────────
      updateSettings: (updates) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...updates,
            phone: updates.phone || updates.companyPhone || s.settings.phone || s.settings.companyPhone,
            website: updates.website || updates.companyWebsite || s.settings.website || s.settings.companyWebsite,
            address: updates.address || updates.companyAddress || s.settings.address || s.settings.companyAddress,
          }
        })),

      toggleTheme: () =>
        set((s) => {
          const newTheme = s.theme === 'light' ? 'dark' : 'light';
          return { theme: newTheme, settings: { ...s.settings, theme: newTheme } };
        }),

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      toggleMobileSidebar: () =>
        set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

      // ── Clients ───────────────────────────────────────────────────────────
      addClient: (client) => {
        const companyName = client.companyName || client.name || 'Untitled Company';
        const newClient: Client = {
          ...client,
          id: `client-${nanoid(8)}`,
          companyName,
          name: companyName,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ clients: [...s.clients, newClient] }));
        get().triggerAutomations('client-added', newClient);
        return newClient;
      },

      updateClient: (id, updates) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...updates,
                  name: updates.name || updates.companyName || c.name || c.companyName,
                  companyName: updates.companyName || updates.name || c.companyName || c.name || '',
                  updatedAt: now(),
                }
              : c
          ),
        })),

      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      // ── Leads ─────────────────────────────────────────────────────────────
      addLead: (lead) => {
        const stage = lead.stage || lead.status || 'new';
        const newLead: Lead = {
          ...lead,
          id: `lead-${nanoid(8)}`,
          stage,
          status: stage,
          activities: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ leads: [...s.leads, newLead] }));
        get().triggerAutomations('lead-created', newLead);
        get().addNotification({
          type: 'new-lead',
          title: 'New Lead Added',
          message: `${newLead.name} from ${newLead.company} has been added.`,
          isRead: false,
          link: '/crm',
        });
        return newLead;
      },

      updateLead: (id, updates) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id
              ? {
                  ...l,
                  ...updates,
                  stage: updates.stage || updates.status || l.stage,
                  status: updates.status || updates.stage || l.status,
                  updatedAt: now(),
                }
              : l
          ),
        })),

      deleteLead: (id) =>
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),

      addLeadActivity: (leadId, activity) => {
        const newActivity: LeadActivity = {
          ...activity,
          id: `la-${nanoid(8)}`,
          createdAt: now(),
        };
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === leadId
              ? { ...l, activities: [...l.activities, newActivity], updatedAt: now() }
              : l
          ),
        }));
      },

      // ── Projects ──────────────────────────────────────────────────────────
      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: `proj-${nanoid(8)}`,
          completedDate: project.completedDate || null,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ projects: [...s.projects, newProject] }));
        return newProject;
      },

      updateProject: (id, updates) => {
        const prevProject = get().projects.find((p) => p.id === id);
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now() } : p
          ),
        }));
        if (updates.status === 'completed' && prevProject?.status !== 'completed') {
          const updatedProject = get().projects.find((p) => p.id === id);
          get().triggerAutomations('project-completed', updatedProject);
          get().addNotification({
            type: 'project-update',
            title: 'Project Completed',
            message: `${prevProject?.name} has been marked as completed.`,
            isRead: false,
            link: '/projects',
          });
        }
      },

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      // ── Tasks ─────────────────────────────────────────────────────────────
      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: `task-${nanoid(8)}`,
          startDate: task.startDate || null,
          dueDate: task.dueDate || null,
          completedAt: task.completedAt || null,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ tasks: [...s.tasks, newTask] }));
        get().triggerAutomations('task-created', newTask);
        return newTask;
      },

      updateTask: (id, updates) => {
        const prevTask = get().tasks.find((t) => t.id === id);
        const isDone = updates.status === 'done';
        const prevDone = prevTask?.status === 'done';
        const completedAt =
          isDone && !prevDone
            ? now()
            : updates.completedAt !== undefined
            ? updates.completedAt
            : prevTask?.completedAt ?? null;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, completedAt, updatedAt: now() } : t
          ),
        }));
        if (isDone && !prevDone) {
          get().triggerAutomations('task-completed', { ...prevTask, ...updates, completedAt });
          get().addNotification({
            type: 'completed-task',
            title: 'Task Completed',
            message: `Task "${prevTask?.title}" has been marked as done.`,
            isRead: false,
            link: '/tasks',
          });
        }
      },

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // ── Invoices ──────────────────────────────────────────────────────────
      addInvoice: (invoice) => {
        const total = calcInvoiceTotal(invoice).total;
        const invoiceNumber = invoice.invoiceNumber || invoice.number || `INV-${nanoid(6)}`;
        const newInvoice: Invoice = {
          ...invoice,
          id: `inv-${nanoid(8)}`,
          invoiceNumber,
          number: invoiceNumber,
          total,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ invoices: [...s.invoices, newInvoice] }));
        return newInvoice;
      },

      updateInvoice: (id, updates) => {
        const prevInvoice = get().invoices.find((i) => i.id === id);
        const total = updates.items ? calcInvoiceTotal(updates.items, updates.discount ?? prevInvoice?.discount ?? 0).total : prevInvoice?.total;
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === id
              ? {
                  ...i,
                  ...updates,
                  number: updates.number || updates.invoiceNumber || i.number || i.invoiceNumber,
                  invoiceNumber: (updates.invoiceNumber || updates.number || i.invoiceNumber || i.number || '') as string,
                  total: total ?? i.total,
                  updatedAt: now(),
                }
              : i
          ),
        }));
        if (updates.status === 'paid' && prevInvoice?.status !== 'paid') {
          get().triggerAutomations('invoice-paid', prevInvoice);
        }
        if (updates.status === 'overdue' && prevInvoice?.status !== 'overdue') {
          get().triggerAutomations('invoice-overdue', prevInvoice);
        }
      },

      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),

      // ── Payments ──────────────────────────────────────────────────────────
      addPayment: (payment) => {
        const ref = payment.reference || payment.referenceNumber || `TXN-${nanoid(6)}`;
        const date = payment.date || payment.transactionDate || now().split('T')[0];
        const newPayment: Payment = {
          ...payment,
          id: `pay-${nanoid(8)}`,
          reference: ref,
          referenceNumber: ref,
          date,
          transactionDate: date,
          createdAt: now(),
        };
        set((s) => ({ payments: [...s.payments, newPayment] }));
        get().addNotification({
          type: 'payment',
          title: 'Payment Recorded',
          message: `Payment of ₹${Number(newPayment.amount).toLocaleString('en-IN')} recorded.`,
          isRead: false,
          link: '/payments',
        });
        return newPayment;
      },

      updatePayment: (id, updates) =>
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...updates,
                  reference: updates.reference || updates.referenceNumber || p.reference || p.referenceNumber,
                  referenceNumber: (updates.referenceNumber || updates.reference || p.referenceNumber || p.reference || '') as string,
                  date: updates.date || updates.transactionDate || p.date || p.transactionDate,
                  transactionDate: (updates.transactionDate || updates.date || p.transactionDate || p.date || '') as string,
                }
              : p
          ),
        })),

      deletePayment: (id) =>
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

      // ── Team ──────────────────────────────────────────────────────────────
      addTeamMember: (member) => {
        const newMember: TeamMember = {
          ...member,
          id: `tm-${nanoid(8)}`,
          joinedAt: now(),
          projectIds: member.projectIds || [],
          taskIds: member.taskIds || [],
        };
        set((s) => {
          const updatedTeam = [...s.team, newMember];
          return { team: updatedTeam, teamMembers: updatedTeam };
        });
        return newMember;
      },

      updateTeamMember: (id, updates) =>
        set((s) => {
          const updatedTeam = s.team.map((m) => (m.id === id ? { ...m, ...updates } : m));
          return { team: updatedTeam, teamMembers: updatedTeam };
        }),

      deleteTeamMember: (id) =>
        set((s) => {
          const updatedTeam = s.team.filter((m) => m.id !== id);
          return { team: updatedTeam, teamMembers: updatedTeam };
        }),

      // ── Automations ───────────────────────────────────────────────────────
      addAutomation: (automation) => {
        const newAutomation: Automation = {
          ...automation,
          id: `auto-${nanoid(8)}`,
          executions: [],
          history: [],
          executionCount: 0,
          lastRunStatus: 'never',
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ automations: [...s.automations, newAutomation] }));
        return newAutomation;
      },

      updateAutomation: (id, updates) =>
        set((s) => ({
          automations: s.automations.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: now() } : a
          ),
        })),

      deleteAutomation: (id) =>
        set((s) => ({ automations: s.automations.filter((a) => a.id !== id) })),

      executeAutomation: (id) => {
        const auto = get().automations.find((a) => a.id === id);
        if (!auto) return;
        const execution: AutomationExecution = {
          id: `ae-${nanoid(8)}`,
          triggeredAt: now(),
          status: 'success',
          details: `Manual execution of "${auto.name}"`,
        };
        set((s) => ({
          automations: s.automations.map((a) =>
            a.id === id
              ? {
                  ...a,
                  executions: [...a.executions, execution],
                  history: [...(a.history || []), execution],
                  executionCount: (a.executionCount || 0) + 1,
                  lastRunStatus: 'success',
                  updatedAt: now(),
                }
              : a
          ),
        }));
        get().addNotification({
          type: 'automation',
          title: 'Automation Executed',
          message: `"${auto.name}" ran successfully.`,
          isRead: false,
          link: '/automations',
        });
      },

      // Internal trigger helper
      triggerAutomations: (trigger: string, data: unknown) => {
        const automations = get().automations.filter(
          (a) => a.isActive && a.trigger === trigger
        );
        automations.forEach((auto) => {
          const execution: AutomationExecution = {
            id: `ae-${nanoid(8)}`,
            triggeredAt: now(),
            status: 'success',
            details: `Triggered automatically by ${trigger}`,
          };
          set((s) => ({
            automations: s.automations.map((a) =>
              a.id === auto.id
                ? {
                    ...a,
                    executions: [...a.executions, execution],
                    history: [...(a.history || []), execution],
                    executionCount: (a.executionCount || 0) + 1,
                    lastRunStatus: 'success',
                  }
                : a
            ),
          }));
        });
      },

      // ── Documents ─────────────────────────────────────────────────────────
      addDocument: (doc) => {
        const newDoc: Document = {
          ...doc,
          id: `doc-${nanoid(8)}`,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ documents: [...s.documents, newDoc] }));
        return newDoc;
      },

      deleteDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      // ── Notifications ─────────────────────────────────────────────────────
      addNotification: (notif) => {
        const newNotif: Notification = {
          ...notif,
          id: `notif-${nanoid(8)}`,
          createdAt: now(),
        };
        set((s) => ({
          notifications: [newNotif, ...s.notifications].slice(0, 50),
        }));
      },

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // ── Data Management ───────────────────────────────────────────────────
      exportData: () => {
        const state = get();
        const exportObj = {
          version: '1.0',
          exportedAt: now(),
          settings: state.settings,
          clients: state.clients,
          leads: state.leads,
          projects: state.projects,
          tasks: state.tasks,
          invoices: state.invoices,
          payments: state.payments,
          team: state.team,
          automations: state.automations,
          documents: state.documents,
          notifications: state.notifications,
        };
        return JSON.stringify(exportObj, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (!data.version || !data.clients || !data.invoices) return false;
          set({
            settings: data.settings ?? defaultSettings,
            clients: data.clients ?? [],
            leads: data.leads ?? [],
            projects: data.projects ?? [],
            tasks: data.tasks ?? [],
            invoices: data.invoices ?? [],
            payments: data.payments ?? [],
            team: data.team ?? [],
            teamMembers: data.team ?? [],
            automations: data.automations ?? [],
            documents: data.documents ?? [],
            notifications: data.notifications ?? [],
          });
          return true;
        } catch {
          return false;
        }
      },

      resetData: () => set(getInitialState()),
    }),
    {
      name: 'nexaos_data',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({
        settings: state.settings,
        clients: state.clients,
        leads: state.leads,
        projects: state.projects,
        tasks: state.tasks,
        invoices: state.invoices,
        payments: state.payments,
        team: state.team,
        teamMembers: state.team,
        automations: state.automations,
        documents: state.documents,
        notifications: state.notifications,
        activities: state.activities,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// ── Computed Selectors ─────────────────────────────────────────────────────────

export function useInvoiceTotal(invoice: Parameters<typeof calcInvoiceTotal>[0]) {
  return calcInvoiceTotal(invoice);
}

export function useProjectProgress(projectId: ID) {
  const tasks = useStore((s) => s.tasks);
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  const done = projectTasks.filter((t) => t.status === 'done').length;
  return Math.round((done / projectTasks.length) * 100);
}

export function useCurrencySymbol() {
  const currency = useStore((s) => s.settings.currency);
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'د.إ',
  };
  return symbols[currency] ?? '₹';
}
