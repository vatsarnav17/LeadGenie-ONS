
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  NOT_RESPONDED = 'NOT_RESPONDED',
  RESPONDED = 'RESPONDED',
  QUALIFIED = 'QUALIFIED',
  LOST = 'LOST',
  WON = 'WON'
}

export enum LeadSubCategory {
  NONE = 'NONE',
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  BAD = 'BAD',
  INTERESTED = 'INTERESTED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  FOLLOW_UP = 'FOLLOW_UP'
}

export interface Lead {
  id: string;
  [key: string]: string | number | string[];
  // Metadata fields that we append to the raw sheet data
  _status: LeadStatus;
  _subCategory: LeadSubCategory;
  _notes: string[];
  _lastUpdated: number;
}

export interface SheetStats {
  total: number;
  contacted: number;
  notResponded: number;
  responded: number;
  won: number;
  lost: number;
  contactRate: number;
  responseRate: number;
  conversionRate: number;
}

export type ImportSource = 'URL' | 'CSV' | 'FILE';

export interface LibraryItem {
  id: string;
  name: string;
  url?: string;
  syncUrl?: string; // Google Apps Script URL for writing back
  importSource: ImportSource;
  createdAt: string;
}

export interface SheetData {
  id: string; 
  name: string;
  columns: string[];
  leads: Lead[];
  importSource: ImportSource;
  url?: string;
  syncUrl?: string; // Optional write-back endpoint
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export type ViewMode = 'DASHBOARD' | 'LIST' | 'DETAIL' | 'IMPORT' | 'PROFILE';
