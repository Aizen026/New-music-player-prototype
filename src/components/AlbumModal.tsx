import React, { useEffect, useState } from 'react';
import { X, Play, Disc, Clock, Calendar, Music } from 'lucide-react';
import { Track, AlbumDetail } from '../types/monochrome';
import { monochromeApi } from '../services/monochromeService';
import { TrackList } from './TrackList';

interface AlbumModalProps {
  albumId: number | string | null;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, index: number) => void;
  onTogglePlay: () => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: number) => boolean;
  onPlayAlbum: (tracks: Track[]) => void;
}

export const AlbumModal: React.FC<AlbumModalProps> = ({
  albumId,
  onClose,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
  onPlayAlbum,
}) => {
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);

    monochromeApi
      .getAlbum(albumId)
      .then((data) => {
        if (!isCancelled) {
          setAlbum(data.album);
          setTracks(data.tracks);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Failed to load album');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [albumId]);

  if (!albumId) return null;

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const formattedDuration = `${Math.floor(totalDuration / 60)} min`;

  return (
    <div
      id="album-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="album-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#111216] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          id="album-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/80 text-zinc-300 hover:text-white border border-zinc-700/60 cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm gap-3">
            <Disc className="w-8 h-8 animate-spin text-zinc-200" />
            <span>Loading album from Monochrome sources...</span>
          </div>
        ) : error || !album ? (
          <div className="py-20 text-center text-rose-400 font-mono text-sm">
            {error || 'Album could not be found'}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header / Hero */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-zinc-800 pb-6">
              <div className="w-44 h-44 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700/60 flex-shrink-0 shadow-lg">
                {album.coverLarge || album.cover ? (
                  <img
                    src={album.coverLarge || album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Disc className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {album.audioQuality || 'LOSSLESS'} ALBUM
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">{album.title}</h2>
                <p className="text-sm sm:text-base text-zinc-300 font-medium">{album.artist}</p>

                <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-mono text-zinc-400 pt-1">
                  {album.releaseDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {album.releaseDate.split('-')[0]}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5" />
                    {tracks.length} songs
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formattedDuration}
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-center sm:justify-start gap-3">
                  <button
                    id="album-play-all-btn"
                    onClick={() => onPlayAlbum(tracks)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer text-sm"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    Play Album
                  </button>
                </div>
              </div>
            </div>

            {/* Tracklist */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400">Tracklist</h3>
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
          </div>
        )}
      </div>
    </div>
  );
};
