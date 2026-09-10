import React, { useEffect, useState } from 'react';
import {
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
  Disc,
  FileText
} from 'lucide-react';
import { Track, RepeatMode, VisualizerMode, AppTheme } from '../types/monochrome';
import { monochromeApi } from '../services/monochromeService';
import { AudioVisualizer } from './AudioVisualizer';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  visualizerMode: VisualizerMode;
  theme?: AppTheme;
  onTogglePlay: () => void;
  onSeek: (secs: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  visualizerMode,
  theme = 'liquid-glass',
  onTogglePlay,
  onSeek,
  onPrevious,
  onNext,
  onToggleRepeat,
  onToggleShuffle,
  onVolumeChange,
  onToggleMute,
  isFavorite,
  onToggleFavorite,
}) => {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [showLyricsTab, setShowLyricsTab] = useState(false);

  useEffect(() => {
    if (!currentTrack || !isOpen) return;
    setLoadingLyrics(true);
    monochromeApi
      .getLyrics(currentTrack.id)
      .then((res) => {
        setLyrics(res.lyrics);
        setLoadingLyrics(false);
      })
      .catch(() => {
        setLyrics(null);
        setLoadingLyrics(false);
      });
  }, [currentTrack?.id, isOpen]);

  if (!isOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="fullscreen-player-overlay"
      className="fixed inset-0 z-50 bg-[#08090b] flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none"
    >
      {/* Background ambient artwork glow */}
      {currentTrack.album?.cover && (
        <div
          className="absolute inset-0 opacity-15 blur-3xl scale-125 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${currentTrack.album.coverLarge || currentTrack.album.cover})` }}
        />
      )}

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="uppercase tracking-widest font-bold text-zinc-200">
            Monochrome {currentTrack.audioQuality || 'HiFi'} Playback
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="fullscreen-lyrics-toggle-btn"
            onClick={() => setShowLyricsTab(!showLyricsTab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
              showLyricsTab
                ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>

          <button
            id="fullscreen-close-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 max-w-5xl mx-auto w-full my-6 overflow-hidden">
        {/* Left: Large Vinyl Artwork */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700/80 shadow-2xl">
            {currentTrack.album?.coverLarge || currentTrack.album?.cover ? (
              <img
                src={currentTrack.album.coverLarge || currentTrack.album.cover}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                <Disc className="w-24 h-24" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Lyrics OR Large Metadata & Waveform */}
        <div className="flex-1 w-full max-w-lg h-72 sm:h-80 md:h-96 flex flex-col justify-center">
          {showLyricsTab ? (
            <div
              className={`w-full h-full rounded-2xl p-5 overflow-y-auto font-mono text-sm leading-relaxed ${
                theme === 'liquid-glass'
                  ? 'liquid-glass-elevated text-white border-white/20'
                  : 'bg-zinc-950/60 border border-zinc-800/80 text-zinc-300'
              }`}
            >
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 mb-3 border-b border-white/10 pb-2">
                Synced Lyrics
              </h4>
              {loadingLyrics ? (
                <p className="text-zinc-500 italic py-12 text-center">Loading lyrics from Monochrome...</p>
              ) : lyrics ? (
                <div className="whitespace-pre-line text-zinc-200 leading-relaxed font-sans text-base">{lyrics}</div>
              ) : (
                <p className="text-zinc-500 italic py-12 text-center">No lyrics available for this track.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 font-semibold">
                  {currentTrack.audioQuality === 'LOSSLESS' ? 'FLAC 24-BIT MASTER' : '320 KBPS AAC'}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
                  {currentTrack.title}
                </h1>
                <p className="text-lg text-zinc-300 font-medium mt-1">{currentTrack.artist?.name}</p>
                {currentTrack.album?.title && (
                  <p className="text-sm text-zinc-400 font-mono mt-0.5">{currentTrack.album.title}</p>
                )}
              </div>

              {/* Large High-Res Visualizer */}
              <div
                className={`rounded-2xl p-4 ${
                  theme === 'liquid-glass'
                    ? 'liquid-glass-surface border-white/15'
                    : 'bg-zinc-950/60 border border-zinc-800/80'
                }`}
              >
                <AudioVisualizer mode={visualizerMode} isPlaying={isPlaying} height={90} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 max-w-3xl mx-auto w-full space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative w-full h-2 rounded-full bg-zinc-800 overflow-hidden cursor-pointer group">
            <div
              className="h-full bg-zinc-100 group-hover:bg-cyan-400 transition-all rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            id="fullscreen-fav-btn"
            onClick={onToggleFavorite}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isFavorite ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <div className="flex items-center gap-6">
            <button
              id="fullscreen-shuffle-btn"
              onClick={onToggleShuffle}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isShuffle ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              id="fullscreen-prev-btn"
              onClick={onPrevious}
              className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              id="fullscreen-play-pause-btn"
              onClick={onTogglePlay}
              className="w-14 h-14 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-xl cursor-pointer"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>

            <button
              id="fullscreen-next-btn"
              onClick={onNext}
              className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            <button
              id="fullscreen-repeat-btn"
              onClick={onToggleRepeat}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="fullscreen-mute-btn"
              onClick={onToggleMute}
              className="p-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
