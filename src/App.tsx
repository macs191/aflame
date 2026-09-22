import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Lazy Loaded Page Layouts for Optimized Chunking
const Home = lazy(() => import('@/pages/Home'));
const LiveStreams = lazy(() => import('@/pages/LiveStreams'));
const Movies = lazy(() => import('@/pages/Movies'));
const Series = lazy(() => import('@/pages/Series'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const History = lazy(() => import('@/pages/History'));
const Profile = lazy(() => import('@/pages/Profile'));
const Contact = lazy(() => import('@/pages/Contact'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-gold-500">
    <Loader2 className="w-12 h-12 animate-spin mb-4" />
    <span className="text-lg font-semibold tracking-wide">جاري تحضير المحتوى...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col dir-rtl">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live" element={<LiveStreams />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/series" element={<Series />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
