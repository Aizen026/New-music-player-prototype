import React from 'react';
import { X, Palette, Sparkles, Check, Droplets } from 'lucide-react';
import { AppTheme } from '../types/monochrome';
import { THEMES } from '../utils/themeConfig';

interface ThemeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const isLiquid = currentTheme === 'liquid-glass';
  const isLight = currentTheme === 'studio-light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all border ${
          isLiquid
            ? 'liquid-glass-elevated text-white'
            : isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
            : 'bg-zinc-950 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isLiquid ? 'bg-white/15' : isLight ? 'bg-slate-100 text-slate-800' : 'bg-zinc-900 text-cyan-400'}`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Appearance & Theme</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Personalize player aesthetics and glass textures
              </p>
            </div>
          </div>
          <button
            id="close-themes-btn"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="py-4 space-y-3">
          {THEMES.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                id={`theme-card-${theme.id}`}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex items-start gap-3.5 ${
                  isSelected
                    ? isLight
                      ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                      : isLiquid
                      ? 'border-cyan-400/80 bg-white/15 shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-1 ring-cyan-400/50'
                      : 'border-zinc-400 bg-zinc-900/90 shadow-md ring-1 ring-zinc-400/30'
                    : isLight
                    ? 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    : isLiquid
                    ? 'border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08]'
                    : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900'
                }`}
              >
                {/* Visual Swatch Preview */}
                <div
                  className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center shadow-inner border border-white/20 relative overflow-hidden ${theme.previewBg}`}
                >
                  {theme.id === 'liquid-glass' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/40 via-purple-500/40 to-pink-500/40 backdrop-blur-xs animate-pulse" />
                  )}
                  {isSelected && (
                    <Check
                      className={`w-4 h-4 relative z-10 ${
                        theme.isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight">
                      {theme.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        theme.id === 'liquid-glass'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                          : isLight
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {theme.badge}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 line-clamp-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {theme.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className={`flex items-center gap-1 font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Liquid glass features Apple dynamic blur
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              isLight ? 'bg-slate-900 text-white' : 'bg-white text-zinc-950 font-bold'
            }`}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
