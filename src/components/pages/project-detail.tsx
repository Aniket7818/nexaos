'use client';

import React, { useState } from 'react';
import { useStore, useProjectProgress, useCurrencySymbol } from '@/store';
import { Project, ProjectStatus, Priority, Task, TaskStatus, Milestone } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Calendar, DollarSign, Clock, Users, CheckCircle2, Circle,
  Plus, MoreVertical, Edit2, Trash2, Tag, Activity
} from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';

const cn = (...c: (string | undefined | null | false)[]) => c.filter(Boolean).join(' ');

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

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { projects, clients, team, tasks, updateProject, addTask, updateTask, deleteTask } = useStore();
  const currencySymbol = useCurrencySymbol();
  
  const project = projects.find(p => p.id === projectId);
  const client = clients.find(c => c.id === project?.clientId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const progress = useProjectProgress(projectId);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'team' | 'activity'>('overview');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  if (!project) return <div className="p-8 text-center">Project not found</div>;

  const daysRemaining = Math.ceil((new Date(project.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const projectTeam = team.filter(m => project.teamMembers.includes(m.id));

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    addTask({
      title: newTaskTitle,
      description: '',
      projectId: project.id,
      assigneeId: null,
      status: 'todo',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: project.dueDate,
      tags: []
    });
    setNewTaskTitle('');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !newMilestoneDate) return;

    const newMilestone: Milestone = {
      id: `ms-${Math.random().toString(36).substr(2, 9)}`,
      title: newMilestoneTitle,
      dueDate: newMilestoneDate,
      completed: false,
      completedAt: null
    };

    updateProject(project.id, {
      milestones: [...(project.milestones || []), newMilestone]
    });
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  const toggleMilestone = (milestoneId: string) => {
    const updated = project.milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null };
      }
      return m;
    });
    updateProject(project.id, { milestones: updated });
  };

  const toggleTask = (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done';
    updateTask(taskId, { status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <Link href="/projects" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-12 rounded-full" style={{ backgroundColor: project.color || '#3b82f6' }} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <p className="text-sm text-gray-500">{client?.companyName || 'Internal Project'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium capitalize", STATUS_COLORS[project.status])}>
              {project.status.replace('-', ' ')}
            </span>
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium capitalize", PRIORITY_COLORS[project.priority])}>
              {project.priority} Priority
            </span>
            <button className="btn-primary">Edit Project</button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget / Spent</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {currencySymbol}{project.spent.toLocaleString()} / {currencySymbol}{project.budget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Task Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Timeline</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Team</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {project.teamMembers.length} Members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {['overview', 'tasks', 'milestones', 'team', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors",
                activeTab === tab
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="card p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4">Description</h3>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                  {project.description ? (
                    <p className="whitespace-pre-wrap">{project.description}</p>
                  ) : (
                    <p className="italic">No description provided.</p>
                  )}
                </div>
                
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-6 flex gap-2 flex-wrap">
                    {project.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Recent Tasks</h3>
                  <button onClick={() => setActiveTab('tasks')} className="text-sm text-blue-600 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {projectTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <button onClick={() => toggleTask(task.id, task.status)} className="text-gray-400 hover:text-green-500">
                        {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <span className={cn("flex-1 font-medium text-sm", task.status === 'done' && "line-through text-gray-400")}>
                        {task.title}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize", TASK_STATUS_COLORS[task.status])}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                  ))}
                  {projectTasks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No tasks added yet.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="card p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4">Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Date</p>
                    <p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> {formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Due Date</p>
                    <p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> {formatDate(project.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created At</p>
                    <p className="font-medium">{formatDate(project.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new task to this project..."
                  className="input flex-1"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </form>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {projectTasks.map(task => (
                <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <button onClick={() => toggleTask(task.id, task.status)} className="text-gray-400 hover:text-green-500 flex-shrink-0">
                    {task.status === 'done' ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-gray-900 dark:text-white truncate", task.status === 'done' && "line-through text-gray-500 dark:text-gray-400")}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(task.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.assigneeId && (
                      <Avatar
                        name={team.find(m => m.id === task.assigneeId)?.name}
                        avatar={team.find(m => m.id === task.assigneeId)?.avatar}
                        size="xs"
                      />
                    )}
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize", PRIORITY_COLORS[task.priority])}>
                      {task.priority}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize", TASK_STATUS_COLORS[task.status])}>
                      {task.status.replace('-', ' ')}
                    </span>
                    <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {projectTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No tasks found. Add one above.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="card p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-6">Project Milestones</h3>
            
            <form onSubmit={handleAddMilestone} className="flex gap-4 mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Milestone title..."
                className="input flex-1"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
              />
              <input
                type="date"
                className="input w-40"
                value={newMilestoneDate}
                onChange={(e) => setNewMilestoneDate(e.target.value)}
              />
              <button type="submit" className="btn-primary">Add</button>
            </form>

            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
              {(project.milestones || []).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(milestone => (
                <div key={milestone.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={cn("flex items-center justify-center w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2", milestone.completed ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600")} />
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-center gap-4">
                    <button onClick={() => toggleMilestone(milestone.id)} className={cn("shrink-0", milestone.completed ? "text-green-500" : "text-gray-400 hover:text-green-500")}>
                      {milestone.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("font-bold text-gray-900 dark:text-white truncate", milestone.completed && "line-through text-gray-500")}>
                        {milestone.title}
                      </h4>
                      <p className="text-sm text-gray-500">{formatDate(milestone.dueDate)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!project.milestones || project.milestones.length === 0) && (
                <p className="text-center text-gray-500 py-4">No milestones defined.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projectTeam.map(member => (
              <div key={member.id} className="card p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center flex flex-col items-center">
                <Avatar
                  name={member.name}
                  avatar={member.avatar}
                  size="xl"
                  className="w-20 h-20 text-2xl mb-4"
                />
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{member.name}</h4>
                <p className="text-sm text-gray-500 mb-4">{member.role}</p>
                <div className="w-full flex justify-center gap-2 mt-auto">
                  <a href={`mailto:${member.email}`} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Email</a>
                </div>
              </div>
            ))}
            {projectTeam.length === 0 && (
              <div className="col-span-full card p-8 text-center text-gray-500 border-dashed">
                No team members assigned to this project.
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-6">Activity History</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 h-8 w-8 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white"><span className="font-semibold">Project Created</span></p>
                  <p className="text-sm text-gray-500">{formatDate(project.createdAt)}</p>
                </div>
              </div>
              {/* Mock activities since we don't track full project activity history in type */}
              <div className="flex gap-4">
                <div className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-600 h-8 w-8 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white">Project status updated to <span className="font-semibold capitalize">{project.status}</span></p>
                  <p className="text-sm text-gray-500">{formatDate(project.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
