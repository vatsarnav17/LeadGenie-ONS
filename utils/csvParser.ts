
import { Lead, LeadStatus, LeadSubCategory } from '../types';
import * as XLSX from 'xlsx';

export const parseCSV = (csvText: string): Lead[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
           i++;
        }
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  return processParsedRows(rows);
};

export const parseExcelFile = async (file: File): Promise<Lead[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        resolve(processParsedRows(rows));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const processParsedRows = (rows: string[][]): Lead[] => {
  const cleanRows = rows.filter(r => r.length > 0 && r.some(c => c !== ''));
  if (cleanRows.length < 2) return [];

  const headers = cleanRows[0];
  const leads: Lead[] = [];

  for (let i = 1; i < cleanRows.length; i++) {
    const values = cleanRows[i];
    if (values.length > 0) {
      const lead: any = {
        id: crypto.randomUUID(),
        _status: LeadStatus.NEW,
        _subCategory: LeadSubCategory.NONE,
        _notes: [],
        _lastUpdated: Date.now(),
      };

      headers.forEach((header, index) => {
        const cleanHeader = String(header || '').trim();
        if (cleanHeader) {
            lead[cleanHeader] = values[index] !== undefined ? String(values[index]) : '';
        }
      });

      if (lead['STATUS(LEAD)']) {
          const s = String(lead['STATUS(LEAD)']).toUpperCase() as LeadStatus;
          if (Object.values(LeadStatus).includes(s)) lead._status = s;
      }
      if (lead['STATUS(CALL)']) {
          const sc = String(lead['STATUS(CALL)']).toUpperCase() as LeadSubCategory;
          if (Object.values(LeadSubCategory).includes(sc)) lead._subCategory = sc;
      }
      if (lead['Activity & Notes']) {
          lead._notes = String(lead['Activity & Notes']).split(' | ').filter(Boolean);
      }

      leads.push(lead as Lead);
    }
  }

  return leads;
};

export const extractGoogleSheetId = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export const fetchPublicSheet = async (sheetId: string): Promise<Lead[]> => {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    if (text.includes('<!DOCTYPE html>') || text.includes('google-signin')) {
      const fallbackUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const fbResponse = await fetch(fallbackUrl);
      if (!fbResponse.ok) throw new Error("Sheet is private. Set sharing to 'Anyone with the link can view'.");
      return parseCSV(await fbResponse.text());
    }
    return parseCSV(text);
  } catch (error: any) {
    throw error;
  }
};

/**
 * Sends a Lead update to the Google Apps Script Web App
 */
export const pushToGoogleSheet = async (syncUrl: string, lead: Lead): Promise<boolean> => {
  try {
    // We clean the lead data to match what the Apps Script expects
    const payload = {
      ...lead,
      'STATUS(LEAD)': lead._status,
      'STATUS(CALL)': lead._subCategory,
      'Activity & Notes': lead._notes.join(' | '),
      timestamp: new Date().toISOString()
    };

    const response = await fetch(syncUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script often requires no-cors for simple deployments
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // With no-cors, we can't see the response body, but we assume success if no error is thrown
    return true;
  } catch (err) {
    console.error("[LeadGenie] Sync Error:", err);
    return false;
  }
};
