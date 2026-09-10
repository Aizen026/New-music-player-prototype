import React, { useRef } from 'react';
import { Play, Pause, Heart, Radio, ChevronLeft, ChevronRight } from 'lucide-react';
import { Track } from '../types/monochrome';

interface HorizontalTrackCarouselProps {
  id?: string;
  title: string;
  subtitle?: string;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, queueList: Track[]) => void;
  onTogglePlay: () => void;
  onToggleFavorite?: (track: Track) => void;
  isFavorite?: (id: string | number) => boolean;
  onStartRadio?: (track: Track) => void;
}

export const HorizontalTrackCarousel: React.FC<HorizontalTrackCarouselProps> = ({
  id,
  title,
  subtitle,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  isFavorite,
  onStartRadio,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!tracks || tracks.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id={id} className="space-y-2.5 mb-7">
      {/* Header with Title, Optional Subtitle & Navigation Controls */}
      <div className="flex items-end justify-between">
        <div>
          {subtitle && (
            <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-semibold block mb-0.5">
              {subtitle}
            </span>
          )}
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPlayTrack(tracks[0], tracks)}
            className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-medium text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 shadow-sm transition-all cursor-pointer select-none active:scale-95"
            title="Play carousel sequence"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 group-hover:bg-cyan-400" />
            <span className="text-[10px] tracking-wider uppercase font-semibold">CUE DECK</span>
            <Play className="w-2.5 h-2.5 fill-current ml-0.5 text-cyan-400" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shadow-inner active:scale-90"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shadow-inner active:scale-90"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Horizontal Scroll Grid */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto pb-2 pt-0.5 scrollbar-none snap-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {tracks.map((track) => {
          const isCurrent = currentTrack && String(currentTrack.id) === String(track.id);
          const isTrackPlaying = isCurrent && isPlaying;
          const favored = isFavorite ? isFavorite(track.id) : false;

          return (
            <div
              key={track.id}
              className="group flex flex-col w-32 sm:w-36 md:w-40 shrink-0 cursor-pointer snap-start"
              onClick={() => {
                if (isCurrent) {
                  onTogglePlay();
                } else {
                  onPlayTrack(track, tracks);
                }
              }}
            >
              {/* Card Artwork (Aspect Square with Compact Borders) */}
              <div
                className={`relative w-32 sm:w-36 md:w-40 h-32 sm:h-36 md:h-40 rounded-xl overflow-hidden bg-zinc-900 shadow-md border transition-all ${
                  isCurrent
                    ? 'border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'border-white/5 group-hover:border-white/20'
                }`}
              >
                <img
                  src={track.album?.cover || track.artist?.picture || ''}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Floating Play / Equalizer Button */}
                <div
                  className={`absolute right-2.5 bottom-2.5 w-9 h-9 rounded-full flex items-center justify-center shadow-xl transition-all transform cursor-pointer border select-none ${
                    isTrackPlaying
                      ? 'bg-cyan-400 text-zinc-950 border-cyan-300 ring-2 ring-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.6)] opacity-100 scale-100'
                      : 'bg-zinc-950/90 text-white border-white/20 hover:border-cyan-400 hover:text-cyan-300 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 backdrop-blur-md'
                  }`}
                >
                  {isTrackPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </div>

                {/* Favorite Heart Badge */}
                {favored && (
                  <div className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/50 backdrop-blur-sm text-rose-400">
                    <Heart className="w-3 h-3 fill-current" />
                  </div>
                )}

                {/* Now Playing Animated EQ badge */}
                {isTrackPlaying && (
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm flex items-center gap-0.5">
                    <span className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite] h-2" />
                    <span className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite] h-3" />
                    <span className="w-0.5 bg-cyan-400 animate-[bounce_0.9s_infinite] h-1.5" />
                  </div>
                )}
              </div>

              {/* Compact Title & Detail Subtitle */}
              <div className="mt-2 space-y-0.5 pr-1">
                <h3
                  className={`text-[13px] font-semibold truncate leading-tight transition-colors ${
                    isCurrent ? 'text-cyan-400' : 'text-zinc-100 group-hover:text-white'
                  }`}
                >
                  {track.title}
                </h3>

                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  {track.explicit && (
                    <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/60 leading-none">
                      E
                    </span>
                  )}
                  <span className="truncate">
                    {track.artist?.name || 'Artist'}
                  </span>
                  {track.album?.title && (
                    <>
                      <span className="text-zinc-600 shrink-0">•</span>
                      <span className="truncate text-zinc-500">
                        {track.album.title}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
