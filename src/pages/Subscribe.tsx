import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown } from 'lucide-react';
import { PLANS } from '@/data/plans';
import { BillingCycle, PlanId } from '@/types';
import { useAuth } from '@/context/AuthContext';

export const Subscribe: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [cycle, setCycle] = React.useState<BillingCycle>('monthly');

  const handleChoose = (planId: PlanId) => {
    navigate(`/checkout?plan=${planId}&cycle=${cycle}`);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold flex items-center justify-center gap-3">
            <Crown className="w-9 h-9 text-gold-500" /> اختر باقتك
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            جميع الباقات تمنحك وصولاً كاملاً للمحتوى. اختر ما يناسب عدد شاشاتك والجودة المطلوبة.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-dark-800 border border-gold-500/20 rounded-xl p-1">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                cycle === 'monthly' ? 'bg-gold-500 text-dark-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                cycle === 'yearly' ? 'bg-gold-500 text-dark-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              سنوي
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                وفّر شهرين
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const isCurrent =
              profile?.subscriptionStatus === 'active' && profile?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`glass-card rounded-2xl p-8 flex flex-col relative ${
                  plan.highlighted ? 'border-gold-500 ring-1 ring-gold-500/40' : ''
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 right-8 bg-gold-500 text-dark-900 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-dark-900" /> الأكثر شعبية
                  </span>
                )}
                <h3 className="text-2xl font-extrabold text-gold-400">{plan.nameAr}</h3>
                <p className="text-gray-400 text-sm mt-1 mb-5">{plan.taglineAr}</p>
                <div className="mb-2">
                  <span className="text-4xl font-black text-white">{price}</span>
                  <span className="text-gray-400"> ريال / {cycle === 'monthly' ? 'شهرياً' : 'سنوياً'}</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mb-6">
                  <span>{plan.quality}</span>
                  <span>•</span>
                  <span>{plan.screens} شاشة</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.featuresAr.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChoose(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 rounded-xl font-extrabold text-center transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlighted
                      ? 'bg-gold-500 text-dark-900 hover:brightness-110'
                      : 'bg-dark-800 border border-gold-500/30 text-gold-400 hover:bg-gold-500/10'
                  }`}
                >
                  {isCurrent ? 'باقتك الحالية' : 'اختر هذه الباقة'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
