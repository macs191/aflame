import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import Home from '@/pages/Home';
import LiveStreams from '@/pages/LiveStreams';
import Movies from '@/pages/Movies';
import Series from '@/pages/Series';
import Contact from '@/pages/Contact';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Subscribe from '@/pages/Subscribe';
import Checkout from '@/pages/Checkout';
import AdminDashboard from '@/pages/admin/Dashboard';

import { Tv, Film, Clapperboard, Mail, User, LogIn, Home as HomeIcon, Crown, ShieldCheck, Menu, X } from 'lucide-react';

const publicNavItems = [
  { to: '/', label: 'الرئيسية', icon: HomeIcon, end: true },
  { to: '/live', label: 'البث المباشر', icon: Tv },
  { to: '/movies', label: 'الأفلام', icon: Film },
  { to: '/series', label: 'المسلسلات', icon: Clapperboard },
  { to: '/subscribe', label: 'الاشتراكات', icon: Crown },
  { to: '/contact', label: 'اتصل بنا', icon: Mail },
];

const Header: React.FC = () => {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isAdmin = profile?.role === 'admin';
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 transition-colors ${isActive ? 'text-gold-400' : 'text-gray-300 hover:text-gold-400'}`;

  const items = isAdmin
    ? [...publicNavItems, { to: '/admin/channels', label: 'الإدارة', icon: ShieldCheck }]
    : publicNavItems;

  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-gold-500/20 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-xl font-black text-gold-500 tracking-wide shrink-0">
          <Tv className="w-7 h-7" /><span>aflame</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold" aria-label="التنقل الرئيسي">
          {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={navClass}><Icon className="w-4 h-4" />{label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? <Link to="/profile" className="flex items-center gap-2 bg-dark-800 border border-gold-500/30 px-3 sm:px-4 py-2 rounded-xl text-sm text-gold-400 font-bold"><User className="w-4 h-4" />{profile?.displayName?.split(' ')[0] || 'حسابي'}</Link> : <Link to="/login" className="flex items-center gap-2 bg-gold-500 text-dark-900 px-3 sm:px-4 py-2 rounded-xl text-sm font-extrabold"><LogIn className="w-4 h-4" />تسجيل الدخول</Link>}
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="lg:hidden p-2 rounded-lg text-gold-400" aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen}>{menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
      </div>
      {menuOpen && <nav className="lg:hidden max-w-7xl mx-auto pt-4 mt-4 border-t border-gold-500/10 grid grid-cols-2 gap-2" aria-label="قائمة الهاتف">{items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `${navClass({ isActive })} p-3 rounded-lg ${isActive ? 'bg-gold-500/10' : ''}`}><Icon className="w-4 h-4" />{label}</NavLink>)}</nav>}
    </header>
  );
};

const Footer: React.FC = () => <footer className="bg-dark-900 border-t border-gold-500/10 py-8 px-6 text-center text-xs text-gray-500"><div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4"><p>جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة البث العربية aflame</p><div className="flex items-center gap-6 text-gray-400"><Link to="/contact" className="hover:text-gold-400">الدعم الفني</Link><Link to="/subscribe" className="hover:text-gold-400">الاشتراكات</Link></div></div></footer>;

export const App: React.FC = () => <Router><AuthProvider><div className="min-h-screen bg-dark-900 text-white flex flex-col justify-between font-cairo"><Header /><main className="flex-1"><Routes><Route path="/" element={<Home />} /><Route path="/live" element={<LiveStreams />} /><Route path="/movies" element={<Movies />} /><Route path="/series" element={<Series />} /><Route path="/contact" element={<Contact />} /><Route path="/login" element={<Login mode="login" />} /><Route path="/register" element={<Login mode="register" />} /><Route path="/subscribe" element={<Subscribe />} /><Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} /><Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /><Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main><Footer /></div></AuthProvider></Router>;

export default App;
