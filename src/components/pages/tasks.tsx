'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Task, TaskStatus, Priority, ID } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Search, Plus, List as ListIcon, LayoutGrid, Calendar as CalendarIcon,
  CheckCircle2, Circle, Clock, MoreVertical, Edit2, Trash2, Filter, AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';

const cn = (...c: (string | undefined | null | false)[]) => c.filter(Boolean).join(' ');

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  status: z.enum(['todo', 'in-progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  tags: z.string()
});

type TaskFormValues = z.infer<typeof taskSchema>;

const PRIORITY_COLORS: Record<Priority, string> = {
  'low': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'urgent': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }
];

export function TasksPage() {
  const { tasks, projects, team, addTask, updateTask, deleteTask } = useStore();
  
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'todo',
      priority: 'medium',
      tags: ''
    }
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchesProject = projectFilter === 'all' || t.projectId === projectFilter;
      const matchesAssignee = assigneeFilter === 'all' || t.assigneeId === assigneeFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchesSearch && matchesProject && matchesAssignee && matchesStatus && matchesPriority;
    });
  }, [tasks, search, projectFilter, assigneeFilter, statusFilter, priorityFilter]);

  const onSubmit = (data: TaskFormValues) => {
    const taskData = {
      ...data,
      projectId: data.projectId || null,
      assigneeId: data.assigneeId || null,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    if (editingTask) {
      updateTask(editingTask.id, {
        ...taskData,
        completedAt: taskData.status === 'done' && editingTask.status !== 'done' ? new Date().toISOString() : editingTask.completedAt
      });
    } else {
      addTask({
        ...taskData,
        completedAt: taskData.status === 'done' ? new Date().toISOString() : null
      });
    }
    
    setIsModalOpen(false);
    setEditingTask(null);
    reset();
  };

  const openAddModal = () => {
    setEditingTask(null);
    reset({
      status: 'todo',
      priority: 'medium',
      tags: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projectId: '',
      assigneeId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setValue('title', task.title);
    setValue('description', task.description);
    setValue('projectId', task.projectId || '');
    setValue('assigneeId', task.assigneeId || '');
    setValue('status', task.status);
    setValue('priority', task.priority);
    setValue('startDate', task.startDate || '');
    setValue('dueDate', task.dueDate || '');
    setValue('tags', task.tags.join(', '));
    setIsModalOpen(true);
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask(task.id, { 
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : null
    });
  };

  // ── Kanban Drag & Drop ──────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const [activeId, setActiveId] = useState<ID | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    // We only handle drag end for moving between columns in this simple implementation
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Is it dropped on a column?
    if (KANBAN_COLUMNS.some(col => col.id === overId)) {
      if (task.status !== overId) {
        updateTask(taskId, { status: overId as TaskStatus });
      }
      return;
    }

    // Dropped on another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && task.status !== overTask.status) {
      updateTask(taskId, { status: overTask.status });
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500">Manage your daily tasks ({filteredTasks.length})</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="input pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-full md:w-36" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input w-full md:w-36" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value="all">All Assignees</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select className="input w-full md:w-32" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="input w-full md:w-32" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}>
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded p-1 shrink-0">
          <button className={cn("p-1.5 rounded flex items-center gap-2", view === 'list' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500")} onClick={() => setView('list')}>
            <ListIcon className="w-4 h-4" />
          </button>
          <button className={cn("p-1.5 rounded flex items-center gap-2", view === 'kanban' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500")} onClick={() => setView('kanban')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button className={cn("p-1.5 rounded flex items-center gap-2", view === 'calendar' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500")} onClick={() => setView('calendar')}>
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-[400px]">
        
        {view === 'list' && (
          <div className="h-full overflow-auto card">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-medium w-10"></th>
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Project</th>
                  <th className="p-4 font-medium">Assignee</th>
                  <th className="p-4 font-medium">Status & Priority</th>
                  <th className="p-4 font-medium">Due Date</th>
                  <th className="p-4 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const assignee = team.find(m => m.id === task.assigneeId);
                  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'done';

                  return (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="p-4">
                        <button onClick={() => toggleTaskStatus(task)} className="text-gray-400 hover:text-green-500">
                          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => openEditModal(task)}>
                          <span className={cn(task.status === 'done' && "line-through text-gray-500")}>{task.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {project ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                            {project.name}
                          </span>
                        ) : <span className="text-gray-400 text-xs">None</span>}
                      </td>
                      <td className="p-4">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={assignee.name} avatar={assignee.avatar} size="xs" />
                            <span className="text-xs">{assignee.name}</span>
                          </div>
                        ) : <span className="text-gray-400 text-xs">Unassigned</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize whitespace-nowrap", STATUS_COLORS[task.status])}>
                            {task.status.replace('-', ' ')}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize whitespace-nowrap", PRIORITY_COLORS[task.priority])}>
                            {task.priority}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {task.dueDate ? (
                          <span className={cn("text-xs flex items-center gap-1", isOverdue && "text-red-600 dark:text-red-400 font-semibold")}>
                            {isOverdue && <AlertCircle className="w-3 h-3" />}
                            {formatDate(task.dueDate)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(task)} className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
              <div className="p-12 text-center text-gray-500">No tasks found matching your filters.</div>
            )}
          </div>
        )}

        {view === 'kanban' && (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="h-full overflow-x-auto flex gap-6 pb-4">
              {KANBAN_COLUMNS.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.id);
                return (
                  <KanbanColumn key={col.id} id={col.id} title={col.title} tasks={colTasks} projects={projects} team={team} onEdit={openEditModal} toggleStatus={toggleTaskStatus} />
                );
              })}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="transform scale-105 rotate-2 shadow-2xl">
                  <KanbanCard task={activeTask} projects={projects} team={team} onEdit={() => {}} toggleStatus={() => {}} isOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {view === 'calendar' && (
          <div className="h-full card p-6 bg-white dark:bg-gray-800 flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-lg font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">Prev</button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">Today</button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">Next</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-50 dark:bg-gray-900/50 p-2 text-center text-xs font-semibold text-gray-500">
                  {day}
                </div>
              ))}
              
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(currentMonth)),
                end: endOfWeek(endOfMonth(currentMonth))
              }).map((date, i) => {
                const dayTasks = filteredTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isToday = isSameDay(date, new Date());
                
                return (
                  <div key={i} className={cn("min-h-[100px] bg-white dark:bg-gray-800 p-2", !isCurrentMonth && "bg-gray-50 dark:bg-gray-900/30 text-gray-400")}>
                    <div className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday && "bg-blue-600 text-white")}>
                      {format(date, 'd')}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                      {dayTasks.map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => openEditModal(task)}
                          className={cn("text-[10px] px-1.5 py-1 rounded cursor-pointer truncate", PRIORITY_COLORS[task.priority])}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingTask ? 'Edit Task' : 'Add Task'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Task Title <span className="text-red-500">*</span></label>
                  <input type="text" className="input" {...register('title')} />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input min-h-[80px]" {...register('description')} />
                </div>
                <div>
                  <label className="label">Project</label>
                  <select className="input" {...register('projectId')}>
                    <option value="">No Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assignee</label>
                  <select className="input" {...register('assigneeId')}>
                    <option value="">Unassigned</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" {...register('status')}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
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
                  <label className="label">Tags (comma separated)</label>
                  <input type="text" className="input" {...register('tags')} placeholder="design, frontend, bug" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Kanban Subcomponents ──────────────────────────────────────────────

import { useDroppable } from '@dnd-kit/core';

function KanbanColumn({ id, title, tasks, projects, team, onEdit, toggleStatus }: any) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col bg-gray-50 dark:bg-gray-900/30 rounded-xl max-h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-gray-700 dark:text-gray-200">{title}</h3>
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium">
          {tasks.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]">
        <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
            <SortableKanbanCard key={task.id} task={task} projects={projects} team={team} onEdit={onEdit} toggleStatus={toggleStatus} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableKanbanCard(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard {...props} />
    </div>
  );
}

