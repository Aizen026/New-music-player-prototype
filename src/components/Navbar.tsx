import React from 'react';
import { Search, Sliders, Music, Disc3, Heart, ListMusic, X } from 'lucide-react';
import { QualityTier } from '../types/monochrome';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: 'explore' | 'library' | 'queue';
  onTabChange: (tab: 'explore' | 'library' | 'queue') => void;
  onOpenSettings: () => void;
  audioQuality: QualityTier;
  onQualityChange: (q: QualityTier) => void;
  isStreaming: boolean;
  favoritesCount: number;
  queueCount: number;
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
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full bg-[#0c0d10]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3 transition-colors">
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
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-black tracking-tighter text-sm shadow-sm group-hover:bg-white transition-all">
              <Disc3 className="w-4 h-4 text-zinc-950 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-wider text-zinc-100 uppercase">Monochrome</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                  .tf Source
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono tracking-tight flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HiFi Stream Ready
              </p>
            </div>
          </button>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              title="Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="w-full md:max-w-md relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tracks, artists, albums (Monochrome / Tidal catalog)..."
              className="w-full bg-zinc-900/90 border border-zinc-800/90 rounded-xl pl-10 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-all font-sans"
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

        {/* Navigation Tabs & Settings */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 gap-1 text-xs">
            <button
              id="tab-explore-btn"
              onClick={() => onTabChange('explore')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            <button
              id="tab-library-btn"
              onClick={() => onTabChange('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono ml-0.5">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              id="tab-queue-btn"
              onClick={() => onTabChange('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Queue</span>
              {queueCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono ml-0.5">
                  {queueCount}
                </span>
              )}
            </button>
          </div>

          {/* Audio Quality Badge / Selector */}
          <button
            id="quality-selector-btn"
            onClick={() => {
              const next: QualityTier = audioQuality === 'HIGH' ? 'LOSSLESS' : 'HIGH';
              onQualityChange(next);
            }}
            title="Toggle Stream Quality"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600 transition-colors text-xs font-mono cursor-pointer"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-cyan-400' : 'bg-zinc-500'}`} />
            <span>{audioQuality === 'HIGH' ? '320K AAC' : 'LOSSLESS'}</span>
          </button>

          {/* Settings Trigger */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="hidden md:flex items-center justify-center p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            title="Configure Monochrome Sources & Instances"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
