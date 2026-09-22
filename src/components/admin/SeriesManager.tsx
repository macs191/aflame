import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Series as SeriesType, Episode } from '@/types';
import { Plus, Trash2, Clapperboard, Loader2, Star, ChevronRight, Film } from 'lucide-react';
import { Field, TextAreaField, StatusMessage, SubmitButton } from './ui';

export const SeriesManager: React.FC = () => {
  const [seriesList, setSeriesList] = useState<SeriesType[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [managed, setManaged] = useState<SeriesType | null>(null);

  const [titleAr, setTitleAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState('2024');
  const [totalSeasons, setTotalSeasons] = useState('1');
  const [rating, setRating] = useState('8');

  const fetchSeries = async () => {
    setLoadingList(true);
    try {
      const snap = await getDocs(collection(db, 'series'));
      setSeriesList(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SeriesType[]);
    } catch (err) {
      console.error('فشل في جلب المسلسلات:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await addDoc(collection(db, 'series'), {
        titleAr,
        descriptionAr,
        posterUrl,
        bannerUrl: bannerUrl || posterUrl,
        categoryId: 'general',
        releaseYear: Number(releaseYear),
        totalSeasons: Number(totalSeasons),
        rating: Number(rating),
        isFeatured: true,
        createdAt: new Date().toISOString(),
      });
      setMessage('تمت إضافة المسلسل بنجاح!');
      setTitleAr('');
      setDescriptionAr('');
      setPosterUrl('');
      setBannerUrl('');
      fetchSeries();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة المسلسل');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسلسل؟ سيتم حذف جميع حلقاته أيضاً.')) return;
    try {
      const epSnap = await getDocs(collection(db, `series/${id}/episodes`));
      await Promise.all(epSnap.docs.map((d) => deleteDoc(doc(db, `series/${id}/episodes`, d.id))));
      await deleteDoc(doc(db, 'series', id));
      fetchSeries();
    } catch (err) {
      console.error('فشل حذف المسلسل:', err);
    }
  };

  if (managed) {
    return <EpisodeManager series={managed} onBack={() => setManaged(null)} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-2xl h-fit">
        <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2">
          <Plus className="w-5 h-5" /> إضافة مسلسل جديد
        </h2>
        <StatusMessage message={message} />
        <form onSubmit={handleAdd} className="space-y-5">
          <Field label="اسم المسلسل" value={titleAr} onChange={setTitleAr} required placeholder="مثال: باب الحارة" />
          <TextAreaField label="وصف المسلسل" value={descriptionAr} onChange={setDescriptionAr} placeholder="قصة المسلسل..." />
          <Field label="رابط الملصق (Poster)" value={posterUrl} onChange={setPosterUrl} required type="url" ltr placeholder="https://example.com/poster.jpg" />
          <Field label="رابط الخلفية (Banner) - اختياري" value={bannerUrl} onChange={setBannerUrl} type="url" ltr placeholder="https://example.com/banner.jpg" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="سنة الإصدار" value={releaseYear} onChange={setReleaseYear} type="number" min={1900} max={2100} />
            <Field label="عدد المواسم" value={totalSeasons} onChange={setTotalSeasons} type="number" min={1} />
            <Field label="التقييم" value={rating} onChange={setRating} type="number" min={0} max={10} step={0.1} />
          </div>
          <SubmitButton loading={saving} label="حفظ المسلسل في Firestore" />
        </form>
      </div>

      <div className="glass-card p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2">
          <Clapperboard className="w-5 h-5" /> المسلسلات الحالية ({seriesList.length})
        </h2>
        {loadingList ? (
          <div className="py-10 flex justify-center text-gold-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : seriesList.length === 0 ? (
          <p className="text-gray-400 text-center py-10">لا توجد مسلسلات مضافة بعد.</p>
        ) : (
          <ul className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {seriesList.map((s) => (
              <li key={s.id} className="flex items-center gap-3 bg-dark-900/50 border border-gold-500/10 rounded-xl p-3">
                <img src={s.posterUrl} alt={s.titleAr} className="w-12 h-16 object-cover rounded-lg bg-dark-800 shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{s.titleAr}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-gold-500"><Star className="w-3 h-3 fill-gold-500" /> {s.rating}</span>
                    <span>{s.releaseYear}</span>
                    <span>{s.totalSeasons} مواسم</span>
                  </p>
                </div>
                <button onClick={() => setManaged(s)} className="flex items-center gap-1 text-xs font-bold text-gold-400 hover:bg-gold-500/10 px-2 py-1.5 rounded-lg transition-colors shrink-0">
                  الحلقات <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0" aria-label="حذف المسلسل">
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

interface EpisodeManagerProps {
  series: SeriesType;
  onBack: () => void;
}

const EpisodeManager: React.FC<EpisodeManagerProps> = ({ series, onBack }) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [titleAr, setTitleAr] = useState('');
  const [seasonNumber, setSeasonNumber] = useState('1');
  const [episodeNumber, setEpisodeNumber] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');

  const path = `series/${series.id}/episodes`;

  const fetchEpisodes = async () => {
    setLoadingList(true);
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Episode[];
      list.sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
      setEpisodes(list);
    } catch (err) {
      console.error('فشل في جلب الحلقات:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchEpisodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await addDoc(collection(db, path), {
        seriesId: series.id,
        seasonNumber: Number(seasonNumber),
        episodeNumber: Number(episodeNumber),
        titleAr,
        descriptionAr: '',
        thumbnailUrl: thumbnailUrl || series.posterUrl,
        durationMinutes: Number(durationMinutes),
        createdAt: new Date().toISOString(),
        streamSources: [{ providerId: 'hls-direct', url: streamUrl, quality: 'auto' }],
      });
      setMessage('تمت إضافة الحلقة بنجاح!');
      setTitleAr('');
      setStreamUrl('');
      setThumbnailUrl('');
      setEpisodeNumber(String(Number(episodeNumber) + 1));
      fetchEpisodes();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة الحلقة');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحلقة؟')) return;
    try {
      await deleteDoc(doc(db, path, id));
      fetchEpisodes();
    } catch (err) {
      console.error('فشل حذف الحلقة:', err);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gold-400 hover:text-gold-300 transition-colors">
        <ChevronRight className="w-5 h-5" /> العودة لقائمة المسلسلات
      </button>

      <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
        <img src={series.posterUrl} alt={series.titleAr} className="w-14 h-20 object-cover rounded-lg bg-dark-800" loading="lazy" />
        <div>
          <p className="text-xs text-gray-400">إدارة حلقات</p>
          <h2 className="text-2xl font-bold text-white">{series.titleAr}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-2xl h-fit">
          <h3 className="text-lg font-bold mb-6 text-gold-400 flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة حلقة جديدة
          </h3>
          <StatusMessage message={message} />
          <form onSubmit={handleAdd} className="space-y-5">
            <Field label="عنوان الحلقة" value={titleAr} onChange={setTitleAr} required placeholder="مثال: البداية" />
            <div className="grid grid-cols-3 gap-4">
              <Field label="الموسم" value={seasonNumber} onChange={setSeasonNumber} type="number" min={1} />
              <Field label="رقم الحلقة" value={episodeNumber} onChange={setEpisodeNumber} type="number" min={1} />
              <Field label="المدة (دقيقة)" value={durationMinutes} onChange={setDurationMinutes} type="number" min={1} />
            </div>
            <Field label="رابط الصورة المصغرة - اختياري" value={thumbnailUrl} onChange={setThumbnailUrl} type="url" ltr placeholder="https://example.com/thumb.jpg" />
            <Field label="رابط البث (HLS .m3u8)" value={streamUrl} onChange={setStreamUrl} required type="url" ltr placeholder="https://example.com/episode.m3u8" />
            <SubmitButton loading={saving} label="حفظ الحلقة في Firestore" />
          </form>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <h3 className="text-lg font-bold mb-6 text-gold-400 flex items-center gap-2">
            <Film className="w-5 h-5" /> الحلقات الحالية ({episodes.length})
          </h3>
          {loadingList ? (
            <div className="py-10 flex justify-center text-gold-500">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : episodes.length === 0 ? (
            <p className="text-gray-400 text-center py-10">لا توجد حلقات مضافة بعد.</p>
          ) : (
            <ul className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              {episodes.map((ep) => (
                <li key={ep.id} className="flex items-center gap-3 bg-dark-900/50 border border-gold-500/10 rounded-xl p-3">
                  <span className="shrink-0 w-14 text-center text-xs font-bold text-gold-500 bg-gold-500/10 rounded-lg py-2">
                    م{ep.seasonNumber} · ح{ep.episodeNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{ep.titleAr}</p>
                    <p className="text-xs text-gray-500">{ep.durationMinutes} دقيقة</p>
                  </div>
                  <button onClick={() => handleDelete(ep.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0" aria-label="حذف الحلقة">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeriesManager;
