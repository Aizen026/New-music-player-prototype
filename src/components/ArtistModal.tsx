import React, { useEffect, useState } from 'react';
import { X, User, Flame, Disc, Play } from 'lucide-react';
import { Track, ArtistDetail, AlbumBasic } from '../types/monochrome';
import { monochromeApi } from '../services/monochromeService';
import { TrackList } from './TrackList';

interface ArtistModalProps {
  artistId: number | string | null;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, index: number) => void;
  onTogglePlay: () => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: number) => boolean;
  onSelectAlbum: (albumId: number | string) => void;
}

export const ArtistModal: React.FC<ArtistModalProps> = ({
  artistId,
  onClose,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
  onSelectAlbum,
}) => {
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<AlbumBasic[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);

    monochromeApi
      .getArtist(artistId)
      .then((data) => {
        if (!isCancelled) {
          setArtist(data.artist);
          setTracks(data.tracks);
          setAlbums(data.albums || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Failed to load artist');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [artistId]);

  if (!artistId) return null;

  return (
    <div
      id="artist-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="artist-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#111216] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <button
          id="artist-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/80 text-zinc-300 hover:text-white border border-zinc-700/60 cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm gap-3">
            <User className="w-8 h-8 animate-bounce text-zinc-200" />
            <span>Loading artist details from Monochrome sources...</span>
          </div>
        ) : error || !artist ? (
          <div className="py-20 text-center text-rose-400 font-mono text-sm">
            {error || 'Artist could not be found'}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-zinc-800 pb-6">
              <div className="w-36 h-36 rounded-full overflow-hidden bg-zinc-900 border-2 border-zinc-700/80 flex-shrink-0 shadow-lg">
                {artist.pictureLarge || artist.picture ? (
                  <img
                    src={artist.pictureLarge || artist.picture}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  Verified Artist
                </span>
                <h2 className="text-3xl font-bold text-zinc-100">{artist.name}</h2>
                {artist.popularity !== undefined && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-mono text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>Popularity Index: {artist.popularity}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Tracks */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400">Popular Tracks</h3>
              <TrackList
                tracks={tracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayTrack={onPlayTrack}
                onTogglePlay={onTogglePlay}
                onAddToQueue={onAddToQueue}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
              />
            </div>

            {/* Albums / Discography */}
            {albums.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400">Discography</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      id={`discography-album-${album.id}`}
                      onClick={() => onSelectAlbum(album.id!)}
                      className="group p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2.5">
                        {album.cover ? (
                          <img
                            src={album.cover}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Disc className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-6 h-6 fill-white text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-zinc-200 truncate">{album.title}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        {album.releaseDate?.split('-')[0] || 'Album'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
