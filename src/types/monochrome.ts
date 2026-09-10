export interface ArtistBasic {
  id?: number | string;
  name: string;
  picture?: string | null;
}

export interface AlbumBasic {
  id?: number | string;
  title: string;
  cover: string;
  coverLarge?: string;
  releaseDate?: string;
  numberOfTracks?: number;
  duration?: number;
  audioQuality?: string;
}

export interface Track {
  id: number | string;
  title: string;
  version?: string | null;
  duration: number; // in seconds
  trackNumber?: number;
  artist: ArtistBasic;
  artists?: ArtistBasic[];
  album: AlbumBasic;
  audioQuality?: string;
  isrc?: string | null;
  popularity?: number;
  streamUrl?: string;
  isLocal?: boolean;
  explicit?: boolean;
}

export interface AlbumDetail extends AlbumBasic {
  id: number | string;
  artist: string;
  artistId?: number | string;
  tracks?: Track[];
}

export interface ArtistDetail {
  id: number | string;
  name: string;
  picture: string;
  pictureLarge?: string;
  popularity?: number;
  tracks?: Track[];
  albums?: AlbumBasic[];
}

export interface SearchResults {
  tracks: Track[];
  albums: AlbumBasic[];
  artists: ArtistDetail[];
}

export type RepeatMode = 'off' | 'all' | 'one';
export type VisualizerMode = 'bars' | 'wave' | 'glow' | 'off';
export type QualityTier = 'HIGH' | 'LOSSLESS' | 'HI_RES_LOSSLESS';
export type AppTheme = 'liquid-glass' | 'monochrome-dark' | 'midnight-sapphire' | 'cyber-amber' | 'studio-light';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  tracks: Track[];
}

export type EQPresetName = 'flat' | 'bass_boost' | 'vocal' | 'treble_boost' | 'electronic' | 'acoustic' | 'rock';

export interface EQSettings {
  preset: EQPresetName;
  bass: number;    // -12 to +12 dB
  mid: number;     // -12 to +12 dB
  treble: number;  // -12 to +12 dB
  soundCheck: boolean; // Dynamic compressor for loudness normalization
}

export interface InstanceInfo {
  name: string;
  url: string;
  status: string;
  type: string;
  notes: string;
  official: boolean;
  latency?: number;
}
