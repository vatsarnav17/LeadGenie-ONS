import React, { useState } from 'react';
import { ViewMode } from '../types';
import { LayoutDashboard, Users, Upload, Menu, X } from 'lucide-react';

interface LayoutProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  children: React.ReactNode;
  hasData: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children, hasData }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItemClass = (view: ViewMode) => `
    flex items-center p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200
    ${currentView === view ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}
  `;

  const handleNav = (view: ViewMode) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between flex-shrink-0 z-30">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3 shadow-indigo-200 shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">LeadGenie</span>
          </div>

          <nav className="p-4 mt-4">
            <div onClick={() => handleNav('IMPORT')} className={navItemClass('IMPORT')}>
              <Upload className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Import Data</span>
            </div>

            {hasData && (
              <>
                <div onClick={() => handleNav('DASHBOARD')} className={navItemClass('DASHBOARD')}>
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  <span className="font-semibold text-sm">Dashboard</span>
                </div>
                
                <div onClick={() => handleNav('LIST')} className={navItemClass('LIST')}>
                  <Users className="w-5 h-5 mr-3" />
                  <span className="font-semibold text-sm">All Leads</span>
                </div>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
           <div className="text-[10px] text-slate-400 font-medium">
             v1.0.0 &bull; Local Storage Mode
           </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">LeadGenie</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4">
          <div onClick={() => handleNav('IMPORT')} className={navItemClass('IMPORT')}>
            <Upload className="w-5 h-5 mr-3" />
            <span className="font-semibold text-sm">Import Data</span>
          </div>
          {hasData && (
            <>
              <div onClick={() => handleNav('DASHBOARD')} className={navItemClass('DASHBOARD')}>
                <LayoutDashboard className="w-5 h-5 mr-3" />
                <span className="font-semibold text-sm">Dashboard</span>
              </div>
              <div onClick={() => handleNav('LIST')} className={navItemClass('LIST')}>
                <Users className="w-5 h-5 mr-3" />
                <span className="font-semibold text-sm">All Leads</span>
              </div>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-20">
          <div className="flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-800">
              {currentView === 'IMPORT' && 'Data Import'}
              {currentView === 'DASHBOARD' && 'Pipeline Overview'}
              {currentView === 'LIST' && 'Lead Management'}
              {currentView === 'DETAIL' && 'Lead Details'}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-800">Arnav User</p>
              <p className="text-[10px] text-slate-400">Sales Lead</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-xs">
              AU
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-screen-2xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};