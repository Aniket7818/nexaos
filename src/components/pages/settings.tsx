'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Settings, Building, Bell, Database, Shield, Download, Upload, AlertTriangle, Moon, Sun, Laptop } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { BRAND } from '@/lib/constants';
import { openDesktopExperienceNotice } from '@/components/mobile/desktop-experience-notice';

const tabs = [
  { id: 'profile', label: 'Business Profile', icon: Building },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data Management', icon: Database },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);
  const resetData = useStore((state) => state.resetData);

  // For data management tab
  const getCounts = () => {
    const state = useStore.getState();
    return {
      clients: state.clients?.length || 0,
      projects: state.projects?.length || 0,
      tasks: state.tasks?.length || 0,
      invoices: state.invoices?.length || 0,
      leads: state.leads?.length || 0,
      documents: state.documents?.length || 0,
    };
  };

  const { register, handleSubmit } = useForm({
    defaultValues: {
      companyName: settings?.companyName || 'NexaOS Demo',
      companyEmail: settings?.companyEmail || 'contact@example.com',
      phone: settings?.phone || '',
      website: settings?.website || '',
      address: settings?.address || '',
    }
  });

  const onSubmitProfile = (data: any) => {
    updateSettings(data);
    alert('Business profile updated successfully!');
  };

  const handleExport = () => {
    const dataStr = exportData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `nexaos_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        importData(json);
        alert('Data imported successfully! The page will now reload.');
        window.location.reload();
      } catch (error) {
        alert('Invalid backup file. Please try again.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data to the demo defaults? This action cannot be undone.')) {
      resetData();
      alert('Data reset successfully! The page will now reload.');
      window.location.reload();
    }
  };

  const handleNotificationToggle = (key: string) => {
    const currentNotifs = settings?.notifications || {};
    updateSettings({
      notifications: {
        ...currentNotifs,
        [key]: !currentNotifs[key as keyof typeof currentNotifs]
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your workspace configuration and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <div className="card p-2 flex flex-col gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 card p-6 min-h-[500px]">
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Business Profile</h2>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Company Name</label>
                    <input {...register('companyName')} className="input" />
                  </div>
                  <div>
                    <label className="label">Company Email</label>
                    <input {...register('companyEmail')} type="email" className="input" />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input {...register('phone')} className="input" />
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input {...register('website')} className="input" placeholder="https://" />
                  </div>
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea {...register('address')} className="input min-h-[100px]" />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="btn-primary">Save Profile</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Regional Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Currency</label>
                    <select 
                      value={settings?.currency || 'INR'}
                      onChange={(e) => updateSettings({ currency: e.target.value as any })}
                      className="input"
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="AUD">Australian Dollar (A$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Date Format</label>
                    <select 
                      value={settings?.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                      className="input"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Appearance</h2>
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {settings?.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">Dark Mode</h3>
                      <p className="text-sm text-slate-500">Toggle dark appearance for the interface</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      settings?.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings?.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Display & Experience</h2>
                <p className="text-sm text-slate-500 mb-4">View device optimization guidelines and mobile desktop mode instructions.</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-lg shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">Desktop Experience Notice</h3>
                      <p className="text-sm text-slate-500">Reopen device notice & desktop mode instructions</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => openDesktopExperienceNotice()}
                    className="btn-secondary py-2 px-3 text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    View Notice
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Notification Preferences</h2>
              <p className="text-sm text-slate-500 mb-6">Choose what events you want to be notified about.</p>

              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and critical alerts via email.' },
                  { key: 'push', label: 'Push Notifications', desc: 'Browser notifications for real-time updates.' },
                  { key: 'deadlines', label: 'Deadline Reminders', desc: 'Alerts when project or task deadlines are approaching.' },
                  { key: 'invoices', label: 'Overdue Invoice Alerts', desc: 'Notifications when client invoices pass their due date.' },
                  { key: 'leads', label: 'New Lead Alerts', desc: 'Immediate notification when a new lead is captured.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{item.label}</h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleNotificationToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        settings?.notifications?.[item.key as keyof typeof settings.notifications] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings?.notifications?.[item.key as keyof typeof settings.notifications] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Data Management</h2>
                <p className="text-sm text-slate-500 mb-6">Export your data for backup or import a previous backup.</p>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex items-start gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-400">Local Storage Only</h4>
                    <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-1">
                      All data is currently stored locally in your browser. If you clear your browser data, you will lose everything. Export regularly to back up your data.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {Object.entries(getCounts()).map(([key, value]) => (
                    <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center border border-slate-100 dark:border-slate-800">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{key}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleExport} className="btn-primary flex items-center justify-center gap-2 flex-1">
                    <Download className="w-4 h-4" />
                    Export Backup (JSON)
                  </button>
                  <label className="btn-secondary flex items-center justify-center gap-2 flex-1 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Backup
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-8 border-t border-red-100 dark:border-red-900/30">
                <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-slate-500 mb-4">Resetting will delete all current data and restore the initial demo data.</p>
                <button onClick={handleReset} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg font-medium transition-colors text-sm">
                  Reset Demo Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center pt-8 text-sm text-slate-500">
        Designed & Developed by <a href={BRAND.developerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{BRAND.developer}</a>
      </div>
    </div>
  );
}
