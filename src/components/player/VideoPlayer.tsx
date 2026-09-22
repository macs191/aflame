import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { StreamSource } from '@/types';
import { StreamManager } from '@/services/stream/StreamProvider';
import { AlertCircle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  source: StreamSource;
  posterUrl?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, posterUrl, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hlsInstance: Hls | null = null;
    let isMounted = true;

    const setupPlayer = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = StreamManager.getProvider(source.providerId);
        const { canPlayNative, streamUrl } = await provider.initializeStream(source);

        if (!videoRef.current) return;

        if (canPlayNative) {
          // Native Safari/iOS HLS support
          videoRef.current.src = streamUrl;
        } else if (Hls.isSupported()) {
          // Hls.js fallback for Chrome/Firefox/Edge
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(videoRef.current);

          hlsInstance.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setError('حدث خطأ أثناء تحميل البث المباشر. يرجى المحاولة لاحقاً.');
            }
          });
        } else {
          setError('متصفحك لا يدعم تشغيل هذا النوع من البث المباشر.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'فشل الاتصال بمزود البث.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setupPlayer();

    return () => {
      isMounted = false;
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [source]);

  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration || 0);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gold-500/20 shadow-2xl">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/80 z-10 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-3" />
          <p className="text-gold-400 font-medium">جاري إعداد مشغّل الفيديو...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/90 z-20 p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white mb-2">عذراً، متعذر التشغيل</h3>
          <p className="text-gray-400 max-w-md">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        poster={posterUrl}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-contain"
        playsInline
      />
    </div>
  );
};
