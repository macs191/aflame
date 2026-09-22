import React, { useState } from 'react';
import { Tv, Film, Clapperboard, Plus, Trash2, Edit, Save } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'channels' | 'movies' | 'series'>('channels');
  const [channelTitle, setChannelTitle] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'channels'), {
        titleAr: channelTitle,
        logoUrl: logoUrl,
        categoryId: 'general',
        isFeatured: true,
        createdAt: new Date().toISOString(),
        streamSources: [
          {
            providerId: 'hls-direct',
            url: streamUrl,
            quality: 'auto',
          },
        ],
      });

      setMessage('تمت إضافة القناة بنجاح!');
      setChannelTitle('');
      setStreamUrl('');
      setLogoUrl('');
    } catch (err: any) {
      setMessage('حدث خطأ أثناء إضافة القناة: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gold-500 mb-8 border-b border-gold-500/20 pb-4">
          لوحة إدارة المنصة (Admin Control Panel)
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'channels'
                ? 'bg-gold-500 text-dark-900 shadow-lg shadow-gold-500/20'
                : 'glass-card text-gray-300 hover:text-gold-400'
            }`}
          >
            <Tv className="w-5 h-5" /> القنوات المباشرة
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'movies'
                ? 'bg-gold-500 text-dark-900 shadow-lg shadow-gold-500/20'
                : 'glass-card text-gray-300 hover:text-gold-400'
            }`}
          >
            <Film className="w-5 h-5" /> الأفلام
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'series'
                ? 'bg-gold-500 text-dark-900 shadow-lg shadow-gold-500/20'
                : 'glass-card text-gray-300 hover:text-gold-400'
            }`}
          >
            <Clapperboard className="w-5 h-5" /> المسلسلات
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'channels' && (
          <div className="glass-card p-8 rounded-2xl max-w-2xl">
            <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2">
              <Plus className="w-5 h-5" /> إضافة قناة جديدة
            </h2>

            {message && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-semibold ${
                message.includes('نجاح') ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleAddChannel} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اسم القناة</label>
                <input
                  type="text"
                  required
                  value={channelTitle}
                  onChange={(e) => setChannelTitle(e.target.value)}
                  placeholder="مثال: قناة الجزيرة M3U8"
                  className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">رابط البث (HLS .m3u8)</label>
                <input
                  type="url"
                  required
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://example.com/live/stream.m3u8"
                  className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 dir-ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">رابط الشعار (Logo Image URL)</label>
                <input
                  type="url"
                  required
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 dir-ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/10"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ القناة في Firestore'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
