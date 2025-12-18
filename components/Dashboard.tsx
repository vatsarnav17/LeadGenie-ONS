import React from 'react';
import { SheetStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Users, PhoneOutgoing, CheckCircle, XCircle } from 'lucide-react';

interface DashboardProps {
  stats: SheetStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const cardData = [
    { label: 'Total Leads', value: stats.total, icon: Users, color: 'bg-blue-500', sub: 'Total pipeline volume' },
    { label: 'Contacted', value: stats.contacted, icon: PhoneOutgoing, color: 'bg-yellow-500', sub: `${stats.contactRate.toFixed(1)}% of total` },
    { label: 'Won', value: stats.won, icon: CheckCircle, color: 'bg-green-500', sub: `${stats.conversionRate.toFixed(1)}% conversion` },
    { label: 'Lost', value: stats.lost, icon: XCircle, color: 'bg-red-500', sub: `${stats.total ? ((stats.lost / stats.total) * 100).toFixed(1) : 0}% of total` },
  ];

  const chartData = [
    { name: 'Unvisited', value: stats.total - stats.contacted, color: '#94a3b8' },
    { name: 'Contacted', value: stats.contacted - stats.notResponded - stats.responded, color: '#eab308' },
    { name: 'No Response', value: stats.notResponded, color: '#f97316' },
    { name: 'Responded', value: stats.responded - stats.won - stats.lost, color: '#a855f7' },
    { name: 'Won', value: stats.won, color: '#22c55e' },
    { name: 'Lost', value: stats.lost, color: '#ef4444' },
  ].filter(item => item.value >= 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{item.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${item.color} bg-opacity-10`}>
                <item.icon className={`w-6 h-6 ${item.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded w-fit">
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Pipeline Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} minPointSize={5}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Distribution</h3>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  minAngle={15}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};