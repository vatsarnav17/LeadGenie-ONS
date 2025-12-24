import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Importer } from './components/Importer';
import { Dashboard } from './components/Dashboard';
import { LeadList } from './components/LeadList';
import { LeadDetail } from './components/LeadDetail';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { Lead, SheetData, SheetStats, LeadStatus, ViewMode, ImportSource, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('IMPORT');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Persistence check
  useEffect(() => {
    const savedUser = localStorage.getItem('lg_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lg_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lg_user');
    setSheetData(null);
    setCurrentView('IMPORT');
  };

  // Derived state for stats
  const stats: SheetStats = useMemo(() => {
    if (!sheetData) return { total: 0, contacted: 0, notResponded: 0, responded: 0, won: 0, lost: 0, contactRate: 0, responseRate: 0, conversionRate: 0 };
    
    const total = sheetData.leads.length;
    const contacted = sheetData.leads.filter(l => l._status !== LeadStatus.NEW).length;
    const notResponded = sheetData.leads.filter(l => l._status === LeadStatus.NOT_RESPONDED).length;
    const won = sheetData.leads.filter(l => l._status === LeadStatus.WON).length;
    const lost = sheetData.leads.filter(l => l._status === LeadStatus.LOST).length;
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

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

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
      case 'PROFILE':
        return <Profile user={user} onBack={() => setCurrentView(sheetData ? 'DASHBOARD' : 'IMPORT')} />;
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      onLogout={handleLogout}
      user={user}
      hasData={!!sheetData}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;