import { SearchResults, Track, AlbumDetail, ArtistDetail, InstanceInfo } from '../types/monochrome';

class MonochromeService {
  private customBaseUrl: string = '';
  private backendGatewayUrl: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.customBaseUrl = localStorage.getItem('monochrome_custom_instance') || '';
      this.backendGatewayUrl = localStorage.getItem('monochrome_backend_gateway') || '';
    }
  }

  isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    const isLocalScheme = window.location.protocol === 'capacitor:' || window.location.protocol === 'file:';
    const isCapacitorHost = window.location.hostname === 'localhost' && window.location.port === '';
    return isCapacitor || isLocalScheme || isCapacitorHost;
  }

  getBackendGateway(): string {
    if (this.backendGatewayUrl) return this.backendGatewayUrl;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('monochrome_backend_gateway');
      if (stored) return stored;
    }
    // If running in native APK environment, fallback to current hosted gateway or env
    if (this.isNativeApp()) {
      const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
      return (metaEnv?.VITE_API_GATEWAY_URL as string) || 'https://ais-pre-cw5naj6yiwuxe2lq4ct7vq-936714427174.asia-southeast1.run.app';
    }
    return '';
  }

  setBackendGateway(url: string) {
    this.backendGatewayUrl = url.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      if (this.backendGatewayUrl) {
        localStorage.setItem('monochrome_backend_gateway', this.backendGatewayUrl);
      } else {
        localStorage.removeItem('monochrome_backend_gateway');
      }
    }
  }

  private apiUrl(path: string): string {
    const gateway = this.getBackendGateway();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return gateway ? `${gateway}${cleanPath}` : cleanPath;
  }

  setCustomInstance(url: string) {
    this.customBaseUrl = url.trim();
    if (typeof window !== 'undefined') {
      if (this.customBaseUrl) {
        localStorage.setItem('monochrome_custom_instance', this.customBaseUrl);
      } else {
        localStorage.removeItem('monochrome_custom_instance');
      }
    }
  }

  getCustomInstance(): string {
    return this.customBaseUrl;
  }

  getStreamUrl(trackId: number, quality: string = 'HIGH'): string {
    return this.apiUrl(`/api/stream?trackId=${trackId}&quality=${encodeURIComponent(quality)}`);
  }

  async search(query: string, limit: number = 20): Promise<SearchResults> {
    if (!query.trim()) {
      return { tracks: [], albums: [], artists: [] };
    }
    const res = await fetch(this.apiUrl(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`));
    if (!res.ok) {
      throw new Error(`Search failed: ${res.statusText}`);
    }
    return res.json();
  }

  async getFeatured(): Promise<{ featuredHeadline: string; tracks: Track[]; albums: any[] }> {
    const res = await fetch(this.apiUrl('/api/featured'));
    if (!res.ok) {
      throw new Error(`Featured fetch failed: ${res.statusText}`);
    }
    return res.json();
  }

  async getAlbum(id: number | string): Promise<{ album: AlbumDetail; tracks: Track[] }> {
    const res = await fetch(this.apiUrl(`/api/album/${id}`));
    if (!res.ok) {
      throw new Error(`Failed to load album: ${res.statusText}`);
    }
    return res.json();
  }

  async getArtist(id: number | string): Promise<{ artist: ArtistDetail; tracks: Track[]; albums: any[] }> {
    const res = await fetch(this.apiUrl(`/api/artist/${id}`));
    if (!res.ok) {
      throw new Error(`Failed to load artist: ${res.statusText}`);
    }
    return res.json();
  }

  async getTrack(id: number | string): Promise<Track> {
    const res = await fetch(this.apiUrl(`/api/track/${id}`));
    if (!res.ok) {
      throw new Error(`Failed to load track: ${res.statusText}`);
    }
    return res.json();
  }

  async getLyrics(id: number | string): Promise<{ found: boolean; lyrics: string | null }> {
    const res = await fetch(this.apiUrl(`/api/lyrics/${id}`));
    if (!res.ok) {
      return { found: false, lyrics: null };
    }
    return res.json();
  }

  async getInstances(): Promise<InstanceInfo[]> {
    try {
      const res = await fetch(this.apiUrl('/api/instances'));
      if (res.ok) {
        const data = await res.json();
        return data.instances || [];
      }
    } catch (e) {
      console.warn('Failed to load instances from API:', e);
    }
    return [
      {
        name: 'Monochrome HiFi (Direct Engine)',
        url: 'https://api.tidal.com',
        status: 'online',
        type: 'official-client',
        notes: 'High-res 320kbps AAC streaming with official Monochrome API credentials',
        official: true,
      }
    ];
  }
}

export const monochromeApi = new MonochromeService();
