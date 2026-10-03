'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Zap, Play, Edit2, Trash2, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';

const cn = (...c: (string | undefined | null | false)[]) => c.filter(Boolean).join(' ');

const triggerLabels: Record<string, string> = {
  'lead-created': 'New Lead Created',
  'invoice-overdue': 'Invoice Becomes Overdue',
  'task-completed': 'Task Completed',
  'project-completed': 'Project Completed',
  'client-added': 'New Client Added',
  'invoice-paid': 'Invoice Paid',
  'lead-won': 'Lead Won',
};

const actionLabels: Record<string, string> = {
  'create-task': 'Create a Follow-up Task',
  'add-to-overdue': 'Flag as Overdue',
  'update-project-progress': 'Update Project Progress',
  'send-notification': 'Send Notification',
  'create-activity': 'Log Activity Entry',
};

const automationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trigger: z.string().min(1, 'Trigger is required'),
  action: z.string().min(1, 'Action is required'),
  isActive: z.boolean(),
});

type AutomationFormData = z.infer<typeof automationSchema>;

export function AutomationsPage() {
  const automations = useStore((state) => state.automations) ?? [];
  const addAutomation = useStore((state) => state.addAutomation);
  const updateAutomation = useStore((state) => state.updateAutomation);
  const deleteAutomation = useStore((state) => state.deleteAutomation);
  const executeAutomation = useStore((state) => state.executeAutomation);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: { isActive: true }
  });

  const openModal = (automation?: any) => {
    if (automation) {
      setEditingId(automation.id);
      reset({
        name: automation.name,
        description: automation.description || '',
        trigger: automation.trigger,
        action: automation.action,
        isActive: automation.isActive,
      });
    } else {
      setEditingId(null);
      reset({ name: '', description: '', trigger: 'lead-created', action: 'create-task', isActive: true });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: AutomationFormData) => {
    if (editingId) {
      updateAutomation(editingId, data as any);
    } else {
      addAutomation({
        name: data.name,
        description: data.description || '',
        trigger: data.trigger as any,
        action: data.action as any,
        actionConfig: {},
        isActive: data.isActive,
      });
    }
    setIsModalOpen(false);
  };

  const handleRun = (id: string) => {
    if (executeAutomation) {
      executeAutomation(id);
    }
  };

  const executionsToday = automations.reduce((acc: number, aut: any) => {
    const todayRuns = aut.history?.filter((h: any) => new Date(h.timestamp).toDateString() === new Date().toDateString()).length || 0;
    return acc + todayRuns;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Automations</h1>
          <p className="text-slate-500 dark:text-slate-400">Streamline your workflow with automated rules.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Create Automation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Automations</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{automations.length}</p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Rules</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {automations.filter((a: any) => a.isActive).length}
          </p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Executions Today</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{executionsToday}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {automations.map((automation: any) => (
          <div key={automation.id} className="card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{automation.name}</h3>
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', 
                  automation.lastRunStatus === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  automation.lastRunStatus === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                )}>
                  {automation.lastRunStatus === 'never' ? 'Never run' : `Last run: ${automation.lastRunStatus}`}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{automation.description}</p>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {triggerLabels[automation.trigger] || automation.trigger}
                </div>
                <Zap className="w-4 h-4 text-slate-400" />
                <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Play className="w-3 h-3" />
                  {actionLabels[automation.action] || automation.action}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto md:border-l md:border-slate-100 md:dark:border-slate-800 md:pl-6">
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-slate-500">Executions</span>
                <span className="font-semibold">{automation.executionCount || 0}</span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button 
                  onClick={() => updateAutomation(automation.id, { isActive: !automation.isActive })}
                  className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', 
                    automation.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  )}
                >
                  <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    automation.isActive ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
                
                <button 
                  onClick={() => handleRun(automation.id)}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  title="Run Now"
                >
                  <Play className="w-4 h-4" />
                </button>
                
                <button onClick={() => openModal(automation)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button onClick={() => deleteAutomation(automation.id)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {automations.length === 0 && (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Automations Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
              Create rules to automate repetitive tasks and keep your business running smoothly without manual intervention.
            </p>
            <button onClick={() => openModal()} className="btn-primary">Create Your First Automation</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              {editingId ? 'Edit Automation' : 'Create Automation'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Automation Name</label>
                <input {...register('name')} className="input" placeholder="e.g. Follow up on won leads" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              
              <div>
                <label className="label">Description</label>
                <input {...register('description')} className="input" placeholder="What does this do?" />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4 border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="label flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">1</span>
                    When this happens (Trigger)
                  </label>
                  <select {...register('trigger')} className="input">
                    {Object.entries(triggerLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">2</span>
                    Then do this (Action)
                  </label>
                  <select {...register('action')} className="input">
                    {Object.entries(actionLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input type="checkbox" id="isActive" {...register('isActive')} className="rounded text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable this automation immediately</label>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                <p>Automations run locally within the app. No external services or API calls are made in this demo.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Create Automation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
