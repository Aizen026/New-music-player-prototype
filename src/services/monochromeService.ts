import { SearchResults, Track, AlbumDetail, ArtistDetail, InstanceInfo } from '../types/monochrome';
import { CURATED_TRACKS, CURATED_ALBUMS, CURATED_ARTISTS } from '../data/defaultTracks';
import { localMusicService } from './localMusicService';

class MusicService {
  private customBaseUrl: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.customBaseUrl = localStorage.getItem('silly_player_custom_instance') || '';
    }
  }

  isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    const isLocalScheme = window.location.protocol === 'capacitor:' || window.location.protocol === 'file:';
    const isCapacitorHost = window.location.hostname === 'localhost' && window.location.port === '';
    return isCapacitor || isLocalScheme || isCapacitorHost;
  }

  private apiUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (this.customBaseUrl) {
      return `${this.customBaseUrl.replace(/\/+$/, '')}${cleanPath}`;
    }
    return cleanPath;
  }

  setCustomInstance(url: string) {
    this.customBaseUrl = url.trim();
    if (typeof window !== 'undefined') {
      if (this.customBaseUrl) {
        localStorage.setItem('silly_player_custom_instance', this.customBaseUrl);
      } else {
        localStorage.removeItem('silly_player_custom_instance');
      }
    }
  }

  getCustomInstance(): string {
    return this.customBaseUrl;
  }

  getStreamUrl(trackOrId: Track | number | string, quality: string = 'HIGH'): string {
    if (typeof trackOrId === 'object' && trackOrId !== null) {
      if (trackOrId.streamUrl) return trackOrId.streamUrl;
      const localObjUrl = localMusicService.getObjectUrl(String(trackOrId.id));
      if (localObjUrl) return localObjUrl;
      const found = CURATED_TRACKS.find((t) => t.id === trackOrId.id);
      if (found?.streamUrl) return found.streamUrl;
      return this.apiUrl(`/api/stream?trackId=${trackOrId.id}&quality=${encodeURIComponent(quality)}`);
    }

    const strId = String(trackOrId);
    const localObjUrl = localMusicService.getObjectUrl(strId);
    if (localObjUrl) return localObjUrl;

    const curated = CURATED_TRACKS.find((t) => String(t.id) === strId);
    if (curated?.streamUrl) return curated.streamUrl;

    return this.apiUrl(`/api/stream?trackId=${encodeURIComponent(strId)}&quality=${encodeURIComponent(quality)}`);
  }

  async search(query: string, limit: number = 20): Promise<SearchResults> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { tracks: [], albums: [], artists: [] };
    }

    // Try backend search if available
    try {
      const res = await fetch(this.apiUrl(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`), {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.tracks?.length || data.albums?.length || data.artists?.length)) {
          return data;
        }
      }
    } catch {
      // Backend not available or in standalone APK mode - fall back to curated catalog
    }

    // Curated fallback search
    const matchedTracks = CURATED_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.name.toLowerCase().includes(q) ||
        t.album.title.toLowerCase().includes(q)
    );

    const matchedAlbums = CURATED_ALBUMS.filter(
      (a) => a.title.toLowerCase().includes(q)
    );

    const matchedArtists = CURATED_ARTISTS.filter(
      (ar) => ar.name.toLowerCase().includes(q)
    );

    return {
      tracks: matchedTracks,
      albums: matchedAlbums,
      artists: matchedArtists,
    };
  }

  async getFeatured(): Promise<{ featuredHeadline: string; tracks: Track[]; albums: any[] }> {
    // Try backend featured first
    try {
      const res = await fetch(this.apiUrl('/api/featured'), {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
          return data;
        }
      }
    } catch {
      // Network failure or standalone APK - seamlessly serve curated catalog
    }

    return {
      featuredHeadline: 'Silly Player Spotlight',
      tracks: CURATED_TRACKS,
      albums: CURATED_ALBUMS,
    };
  }

  async getAlbum(id: number | string): Promise<{ album: AlbumDetail; tracks: Track[] }> {
    const strId = String(id);

    try {
      const res = await fetch(this.apiUrl(`/api/album/${encodeURIComponent(strId)}`), {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to curated album
    }

    const curAlb = CURATED_ALBUMS.find((a) => String(a.id) === strId) || CURATED_ALBUMS[0];
    const tracks = CURATED_TRACKS.filter((t) => String(t.album.id) === String(curAlb.id));

    return {
      album: {
        id: curAlb.id || 'alb-1',
        title: curAlb.title,
        artist: tracks[0]?.artist?.name || 'Various Artists',
        cover: curAlb.cover,
        coverLarge: curAlb.coverLarge || curAlb.cover,
        releaseDate: curAlb.releaseDate || '2024',
        audioQuality: curAlb.audioQuality || 'LOSSLESS',
        numberOfTracks: tracks.length || 4,
        tracks,
      },
      tracks: tracks.length > 0 ? tracks : [CURATED_TRACKS[0]],
    };
  }

  async getArtist(id: number | string): Promise<{ artist: ArtistDetail; tracks: Track[]; albums: any[] }> {
    const strId = String(id);

    try {
      const res = await fetch(this.apiUrl(`/api/artist/${encodeURIComponent(strId)}`), {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const curArt = CURATED_ARTISTS.find((a) => String(a.id) === strId) || CURATED_ARTISTS[0];
    const tracks = CURATED_TRACKS.filter((t) => String(t.artist.id) === String(curArt.id));
    const albums = CURATED_ALBUMS.filter((a) => tracks.some((t) => String(t.album.id) === String(a.id)));

    return {
      artist: {
        id: curArt.id,
        name: curArt.name,
        picture: curArt.picture,
        pictureLarge: curArt.pictureLarge,
        popularity: curArt.popularity || 90,
        tracks,
        albums,
      },
      tracks: tracks.length > 0 ? tracks : [CURATED_TRACKS[0]],
      albums: albums.length > 0 ? albums : [CURATED_ALBUMS[0]],
    };
  }

  async getTrack(id: number | string): Promise<Track> {
    const strId = String(id);
    try {
      const res = await fetch(this.apiUrl(`/api/track/${encodeURIComponent(strId)}`), {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const curTrack = CURATED_TRACKS.find((t) => String(t.id) === strId);
    if (curTrack) return curTrack;
    return CURATED_TRACKS[0];
  }

  async getLyrics(id: number | string): Promise<{ found: boolean; lyrics: string | null }> {
    try {
      const res = await fetch(this.apiUrl(`/api/lyrics/${encodeURIComponent(String(id))}`));
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { found: false, lyrics: null };
  }

  async checkLatency(): Promise<number> {
    const start = performance.now();
    try {
      const res = await fetch(this.apiUrl('/api/ping'), {
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        return Math.round(performance.now() - start);
      }
      return Math.round(performance.now() - start);
    } catch {
      return -1;
    }
  }

  async getInstances(): Promise<InstanceInfo[]> {
    try {
      const res = await fetch(this.apiUrl('/api/instances'), {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.instances && Array.isArray(data.instances)) {
          return data.instances;
        }
      }
    } catch {}

    return [
      {
        name: 'Silly Player HiFi (Direct Engine)',
        url: 'https://api.tidal.com',
        status: 'online',
        type: 'official-client',
        notes: 'High-res 320kbps AAC streaming with official HiFi audio engine',
        official: true,
      },
      {
        name: 'Monochrome Official Web',
        url: 'https://monochrome.tf',
        status: 'online',
        type: 'web-mirror',
        notes: 'Primary official Monochrome web portal',
        official: true,
      },
      {
        name: 'Monochrome Samidy API',
        url: 'https://monochrome-api.samidy.com',
        status: 'online',
        type: 'rest-api',
        notes: 'Official metadata proxy (v2.3 HiFi-RestAPI)',
        official: true,
      },
      {
        name: 'Lossless.wtf Mirror',
        url: 'https://lossless.wtf',
        status: 'online',
        type: 'web-mirror',
        notes: 'Official Monochrome web failover mirror',
        official: true,
      },
      {
        name: 'If-It-Runs-Ship-It Mirror',
        url: 'https://if-it-runs-ship-it.lol',
        status: 'online',
        type: 'web-mirror',
        notes: 'Official Monochrome web failover mirror',
        official: true,
      },
    ];
  }
}

export const monochromeApi = new MusicService();
export const sillyMusicApi = monochromeApi;
