import React, { useRef } from 'react';
import { Play, Pause, Heart, Radio, ListPlus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Track } from '../types/monochrome';

interface QuickPicksSectionProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, queueList: Track[]) => void;
  onTogglePlay: () => void;
  onAddToQueue?: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
  isFavorite?: (id: string | number) => boolean;
  onStartRadio?: (track: Track) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const QuickPicksSection: React.FC<QuickPicksSectionProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
  onStartRadio,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!tracks || tracks.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="quick-picks-section" className="space-y-2 mb-7">
      {/* Header Eyebrow & Controls */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-mono text-zinc-400 font-semibold flex items-center gap-1.5 mb-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            START RADIO FROM A SONG
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Quick picks
          </h2>
        </div>

        {/* Action Controls & Scroll Arrows */}
        <div className="flex items-center gap-2">
          <button
            id="quick-picks-cue-btn"
            onClick={() => onPlayTrack(tracks[0], tracks)}
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-semibold text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.12)] transition-all cursor-pointer select-none active:scale-95"
            title="Cue and play all quick picks"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:shadow-[0_0_6px_rgba(6,182,212,0.9)] transition-all" />
            <span className="tracking-wider uppercase text-[10px]">CUE ALL</span>
            <Play className="w-3 h-3 fill-cyan-400 text-cyan-400 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shadow-inner active:scale-90"
              title="Previous bank"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shadow-inner active:scale-90"
              title="Next bank"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4-Row High-Density Horizontal Scrolling Grid */}
      <div
        ref={scrollContainerRef}
        id="quick-picks-grid"
        className="grid grid-rows-4 grid-flow-col auto-cols-[86%] sm:auto-cols-[380px] md:auto-cols-[350px] lg:auto-cols-[330px] gap-x-3 gap-y-1 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {tracks.map((track) => {
          const isCurrent = currentTrack && String(currentTrack.id) === String(track.id);
          const isTrackPlaying = isCurrent && isPlaying;
          const favored = isFavorite ? isFavorite(track.id) : false;

          return (
            <div
              key={track.id}
              className={`group flex items-center justify-between p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer snap-start ${
                isCurrent
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-400/40 shadow-sm'
                  : 'hover:bg-zinc-800/60 active:bg-zinc-800'
              }`}
              onClick={() => {
                if (isCurrent) {
                  onTogglePlay();
                } else {
                  onPlayTrack(track, tracks);
                }
              }}
            >
              {/* Left Column: Artwork & Detailed Text */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                {/* Thumbnail (44px) */}
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-800 shadow-sm border border-white/5">
                  <img
                    src={track.album?.cover || track.artist?.picture || ''}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Play / Equalizer Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isTrackPlaying ? (
                      <div className="flex items-end gap-0.5 h-3.5">
                        <span className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite] h-2" />
                        <span className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite] h-3.5" />
                        <span className="w-0.5 bg-cyan-400 animate-[bounce_0.9s_infinite] h-2.5" />
                      </div>
                    ) : (
                      <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Detailed Title and Metadata */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3
                      className={`text-[13px] sm:text-sm font-semibold truncate leading-tight ${
                        isCurrent ? 'text-cyan-400' : 'text-zinc-100 group-hover:text-white'
                      }`}
                    >
                      {track.title}
                    </h3>
                    {track.version && (
                      <span className="hidden sm:inline-block text-[10px] text-zinc-500 font-mono truncate">
                        ({track.version})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400">
                    {track.explicit && (
                      <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/60 leading-tight">
                        E
                      </span>
                    )}
                    <span className="truncate hover:text-zinc-200">
                      {track.artist?.name || 'Unknown Artist'}
                    </span>
                    {track.album?.title && (
                      <>
                        <span className="text-zinc-600 shrink-0">•</span>
                        <span className="truncate text-zinc-500 hidden sm:inline">
                          {track.album.title}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Duration & Quick Actions */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Duration */}
                <span className="text-[11px] font-mono text-zinc-500 pr-1 hidden group-hover:hidden sm:inline-block">
                  {formatDuration(track.duration)}
                </span>

                {/* Quick actions (visible on hover or touch) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onToggleFavorite && (
                    <button
                      onClick={() => onToggleFavorite(track)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90 ${
                        favored
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                          : 'bg-zinc-900/90 border-zinc-800/80 text-zinc-400 hover:text-rose-300 hover:border-zinc-700'
                      }`}
                      title={favored ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favored ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  {onStartRadio && (
                    <button
                      onClick={() => onStartRadio(track)}
                      className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer active:scale-90"
                      title="Start radio station from track"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onAddToQueue && (
                    <button
                      onClick={() => onAddToQueue(track)}
                      className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer active:scale-90"
                      title="Add to queue"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>
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
