import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
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

// Components & Icons
import { Tv, Film, Clapperboard, Mail, User, LogIn, Home as HomeIcon, Crown } from 'lucide-react';

const Header: React.FC = () => {
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-md border-b border-gold-500/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-black text-gold-500 tracking-wide">
          <Tv className="w-7 h-7" />
          <span>aflame</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-300">
          <Link to="/" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
            <HomeIcon className="w-4 h-4" /> الرئيسية
          </Link>
          <Link to="/live" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
            <Tv className="w-4 h-4" /> البث المباشر
          </Link>
          <Link to="/movies" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
            <Film className="w-4 h-4" /> الأفلام
          </Link>
          <Link to="/series" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
            <Clapperboard className="w-4 h-4" /> المسلسلات
          </Link>
          <Link to="/subscribe" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
            <Crown className="w-4 h-4" /> الاشتراكات
          </Link>
          <Link to="/contact" className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> اتصل بنا
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 bg-dark-800 border border-gold-500/30 px-4 py-2 rounded-xl text-sm text-gold-400 hover:bg-gold-500/10 transition-all font-bold"
            >
              <User className="w-4 h-4" />
              <span>{profile?.displayName?.split(' ')[0] || 'حسابي'}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-gold-500 text-dark-900 px-4 py-2 rounded-xl text-sm font-extrabold hover:brightness-110 transition-all shadow-md shadow-gold-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-dark-900 border-t border-gold-500/10 py-8 px-6 text-center text-xs text-gray-500">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة البث العربية aflame</p>
      <div className="flex items-center gap-6 text-gray-400">
        <Link to="/contact" className="hover:text-gold-400">الدعم الفني</Link>
        <Link to="/subscribe" className="hover:text-gold-400">الاشتراكات</Link>
      </div>
    </div>
  </footer>
);

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark-900 text-white flex flex-col justify-between font-cairo">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/live" element={<LiveStreams />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/series" element={<Series />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login mode="login" />} />
              <Route path="/register" element={<Login mode="register" />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
