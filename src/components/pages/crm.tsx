'use client';

import React, { useState, useMemo } from 'react';
import { useStore, useCurrencySymbol } from '@/store';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building,
  Calendar,
  X,
  LayoutGrid,
  List as ListIcon,
  MessageSquare,
  DollarSign,
  Briefcase,
  User
} from 'lucide-react';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';

// -- Constants & Types --

const stages = [
  { id: 'new', name: 'New', color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'contacted', name: 'Contacted', color: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { id: 'qualified', name: 'Qualified', color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'proposal', name: 'Proposal Sent', color: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'won', name: 'Won', color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'lost', name: 'Lost', color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
] as const;

type StageId = typeof stages[number]['id'];

const sourceOptions = [
  'website', 'referral', 'linkedin', 'email', 'cold-call', 'event', 'ad', 'other'
];

// -- Form Schema --

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  source: z.string().min(1, 'Source is required'),
  value: z.coerce.number().min(0, 'Value must be positive'),
  probability: z.coerce.number().min(0).max(100),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

// -- Components --

// 1. Sortable Lead Card for Kanban
function SortableLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { type: 'Lead', lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const currencySymbol = useCurrencySymbol();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">{lead.name}</h4>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {currencySymbol}{lead.value.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-3">
        <Building className="w-3 h-3 mr-1" />
        <span className="truncate">{lead.company}</span>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex -space-x-2">
          {lead.assignedTo ? (
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border-2 border-white dark:border-slate-800 text-indigo-700 dark:text-indigo-300 font-medium text-[10px]">
              {lead.assignedTo.substring(0,2).toUpperCase()}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-800">
              <User className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>
        {lead.followUpDate && (
          <div className="flex items-center text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(lead.followUpDate), 'MMM d')}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Kanban Column
function KanbanColumn({
  stage,
  leads,
  onLeadClick,
}: {
  stage: typeof stages[number];
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}) {
  const { setNodeRef } = useSortable({
    id: stage.id,
    data: { type: 'Column', stage },
  });

  return (
    <div className="flex flex-col flex-shrink-0 w-72 h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className={cn("p-3 border-b border-slate-200 dark:border-slate-800", stage.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", stage.color)} />
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{stage.name}</h3>
          </div>
          <span className="text-xs font-medium bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            {leads.length}
          </span>
        </div>
      </div>
      
      <div className="p-2 flex-1 overflow-y-auto" ref={setNodeRef}>
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 min-h-[100px]">
            {leads.map(lead => (
              <SortableLeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// 3. Main CRM Page Component
export function CRMPage() {
  const { leads, team, addLead, updateLead, deleteLead } = useStore();
  const currencySymbol = useCurrencySymbol();
  
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // -- Computed Stats --
  const activeLeads = leads.filter(l => l.stage !== 'lost' && l.stage !== 'won');
  const pipelineValue = activeLeads.reduce((sum, l) => sum + l.value, 0);
  const wonLeads = leads.filter(l => l.stage === 'won');
  const lostLeads = leads.filter(l => l.stage === 'lost');
  const conversionRate = leads.length ? (wonLeads.length / leads.length) * 100 : 0;
  
  // -- Filtered Leads --
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                            l.company.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [leads, search, stageFilter]);
  
  // -- Dnd-kit logic --
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === 'Lead') {
      setActiveDragLead(active.data.current.lead);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const isActiveLead = active.data.current?.type === 'Lead';
    const isOverLead = over.data.current?.type === 'Lead';
    const isOverColumn = over.data.current?.type === 'Column';
    
    if (!isActiveLead) return;
    
    if (isOverLead || isOverColumn) {
      // Handled in DragEnd to persist state, but visually updated here if we used local state for optimistic updates
      // For simplicity and stability with zustand, we'll do the actual move in dragEnd.
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragLead(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;
    
    const isActiveLead = active.data.current?.type === 'Lead';
    if (!isActiveLead) return;

    const isOverLead = over.data.current?.type === 'Lead';
    const isOverColumn = over.data.current?.type === 'Column';
    
    const activeLead = leads.find(l => l.id === activeId);
    if (!activeLead) return;

    let newStage = activeLead.stage;
    
    if (isOverColumn) {
      newStage = over.data.current?.stage.id as StageId;
    } else if (isOverLead) {
      const overLead = leads.find(l => l.id === overId);
      if (overLead) {
        newStage = overLead.stage;
      }
    }
    
    if (activeLead.stage !== newStage) {
      updateLead(activeLead.id, { stage: newStage });
    }
  }
  
  // -- Forms --
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      stage: 'new',
      probability: 50,
      value: 0,
      source: 'website'
    }
  });

  const onSubmit = (data: LeadFormData) => {
    addLead(data as unknown as Parameters<typeof addLead>[0]);
    setIsAddModalOpen(false);
    form.reset();
  };
  
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLead(id);
      setSelectedLead(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Header & Stats */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">CRM Pipeline</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your leads and deals</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="card p-5 sm:p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Leads</div>
            <div className="text-2xl font-bold">{leads.length}</div>
          </div>
          <div className="card p-5 sm:p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pipeline Value</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {currencySymbol}{pipelineValue.toLocaleString()}
            </div>
          </div>
          <div className="card p-5 sm:p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Conversion Rate</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {conversionRate.toFixed(1)}%
            </div>
          </div>
          <div className="card p-5 sm:p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Won / Lost</div>
            <div className="text-2xl font-bold">
              <span className="text-green-600 dark:text-green-400">{wonLeads.length}</span>
              <span className="text-slate-300 dark:text-slate-600 mx-2">/</span>
              <span className="text-red-600 dark:text-red-400">{lostLeads.length}</span>
            </div>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select 
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Stages</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-md p-1">
            <button 
              onClick={() => setView('kanban')}
              className={cn("p-1.5 rounded text-sm flex items-center transition-colors", view === 'kanban' ? "bg-white dark:bg-slate-700 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              Board
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-1.5 rounded text-sm flex items-center transition-colors", view === 'list' ? "bg-white dark:bg-slate-700 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
            >
              <ListIcon className="w-4 h-4 mr-1.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden pb-6">
        {view === 'kanban' ? (
          <div className="h-full overflow-x-auto pb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 h-full min-w-max">
                {stages.map(stage => (
                  <KanbanColumn 
                    key={stage.id} 
                    stage={stage} 
                    leads={filteredLeads.filter(l => l.stage === stage.id)}
                    onLeadClick={setSelectedLead}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeDragLead ? (
                  <div className="opacity-90 scale-105 rotate-2 cursor-grabbing">
                    <SortableLeadCard lead={activeDragLead} onClick={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <div className="h-full overflow-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Name</th>
                  <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Company</th>
                  <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Stage</th>
                  <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Value</th>
                  <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Follow-up</th>
                  <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No leads found.</td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td className="px-4 py-3 font-medium">{lead.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{lead.company}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium text-white", stages.find(s => s.id === lead.stage)?.color)}>
                          {stages.find(s => s.id === lead.stage)?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">{currencySymbol}{lead.value.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500">{lead.followUpDate ? format(new Date(lead.followUpDate), 'MMM d, yyyy') : '-'}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Add New Lead</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <form id="add-lead-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Name *</label>
                    <input {...form.register('name')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent" placeholder="John Doe" />
                    {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Company *</label>
                    <input {...form.register('company')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent" placeholder="Acme Corp" />
                    {form.formState.errors.company && <p className="text-red-500 text-xs">{form.formState.errors.company.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email *</label>
                    <input {...form.register('email')} type="email" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent" placeholder="john@acme.com" />
                    {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Phone</label>
                    <input {...form.register('phone')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent" placeholder="+1 234 567 890" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Value ({currencySymbol})</label>
                    <input {...form.register('value')} type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Stage</label>
                    <select {...form.register('stage')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent">
                      {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Probability (%)</label>
                    <input {...form.register('probability')} type="number" min="0" max="100" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Source</label>
                    <select {...form.register('source')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent">
                      {sourceOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Follow-up Date</label>
                    <input {...form.register('followUpDate')} type="date" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Assigned To</label>
                    <select {...form.register('assignedTo')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent">
                      <option value="">Unassigned</option>
                      {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1">
                    <label className="text-sm font-medium">Notes</label>
                    <textarea {...form.register('notes')} rows={3} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent resize-none" placeholder="Initial notes..."></textarea>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-lead-form" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                Save Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold truncate pr-4">Lead Details</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDelete(selectedLead.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Info */}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedLead.name}</h1>
                <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                  <Building className="w-4 h-4 mr-2" />
                  {selectedLead.company}
                </div>
              </div>

              {/* Quick Actions & Status */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Current Stage</span>
                  <select 
                    value={selectedLead.stage} 
                    onChange={(e) => {
                      updateLead(selectedLead.id, { stage: e.target.value as StageId });
                      setSelectedLead({...selectedLead, stage: e.target.value as StageId});
                    }}
                    className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
                  <span className="text-sm font-medium text-slate-500">Value</span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {currencySymbol}{selectedLead.value.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
                  <span className="text-sm font-medium text-slate-500">Probability</span>
                  <span className="text-sm font-medium">{selectedLead.probability}%</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-slate-900 dark:text-white uppercase tracking-wider">Contact Info</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-3 text-slate-400" />
                    <a href={`mailto:${selectedLead.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{selectedLead.email}</a>
                  </div>
                  {selectedLead.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-3 text-slate-400" />
                      <a href={`tel:${selectedLead.phone}`} className="text-slate-700 dark:text-slate-300 hover:underline">{selectedLead.phone}</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-slate-900 dark:text-white uppercase tracking-wider">Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400 text-xs mb-1">Source</span>
                    <span className="capitalize">{selectedLead.source}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400 text-xs mb-1">Assigned To</span>
                    <span>{team.find(t => t.id === selectedLead.assignedTo)?.name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400 text-xs mb-1">Created At</span>
                    <span>{format(new Date(selectedLead.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400 text-xs mb-1">Follow-up</span>
                    <span>{selectedLead.followUpDate ? format(new Date(selectedLead.followUpDate), 'MMM d, yyyy') : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-slate-900 dark:text-white uppercase tracking-wider">Notes</h3>
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                    {selectedLead.notes}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <button 
                onClick={() => alert("Edit functionality can be implemented similarly to Add Lead")} 
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
