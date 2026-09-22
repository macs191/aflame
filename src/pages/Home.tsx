import React from 'react';
import { Tv, Film, Clapperboard, ShieldCheck } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-b from-dark-800 to-dark-900 border-b border-gold-500/20 py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 text-sm font-medium mb-6 inline-block">
            منصة البث العربية المتكاملة
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            عالم من الترفيه العربي <span className="text-gold-500">بدقة عالية</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            شاهد قنواتك المفضلة، أحدث الأفلام، والمسلسلات الحصرية باستخدام أحدث تقنيات بث HLS.
          </p>
        </div>
      </header>

      {/* Feature Navigation Cards */}
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="p-4 bg-gold-500/10 rounded-xl mb-6 text-gold-500">
              <Tv className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3">بث مباشر</h3>
            <p className="text-gray-400">قنوات عربية وعالمية مباشرة ببروتوكول HLS فائق السرعة وبدون تقطيع.</p>
          </div>

          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="p-4 bg-gold-500/10 rounded-xl mb-6 text-gold-500">
              <Film className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3">أفلام حصريّة</h3>
            <p className="text-gray-400">مكتبة ضخمة تضم أحدث السينمائيات العربية والأجنبية المترجمة.</p>
          </div>

          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="p-4 bg-gold-500/10 rounded-xl mb-6 text-gold-500">
              <Clapperboard className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3">مسلسلات متكاملة</h3>
            <p className="text-gray-400">مواسم وحلقات مقسمة بتنظيم دقيق وتجربة متابعة سلسة.</p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-16 glass-card p-6 rounded-2xl flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-gold-500 shrink-0" />
            <p className="text-sm text-gray-300">
              جميع روابط البث آمنة وتُدار بواسطة قواعد أمان Firestore صارمة ومزودات بث مستقلة.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
