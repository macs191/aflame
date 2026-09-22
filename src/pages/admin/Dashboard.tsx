import React, { useState } from 'react';
import { Tv, Film, Clapperboard } from 'lucide-react';
import { ChannelManager } from '@/components/admin/ChannelManager';
import { MovieManager } from '@/components/admin/MovieManager';
import { SeriesManager } from '@/components/admin/SeriesManager';

type Tab = 'channels' | 'movies' | 'series';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('channels');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'channels', label: 'القنوات المباشرة', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'الأفلام', icon: <Film className="w-5 h-5" /> },
    { id: 'series', label: 'المسلسلات', icon: <Clapperboard className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gold-500 mb-8 border-b border-gold-500/20 pb-4">
          لوحة إدارة المنصة (Admin Control Panel)
        </h1>

        <div className="flex flex-wrap gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-dark-900 shadow-lg shadow-gold-500/20'
                  : 'glass-card text-gray-300 hover:text-gold-400'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'channels' && <ChannelManager />}
        {activeTab === 'movies' && <MovieManager />}
        {activeTab === 'series' && <SeriesManager />}
      </div>
    </div>
  );
};

export default AdminDashboard;
