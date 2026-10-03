// ============================================================
// NexaOS – Constants & Configuration
// ============================================================

export const BRAND = {
  name: 'NexaOS',
  tagline: 'Your All-in-One Business Operating System',
  developer: 'Infinvo Tech',
  developerUrl: 'https://infinvo-tech.vercel.app/',
} as const;

export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED' },
} as const;

export const DATE_FORMATS = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
  { value: 'dd MMM yyyy', label: 'DD MMM YYYY' },
  { value: 'MMM dd, yyyy', label: 'MMM DD, YYYY' },
];

export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Marketing',
  'Real Estate',
  'Manufacturing',
  'Consulting',
  'Media & Entertainment',
  'Retail',
  'Logistics',
  'Legal',
  'Non-profit',
  'Other',
];

export const PROJECT_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
];

export const STORAGE_KEY = 'nexaos_data';
export const SETTINGS_KEY = 'nexaos_settings';
