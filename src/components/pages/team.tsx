'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { UserPlus, Edit2, Trash2, Mail, Phone, Briefcase, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar } from '@/components/ui/avatar';

const cn = (...c: (string | undefined | null | false)[]) => c.filter(Boolean).join(' ');

const teamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'manager', 'member']),
  department: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type TeamFormData = z.infer<typeof teamSchema>;

export function TeamPage() {
  const teamMembers = useStore((state) => state.team) ?? [];
  const projects = useStore((state) => state.projects) ?? [];
  const tasks = useStore((state) => state.tasks) ?? [];
  const addTeamMember = useStore((state) => state.addTeamMember);
  const updateTeamMember = useStore((state) => state.updateTeamMember);
  const deleteTeamMember = useStore((state) => state.deleteTeamMember);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      role: 'member',
      status: 'active',
    }
  });

  const openModal = (member?: any) => {
    if (member) {
      setEditingId(member.id);
      reset({
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department || '',
        phone: member.phone || '',
        status: member.status,
      });
    } else {
      setEditingId(null);
      reset({ role: 'member', status: 'active', name: '', email: '', department: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: TeamFormData) => {
    if (editingId) {
      updateTeamMember(editingId, data);
    } else {
      addTeamMember({
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department || 'Operations',
        phone: data.phone || '',
        avatar: data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        status: data.status,
        projectIds: [],
        taskIds: [],
      });
    }
    setIsModalOpen(false);
  };

  const roleColors = {
    owner: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    member: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your organization members and roles.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-5 sm:p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Members</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{teamMembers.length}</p>
        </div>
        <div className="card p-5 sm:p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Members</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {teamMembers.filter((m: any) => m.status === 'active').length}
          </p>
        </div>
        <div className="card p-5 sm:p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Owners / Admins</p>
          <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
            {teamMembers.filter((m: any) => ['owner', 'admin'].includes(m.role)).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member: any) => {
          const projectCount = member.projectIds?.length || projects.filter((p: any) => p.teamMembers?.includes(member.id)).length;
          const taskCount = member.taskIds?.length || tasks.filter((t: any) => t.assigneeId === member.id).length;

          return (
            <div key={member.id} className="card p-6 flex flex-col relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(member)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteTeamMember(member.id)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <Avatar name={member.name} avatar={member.avatar} size="lg" className="w-12 h-12 text-base font-bold" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                  <span className={cn('text-xs px-2 py-1 rounded-full font-medium', roleColors[member.role as keyof typeof roleColors])}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.department && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{member.department}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-auto">
                <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{projectCount}</p>
                    <p className="text-xs">Projects</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{taskCount}</p>
                    <p className="text-xs">Tasks</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => updateTeamMember(member.id, { status: member.status === 'active' ? 'inactive' : 'active' })}
                  className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none', 
                    member.status === 'active' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  )}
                >
                  <span className={cn('inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    member.status === 'active' ? 'translate-x-5' : 'translate-x-1'
                  )} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              {editingId ? 'Edit Team Member' : 'Add Team Member'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input {...register('name')} className="input" placeholder="John Doe" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" className="input" placeholder="john@example.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role</label>
                  <select {...register('role')} className="input">
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select {...register('status')} className="input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Department (Optional)</label>
                <input {...register('department')} className="input" placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="label">Phone (Optional)</label>
                <input {...register('phone')} className="input" placeholder="+1 234 567 890" />
              </div>
              
              {!editingId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  <p>In a live system, an invitation email would be sent. This is a demo - no emails are sent.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
