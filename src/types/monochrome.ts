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
  id: number;
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
}

export interface AlbumDetail extends AlbumBasic {
  id: number;
  artist: string;
  artistId?: number;
  tracks?: Track[];
}

export interface ArtistDetail {
  id: number;
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

export interface InstanceInfo {
  name: string;
  url: string;
  status: string;
  type: string;
  notes: string;
  official: boolean;
  latency?: number;
}
