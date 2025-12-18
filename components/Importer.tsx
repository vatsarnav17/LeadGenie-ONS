import React, { useState, useRef } from 'react';
import { extractGoogleSheetId, fetchPublicSheet, parseCSV, parseExcelFile } from '../utils/csvParser';
import { Lead, ImportSource } from '../types';
import { DEMO_CSV } from '../constants';
import { FileSpreadsheet, Loader2, AlertCircle, PlayCircle, UploadCloud, FileText } from 'lucide-react';

interface ImporterProps {
  onImport: (leads: Lead[], name: string, source: ImportSource) => void;
}

export const Importer: React.FC<ImporterProps> = ({ onImport }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'csv' | 'file'>('url');
  const [csvInput, setCsvInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlImport = async () => {
    setError(null);
    setLoading(true);

    try {
      const sheetId = extractGoogleSheetId(url);
      if (!sheetId) throw new Error("Invalid Google Sheet URL.");
      
      const leads = await fetchPublicSheet(sheetId);
      if (leads.length === 0) throw new Error("No data found in sheet.");
      
      onImport(leads, "Imported Sheet", 'URL');
    } catch (err: any) {
      setError(err.message || "Failed to load sheet. Make sure it is 'Published to the Web' (File > Share > Publish to web).");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = () => {
    try {
        const leads = parseCSV(csvInput);
        if (leads.length === 0) throw new Error("No valid CSV data found.");
        onImport(leads, "Pasted CSV", 'CSV');
    } catch(err: any) {
        setError(err.message);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      try {
          const leads = await parseExcelFile(file);
          if (leads.length === 0) throw new Error("No data found in file.");
          onImport(leads, file.name, 'FILE');
      } catch (err: any) {
          setError(err.message || "Failed to parse file. Ensure it is a valid CSV or Excel (.xlsx, .xls) file.");
      } finally {
          setLoading(false);
      }
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
          <p className="text-indigo-100">Import leads from Google Sheets, Excel, or CSV.</p>
        </div>

        <div className="p-8">
            <div className="flex space-x-4 mb-6 border-b border-slate-200">
                <button 
                    className={`pb-3 text-sm font-medium ${activeTab === 'url' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
                    onClick={() => { setActiveTab('url'); setError(null); }}
                >
                    Google Sheet URL
                </button>
                <button 
                    className={`pb-3 text-sm font-medium ${activeTab === 'file' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
                    onClick={() => { setActiveTab('file'); setError(null); }}
                >
                    Upload File
                </button>
                <button 
                    className={`pb-3 text-sm font-medium ${activeTab === 'csv' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
                    onClick={() => { setActiveTab('csv'); setError(null); }}
                >
                    Paste CSV
                </button>
            </div>

          {activeTab === 'url' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet Link</label>
                    <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        * Ensure the sheet is <strong>Published to the Web</strong> (File &gt; Share &gt; Publish to web &gt; CSV).
                    </p>
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                    </div>
                )}

                <button
                    onClick={handleUrlImport}
                    disabled={loading || !url}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center shadow-lg"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {loading ? 'Fetching Sheet...' : 'Import Leads'}
                </button>
              </div>
          )}

          {activeTab === 'file' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                >
                    <UploadCloud className="w-12 h-12 text-slate-400 mb-4 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-sm font-semibold text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">Excel (.xlsx, .xls) or CSV files</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={handleFileChange}
                    />
                </div>
                
                {loading && (
                    <div className="flex items-center justify-center p-4 text-indigo-600 text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing file...
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                    </div>
                )}
              </div>
          )}

          {activeTab === 'csv' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-1">CSV Content</label>
                  <textarea
                    className="w-full h-40 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                    placeholder="Name,Email,Company&#10;John Doe,john@example.com,Acme Inc"
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                  />
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                    </div>
                )}
                  <button
                    onClick={handleCsvImport}
                    disabled={!csvInput}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg"
                >
                    Process CSV
                </button>
              </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-3">Just want to look around?</p>
            <button
              onClick={loadDemo}
              className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Load Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};