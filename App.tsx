
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Importer } from './components/Importer';
import { Dashboard } from './components/Dashboard';
import { LeadList } from './components/LeadList';
import { LeadDetail } from './components/LeadDetail';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { supabase } from './lib/supabase';
import { Lead, SheetData, SheetStats, LeadStatus, ViewMode, ImportSource, User, LibraryItem } from './types';
import { Plus, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';
import { extractGoogleSheetId, fetchPublicSheet, pushToGoogleSheet } from './utils/csvParser';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('IMPORT');
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const loadLibrary = useCallback(async (userId: string) => {
    if (!userId) {
      setLibrary([]);
      return;
    }
    setLoadingLibrary(true);
    try {
      // Specifically select columns to avoid schema cache errors for missing 'sync_url'
      const { data, error } = await supabase
        .from('user_sheets')
        .select('id, name, url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('column')) {
            console.warn("Table schema mismatch, attempting fallback select");
            const fallback = await supabase.from('user_sheets').select('id, name, url').eq('user_id', userId);
            if (fallback.data) {
                setLibrary(fallback.data.map(row => ({
                    id: row.id,
                    name: row.name,
                    url: row.url,
                    importSource: 'URL',
                    createdAt: new Date().toISOString()
                })));
                return;
            }
        }
        throw error;
      }

      if (data) {
        setLibrary(data.map(row => ({
          id: row.id,
          name: row.name,
          url: row.url,
          importSource: 'URL',
          createdAt: row.created_at
        })));
        setDbError(null);
      }
    } catch (err: any) {
      console.error("[LeadGenie] Library load error:", err.message);
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const newUser: User = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: session.user.user_metadata.role || 'Lead Specialist',
        };
        setUser(newUser);
        await loadLibrary(session.user.id);
      }
      setInitializing(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setSheets([]);
        setLibrary([]);
        setActiveSheetId(null);
        setCurrentView('IMPORT');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadLibrary]);

  const activeSheet = useMemo(() => 
    sheets.find(s => s.id === activeSheetId) || null
  , [sheets, activeSheetId]);

  const stats: SheetStats = useMemo(() => {
    if (!activeSheet) return { total: 0, contacted: 0, notResponded: 0, responded: 0, won: 0, lost: 0, contactRate: 0, responseRate: 0, conversionRate: 0 };
    const total = activeSheet.leads.length;
    const contacted = activeSheet.leads.filter(l => l._status !== LeadStatus.NEW).length;
    const notResponded = activeSheet.leads.filter(l => l._status === LeadStatus.NOT_RESPONDED).length;
    const won = activeSheet.leads.filter(l => l._status === LeadStatus.WON).length;
    const lost = activeSheet.leads.filter(l => l._status === LeadStatus.LOST).length;
    const responded = activeSheet.leads.filter(l => [LeadStatus.RESPONDED, LeadStatus.QUALIFIED, LeadStatus.WON, LeadStatus.LOST].includes(l._status)).length;
    return {
      total, contacted, notResponded, responded, won, lost,
      contactRate: total ? (contacted / total) * 100 : 0,
      responseRate: contacted ? (responded / contacted) * 100 : 0,
      conversionRate: total ? (won / total) * 100 : 0,
    };
  }, [activeSheet]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setSheets([]);
      setLibrary([]);
      setActiveSheetId(null);
      setCurrentView('IMPORT');
      window.location.href = window.location.origin;
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const handleImport = async (leads: Lead[], name: string, importSource: ImportSource, url?: string, syncUrl?: string) => {
    if (!user) return;
    let finalId = crypto.randomUUID();
    
    if (url) {
      const existingActive = sheets.find(s => s.url === url);
      if (existingActive) {
        setActiveSheetId(existingActive.id);
        setCurrentView('DASHBOARD');
        return;
      }
    }

    if (importSource === 'URL' && url) {
      try {
        const { data, error } = await supabase
          .from('user_sheets')
          .upsert({ user_id: user.id, url: url, name: name })
          .select('id')
          .single();
        if (data) {
          finalId = data.id;
          await loadLibrary(user.id); 
        }
      } catch (err: any) { 
        console.error("[LeadGenie] Database Sync Error:", err.message);
      }
    }

    const newSheet: SheetData = {
      id: finalId,
      name,
      columns: leads.length > 0 ? Object.keys(leads[0]) : [],
      leads,
      importSource,
      url,
      syncUrl
    };
    
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setCurrentView('DASHBOARD');
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    setSheets(prev => prev.map(s => 
      s.id === activeSheetId ? {...s, leads: s.leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead)} : s
    ));
    if (activeSheet?.syncUrl) {
      setSyncingId(updatedLead.id);
      try {
        await pushToGoogleSheet(activeSheet.syncUrl, updatedLead);
      } finally {
        setSyncingId(null);
      }
    }
  };

  const handleRefreshSheet = async () => {
    if (!activeSheet || activeSheet.importSource !== 'URL' || !activeSheet.url) return;
    const idToSync = activeSheet.id;
    setSyncingId(idToSync);
    try {
      const sheetId = extractGoogleSheetId(activeSheet.url);
      if (!sheetId) throw new Error("Invalid Google Sheet URL.");
      const leads = await fetchPublicSheet(sheetId);
      setSheets(prev => prev.map(s => s.id === idToSync ? { ...s, leads, columns: leads.length > 0 ? Object.keys(leads[0]) : [] } : s));
    } catch (err: any) {
      alert("Refresh failed: " + err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleCloseSheet = (id: string) => {
    // Function logic remains but UI triggers are removed as requested
    const remainingSheets = sheets.filter(s => s.id !== id);
    setSheets(remainingSheets);
    if (activeSheetId === id) {
      if (remainingSheets.length > 0) {
        setActiveSheetId(remainingSheets[0].id);
      } else {
        setActiveSheetId(null);
        setCurrentView('IMPORT');
      }
    }
  };

  const handleRemoveFromLibrary = async (id: string) => {
    if (!user) return;
    try {
      await supabase.from('user_sheets').delete().eq('id', id);
      setLibrary(prev => prev.filter(item => item.id !== id));
      setSheets(prev => prev.filter(s => s.id !== id));
      if (activeSheetId === id) {
        setActiveSheetId(null);
        setCurrentView('IMPORT');
      }
    } catch (err: any) {
      alert("Failed to delete from library: " + err.message);
    }
  };

  const handleOpenFromLibrary = async (item: LibraryItem) => {
    const alreadyOpen = sheets.find(s => s.id === item.id || (s.url && s.url === item.url));
    if (alreadyOpen) {
      setActiveSheetId(alreadyOpen.id);
      setCurrentView('DASHBOARD');
      return;
    }
    if (syncingId === item.id) return;
    setSyncingId(item.id);
    try {
      if (item.url) {
        const sheetId = extractGoogleSheetId(item.url);
        if (!sheetId) throw new Error("Could not extract ID");
        const leads = await fetchPublicSheet(sheetId);
        const newSheet: SheetData = {
          id: item.id,
          name: item.name,
          columns: leads.length > 0 ? Object.keys(leads[0]) : [],
          leads,
          importSource: item.importSource,
          url: item.url,
          syncUrl: item.syncUrl
        };
        setSheets(prev => [...prev, newSheet]);
        setActiveSheetId(item.id);
        setCurrentView('DASHBOARD');
      }
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setSyncingId(null); 
    }
  };

  if (initializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /></div>;
  if (!user) return <Auth onLogin={(u) => { setUser(u); loadLibrary(u.id); }} />;

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView} 
      onLogout={handleLogout} 
      user={user} 
      hasData={sheets.length > 0} 
      library={library} 
      openedSheets={sheets}
      activeSheetId={activeSheetId}
      onSetActiveSheet={(id) => { setActiveSheetId(id); if (currentView === 'IMPORT') setCurrentView('DASHBOARD'); }}
      onCloseSheet={handleCloseSheet}
      onOpenFromLibrary={handleOpenFromLibrary} 
      onRemoveFromLibrary={handleRemoveFromLibrary} 
      syncingId={syncingId}
    >
      <div className="flex flex-col h-full">
        {(sheets.length > 0 || loadingLibrary) && (currentView === 'DASHBOARD' || currentView === 'LIST' || currentView === 'DETAIL') && (
          <div className="flex items-center space-x-1 mb-6 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {sheets.map((sheet) => (
              <div 
                key={sheet.id} 
                onClick={() => { setActiveSheetId(sheet.id); if (currentView === 'IMPORT') setCurrentView('DASHBOARD'); }} 
                className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer transition-all border shrink-0 font-bold text-sm ${activeSheetId === sheet.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{sheet.name}</span>
              </div>
            ))}
            
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
              {activeSheet?.importSource === 'URL' && (
                <button 
                  onClick={handleRefreshSheet}
                  disabled={!!syncingId}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Pull latest from Google Sheets"
                >
                  <RefreshCw className={`w-5 h-5 ${syncingId === activeSheetId ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button 
                onClick={() => setCurrentView('IMPORT')} 
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                title="Import new sheet"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {currentView === 'IMPORT' && <Importer onImport={handleImport} />}
          {currentView === 'DASHBOARD' && (activeSheet ? <Dashboard stats={stats} /> : <Importer onImport={handleImport} />)}
          {currentView === 'LIST' && (activeSheet ? <LeadList leads={activeSheet.leads} onSelectLead={(l) => { setSelectedLeadId(l.id); setCurrentView('DETAIL'); }} importSource={activeSheet.importSource} /> : null)}
          {currentView === 'DETAIL' && (activeSheet?.leads.find(l => l.id === selectedLeadId) ? <LeadDetail lead={activeSheet.leads.find(l => l.id === selectedLeadId)!} onUpdate={handleUpdateLead} onBack={() => setCurrentView('LIST')} isSyncing={syncingId === selectedLeadId} /> : <div>Lead not found</div>)}
          {currentView === 'PROFILE' && <Profile user={user} onBack={() => setCurrentView(activeSheet ? 'DASHBOARD' : 'IMPORT')} />}
        </div>
      </div>
    </Layout>
  );
}

export default App;