function KanbanCard({ task, projects, team, onEdit, toggleStatus, isOverlay = false }: any) {
  const project = projects.find((p: any) => p.id === task.projectId);
  const assignee = team.find((m: any) => m.id === task.assigneeId);
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'done';

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm cursor-grab active:cursor-grabbing group",
        isOverlay && "shadow-xl border-blue-500"
      )}
      onClick={() => !isOverlay && onEdit(task)}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {project && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {project.name}
            </span>
          )}
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium capitalize", PRIORITY_COLORS[task.priority as Priority])}>
            {task.priority}
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleStatus(task); }} 
          className="text-gray-400 hover:text-green-500 shrink-0"
        >
          {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
        </button>
      </div>
      
      <h4 className={cn("font-medium text-sm text-gray-900 dark:text-white mb-3", task.status === 'done' && "line-through text-gray-500")}>
        {task.title}
      </h4>
      
      <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {task.dueDate ? (
            <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 dark:text-red-400 font-semibold")}>
              <CalendarIcon className="w-3 h-3" />
              {formatDate(task.dueDate)}
            </span>
          ) : <span>No date</span>}
        </div>
        
        {assignee ? (
          <Avatar name={assignee.name} avatar={assignee.avatar} size="xs" />
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center" title="Unassigned">
            <span className="text-gray-400 text-[10px]">?</span>
          </div>
        )}
      </div>
    </div>
  );
}
