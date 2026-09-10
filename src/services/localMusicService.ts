import { Track } from '../types/monochrome';

export interface LocalAudioFileRecord {
  id: string;
  title: string;
  artist: string;
  duration: number;
  fileName: string;
  size: number;
  type: string;
  addedAt: number;
}

// In-memory cache for loaded object URLs so files can be played
const activeObjectUrls: Map<string, string> = new Map();

class LocalMusicService {
  private storageKey = 'silly_player_local_tracks';

  public getSavedTrackRecords(): LocalAudioFileRecord[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveTrackRecords(records: LocalAudioFileRecord[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save local track records:', e);
    }
  }

  public registerObjectUrl(id: string, url: string) {
    activeObjectUrls.set(id, url);
  }

  public getObjectUrl(id: string): string | undefined {
    return activeObjectUrls.get(id);
  }

  public async importFiles(fileList: FileList | File[]): Promise<Track[]> {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith('audio/') ||
      /\.(mp3|flac|wav|m4a|aac|ogg|opus)$/i.test(f.name)
    );

    const importedTracks: Track[] = [];
    const savedRecords = this.getSavedTrackRecords();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      const objectUrl = URL.createObjectURL(file);
      this.registerObjectUrl(id, objectUrl);

      // Clean file name
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      let artist = 'Local Artist';
      let title = cleanName;

      if (cleanName.includes(' - ')) {
        const parts = cleanName.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      // Read audio duration
      const duration = await this.probeDuration(objectUrl);

      const track: Track = {
        id,
        title,
        duration: duration || 180,
        artist: { id: `artist-${artist}`, name: artist, picture: null },
        artists: [{ id: `artist-${artist}`, name: artist }],
        album: {
          id: `alb-local-${artist}`,
          title: 'Device Audio',
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
          audioQuality: file.name.toLowerCase().endsWith('.flac') || file.name.toLowerCase().endsWith('.wav') ? 'LOSSLESS' : 'HIGH',
        },
        audioQuality: file.name.toLowerCase().endsWith('.flac') || file.name.toLowerCase().endsWith('.wav') ? 'LOSSLESS' : 'HIGH',
        streamUrl: objectUrl,
        isLocal: true,
      };

      importedTracks.push(track);

      savedRecords.push({
        id,
        title,
        artist,
        duration: track.duration,
        fileName: file.name,
        size: file.size,
        type: file.type,
        addedAt: Date.now(),
      });
    }

    this.saveTrackRecords(savedRecords);
    return importedTracks;
  }

  private probeDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const tempAudio = new Audio();
      tempAudio.preload = 'metadata';
      tempAudio.src = url;
      const cleanup = () => {
        tempAudio.removeAttribute('src');
        tempAudio.load();
      };
      tempAudio.onloadedmetadata = () => {
        const dur = Math.round(tempAudio.duration);
        cleanup();
        resolve(dur);
      };
      tempAudio.onerror = () => {
        cleanup();
        resolve(180);
      };
      // 3s fallback timeout
      setTimeout(() => resolve(180), 3000);
    });
  }
}

export const localMusicService = new LocalMusicService();
