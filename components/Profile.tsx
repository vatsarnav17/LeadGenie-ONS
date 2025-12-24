import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Camera, ArrowLeft } from 'lucide-react';

interface ProfileProps {
  user: User;
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onBack }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors border-4 border-white">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 font-medium">{user.role}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center text-slate-400 mb-2">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-xs font-bold uppercase">Email Address</span>
              </div>
              <p className="text-slate-800 font-semibold">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
             <h3 className="text-sm font-bold text-slate-900 mb-4">Account Preferences</h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-slate-800">Dark Mode</p>
                   <p className="text-xs text-slate-500">Switch between light and dark themes</p>
                 </div>
                 <div 
                   onClick={() => setIsDarkMode(!isDarkMode)}
                   className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};