import React from 'react';
import { Play, Pause, Heart, Plus, Disc, Volume2 } from 'lucide-react';
import { Track } from '../types/monochrome';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, index: number) => void;
  onTogglePlay: () => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: number) => boolean;
  onSelectAlbum?: (albumId: number | string) => void;
  onSelectArtist?: (artistId: number | string) => void;
  emptyMessage?: string;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
  onSelectAlbum,
  onSelectArtist,
  emptyMessage = 'No tracks found.',
}) => {
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800/80 rounded-2xl">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full divide-y divide-zinc-800/40">
      {tracks.map((track, idx) => {
        const isCurrent = currentTrack?.id === track.id;
        const favorited = isFavorite(track.id);

        return (
          <div
            key={`${track.id}-${idx}`}
            id={`track-row-${track.id}`}
            className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
              isCurrent ? 'bg-zinc-900/90 border border-zinc-800/90' : 'hover:bg-zinc-900/40'
            }`}
          >
            {/* Left: Index / Play Button + Artwork + Title + Artist */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Play / Status Indicator */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {isCurrent ? (
                  <button
                    id={`track-toggle-${track.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlay();
                    }}
                    className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <div className="flex items-end justify-center gap-0.5 h-3">
                        <span className="w-0.5 bg-zinc-950 animate-[bounce_0.8s_infinite_100ms] h-full" />
                        <span className="w-0.5 bg-zinc-950 animate-[bounce_0.8s_infinite_300ms] h-full" />
                        <span className="w-0.5 bg-zinc-950 animate-[bounce_0.8s_infinite_200ms] h-full" />
                      </div>
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                ) : (
                  <>
                    <span className="text-xs font-mono text-zinc-500 group-hover:hidden">
                      {track.trackNumber || idx + 1}
                    </span>
                    <button
                      id={`track-play-${track.id}`}
                      onClick={() => onPlayTrack(track, idx)}
                      className="hidden group-hover:flex w-7 h-7 rounded-full bg-zinc-200 text-zinc-950 items-center justify-center hover:bg-white hover:scale-105 transition-all cursor-pointer"
                      title="Play track"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Cover Artwork */}
              <div
                className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-700/40 cursor-pointer group-hover:brightness-105"
                onClick={() => onPlayTrack(track, idx)}
              >
                {track.album?.cover ? (
                  <img
                    src={track.album.cover}
                    alt={track.album.title || track.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Disc className="w-5 h-5" />
                  </div>
                )}
                {isCurrent && isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-zinc-100 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    onClick={() => onPlayTrack(track, idx)}
                    className={`text-sm font-semibold truncate cursor-pointer hover:underline ${
                      isCurrent ? 'text-zinc-100 font-bold' : 'text-zinc-200'
                    }`}
                  >
                    {track.title}
                  </span>
                  {track.version && (
                    <span className="text-[11px] text-zinc-400 font-normal px-1.5 py-0.5 rounded bg-zinc-800/70 border border-zinc-700/50">
                      {track.version}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-2 truncate mt-0.5">
                  <span
                    onClick={() => track.artist?.id && onSelectArtist?.(track.artist.id)}
                    className="hover:text-zinc-200 hover:underline cursor-pointer truncate"
                  >
                    {track.artist?.name}
                  </span>
                  {track.album?.title && (
                    <>
                      <span className="text-zinc-600 hidden sm:inline">•</span>
                      <span
                        onClick={() => track.album?.id && onSelectAlbum?.(track.album.id)}
                        className="hover:text-zinc-200 hover:underline cursor-pointer truncate hidden sm:inline text-zinc-500"
                      >
                        {track.album.title}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quality Badge, Duration & Actions */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800/80 hidden md:inline">
                {track.audioQuality === 'LOSSLESS' ? 'FLAC' : '320K'}
              </span>

              <span className="text-xs font-mono text-zinc-400 w-12 text-right">
                {formatDuration(track.duration)}
              </span>

              {/* Favorite Button */}
              <button
                id={`track-favorite-${track.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(track);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  favorited
                    ? 'text-rose-400 hover:text-rose-300'
                    : 'text-zinc-500 hover:text-zinc-300 opacity-70 group-hover:opacity-100'
                }`}
                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
              </button>

              {/* Add to Queue Button */}
              <button
                id={`track-queue-${track.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToQueue(track);
                }}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/60 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Add to queue"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
