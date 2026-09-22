import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Tv, Film, Clapperboard, LayoutDashboard, Users } from 'lucide-react';
import { ChannelManager } from '@/components/admin/ChannelManager';
import { MovieManager } from '@/components/admin/MovieManager';
import { SeriesManager } from '@/components/admin/SeriesManager';
import { Accounts } from '@/pages/admin/Accounts';

type Tab = 'channels' | 'movies' | 'series' | 'accounts';

const tabs: { id: Tab; path: string; label: string; icon: React.ReactNode }[] = [
  { id: 'channels', path: '/admin/channels', label: 'البث المباشر', icon: <Tv className="w-5 h-5" /> },
  { id: 'movies', path: '/admin/movies', label: 'الأفلام', icon: <Film className="w-5 h-5" /> },
  { id: 'series', path: '/admin/series', label: 'المسلسلات', icon: <Clapperboard className="w-5 h-5" /> },
  { id: 'accounts', path: '/admin/accounts', label: 'الحسابات', icon: <Users className="w-5 h-5" /> },
];

export const AdminDashboard: React.FC = () => {
  const { pathname } = useLocation();

  if (pathname === '/admin' || pathname === '/admin/') {
    return <Navigate to="/admin/channels" replace />;
  }

  const activeTab: Tab = pathname.startsWith('/admin/movies')
    ? 'movies'
    : pathname.startsWith('/admin/series')
      ? 'series'
      : pathname.startsWith('/admin/accounts')
        ? 'accounts'
        : 'channels';

  return (
    <section className="min-h-screen bg-dark-900 text-white p-4 sm:p-6 md:p-10" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-gold-500/20 pb-6">
          <div>
            <p className="text-gold-500 text-sm font-bold mb-2">AFLAME ADMIN</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-gold-500" /> لوحة إدارة المحتوى
            </h1>
            <p className="text-gray-400 text-sm mt-2">أضف روابط البث والأفلام والمسلسلات من مكان واحد.</p>
          </div>
          <Link to="/" className="text-sm font-bold text-gold-400 hover:text-gold-300 transition-colors">
            العودة إلى الموقع
          </Link>
        </div>

        <nav className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8" aria-label="أقسام لوحة الإدارة">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all border ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-dark-900 border-gold-500 shadow-lg shadow-gold-500/20'
                  : 'bg-dark-800 text-gray-300 border-gold-500/20 hover:border-gold-500/50 hover:text-gold-400'
              }`}
            >
              {tab.icon} {tab.label}
            </Link>
          ))}
        </nav>

        {activeTab === 'channels' && <ChannelManager />}
        {activeTab === 'movies' && <MovieManager />}
        {activeTab === 'series' && <SeriesManager />}
        {activeTab === 'accounts' && <Accounts />}
      </div>
    </section>
  );
};

export default AdminDashboard;
