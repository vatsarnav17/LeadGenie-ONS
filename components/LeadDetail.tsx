
import React, { useState } from 'react';
import { Lead, LeadStatus, LeadSubCategory } from '../types';
import { STATUS_COLORS } from '../constants';
import { generateColdEmail, analyzeLead } from '../services/geminiService';
import { ArrowLeft, Mail, Save, Wand2, BrainCircuit, Loader2, Info, CheckCircle2, Phone, Cloud, UploadCloud } from 'lucide-react';

interface LeadDetailProps {
  lead: Lead;
  onUpdate: (updatedLead: Lead) => Promise<void>;
  onBack: () => void;
  isSyncing?: boolean;
}

export const LeadDetail: React.FC<LeadDetailProps> = ({ lead, onUpdate, onBack, isSyncing = false }) => {
  const [note, setNote] = useState('');
  const [aiLoading, setAiLoading] = useState<'email' | 'analyze' | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const syncAndNotify = async (updatedLead: Lead) => {
    const syncedLead = {
      ...updatedLead,
      'STATUS(LEAD)': updatedLead._status,
      'STATUS(CALL)': updatedLead._subCategory,
      'Activity & Notes': updatedLead._notes.join(' | '),
      _lastUpdated: Date.now()
    };
    
    setSaveStatus(true);
    await onUpdate(syncedLead);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleManualSave = () => {
    syncAndNotify(lead);
  };

  const displayFields = Object.keys(lead).filter(k => 
    !k.startsWith('_') && 
    k !== 'id' && 
    k !== 'STATUS(LEAD)' && 
    k !== 'STATUS(CALL)' && 
    k !== 'Activity & Notes'
  );

  const handleStatusChange = (status: LeadStatus) => {
    syncAndNotify({ ...lead, _status: status });
  };

  const handleSubCategoryChange = (subCat: LeadSubCategory) => {
    syncAndNotify({ ...lead, _subCategory: subCat });
  };

  const addNote = () => {
    if (!note.trim()) return;
    const updatedNotes = [note, ...lead._notes];
    syncAndNotify({ ...lead, _notes: updatedNotes });
    setNote('');
  };

  const handleGenerateEmail = async () => {
    setAiLoading('email');
    setGeneratedContent(null);
    const content = await generateColdEmail(lead);
    setGeneratedContent(content);
    setAiLoading(null);
  };

  const handleAnalyze = async () => {
      setAiLoading('analyze');
      setAnalysis(null);
      const content = await analyzeLead(lead);
      setAnalysis(content);
      setAiLoading(null);
  }

  const isCallStatusEditable = [
    LeadStatus.CONTACTED,
    LeadStatus.RESPONDED,
    LeadStatus.QUALIFIED,
    LeadStatus.LOST,
    LeadStatus.WON
  ].includes(lead._status);

  const handleCopyValue = (key: string, value: any) => {
    const isPhone = key.toLowerCase().includes('phone') || key.toLowerCase().includes('contact') || key.toLowerCase().includes('mobile');
    if (isPhone && value) {
      navigator.clipboard.writeText(String(value));
      setCopyFeedback(key);
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </button>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleManualSave}
            disabled={isSyncing}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 mr-2" />
            )}
            {isSyncing ? 'Saving...' : 'Save to Sheet'}
          </button>

          {isSyncing && (
            <div className="hidden sm:flex items-center text-indigo-600 text-xs font-bold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                SYNCING...
            </div>
          )}
          {saveStatus && !isSyncing && (
            <div className="flex items-center text-green-600 text-xs font-bold animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                SYNCED
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div className="max-w-full overflow-hidden">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{lead['Name'] || lead['Full Name'] || 'Unnamed Lead'}</h2>
                <p className="text-slate-500 font-medium truncate">{lead['Company'] || lead['Organization']}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status(Lead)</label>
                    <select 
                        value={lead._status}
                        onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                        className={`px-3 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_COLORS[lead._status]}`}
                    >
                        {Object.values(LeadStatus).map(s => (
                            <option key={s} value={s} className="bg-white text-slate-800">{s}</option>
                        ))}
                    </select>
                 </div>

                 <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">STATUS(CALL)</label>
                    <div className="relative group">
                        <select 
                            value={lead._subCategory}
                            disabled={!isCallStatusEditable}
                            onChange={(e) => handleSubCategoryChange(e.target.value as LeadSubCategory)}
                            className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full transition-all duration-200 ${isCallStatusEditable ? 'bg-indigo-50 text-indigo-700 border-indigo-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'}`}
                        >
                            {Object.values(LeadSubCategory).map(sc => (
                                <option key={sc} value={sc} className="bg-white text-slate-800">{sc}</option>
                            ))}
                        </select>
                        
                        {!isCallStatusEditable && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-slate-800 text-white text-[10px] p-2.5 rounded shadow-2xl hidden group-hover:flex items-center z-[100] animate-in fade-in zoom-in duration-200 pointer-events-none">
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                <Info className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-indigo-300" /> 
                                <span className="leading-tight">Mark lead as "ContactED" or further to update call status</span>
                            </div>
                        )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayFields.map(key => {
                const isPhone = key.toLowerCase().includes('phone') || key.toLowerCase().includes('contact') || key.toLowerCase().includes('mobile');
                const value = lead[key];
                return (
                  <div key={key} className={`bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-hidden relative transition-all duration-200 ${isPhone ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50' : ''}`} onClick={() => handleCopyValue(key, value)} title={isPhone ? "Click to copy phone number" : ""}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase flex items-center truncate">
                        {key}
                        {copyFeedback === key && <span className="ml-2 text-green-600 normal-case animate-in fade-in slide-in-from-left-2">Copied!</span>}
                      </span>
                      {isPhone && value && (
                        <a href={`tel:${value}`} onClick={(e) => e.stopPropagation()} className="flex items-center px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700 transition-colors shadow-sm"><Phone className="w-3 h-3 mr-1" />CALL</a>
                      )}
                    </div>
                    <div className={`text-slate-800 text-sm break-words font-medium ${copyFeedback === key ? 'text-indigo-600' : ''}`}>{value || '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-indigo-100 shadow-sm ring-4 ring-indigo-50/50">
             <div className="flex items-center mb-4">
                <Wand2 className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-bold text-slate-800">AI Assistant</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                 <button onClick={handleGenerateEmail} disabled={!!aiLoading} className="flex items-center justify-center p-3 border border-indigo-200 rounded-lg hover:bg-indigo-50 text-indigo-700 transition-colors font-medium text-sm">
                    {aiLoading === 'email' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Mail className="w-4 h-4 mr-2" />}Draft Cold Email
                 </button>
                 <button onClick={handleAnalyze} disabled={!!aiLoading} className="flex items-center justify-center p-3 border border-purple-200 rounded-lg hover:bg-purple-50 text-purple-700 transition-colors font-medium text-sm">
                    {aiLoading === 'analyze' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <BrainCircuit className="w-4 h-4 mr-2" />}Analyze Strategy
                 </button>
             </div>
             {generatedContent && (<div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap animate-in fade-in slide-in-from-top-2"><div className="flex justify-between items-center mb-2"><span className="font-semibold text-xs text-slate-400 uppercase">Draft Output</span><button className="text-xs text-indigo-600 hover:underline" onClick={() => {navigator.clipboard.writeText(generatedContent); alert("Copied!")}}>Copy</button></div>{generatedContent}</div>)}
             {analysis && (<div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-purple-900 whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 mt-4"><span className="font-semibold text-xs text-purple-400 uppercase mb-2 block">Strategy Analysis</span>{analysis}</div>)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 flex-shrink-0">Activity & Notes</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {lead._notes.length === 0 ? (<div className="text-center text-slate-400 text-sm py-10 italic">No notes yet.</div>) : (lead._notes.map((n, idx) => (<div key={idx} className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-slate-800 shadow-sm relative group animate-in slide-in-from-right-2">{n}</div>)))}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <textarea className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none mb-2" rows={3} placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addNote())} />
            <button onClick={addNote} disabled={!note.trim()} className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"><Save className="w-4 h-4 mr-2" />Save Note</button>
          </div>
        </div>
      </div>
    </div>
  );
};
