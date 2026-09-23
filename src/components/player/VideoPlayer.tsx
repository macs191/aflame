import React, { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { StreamSource } from '@/types';
import { StreamManager } from '@/services/stream/StreamProvider';
import { AlertCircle, Loader2, Server } from 'lucide-react';

interface VideoPlayerProps {
  source: StreamSource;
  sources?: StreamSource[];
  posterUrl?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

const isHls = (source: StreamSource) => {
  if (source.mimeType === 'application/vnd.apple.mpegurl' || source.mimeType === 'application/x-mpegurl') return true;
  try {
    return new URL(source.url).pathname.toLowerCase().endsWith('.m3u8');
  } catch {
    return source.url.toLowerCase().includes('.m3u8');
  }
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, sources, posterUrl, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [activeSource, setActiveSource] = useState(source);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const availableSources = useMemo(() => (sources?.length ? sources : [source]), [sources, source]);

  useEffect(() => {
    setActiveSource(source);
  }, [source]);

  useEffect(() => {
    let isMounted = true;
    const video = videoRef.current;
    const setupPlayer = async () => {
      setLoading(true);
      setError(null);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (!video) return;

      try {
        const provider = StreamManager.getProvider(activeSource.providerId);
        const { canPlayNative, streamUrl, isHls: providerIsHls } = await provider.initializeStream(activeSource);
        const streamIsHls = providerIsHls || isHls(activeSource);

        if (streamIsHls && !canPlayNative && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true, capLevelToPlayerSize: true });
          hlsRef.current = hls;
          hls.attachMedia(video);
          hls.loadSource(streamUrl);
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (!data.fatal || !isMounted) return;
            setError('تعذر تشغيل هذا السيرفر. جرّب سيرفرًا آخر أو تحقق من CORS وصلاحية الرابط.');
          });
        } else if (canPlayNative || !streamIsHls) {
          video.src = streamUrl;
          if (activeSource.mimeType) video.setAttribute('type', activeSource.mimeType);
        } else {
          throw new Error('متصفحك لا يدعم صيغة هذا الفيديو.');
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'فشل الاتصال بسيرفر الفيديو.');
      }
    };

    void setupPlayer();
    return () => {
      isMounted = false;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [activeSource]);

  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration || 0);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gold-500/20 shadow-2xl">
      {availableSources.length > 1 && (
        <div className="absolute top-3 right-3 z-10 flex flex-wrap gap-2 max-w-[80%] justify-end">
          {availableSources.map((server, index) => (
            <button key={`${server.url}-${index}`} onClick={() => setActiveSource(server)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border backdrop-blur-md ${activeSource.url === server.url ? 'bg-gold-500 text-dark-900 border-gold-400' : 'bg-dark-900/80 text-white border-white/20 hover:border-gold-400'}`}>
              <Server className="w-3.5 h-3.5" /> {server.label || `سيرفر ${index + 1}`}
            </button>
          ))}
        </div>
      )}
      {loading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/80 z-10 backdrop-blur-sm"><Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-3" /><p className="text-gold-400 font-medium">جاري إعداد مشغّل الفيديو...</p></div>}
      {error && <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/90 z-20 p-6 text-center"><AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" /><h3 className="text-xl font-bold text-white mb-2">عذراً، متعذر التشغيل</h3><p className="text-gray-400 max-w-md">{error}</p></div>}
      <video ref={videoRef} controls poster={posterUrl} onTimeUpdate={handleTimeUpdate} onCanPlay={() => setLoading(false)} onError={() => setError('تعذر تشغيل صيغة الفيديو أو أن الرابط غير متاح.')} className="w-full h-full object-contain" playsInline />
    </div>
  );
};
