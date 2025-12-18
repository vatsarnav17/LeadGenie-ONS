import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, LeadSubCategory, ImportSource } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, ChevronRight, ChevronLeft, Filter, MapPin, Tag, Phone, Mail, LayoutGrid, Download, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  importSource: ImportSource;
}

export const LeadList: React.FC<LeadListProps> = ({ leads, onSelectLead, importSource }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [callStatusFilter, setCallStatusFilter] = useState<string>('ALL');
  const [sheetSubCategoryFilter, setSheetSubCategoryFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getVal = (lead: Lead, keys: string[]) => {
    for (const key of keys) {
      if (lead[key] !== undefined) return String(lead[key]);
      const lowerKey = key.toLowerCase();
      const foundKey = Object.keys(lead).find(k => k.toLowerCase() === lowerKey);
      if (foundKey) return String(lead[foundKey]);
    }
    return '';
  };

  const getSubCategoryVal = (lead: Lead) => {
    return getVal(lead, ['Sub Category', 'Sub-category', 'Subcategory']);
  };

  const cities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      const cityVal = getVal(l, ['City', 'Town', 'Location']);
      if (cityVal) set.add(cityVal);
    });
    return Array.from(set).sort();
  }, [leads]);

  const sheetSubCategories = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      const subCatVal = getSubCategoryVal(l);
      if (subCatVal) set.add(subCatVal);
    });
    return Array.from(set).sort();
  }, [leads]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = Object.values(lead).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'ALL' || lead._status === statusFilter;
    const matchesCallStatus = callStatusFilter === 'ALL' || lead._subCategory === callStatusFilter;
    const sheetSubCatVal = getSubCategoryVal(lead);
    const matchesSheetSubCategory = sheetSubCategoryFilter === 'ALL' || sheetSubCatVal === sheetSubCategoryFilter;
    const cityVal = getVal(lead, ['City', 'Town', 'Location']);
    const matchesCity = cityFilter === 'ALL' || cityVal === cityFilter;
    
    return matchesSearch && matchesStatus && matchesCallStatus && matchesSheetSubCategory && matchesCity;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, callStatusFilter, sheetSubCategoryFilter, cityFilter, itemsPerPage]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  const handleDownloadExcel = () => {
      if (leads.length === 0) return;

      const exportData = leads.map(lead => {
          const row: any = {};
          Object.keys(lead).forEach(key => {
              if (!key.startsWith('_') && key !== 'id') {
                  row[key] = lead[key];
              }
          });

          row['STATUS(LEAD)'] = lead._status;
          row['STATUS(CALL)'] = lead._subCategory;
          row['Activity & Notes'] = lead._notes.join(' | ');

          return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Updated Leads");

      XLSX.writeFile(workbook, `LeadGenie_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleCopyPhone = (e: React.MouseEvent, phone: string, id: string) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[85vh]">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 w-full lg:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {importSource === 'FILE' && (
              <button 
                onClick={handleDownloadExcel}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm flex-shrink-0"
                title="Download updated Excel sheet"
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-1.5 flex-1 min-w-[140px]">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select 
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white text-black font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 flex-1 min-w-[140px]">
            <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select 
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white text-black font-medium"
              value={callStatusFilter}
              onChange={(e) => setCallStatusFilter(e.target.value)}
            >
              <option value="ALL">All Call Status</option>
              {Object.values(LeadSubCategory).map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 flex-1 min-w-[140px]">
            <LayoutGrid className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select 
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white text-black font-medium"
              value={sheetSubCategoryFilter}
              onChange={(e) => setSheetSubCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Sub-categories</option>
              {sheetSubCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 flex-1 min-w-[140px]">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select 
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white text-black font-medium"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="ALL">All Cities</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 w-12 text-center">#</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Status(Lead)</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Company</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Sub-category</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Phone</th>
              <th className="px-4 py-3 border-b border-slate-200"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLeads.map((lead, index) => {
              const phone = getVal(lead, ['Contact Number', 'Phone', 'Mobile']);
              return (
                <tr 
                  key={lead.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onSelectLead(lead)}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400 font-mono text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[lead._status]}`}>
                      {lead._status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {getVal(lead, ['Name', 'Full Name', 'First Name'])}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 truncate max-w-[150px]">
                    {getVal(lead, ['Company', 'Organization'])}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    {getSubCategoryVal(lead)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div className="flex items-center truncate max-w-[180px]">
                        <Mail className="w-3 h-3 mr-1 text-slate-400" />
                        {getVal(lead, ['Email', 'E-mail'])}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div 
                      className="flex items-center cursor-pointer hover:text-indigo-600 group/phone transition-colors relative"
                      title="Click to copy"
                      onClick={(e) => handleCopyPhone(e, phone, lead.id)}
                    >
                        {copiedId === lead.id ? (
                          <div className="flex items-center text-green-600 font-bold text-[10px] animate-in fade-in zoom-in duration-200">
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </div>
                        ) : (
                          <>
                            <Phone className="w-3 h-3 mr-1 text-slate-400 group-hover/phone:text-indigo-600" />
                            {phone}
                          </>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white space-y-4 sm:space-y-0 flex-shrink-0">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Rows:</span>
            <select
                className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 text-xs outline-none"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
            </select>
        </div>

        <div className="flex items-center space-x-4">
            <div className="text-[10px] text-slate-400 font-medium">
                {filteredLeads.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredLeads.length)} of {filteredLeads.length}
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-600 min-w-[40px] text-center">
                         {currentPage} / {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};