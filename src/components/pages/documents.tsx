'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { FileText, File, FileImage, FileSpreadsheet, Upload, Download, Trash2, Eye, X, Search, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';

const categories = ['All', 'Contracts', 'Proposals', 'Reports', 'Invoices', 'General', 'Other'];

export function DocumentsPage() {
  // Mock store values if they don't exist yet, but use actual structure
  const documents = useStore((state) => state.documents) ?? [];
  const addDocument = useStore((state) => state.addDocument);
  const deleteDocument = useStore((state) => state.deleteDocument);
  const clients = useStore((state) => state.clients) ?? [];
  const projects = useStore((state) => state.projects) ?? [];

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const filteredDocs = documents.filter((doc: any) => {
    const matchesCategory = activeTab === 'All' || doc.category === activeTab;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFileIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (t.includes('image')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (t.includes('spreadsheet') || t.includes('excel') || t.includes('csv')) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadSubmit = (data: any) => {
    if (!data.file || data.file.length === 0) return;
    const file = data.file[0];
    
    addDocument({
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      category: data.category || 'general',
      clientId: data.clientId || null,
      projectId: data.projectId || null,
      content: 'Demo document content uploaded in session.',
    });
    
    setIsUploadModalOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and organize all your files centrally.</p>
        </div>
        <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === cat 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDocs.map((doc: any) => {
          const client = clients.find((c: any) => c.id === doc.clientId);
          const project = projects.find((p: any) => p.id === doc.projectId);
          
          return (
            <div key={doc.id} className="card p-5 group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {getFileIcon(doc.mimeType || doc.type || '')}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => setPreviewDoc(doc)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-900 rounded shadow-sm">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteDocument(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-900 rounded shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-slate-900 dark:text-white truncate mb-1" title={doc.name}>
                {doc.name}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-3 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">
                  {doc.category}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-500">
                  {formatFileSize(doc.size)}
                </span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
                {client && <p className="text-xs text-slate-500 truncate">Client: {client.name}</p>}
                {project && <p className="text-xs text-slate-500 truncate">Project: {project.name}</p>}
                <p className="text-xs text-slate-400">{formatDate(doc.createdAt)}</p>
              </div>
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full card p-12 flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No documents found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Upload your first document or change the filters.</p>
            <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary">Upload Document</button>
          </div>
        )}
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Upload Document</h2>
            <form onSubmit={handleSubmit(handleUploadSubmit)} className="space-y-4">
              <div>
                <label className="label">File</label>
                <input 
                  type="file" 
                  {...register('file', { required: true })} 
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-300"
                />
              </div>
              
              <div>
                <label className="label">Category</label>
                <select {...register('category')} className="input" defaultValue="General">
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Link to Client (Optional)</label>
                <select {...register('clientId')} className="input">
                  <option value="">None</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Link to Project (Optional)</label>
                <select {...register('projectId')} className="input">
                  <option value="">None</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-400 mt-4">
                File contents are stored in session only. Only metadata persists in LocalStorage.
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col relative overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                {getFileIcon(previewDoc.type)}
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500">{formatFileSize(previewDoc.size)} • {formatDate(previewDoc.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-black p-8 flex items-center justify-center overflow-auto">
              <div className="bg-white dark:bg-slate-800 max-w-2xl w-full p-12 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <FileText className="w-24 h-24 text-slate-300 mx-auto mb-6" />
                <h4 className="text-xl font-medium text-slate-900 dark:text-white mb-2">Preview not available</h4>
                <p className="text-slate-500 dark:text-slate-400">
                  This is a demo preview. Actual file preview requires backend storage and conversion services.
                </p>
                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded text-left text-sm font-mono text-slate-600 dark:text-slate-400 break-all">
                  [File Binary Content Mockup]
                  <br />
                  Name: {previewDoc.name}
                  <br />
                  Type: {previewDoc.type}
                  <br />
                  Size: {previewDoc.size} bytes
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
