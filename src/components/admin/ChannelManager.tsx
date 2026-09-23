import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LiveChannel, StreamSource } from '@/types';
import { Plus, Trash2, Tv, Loader2 } from 'lucide-react';
import { Field, StatusMessage, SubmitButton } from './ui';

const parseSources = (value: string): StreamSource[] =>
  value
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      providerId: 'hls-direct',
      url,
      label: `سيرفر ${index + 1}`,
      quality: 'auto',
    }));

export const ChannelManager: React.FC = () => {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [titleAr, setTitleAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const fetchChannels = async () => {
    setLoadingList(true);
    try {
      const snap = await getDocs(collection(db, 'channels'));
      setChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LiveChannel[]);
    } catch (err) {
      console.error('فشل في جلب القنوات:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void fetchChannels();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const streamSources = parseSources(streamUrl);
    if (!streamSources.length) {
      setMessage('أضف رابط سيرفر واحد على الأقل.');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await addDoc(collection(db, 'channels'), {
        titleAr,
        descriptionAr,
        logoUrl,
        categoryId: 'general',
        isFeatured: true,
        createdAt: new Date().toISOString(),
        streamSources,
      });
      setMessage('تمت إضافة القناة بنجاح!');
      setTitleAr('');
      setDescriptionAr('');
      setStreamUrl('');
      setLogoUrl('');
      void fetchChannels();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة القناة');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القناة؟')) return;
    try {
      await deleteDoc(doc(db, 'channels', id));
      void fetchChannels();
    } catch (err) {
      console.error('فشل حذف القناة:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-2xl h-fit">
        <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2">
          <Plus className="w-5 h-5" /> إضافة قناة جديدة
        </h2>
        <StatusMessage message={message} />
        <form onSubmit={handleAdd} className="space-y-5">
          <Field label="اسم القناة" value={titleAr} onChange={setTitleAr} required placeholder="مثال: قناة الجزيرة" />
          <Field label="وصف القناة" value={descriptionAr} onChange={setDescriptionAr} placeholder="وصف مختصر للقناة" />
          <div>
            <label className="block text-sm text-gray-300 mb-2">روابط السيرفرات (رابط في كل سطر)</label>
            <textarea value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} required dir="ltr" rows={4} placeholder="https://example.com/stream.m3u8\nhttps://backup.example.com/stream.m3u8" className="w-full rounded-xl bg-dark-900 border border-gold-500/20 p-3 text-white outline-none focus:border-gold-500" />
          </div>
          <Field label="رابط الشعار" value={logoUrl} onChange={setLogoUrl} required type="url" ltr placeholder="https://example.com/logo.png" />
          <SubmitButton loading={saving} label="حفظ القناة في Firestore" />
        </form>
      </div>
      <div className="glass-card p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2"><Tv className="w-5 h-5" /> القنوات الحالية ({channels.length})</h2>
        {loadingList ? <div className="py-10 flex justify-center text-gold-500"><Loader2 className="w-8 h-8 animate-spin" /></div> : channels.length === 0 ? <p className="text-gray-400 text-center py-10">لا توجد قنوات مضافة بعد.</p> : <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">{channels.map((c) => <li key={c.id} className="flex items-center gap-3 bg-dark-900/50 border border-gold-500/10 rounded-xl p-3"><img src={c.logoUrl} alt={c.titleAr} className="w-12 h-12 object-contain rounded-lg bg-dark-800 p-1 shrink-0" loading="lazy" /><div className="flex-1 min-w-0"><p className="font-bold text-white truncate">{c.titleAr}</p><p className="text-xs text-gray-500 truncate dir-ltr text-right">{c.streamSources?.length || 0} سيرفر</p></div><button onClick={() => void handleDelete(c.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0" aria-label="حذف القناة"><Trash2 className="w-5 h-5" /></button></li>)}</ul>}
      </div>
    </div>
  );
};

export default ChannelManager;
