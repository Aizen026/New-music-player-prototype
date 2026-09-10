import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  ListMusic,
  Heart,
  Activity,
  Disc,
  Loader2,
  Plus,
  SlidersHorizontal,
  Moon,
  Gauge
} from 'lucide-react';
import { Track, RepeatMode, VisualizerMode, AppTheme } from '../types/monochrome';
import { AudioVisualizer } from './AudioVisualizer';

interface NowPlayingBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  visualizerMode: VisualizerMode;
  theme: AppTheme;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onCyclePlaybackRate: () => void;
  onToggleVisualizer: () => void;
  onOpenFullscreen: () => void;
  onToggleQueue: () => void;
  onOpenAddToPlaylist: () => void;
  onOpenEQ: () => void;
  onOpenSleepTimer: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  queueLength: number;
}

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  repeatMode,
  isShuffle,
  visualizerMode,
  theme,
  onTogglePlay,
  onSeek,
  onPrevious,
  onNext,
  onToggleRepeat,
  onToggleShuffle,
  onVolumeChange,
  onToggleMute,
  onCyclePlaybackRate,
  onToggleVisualizer,
  onOpenFullscreen,
  onToggleQueue,
  onOpenAddToPlaylist,
  onOpenEQ,
  onOpenSleepTimer,
  isFavorite,
  onToggleFavorite,
  queueLength,
}) => {
  const isLiquid = theme === 'liquid-glass';
  const isLight = theme === 'studio-light';

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      id="now-playing-bar"
      className={`fixed bottom-2.5 sm:bottom-3.5 left-2 right-2 sm:left-4 sm:right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl z-40 shadow-[0_16px_48px_rgba(0,0,0,0.65)] rounded-2xl overflow-hidden border transition-all ${
        isLiquid
          ? 'liquid-glass-elevated text-white border-white/20'
          : isLight
          ? 'bg-white/95 backdrop-blur-xl border-slate-200/90 text-slate-900 shadow-slate-300/40'
          : 'bg-[#0e0f14]/95 backdrop-blur-2xl border-white/10 text-white'
      }`}
    >
      {/* Top progress scrub bar */}
      <div
        className={`relative w-full h-1 group cursor-pointer ${
          isLiquid ? 'bg-white/10' : isLight ? 'bg-slate-200' : 'bg-zinc-800'
        }`}
      >
        <div
          className={`h-full transition-all ${
            isLiquid
              ? 'bg-gradient-to-r from-cyan-400 to-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.7)]'
              : isLight
              ? 'bg-slate-900'
              : 'bg-zinc-100 group-hover:bg-cyan-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
        <input
          id="seek-slider"
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Seek playback"
        />
      </div>

      {/* Mobile Mini Player Layout */}
      <div className="flex md:hidden items-center justify-between gap-3 px-3 py-2">
        <div
          onClick={onOpenFullscreen}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
        >
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 shadow">
            {currentTrack.album?.cover ? (
              <img
                src={currentTrack.album.cover}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <Disc className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-zinc-100 truncate">{currentTrack.title}</p>
              {currentTrack.explicit && (
                <span className="shrink-0 text-[9px] font-bold px-1 py-0.2 rounded bg-zinc-700 text-zinc-300">
                  E
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isFavorite ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md cursor-pointer active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-current" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Next track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onOpenFullscreen}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Full Screen / Lyrics"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Desktop Rich Controls Layout */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 py-2.5 items-center justify-between gap-3">
        {/* Track Metadata & Artwork */}
        <div className="flex items-center gap-3 w-1/3 min-w-0">
          <div
            id="now-playing-cover"
            onClick={onOpenFullscreen}
            className={`relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group shadow-md ${
              isLiquid ? 'border border-white/25' : isLight ? 'border border-slate-200 bg-slate-100' : 'border border-zinc-700/60 bg-zinc-900'
            }`}
            title="Expand Fullscreen / Synced Lyrics"
          >
            {currentTrack.album?.cover ? (
              <img
                src={currentTrack.album.cover}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <Disc className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-bold truncate ${
                  isLight ? 'text-slate-900' : 'text-zinc-100'
                }`}
              >
                {currentTrack.title}
              </p>
              <span
                className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                  isLiquid
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : isLight
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {currentTrack.audioQuality === 'LOSSLESS' ? 'FLAC' : '320K'}
              </span>
            </div>
            <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              {currentTrack.artist?.name}
            </p>
          </div>

          {/* Quick Actions: Favorite + Add to Playlist */}
          <div className="flex items-center gap-1">
            <button
              id="player-favorite-btn"
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFavorite
                  ? 'text-rose-400'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-600'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              id="player-add-to-playlist-btn"
              onClick={onOpenAddToPlaylist}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  : isLiquid
                  ? 'text-zinc-300 hover:text-white hover:bg-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
              }`}
              title="Add to Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Controls: Prev, Play/Pause, Next & Progress */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-1/3 max-w-lg">
          <div className="flex items-center gap-4">
            {/* Playback Rate Badge */}
            <button
              id="player-speed-btn"
              onClick={onCyclePlaybackRate}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                playbackRate !== 1.0
                  ? isLiquid
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 font-bold'
                    : 'bg-zinc-100 text-zinc-950 font-bold'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Playback speed: ${playbackRate}x (click to change)`}
            >
              {playbackRate}x
            </button>

            {/* Shuffle Toggle */}
            <button
              id="player-shuffle-btn"
              onClick={onToggleShuffle}
              className={`relative p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90 ${
                isShuffle
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={isShuffle ? 'Shuffle enabled' : 'Enable shuffle'}
            >
              <Shuffle className="w-3.5 h-3.5" />
              {isShuffle && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.9)]" />
              )}
            </button>

            {/* Previous Track */}
            <button
              id="player-prev-btn"
              onClick={onPrevious}
              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-90 border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
              title="Previous track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Centerpiece Master Rotary Transport Button (Play / Pause / Loading) */}
            <button
              id="player-play-pause-btn"
              onClick={onTogglePlay}
              className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer active:scale-95 select-none ${
                isLiquid
                  ? 'bg-gradient-to-b from-white to-zinc-200 text-zinc-950 ring-2 ring-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                  : isLight
                  ? 'bg-slate-900 text-white ring-2 ring-slate-400/30 hover:bg-slate-800 shadow-slate-900/20'
                  : isPlaying
                  ? 'bg-gradient-to-b from-cyan-400 to-cyan-500 text-zinc-950 ring-4 ring-cyan-400/30 shadow-[0_0_24px_rgba(6,182,212,0.5)]'
                  : 'bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-950 ring-2 ring-white/20 hover:from-white hover:to-zinc-200 shadow-lg'
              }`}
              title={isPlaying ? 'Pause playback' : 'Start playback'}
            >
              {/* Outer concentric groove bezel */}
              <span className="absolute inset-0.5 rounded-full border border-black/10 pointer-events-none" />

              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-current" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current transition-transform group-hover:scale-105" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5 transition-transform group-hover:scale-105" />
              )}
            </button>

            {/* Next Track */}
            <button
              id="player-next-btn"
              onClick={onNext}
              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-90 border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
              title="Next track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Repeat Toggle */}
            <button
              id="player-repeat-btn"
              onClick={onToggleRepeat}
              className={`relative p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90 ${
                repeatMode !== 'off'
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={`Repeat mode: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
              {repeatMode !== 'off' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.9)]" />
              )}
            </button>
          </div>

          {/* Time & Mini Visualizer */}
          <div
            className={`flex items-center gap-3 w-full text-[11px] font-mono justify-between px-2 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}
          >
            <span className="w-10 text-right">{formatTime(currentTime)}</span>

            {/* Embedded Mini Visualizer Waveform */}
            <div className="flex-1 max-w-xs h-5 px-2">
              <AudioVisualizer mode={visualizerMode} isPlaying={isPlaying} height={20} />
            </div>

            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Section: Volume, EQ, Sleep Timer, Queue & Fullscreen */}
        <div className="flex items-center justify-end gap-2 w-full md:w-1/3">
          {/* Quick EQ Trigger */}
          <button
            onClick={onOpenEQ}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                : isLiquid
                ? 'hover:bg-white/10 text-zinc-300 hover:text-white'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Open Equalizer & FX"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Quick Sleep Timer Trigger */}
          <button
            onClick={onOpenSleepTimer}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                : isLiquid
                ? 'hover:bg-white/10 text-zinc-300 hover:text-white'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Set Sleep Timer"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Visualizer Preset Toggle */}
          <button
            id="player-visualizer-toggle-btn"
            onClick={onToggleVisualizer}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
              visualizerMode !== 'off'
                ? isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 font-semibold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : isLight
                ? 'border-slate-200 text-slate-400 hover:text-slate-600'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title={`Visualizer mode: ${visualizerMode}`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-mono hidden xl:inline">{visualizerMode}</span>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              id="player-volume-toggle-btn"
              onClick={onToggleMute}
              className={`p-1.5 transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className={`w-16 sm:w-20 h-1 rounded-lg appearance-none cursor-pointer ${
                isLight ? 'bg-slate-300 accent-slate-900' : 'bg-zinc-700 accent-zinc-200'
              }`}
              title="Volume"
            />
          </div>

          {/* Queue Drawer Toggle */}
          <button
            id="player-queue-toggle-btn"
            onClick={onToggleQueue}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
              isLight
                ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
            title="Toggle playback queue"
          >
            <ListMusic className="w-4 h-4" />
            {queueLength > 0 && (
              <span
                className={`absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full ${
                  isLight ? 'bg-slate-900 text-white' : 'bg-zinc-200 text-zinc-950'
                }`}
              >
                {queueLength}
              </span>
            )}
          </button>

          {/* Fullscreen Player Mode */}
          <button
            id="player-fullscreen-btn"
            onClick={onOpenFullscreen}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
            title="Expand Fullscreen / Synced Lyrics"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
