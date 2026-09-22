import React from 'react';
import { Link } from 'react-router-dom';
import {
  Tv,
  Film,
  Clapperboard,
  ShieldCheck,
  Play,
  Sparkles,
  Download,
  Monitor,
  Globe,
  Check,
  ChevronDown,
  Star,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PLANS } from '@/data/plans';

const features = [
  {
    icon: Tv,
    title: 'بث مباشر بدون تقطيع',
    desc: 'قنوات عربية وعالمية مباشرة ببروتوكول HLS فائق السرعة وجودة تتكيف تلقائياً مع سرعة اتصالك.',
  },
  {
    icon: Film,
    title: 'مكتبة أفلام ضخمة',
    desc: 'أحدث السينمائيات العربية والأجنبية المترجمة، تُحدَّث أسبوعياً بأحدث الإصدارات.',
  },
  {
    icon: Clapperboard,
    title: 'مسلسلات وحلقات كاملة',
    desc: 'مواسم وحلقات منظمة بدقة مع متابعة تلقائية لآخر ما شاهدته.',
  },
  {
    icon: Monitor,
    title: 'مشاهدة على كل الأجهزة',
    desc: 'هاتف، تابلت، حاسوب، وتلفاز ذكي — تجربة سلسة أينما كنت.',
  },
  {
    icon: Download,
    title: 'تحميل ومشاهدة دون اتصال',
    desc: 'حمّل أفلامك ومسلسلاتك المفضلة وشاهدها في أي وقت بدون إنترنت.',
  },
  {
    icon: Globe,
    title: 'محتوى بلا حدود',
    desc: 'وصول كامل لكل المحتوى من أي مكان في العالم بجودة عالية.',
  },
];

const faqs = [
  {
    q: 'ما هي منصة aflame؟',
    a: 'منصة بث عربية متكاملة تتيح لك مشاهدة القنوات المباشرة، الأفلام، والمسلسلات بجودة عالية على جميع أجهزتك مقابل اشتراك شهري أو سنوي.',
  },
  {
    q: 'كم تكلفة الاشتراك؟',
    a: 'تبدأ الباقات من 29 ريال شهرياً للباقة الأساسية، مع خيارات أعلى للجودة 4K وعدد الشاشات. يمكنك أيضاً الاشتراك سنوياً وتوفير أكثر من شهرين مجاناً.',
  },
  {
    q: 'هل يمكنني الإلغاء في أي وقت؟',
    a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت من صفحة حسابك دون أي رسوم إضافية أو التزامات.',
  },
  {
    q: 'على كم جهاز يمكنني المشاهدة؟',
    a: 'يعتمد ذلك على باقتك: من شاشة واحدة في الباقة الأساسية حتى 4 شاشات في الباقة المميزة في وقت واحد.',
  },
];

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-right"
      >
        <span className="font-bold text-white">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-gold-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{a}</p>}
    </div>
  );
};

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-dark-900 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero.png" alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/80 to-dark-900/60" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
          <span className="px-4 py-1.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 text-sm font-medium mb-6 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> منصة البث العربية المتكاملة
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            كل الترفيه العربي في مكان واحد <span className="text-gold-500">بجودة تصل إلى 4K</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            بث مباشر، أحدث الأفلام، والمسلسلات الحصرية — شاهد بلا حدود على كل أجهزتك. اشترك الآن وألغِ في أي وقت.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? '/live' : '/register'}
              className="px-8 py-4 bg-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/20 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Play className="w-5 h-5 fill-dark-900" /> {user ? 'ابدأ المشاهدة' : 'ابدأ الآن مجاناً'}
            </Link>
            <Link
              to="/subscribe"
              className="px-8 py-4 bg-dark-800 border border-gold-500/30 text-gold-400 font-bold rounded-xl hover:bg-gold-500/10 transition-all w-full sm:w-auto justify-center flex items-center gap-2"
            >
              عرض الباقات والأسعار
            </Link>
          </div>
        </div>
      </section>

      {/* Quick category links */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/live', icon: Tv, label: 'البث المباشر', desc: 'قنوات مباشرة' },
            { to: '/movies', icon: Film, label: 'الأفلام', desc: 'مكتبة سينمائية' },
            { to: '/series', icon: Clapperboard, label: 'المسلسلات', desc: 'مواسم وحلقات' },
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="glass-card glass-card-hover p-6 rounded-2xl flex items-center gap-4"
            >
              <div className="p-3 bg-gold-500/10 rounded-xl text-gold-500">
                <c.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{c.label}</h3>
                <p className="text-gray-400 text-sm">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            لماذا <span className="text-gold-500">aflame</span>؟
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            تجربة مشاهدة متكاملة صُممت خصيصاً للمشاهد العربي بأعلى المعايير التقنية.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card glass-card-hover p-7 rounded-2xl">
              <div className="p-3 bg-gold-500/10 rounded-xl mb-5 text-gold-500 w-fit">
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-dark-800/40 border-y border-gold-500/10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              باقات تناسب <span className="text-gold-500">الجميع</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              اختر الباقة المناسبة لك وابدأ المشاهدة فوراً. جميع الباقات تشمل الوصول الكامل للمحتوى.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => (
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
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">{plan.monthlyPrice}</span>
                  <span className="text-gray-400"> ريال / شهرياً</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.featuresAr.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/subscribe"
                  className={`w-full py-3.5 rounded-xl font-extrabold text-center transition-all ${
                    plan.highlighted
                      ? 'bg-gold-500 text-dark-900 hover:brightness-110'
                      : 'bg-dark-800 border border-gold-500/30 text-gold-400 hover:bg-gold-500/10'
                  }`}
                >
                  اشترك الآن
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">الأسئلة الشائعة</h2>
          <p className="text-gray-400">كل ما تحتاج معرفته قبل الاشتراك.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="glass-card rounded-3xl p-10 md:p-14 text-center border border-gold-500/30">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">جاهز لتبدأ المشاهدة؟</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            انضم لآلاف المشاهدين واستمتع بأفضل تجربة ترفيه عربية. اشترك الآن وابدأ خلال دقائق.
          </p>
          <Link
            to={user ? '/subscribe' : '/register'}
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/20"
          >
            <Play className="w-5 h-5 fill-dark-900" /> {user ? 'اختر باقتك' : 'إنشاء حساب جديد'}
          </Link>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-gold-500" />
            <span>دفع آمن ومشفّر • إلغاء في أي وقت • دعم فني على مدار الساعة</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
