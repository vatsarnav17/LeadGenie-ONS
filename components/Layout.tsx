
import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, User, LibraryItem, SheetData } from '../types';
import { LayoutDashboard, Users, Upload, Menu, X, LogOut, User as UserIcon, ChevronDown, BookOpen, Link2, FileSpreadsheet, PlusCircle } from 'lucide-react';

interface LayoutProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  user: User;
  children: React.ReactNode;
  hasData: boolean;
  library: LibraryItem[];
  openedSheets: SheetData[];
  activeSheetId: string | null;
  onSetActiveSheet: (id: string) => void;
  onCloseSheet: (id: string) => void;
  onOpenFromLibrary: (item: LibraryItem) => void;
  onRemoveFromLibrary: (id: string) => void;
  syncingId?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onNavigate, 
  onLogout, 
  user, 
  children, 
  hasData,
  library,
  openedSheets,
  activeSheetId,
  onSetActiveSheet,
  onOpenFromLibrary,
  syncingId
}) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItemClass = (view: ViewMode) => `
    flex items-center p-3 mb-1 rounded-lg cursor-pointer transition-all duration-200
    ${currentView === view ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-600 hover:bg-slate-100'}
  `;

  const handleNav = (view: ViewMode) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const userInitial = user.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col justify-between flex-shrink-0 z-30">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="h-16 flex items-center px-6 border-b border-slate-100 flex-shrink-0">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3 shadow-indigo-200 shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">LeadGenie</span>
          </div>

          <nav className="p-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">General</div>
            <div onClick={() => handleNav('IMPORT')} className={navItemClass('IMPORT')}>
              <Upload className="w-4 h-4 mr-3" />
              <span className="font-semibold text-sm">Import Data</span>
            </div>

            {hasData && (
              <>
                <div onClick={() => handleNav('DASHBOARD')} className={navItemClass('DASHBOARD')}>
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  <span className="font-semibold text-sm">Dashboard</span>
                </div>
                
                <div onClick={() => handleNav('LIST')} className={navItemClass('LIST')}>
                  <Users className="w-4 h-4 mr-3" />
                  <span className="font-semibold text-sm">All Leads</span>
                </div>
              </>
            )}

            {/* OPENED WORKSPACES Section */}
            {openedSheets.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3 ml-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opened Workspaces</div>
                  <div className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                    {openedSheets.length}
                  </div>
                </div>
                <div className="space-y-1">
                  {openedSheets.map((sheet) => (
                    <div 
                      key={sheet.id}
                      className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${activeSheetId === sheet.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                      onClick={() => onSetActiveSheet(sheet.id)}
                    >
                      <div className="flex items-center min-w-0">
                        <FileSpreadsheet className={`w-3.5 h-3.5 mr-2.5 flex-shrink-0 ${activeSheetId === sheet.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className={`text-xs truncate pr-2 ${activeSheetId === sheet.id ? 'text-indigo-700 font-bold' : 'text-slate-600 font-medium'}`}>
                          {sheet.name}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleNav('IMPORT')}
                    className="w-full flex items-center p-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-2"
                  >
                    <PlusCircle className="w-3 h-3 mr-2" />
                    New Workspace
                  </button>
                </div>
              </div>
            )}

            {library.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3 ml-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saved in Library</div>
                  <BookOpen className="w-3 h-3 text-slate-300" />
                </div>
                <div className="space-y-1">
                  {library.map((item) => (
                    <div 
                      key={item.id}
                      className={`group relative flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors overflow-hidden ${syncingId === item.id ? 'bg-slate-100 pointer-events-none' : ''}`}
                      onClick={() => onOpenFromLibrary(item)}
                    >
                      <div className="flex items-center min-w-0">
                        {item.importSource === 'URL' ? (
                          <Link2 className={`w-3 h-3 mr-2 ${syncingId === item.id ? 'text-indigo-600 animate-spin' : 'text-indigo-400'} flex-shrink-0`} />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2.5 ml-1 flex-shrink-0" />
                        )}
                        <span className={`text-xs font-medium truncate pr-2 ${syncingId === item.id ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}>
                          {item.name}
                        </span>
                      </div>

                      {/* LOADING BAR */}
                      {syncingId === item.id && (
                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white overflow-hidden z-10 border-t border-slate-100">
                          <div className="w-1/2 h-full bg-indigo-600 animate-slide-right shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </nav>
          
          <div className="p-4 border-t border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>Cloud Sync Active</span>
            </div>
          </div>
        </div>
      </aside>

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
        <nav className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
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

          {openedSheets.length > 0 && (
            <div className="mt-8 px-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Active Sessions</div>
              {openedSheets.map(sheet => (
                <div 
                  key={sheet.id} 
                  className={`flex items-center justify-between py-2.5 border-b border-slate-50 relative group ${activeSheetId === sheet.id ? 'bg-indigo-50/50 -mx-2 px-2' : ''}`} 
                  onClick={() => { onSetActiveSheet(sheet.id); setMobileMenuOpen(false); }}
                >
                  <span className={`text-sm truncate pr-4 ${activeSheetId === sheet.id ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}>
                    {sheet.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {library.length > 0 && (
            <div className="mt-8 px-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Your Library</div>
              {library.map(item => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between py-2 border-b border-slate-50 relative group ${syncingId === item.id ? 'bg-indigo-50/30' : ''}`} 
                  onClick={() => { onOpenFromLibrary(item); setMobileMenuOpen(false); }}
                >
                  <span className={`text-sm truncate pr-4 ${syncingId === item.id ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
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
              {currentView === 'PROFILE' && 'User Profile'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 p-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-xs uppercase">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none mb-0.5">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none">{user.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleNav('PROFILE')}
                    className="w-full flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 mr-3" />
                    My Profile
                  </button>
                  
                  <div className="h-px bg-slate-100 my-1"></div>
                  
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-screen-2xl mx-auto h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
