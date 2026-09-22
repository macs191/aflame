import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getPlan } from '@/data/plans';
import { User, ShieldCheck, CreditCard, LogOut, Mail, Calendar, Monitor, Sparkles } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, profile, logout } = useAuth();

  const isAdmin = profile?.role === 'admin';
  const isActive = profile?.subscriptionStatus === 'active' || isAdmin;
  const plan = getPlan(profile?.planId);

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-gold-500 flex items-center gap-3 border-b border-gold-500/20 pb-4">
          <User className="w-8 h-8" /> الملف الشخصي والحساب
        </h1>

        {/* User Card */}
        <div className="glass-card p-8 rounded-2xl flex flex-col md:flex-row items-center gap-6 border border-gold-500/20">
          <div className="relative">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-24 h-24 rounded-full border-2 border-gold-500 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gold-500/20 border-2 border-gold-500 flex items-center justify-center text-gold-500 text-3xl font-bold">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            {isAdmin && (
              <span className="absolute -bottom-1 -right-1 bg-gold-500 text-dark-900 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> مسؤول
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-right space-y-2">
            <h2 className="text-2xl font-bold text-white">{profile?.displayName || 'مستخدم المنصة'}</h2>
            <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2 text-sm">
              <Mail className="w-4 h-4 text-gold-500" /> {user?.email}
            </p>
            <p className="text-xs text-gray-500 flex items-center justify-center md:justify-start gap-2">
              <Calendar className="w-3.5 h-3.5" /> تاريخ الإنشاء: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
            </p>
          </div>

          <button
            onClick={logout}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all font-bold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>

        {/* Subscription Plan Card */}
        <div className="glass-card p-8 rounded-2xl border border-gold-500/20 space-y-6">
          <div className="flex items-center justify-between border-b border-gold-500/10 pb-4">
            <h3 className="text-xl font-bold text-gold-400 flex items-center gap-2">
              <CreditCard className="w-6 h-6" /> حالة الاشتراك
            </h3>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}
            >
              {isAdmin ? 'اشتراك مسؤول غير محدود' : profile?.subscriptionStatus === 'active' ? 'اشتراك نشط' : 'غير مشترك'}
            </span>
          </div>

          {isActive && !isAdmin && plan ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-dark-800/60 rounded-xl p-4 border border-gold-500/10">
                <div className="flex items-center gap-2 text-gold-400 text-sm font-bold mb-1">
                  <Sparkles className="w-4 h-4" /> الباقة
                </div>
                <p className="text-white font-extrabold">{plan.nameAr}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.billingCycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}
                </p>
              </div>
              <div className="bg-dark-800/60 rounded-xl p-4 border border-gold-500/10">
                <div className="flex items-center gap-2 text-gold-400 text-sm font-bold mb-1">
                  <Monitor className="w-4 h-4" /> الجودة
                </div>
                <p className="text-white font-extrabold">{plan.quality}</p>
                <p className="text-xs text-gray-500 mt-1">{plan.screens} شاشة متزامنة</p>
              </div>
              <div className="bg-dark-800/60 rounded-xl p-4 border border-gold-500/10">
                <div className="flex items-center gap-2 text-gold-400 text-sm font-bold mb-1">
                  <Calendar className="w-4 h-4" /> ينتهي في
                </div>
                <p className="text-white font-extrabold">
                  {profile?.subscriptionExpiresAt
                    ? new Date(profile.subscriptionExpiresAt).toLocaleDateString('ar-EG')
                    : '—'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed">
              تتيح لك العضوية المتميزة الوصول الكامل لجميع القنوات المباشرة، الأفلام، والمسلسلات بجودة عالية وبدون إعلانات.
            </p>
          )}

          {!isAdmin && (
            <div className="pt-2">
              <Link
                to="/subscribe"
                className="inline-block px-8 py-3.5 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/10"
              >
                {isActive ? 'ترقية / تغيير الباقة' : 'اشترك الآن'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
