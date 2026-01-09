
import React, { useState, useRef } from 'react';
import { extractGoogleSheetId, fetchPublicSheet, parseCSV, parseExcelFile } from '../utils/csvParser';
import { Lead, ImportSource } from '../types';
import { DEMO_CSV } from '../constants';
import { FileSpreadsheet, Loader2, AlertCircle, PlayCircle, UploadCloud, Type, Info, Settings2, Copy, Check } from 'lucide-react';

interface ImporterProps {
  onImport: (leads: Lead[], name: string, source: ImportSource, url?: string, syncUrl?: string) => Promise<void>;
}

export const Importer: React.FC<ImporterProps> = ({ onImport }) => {
  const [url, setUrl] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'csv' | 'file'>('url');
  const [csvInput, setCsvInput] = useState('');
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appsScriptCode = `// PASTE THIS INTO GOOGLE APPS SCRIPT (Extensions > Apps Script)
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Find the unique identifier column (Email or Name)
  var idCol = headers.indexOf('Email') + 1 || headers.indexOf('Name') + 1 || 1;
  var idValue = data['Email'] || data['Name'] || data['id'];
  
  var rows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idCol-1] == idValue) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    headers.forEach(function(header, idx) {
      if (data[header] !== undefined) {
        sheet.getRange(rowIndex, idx + 1).setValue(data[header]);
      }
    });
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput("Not Found").setMimeType(ContentService.MimeType.TEXT);
}`;

  const handleUrlImport = async () => {
    setError(null);
    setLoading(true);
    try {
      const sheetId = extractGoogleSheetId(url);
      if (!sheetId) throw new Error("Invalid Google Sheet URL.");
      const leads = await fetchPublicSheet(sheetId);
      if (leads.length === 0) throw new Error("No data found in sheet.");
      await onImport(leads, customName.trim() || "Imported Sheet", 'URL', url, syncUrl.trim());
      setUrl('');
      setSyncUrl('');
      setCustomName('');
    } catch (err: any) {
      setError(err.message || "Failed to load sheet.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const loadDemo = () => {
    const leads = parseCSV(DEMO_CSV);
    onImport(leads, "Demo Leads", 'CSV');
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Data</h2>
          <p className="text-indigo-100">Import leads from Google Sheets or CSV.</p>
        </div>

        <div className="p-8">
            <div className="flex space-x-4 mb-6 border-b border-slate-200">
                <button className={`pb-3 text-sm font-medium ${activeTab === 'url' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`} onClick={() => setActiveTab('url')}>Google Sheet URL</button>
                <button className={`pb-3 text-sm font-medium ${activeTab === 'file' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`} onClick={() => setActiveTab('file')}>Upload File</button>
                <button className={`pb-3 text-sm font-medium ${activeTab === 'csv' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`} onClick={() => setActiveTab('csv')}>Paste CSV</button>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                    <Type className="w-4 h-4 mr-2 text-slate-400" />
                    Sheet Nickname
                </label>
                <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-slate-50" placeholder="e.g., Q4 Campaigns" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            </div>

          {activeTab === 'url' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Google Sheet Link</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900" placeholder="https://docs.google.com/spreadsheets/d/..." value={url} onChange={(e) => setUrl(e.target.value)} />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <button 
                        onClick={() => setShowSyncSetup(!showSyncSetup)}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <div className="flex items-center">
                            <Settings2 className="w-4 h-4 text-indigo-500 mr-2" />
                            <span className="text-sm font-bold text-slate-700">Two-way Sync (Optional)</span>
                        </div>
                        <Info className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    {showSyncSetup && (
                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                To update your original sheet from LeadGenie, paste the provided Apps Script into your sheet (Extensions > Apps Script) and deploy as a "Web App".
                            </p>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:ring-indigo-500" 
                                placeholder="Paste Web App URL here..." 
                                value={syncUrl}
                                onChange={(e) => setSyncUrl(e.target.value)}
                            />
                            <button 
                                onClick={handleCopyScript}
                                className="flex items-center text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                {copiedScript ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                {copiedScript ? 'COPIED SCRIPT' : 'GET APPS SCRIPT CODE'}
                            </button>
                        </div>
                    )}
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start border border-red-100">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <div><p className="font-bold mb-1">Import Error</p><p className="opacity-90">{error}</p></div>
                    </div>
                )}

                <button onClick={handleUrlImport} disabled={loading || !url} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center active:scale-[0.98]">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : null}
                    {loading ? 'Fetching Leads...' : 'Connect Google Sheet'}
                </button>
              </div>
          )}

          {activeTab === 'file' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group">
                    <UploadCloud className="w-14 h-14 text-slate-400 mb-4 group-hover:text-indigo-500" />
                    <p className="text-sm font-bold text-slate-600">Choose an Excel or CSV file</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         setLoading(true);
                         try {
                             const leads = await parseExcelFile(file);
                             await onImport(leads, customName.trim() || file.name, 'FILE');
                         } catch (err: any) { setError(err.message); } finally { setLoading(false); }
                    }} />
                </div>
              </div>
          )}

          {activeTab === 'csv' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                  <textarea className="w-full h-48 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs text-slate-900 bg-slate-50" placeholder="Name,Email,Company&#10;John Doe,john@example.com,Acme Inc" value={csvInput} onChange={(e) => setCsvInput(e.target.value)} />
                  <button onClick={async () => {
                      try {
                          const leads = parseCSV(csvInput);
                          await onImport(leads, customName.trim() || "Pasted CSV", 'CSV');
                      } catch (err: any) { setError(err.message); }
                  }} disabled={!csvInput} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg">Process CSV Data</button>
              </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <button onClick={loadDemo} className="inline-flex items-center px-6 py-2.5 bg-slate-100 rounded-full text-slate-600 font-bold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <PlayCircle className="w-4 h-4 mr-2" />
              Try with Demo Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
