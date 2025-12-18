import React, { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Importer } from './components/Importer';
import { Dashboard } from './components/Dashboard';
import { LeadList } from './components/LeadList';
import { LeadDetail } from './components/LeadDetail';
import { Lead, SheetData, SheetStats, LeadStatus, ViewMode, ImportSource } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('IMPORT');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Derived state for stats
  const stats: SheetStats = useMemo(() => {
    if (!sheetData) return { total: 0, contacted: 0, notResponded: 0, responded: 0, won: 0, lost: 0, contactRate: 0, responseRate: 0, conversionRate: 0 };
    
    const total = sheetData.leads.length;
    // Contacted includes anything that isn't NEW
    const contacted = sheetData.leads.filter(l => l._status !== LeadStatus.NEW).length;
    
    // Explicit statuses
    const notResponded = sheetData.leads.filter(l => l._status === LeadStatus.NOT_RESPONDED).length;
    const won = sheetData.leads.filter(l => l._status === LeadStatus.WON).length;
    const lost = sheetData.leads.filter(l => l._status === LeadStatus.LOST).length;
    
    // Responded group: Responded, Qualified, Won, Lost
    const responded = sheetData.leads.filter(l => [LeadStatus.RESPONDED, LeadStatus.QUALIFIED, LeadStatus.WON, LeadStatus.LOST].includes(l._status)).length;

    return {
      total,
      contacted,
      notResponded,
      responded,
      won,
      lost,
      contactRate: total ? (contacted / total) * 100 : 0,
      responseRate: contacted ? (responded / contacted) * 100 : 0,
      conversionRate: total ? (won / total) * 100 : 0,
    };
  }, [sheetData]);

  const handleImport = (leads: Lead[], name: string, importSource: ImportSource) => {
    setSheetData({
      id: crypto.randomUUID(),
      name,
      columns: leads.length > 0 ? Object.keys(leads[0]) : [],
      leads,
      importSource
    });
    setCurrentView('DASHBOARD');
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setCurrentView('DETAIL');
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    if (!sheetData) return;
    const updatedLeads = sheetData.leads.map(l => l.id === updatedLead.id ? updatedLead : l);
    setSheetData({ ...sheetData, leads: updatedLeads });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'IMPORT':
        return <Importer onImport={handleImport} />;
      case 'DASHBOARD':
        return <Dashboard stats={stats} />;
      case 'LIST':
        return sheetData ? <LeadList leads={sheetData.leads} onSelectLead={handleSelectLead} importSource={sheetData.importSource} /> : null;
      case 'DETAIL':
        const lead = sheetData?.leads.find(l => l.id === selectedLeadId);
        return lead ? (
          <LeadDetail 
            lead={lead} 
            onUpdate={handleUpdateLead} 
            onBack={() => setCurrentView('LIST')} 
          />
        ) : <div>Lead not found</div>;
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      hasData={!!sheetData}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;