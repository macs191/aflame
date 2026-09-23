import { StreamSource } from '@/types';

export interface StreamInitializationResult {
  canPlayNative: boolean;
  streamUrl: string;
  headers?: Record<string, string>;
  isHls: boolean;
}

export interface IStreamProvider {
  id: string;
  name: string;
  initializeStream(source: StreamSource): Promise<StreamInitializationResult>;
  cleanup(): void;
}

const isHlsUrl = (url: string, mimeType?: string) => {
  const path = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();

  return mimeType === 'application/vnd.apple.mpegurl' || mimeType === 'application/x-mpegurl' || path.endsWith('.m3u8');
};

/** Supports HLS and browser-native progressive media (MP4, WebM, Ogg, etc.). */
export class HlsStreamProvider implements IStreamProvider {
  id = 'hls-direct';
  name = 'HLS / Browser Native';

  async initializeStream(source: StreamSource): Promise<StreamInitializationResult> {
    if (!source.url) {
      throw new Error('رابط الفيديو مطلوب.');
    }

    const isHls = isHlsUrl(source.url, source.mimeType);
    const testVideo = document.createElement('video');
    const canPlayNative = isHls
      ? testVideo.canPlayType('application/vnd.apple.mpegurl') !== ''
      : source.mimeType
        ? testVideo.canPlayType(source.mimeType) !== ''
        : true;

    return { canPlayNative, streamUrl: source.url, headers: source.headers, isHls };
  }

  cleanup(): void {
    // Reserved for provider-specific cleanup.
  }
}

export class StreamManager {
  private static providers: Map<string, IStreamProvider> = new Map();

  static registerProvider(provider: IStreamProvider) {
    this.providers.set(provider.id, provider);
  }

  static getProvider(providerId: string): IStreamProvider {
    return this.providers.get(providerId) ?? new HlsStreamProvider();
  }
}

StreamManager.registerProvider(new HlsStreamProvider());
