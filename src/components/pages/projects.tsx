'use client';

import React, { useState } from 'react';
import { useStore, useProjectProgress, useCurrencySymbol } from '@/store';
import { Project, ProjectStatus, Priority, ID } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Search, Plus, LayoutGrid, List, MoreVertical,
  Filter, ArrowUpDown, Calendar, DollarSign, Clock, Users, Tag
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';

const cn = (...c: (string | undefined | null | false)[]) => c.filter(Boolean).join(' ');

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string(),
  clientId: z.string().optional().nullable(),
  status: z.enum(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  budget: z.number().min(0),
  startDate: z.string(),
  dueDate: z.string(),
  teamMembers: z.array(z.string()),
  color: z.string(),
  tags: z.string()
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const STATUS_COLORS: Record<ProjectStatus, string> = {
  'planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'in-progress': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  'on-hold': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

const PRIORITY_COLORS: Record<Priority, string> = {
  'low': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'urgent': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

export function ProjectsPage() {
  const { projects, clients, team, addProject, updateProject, deleteProject } = useStore();
  const currencySymbol = useCurrencySymbol();

  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'budget' | 'progress'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'planning',
      priority: 'medium',
      budget: 0,
      teamMembers: [],
      color: '#3b82f6',
      tags: ''
    }
  });

  const onSubmit = (data: ProjectFormValues) => {
    const projectData = {
      ...data,
      clientId: data.clientId || null,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      spent: editingProject ? editingProject.spent : 0,
      milestones: editingProject ? editingProject.milestones : [],
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData);
    }
    
    setIsModalOpen(false);
    setEditingProject(null);
    reset();
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setValue('name', project.name);
    setValue('description', project.description);
    setValue('clientId', project.clientId || '');
    setValue('status', project.status);
    setValue('priority', project.priority);
    setValue('budget', project.budget);
    setValue('startDate', project.startDate);
    setValue('dueDate', project.dueDate);
    setValue('teamMembers', project.teamMembers);
    setValue('color', project.color || '#3b82f6');
    setValue('tags', project.tags.join(', '));
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProject(null);
    reset({
      status: 'planning',
      priority: 'medium',
      budget: 0,
      teamMembers: [],
      color: '#3b82f6',
      tags: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  // Filtering and Sorting
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    if (sortBy === 'dueDate') cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (sortBy === 'budget') cmp = a.budget - b.budget;
    
    // progress sort is tricky as it's computed, we will handle that in a map if strictly needed,
    // but for now simple fallback to budget if progress sort is requested.
    
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500">Manage and track your projects ({filteredProjects.length})</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="input pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input md:max-w-[150px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="input md:max-w-[150px]" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}>
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center text-gray-500"
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="name">Sort by Name</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="budget">Sort by Budget</option>
          </select>
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded p-1">
            <button
              className={cn("p-1.5 rounded", view === 'cards' ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}
              onClick={() => setView('cards')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={cn("p-1.5 rounded", view === 'table' ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}
              onClick={() => setView('table')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              clients={clients}
              team={team}
              currencySymbol={currencySymbol} 
            />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto bg-white dark:bg-gray-800">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4 font-medium">Project Name</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Status & Priority</th>
                <th className="p-4 font-medium">Budget</th>
                <th className="p-4 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => {
                const client = clients.find(c => c.id === project.clientId);
                return (
                  <tr key={project.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4">
                      <Link href={`/projects/${project.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#ccc' }} />
                        {project.name}
                      </Link>
                    </td>
                    <td className="p-4">{client?.companyName || 'Internal'}</td>
                    <td className="p-4 flex gap-2 items-center">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLORS[project.status])}>
                        {project.status.replace('-', ' ')}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", PRIORITY_COLORS[project.priority])}>
                        {project.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      {currencySymbol}{project.budget.toLocaleString()}
                    </td>
                    <td className="p-4">{formatDate(project.dueDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingProject ? 'Edit Project' : 'Add Project'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Project Name</label>
                  <input type="text" className="input" {...register('name')} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input min-h-[80px]" {...register('description')} />
                </div>
                <div>
                  <label className="label">Client</label>
                  <select className="input" {...register('clientId')}>
                    <option value="">Internal Project (No Client)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Budget ({currencySymbol})</label>
                  <input type="number" className="input" {...register('budget', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" {...register('status')}>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" {...register('priority')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" {...register('startDate')} />
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input" {...register('dueDate')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Team Members</label>
                  <select multiple className="input h-24" {...register('teamMembers')}>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
                <div>
                  <label className="label">Project Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" className="h-10 w-10 cursor-pointer rounded bg-transparent border-0" {...register('color')} />
                    <input type="text" className="input flex-1" {...register('color')} />
                  </div>
                </div>
                <div>
                  <label className="label">Tags (comma separated)</label>
                  <input type="text" className="input" {...register('tags')} placeholder="web, design, marketing" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, clients, team, currencySymbol }: { project: Project, clients: any[], team: any[], currencySymbol: string }) {
  const client = clients.find(c => c.id === project.clientId);
  const projectTeam = team.filter(m => project.teamMembers.includes(m.id)).slice(0, 3);
  const progress = useProjectProgress(project.id);
  const budgetPercent = project.budget > 0 ? Math.min(100, (project.spent / project.budget) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="card overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow relative">
        {/* Top color bar */}
        <div className="h-2 w-full absolute top-0 left-0" style={{ backgroundColor: project.color || '#3b82f6' }} />
        
        <div className="p-6 pt-7 space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">{project.name}</h3>
              <p className="text-sm text-gray-500">{client?.companyName || 'Internal Project'}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[40px]">
            {project.description || 'No description provided.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLORS[project.status])}>
              {project.status.replace('-', ' ')}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", PRIORITY_COLORS[project.priority])}>
              {project.priority}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Task Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
            <div>
              <div className="text-xs text-gray-500">Budget Spent</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {currencySymbol}{project.spent.toLocaleString()} / {project.budget.toLocaleString()}
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mt-1">
                <div 
                  className={cn("h-1 rounded-full", budgetPercent > 90 ? "bg-red-500" : "bg-green-500")} 
                  style={{ width: `${budgetPercent}%` }} 
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Due Date</div>
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {formatDate(project.dueDate)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex -space-x-2 overflow-hidden items-center py-1">
              {projectTeam.map((member) => (
                <Avatar
                  key={member.id}
                  name={member.name}
                  avatar={member.avatar}
                  size="sm"
                  className="ring-2 ring-white dark:ring-gray-800"
                />
              ))}
              {project.teamMembers.length > 3 && (
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300">
                  +{project.teamMembers.length - 3}
                </div>
              )}
              {project.teamMembers.length === 0 && (
                <span className="text-xs text-gray-500">Unassigned</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
