import React from 'react';
import {
  Search,
  Sliders,
  Music,
  Disc3,
  Heart,
  ListMusic,
  X,
  Palette,
  Moon,
  SlidersHorizontal,
  Keyboard,
  Clock,
  Radio,
  Sparkles
} from 'lucide-react';
import { QualityTier, AppTheme } from '../types/monochrome';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: 'explore' | 'library' | 'queue' | 'mix' | 'analytics';
  onTabChange: (tab: 'explore' | 'library' | 'queue' | 'mix' | 'analytics') => void;
  onOpenSettings: () => void;
  audioQuality: QualityTier;
  onQualityChange: (q: QualityTier) => void;
  isStreaming: boolean;
  favoritesCount: number;
  queueCount: number;
  theme: AppTheme;
  onOpenThemeModal: () => void;
  onOpenEQModal: () => void;
  onOpenSleepTimerModal: () => void;
  onOpenShortcutsModal: () => void;
  sleepTimerRemaining: number | null;
  sleepTimerMode: 'minutes' | 'track' | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onOpenSettings,
  audioQuality,
  onQualityChange,
  isStreaming,
  favoritesCount,
  queueCount,
  theme,
  onOpenThemeModal,
  onOpenEQModal,
  onOpenSleepTimerModal,
  onOpenShortcutsModal,
  sleepTimerRemaining,
  sleepTimerMode,
}) => {
  const isLiquid = theme === 'liquid-glass';
  const isLight = theme === 'studio-light';

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header
      id="app-header"
      className={`sticky top-0 z-40 w-full px-4 lg:px-8 safe-top-nav pb-3 transition-all ${
        isLiquid
          ? 'liquid-glass-surface'
          : isLight
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-900 shadow-sm'
          : 'bg-[#0c0d10]/95 backdrop-blur-md border-b border-zinc-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Instance Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <button
            id="brand-home-btn"
            onClick={() => {
              onSearchChange('');
              onTabChange('explore');
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black tracking-tighter text-sm transition-all ${
                isLiquid
                  ? 'liquid-glass-elevated text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                  : isLight
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-950 shadow-sm group-hover:bg-white'
              }`}
            >
              <Disc3 className="w-4 h-4 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-base font-bold tracking-wider uppercase ${
                    isLight ? 'text-slate-900' : 'text-zinc-100'
                  }`}
                >
                  Silly Player
                </span>
                <span
                  className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                    isLiquid
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-zinc-800/90 text-zinc-300 border border-zinc-700/60'
                  }`}
                >
                  Hi-Fi Audio
                </span>
              </div>
              <p
                className={`text-[11px] font-mono tracking-tight flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-zinc-400'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hi-Res Audio Engine
              </p>
            </div>
          </button>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOpenThemeModal}
              className={`p-2 rounded-lg text-xs cursor-pointer ${
                isLiquid
                  ? 'liquid-glass-pill text-cyan-300'
                  : isLight
                  ? 'bg-slate-100 border border-slate-200 text-slate-700'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
              }`}
              title="Theme Switcher"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenEQModal}
              className={`p-2 rounded-lg text-xs cursor-pointer ${
                isLiquid
                  ? 'liquid-glass-pill text-cyan-300'
                  : isLight
                  ? 'bg-slate-100 border border-slate-200 text-slate-700'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
              }`}
              title="Equalizer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              id="mobile-settings-btn"
              onClick={onOpenSettings}
              className={`p-2 rounded-lg text-xs cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border border-slate-200 text-slate-700'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
              }`}
              title="Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="w-full md:max-w-md relative">
          <div className="relative flex items-center">
            <Search
              className={`w-4 h-4 absolute left-3.5 pointer-events-none ${
                isLight ? 'text-slate-400' : 'text-zinc-400'
              }`}
            />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search songs, artists, albums, or local library..."
              className={`w-full rounded-xl pl-10 pr-9 py-2 text-sm transition-all font-sans focus:outline-none ${
                isLiquid
                  ? 'liquid-glass-input text-white placeholder-zinc-400 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/30'
                  : isLight
                  ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20'
                  : 'bg-zinc-900/90 border border-zinc-800/90 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30'
              }`}
            />
            {searchQuery && (
              <button
                id="search-clear-btn"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 rounded-md cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Studio Audio Channel Selectors */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <nav
            aria-label="Studio Channels"
            className={`flex items-center p-1 rounded-xl gap-1 text-xs border ${
              isLiquid
                ? 'liquid-glass-elevated border-white/20'
                : isLight
                ? 'bg-slate-100/90 border-slate-200/90 shadow-sm'
                : 'bg-zinc-950/90 border-zinc-800/80 shadow-inner'
            }`}
          >
            {/* 1. Explore Tab */}
            <button
              id="tab-explore-btn"
              onClick={() => onTabChange('explore')}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer select-none active:scale-[0.97] ${
                activeTab === 'explore'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : isLiquid
                    ? 'bg-white/25 text-white border border-white/40 shadow-inner'
                    : 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80 ring-1 ring-cyan-400/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeTab === 'explore'
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse'
                    : 'bg-zinc-600 group-hover:bg-zinc-400'
                }`}
              />
              <Music className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            {/* 2. Live Radio Mix Tab */}
            <button
              id="tab-mix-btn"
              onClick={() => onTabChange('mix')}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer select-none active:scale-[0.97] ${
                activeTab === 'mix'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : isLiquid
                    ? 'bg-white/25 text-white border border-white/40 shadow-inner'
                    : 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80 ring-1 ring-cyan-400/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeTab === 'mix'
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse'
                    : 'bg-zinc-600 group-hover:bg-zinc-400'
                }`}
              />
              <Radio className="w-3.5 h-3.5" />
              <span>Radio Mix</span>
            </button>

            {/* 3. Studio FX / Parametric EQ */}
            <button
              id="tab-analytics-btn"
              onClick={() => onTabChange('analytics')}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer select-none active:scale-[0.97] ${
                activeTab === 'analytics'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : isLiquid
                    ? 'bg-white/25 text-white border border-white/40 shadow-inner'
                    : 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80 ring-1 ring-cyan-400/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                    : 'bg-zinc-600 group-hover:bg-zinc-400'
                }`}
              />
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Studio FX</span>
            </button>

            {/* 4. Library Tab */}
            <button
              id="tab-library-btn"
              onClick={() => onTabChange('library')}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer select-none active:scale-[0.97] ${
                activeTab === 'library'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : isLiquid
                    ? 'bg-white/25 text-white border border-white/40 shadow-inner'
                    : 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80 ring-1 ring-cyan-400/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeTab === 'library'
                    ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)] animate-pulse'
                    : 'bg-zinc-600 group-hover:bg-zinc-400'
                }`}
              />
              <Heart className="w-3.5 h-3.5" />
              <span>Library</span>
              {favoritesCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ml-0.5 font-bold ${
                    isLight ? 'bg-slate-200 text-slate-800' : 'bg-zinc-900 text-cyan-300 border border-zinc-700/60'
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* 5. Queue Tab */}
            <button
              id="tab-queue-btn"
              onClick={() => onTabChange('queue')}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer select-none active:scale-[0.97] ${
                activeTab === 'queue'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : isLiquid
                    ? 'bg-white/25 text-white border border-white/40 shadow-inner'
                    : 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80 ring-1 ring-cyan-400/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeTab === 'queue'
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
                    : 'bg-zinc-600 group-hover:bg-zinc-400'
                }`}
              />
              <ListMusic className="w-3.5 h-3.5" />
              <span>Queue</span>
              {queueCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ml-0.5 font-bold ${
                    isLight ? 'bg-slate-200 text-slate-800' : 'bg-zinc-900 text-amber-300 border border-zinc-700/60'
                  }`}
                >
                  {queueCount}
                </span>
              )}
            </button>
          </nav>

          {/* Sleep Timer Indicator Button */}
          <button
            id="sleep-timer-nav-btn"
            onClick={onOpenSleepTimerModal}
            title={sleepTimerMode ? 'Sleep timer active' : 'Set sleep timer'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border select-none active:scale-95 ${
              sleepTimerMode
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)] animate-pulse'
                : isLiquid
                ? 'liquid-glass-elevated border-white/20 text-zinc-200 hover:text-white'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            {sleepTimerRemaining !== null ? (
              <span className="font-bold">{formatTimer(sleepTimerRemaining)}</span>
            ) : sleepTimerMode === 'track' ? (
              <span>1 Track</span>
            ) : null}
          </button>

          {/* Equalizer Quick Button */}
          <button
            id="eq-nav-btn"
            onClick={onOpenEQModal}
            title="Audio Equalizer (Web Audio FX)"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none active:scale-95 ${
              isLiquid
                ? 'liquid-glass-elevated border-white/20 text-zinc-200 hover:text-white'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">EQ</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            id="theme-switcher-nav-btn"
            onClick={onOpenThemeModal}
            title="Customize Appearance & Themes (Apple Liquid Glass, Dark, Light)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none active:scale-95 ${
              isLiquid
                ? 'liquid-glass-elevated text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Theme</span>
          </button>

          {/* Audio Quality Master Indicator */}
          <button
            id="quality-selector-btn"
            onClick={() => {
              const next: QualityTier = audioQuality === 'HIGH' ? 'LOSSLESS' : 'HIGH';
              onQualityChange(next);
            }}
            title="Toggle Stream Bitrate / Quality"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all border select-none active:scale-95 ${
              isLiquid
                ? 'liquid-glass-elevated border-white/20 text-zinc-200'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStreaming
                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)] animate-pulse'
                  : 'bg-zinc-500'
              }`}
            />
            <span className="font-semibold tracking-wider text-[11px]">
              {audioQuality === 'HIGH' ? '320K AAC' : 'LOSSLESS'}
            </span>
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            id="shortcuts-btn"
            onClick={onOpenShortcutsModal}
            className={`hidden xl:flex items-center justify-center p-2 rounded-lg transition-all border cursor-pointer select-none active:scale-95 ${
              isLiquid
                ? 'liquid-glass-elevated border-white/20 text-zinc-300 hover:text-white'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
            }`}
            title="Desktop Hotkeys & Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Settings Trigger */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className={`hidden md:flex items-center justify-center p-2 rounded-lg transition-all border cursor-pointer select-none active:scale-95 ${
              isLiquid
                ? 'liquid-glass-elevated border-white/20 text-zinc-300 hover:text-white'
                : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
            }`}
            title="Monochrome Gateway & Instance Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
