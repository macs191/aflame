import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Movie, StreamSource } from '@/types';
import { Plus, Trash2, Film, Loader2, Star } from 'lucide-react';
import { Field, TextAreaField, StatusMessage, SubmitButton } from './ui';

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

export const MovieManager: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [titleAr, setTitleAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState('2024');
  const [durationMinutes, setDurationMinutes] = useState('90');
  const [rating, setRating] = useState('8');

  const fetchMovies = async () => {
    setLoadingList(true);
    try {
      const snap = await getDocs(collection(db, 'movies'));
      setMovies(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Movie[]);
    } catch (err) {
      console.error('فشل في جلب الأفلام:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void fetchMovies();
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
      await addDoc(collection(db, 'movies'), {
        titleAr, descriptionAr, posterUrl, bannerUrl: bannerUrl || posterUrl,
        categoryId: 'general', releaseYear: Number(releaseYear), durationMinutes: Number(durationMinutes),
        rating: Number(rating), isFeatured: true, createdAt: new Date().toISOString(), streamSources,
      });
      setMessage('تمت إضافة الفيلم بنجاح!');
      setTitleAr(''); setDescriptionAr(''); setPosterUrl(''); setBannerUrl(''); setStreamUrl('');
      void fetchMovies();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة الفيلم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيلم؟')) return;
    try {
      await deleteDoc(doc(db, 'movies', id));
      void fetchMovies();
    } catch (err) {
      console.error('فشل حذف الفيلم:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-2xl h-fit">
        <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2"><Plus className="w-5 h-5" /> إضافة فيلم جديد</h2>
        <StatusMessage message={message} />
        <form onSubmit={handleAdd} className="space-y-5">
          <Field label="اسم الفيلم" value={titleAr} onChange={setTitleAr} required placeholder="مثال: الرسالة" />
          <TextAreaField label="وصف الفيلم" value={descriptionAr} onChange={setDescriptionAr} placeholder="قصة الفيلم..." />
          <Field label="رابط الملصق (Poster)" value={posterUrl} onChange={setPosterUrl} required type="url" ltr placeholder="https://example.com/poster.jpg" />
          <Field label="رابط الخلفية (Banner) - اختياري" value={bannerUrl} onChange={setBannerUrl} type="url" ltr placeholder="https://example.com/banner.jpg" />
          <div>
            <label className="block text-sm text-gray-300 mb-2">روابط السيرفرات (رابط في كل سطر)</label>
            <textarea value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} required dir="ltr" rows={4} placeholder="https://example.com/movie.m3u8\nhttps://backup.example.com/movie.mp4" className="w-full rounded-xl bg-dark-900 border border-gold-500/20 p-3 text-white outline-none focus:border-gold-500" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="سنة الإصدار" value={releaseYear} onChange={setReleaseYear} type="number" min={1900} max={2100} />
            <Field label="المدة (دقيقة)" value={durationMinutes} onChange={setDurationMinutes} type="number" min={1} />
            <Field label="التقييم" value={rating} onChange={setRating} type="number" min={0} max={10} step={0.1} />
          </div>
          <SubmitButton loading={saving} label="حفظ الفيلم في Firestore" />
        </form>
      </div>
      <div className="glass-card p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2"><Film className="w-5 h-5" /> الأفلام الحالية ({movies.length})</h2>
        {loadingList ? <div className="py-10 flex justify-center text-gold-500"><Loader2 className="w-8 h-8 animate-spin" /></div> : movies.length === 0 ? <p className="text-gray-400 text-center py-10">لا توجد أفلام مضافة بعد.</p> : <ul className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">{movies.map((m) => <li key={m.id} className="flex items-center gap-3 bg-dark-900/50 border border-gold-500/10 rounded-xl p-3"><img src={m.posterUrl} alt={m.titleAr} className="w-12 h-16 object-cover rounded-lg bg-dark-800 shrink-0" loading="lazy" /><div className="flex-1 min-w-0"><p className="font-bold text-white truncate">{m.titleAr}</p><p className="text-xs text-gray-400 flex items-center gap-2 mt-1"><span className="flex items-center gap-1 text-gold-500"><Star className="w-3 h-3 fill-gold-500" /> {m.rating}</span><span>{m.streamSources?.length || 0} سيرفر</span></p></div><button onClick={() => void handleDelete(m.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0" aria-label="حذف الفيلم"><Trash2 className="w-5 h-5" /></button></li>)}</ul>}
      </div>
    </div>
  );
};

export default MovieManager;
