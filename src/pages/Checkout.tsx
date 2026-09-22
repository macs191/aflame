import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CreditCard, Lock, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { getPlan } from '@/data/plans';
import { BillingCycle, PlanId } from '@/types';
import { useAuth } from '@/context/AuthContext';

const onlyDigits = (v: string) => v.replace(/\D/g, '');

const formatCardNumber = (v: string) =>
  onlyDigits(v).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
};

export const Checkout: React.FC = () => {
  const [params] = useSearchParams();
  const { profile, updateUserProfile } = useAuth();

  const planId = (params.get('plan') as PlanId) || 'standard';
  const cycle = (params.get('cycle') as BillingCycle) || 'monthly';
  const plan = getPlan(planId);

  const [name, setName] = React.useState(profile?.displayName || '');
  const [card, setCard] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!plan) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-gray-400">الباقة المحددة غير موجودة.</p>
        <Link to="/subscribe" className="text-gold-400 font-bold hover:underline">
          العودة للباقات
        </Link>
      </div>
    );
  }

  const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const tax = Math.round(price * 0.15 * 100) / 100;
  const total = Math.round((price + tax) * 100) / 100;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (onlyDigits(card).length !== 16) {
      setError('رقم البطاقة يجب أن يتكون من 16 رقماً.');
      return;
    }
    if (onlyDigits(expiry).length !== 4) {
      setError('تاريخ انتهاء البطاقة غير صحيح.');
      return;
    }
    if (onlyDigits(cvc).length < 3) {
      setError('رمز التحقق CVC غير صحيح.');
      return;
    }

    setLoading(true);
    try {
      // Simulated payment processing, then persist the subscription to Firestore.
      await new Promise((r) => setTimeout(r, 1400));

      const now = new Date();
      const expires = new Date(now);
      if (cycle === 'monthly') expires.setMonth(expires.getMonth() + 1);
      else expires.setFullYear(expires.getFullYear() + 1);

      await updateUserProfile({
        subscriptionStatus: 'active',
        planId: plan.id,
        billingCycle: cycle,
        subscriptionExpiresAt: expires.toISOString(),
      });

      setDone(true);
    } catch (err) {
      console.error(err);
      setError('تعذّر إتمام عملية الدفع، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-10 rounded-2xl border border-green-500/30 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center text-green-400">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold">تم تفعيل اشتراكك!</h1>
          <p className="text-gray-400 text-sm">
            أنت الآن مشترك في باقة <span className="text-gold-400 font-bold">{plan.nameAr}</span>. استمتع
            بالمشاهدة بلا حدود.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              to="/live"
              className="w-full py-3.5 bg-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all"
            >
              ابدأ المشاهدة
            </Link>
            <Link to="/profile" className="text-gold-400 text-sm font-bold hover:underline">
              عرض تفاصيل الحساب
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/subscribe" className="inline-flex items-center gap-1 text-gray-400 hover:text-gold-400 text-sm">
          <ChevronLeft className="w-4 h-4" /> العودة للباقات
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Payment form */}
          <div className="md:col-span-3 glass-card p-8 rounded-2xl border border-gold-500/20 space-y-6">
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-gold-500" /> بيانات الدفع
            </h1>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">الاسم على البطاقة</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم كما يظهر على البطاقة"
                  className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">رقم البطاقة</label>
                <div className="relative">
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={card}
                    onChange={(e) => setCard(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    dir="ltr"
                    className="w-full bg-dark-800 border border-gold-500/30 rounded-xl pr-11 pl-4 py-3 text-white text-right focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">تاريخ الانتهاء</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    dir="ltr"
                    className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-right focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">رمز التحقق CVC</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={cvc}
                    onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))}
                    placeholder="123"
                    dir="ltr"
                    className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-right focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                {loading ? 'جاري معالجة الدفع...' : `ادفع ${total} ريال`}
              </button>

              <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Lock className="w-3.5 h-3.5 text-gold-500" /> جميع المعاملات مشفّرة وآمنة
              </p>
            </form>
          </div>

          {/* Order summary */}
          <div className="md:col-span-2 glass-card p-8 rounded-2xl border border-gold-500/20 h-fit space-y-5">
            <h2 className="text-lg font-bold text-gold-400">ملخص الطلب</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">الباقة</span>
                <span className="font-bold">{plan.nameAr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">الاشتراك</span>
                <span>{cycle === 'monthly' ? 'شهري' : 'سنوي'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">الجودة</span>
                <span>{plan.quality}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">عدد الشاشات</span>
                <span>{plan.screens}</span>
              </div>
              <div className="border-t border-gold-500/10 pt-3 flex items-center justify-between">
                <span className="text-gray-400">السعر</span>
                <span>{price} ريال</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">ضريبة القيمة المضافة (15%)</span>
                <span>{tax} ريال</span>
              </div>
              <div className="border-t border-gold-500/10 pt-3 flex items-center justify-between text-base">
                <span className="font-bold">الإجمالي</span>
                <span className="font-black text-gold-400">{total} ريال</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
