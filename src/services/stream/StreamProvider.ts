import { StreamSource } from '@/types';

export interface StreamInitializationResult {
  canPlayNative: boolean;
  streamUrl: string;
  headers?: Record<string, string>;
}

export interface IStreamProvider {
  id: string;
  name: string;
  initializeStream(source: StreamSource): Promise<StreamInitializationResult>;
  cleanup(): void;
}

/**
 * Default HLS Provider Strategy
 * Handles .m3u8 parsing verification and runtime setup.
 */
export class HlsStreamProvider implements IStreamProvider {
  id = 'hls-direct';
  name = 'Standard HLS Direct Provider';

  async initializeStream(source: StreamSource): Promise<StreamInitializationResult> {
    if (!source.url || !source.url.includes('.m3u8')) {
      throw new Error('رابط البث غير صالحة صيغته. يجب أن يكون رابط HLS (.m3u8)');
    }

    const testVideo = document.createElement('video');
    const canPlayNative = testVideo.canPlayType('application/vnd.apple.mpegurl') !== '';

    return {
      canPlayNative,
      streamUrl: source.url,
    };
  }

  cleanup(): void {
    // Provider specific cleanup (e.g. revoking blob tokens or disconnecting sessions)
  }
}

/**
 * Stream Factory / Manager to prevent binding components directly to a single engine
 */
export class StreamManager {
  private static providers: Map<string, IStreamProvider> = new Map();

  static registerProvider(provider: IStreamProvider) {
    this.providers.set(provider.id, provider);
  }

  static getProvider(providerId: string): IStreamProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      // Fallback to default HlsStreamProvider if missing
      return new HlsStreamProvider();
    }
    return provider;
  }
}

// Register default providers
StreamManager.registerProvider(new HlsStreamProvider());
