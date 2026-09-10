import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { AppTheme } from '../types/monochrome';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause audio playback' },
  { key: '← / →', desc: 'Seek 5 seconds backward / forward' },
  { key: 'Shift + ← / →', desc: 'Previous / Next track in queue' },
  { key: '↑ / ↓', desc: 'Increase / Decrease volume' },
  { key: 'M', desc: 'Toggle Mute / Unmute' },
  { key: 'F', desc: 'Open / Close Fullscreen Player & Lyrics' },
  { key: 'L', desc: 'Add / Remove current track from Favorites' },
  { key: 'S', desc: 'Toggle Shuffle mode' },
  { key: 'R', desc: 'Cycle Repeat mode (Off → All → One)' },
  { key: 'E', desc: 'Open Audio Equalizer & FX' },
  { key: 'T', desc: 'Open Appearance & Themes' },
  { key: 'Z', desc: 'Set Sleep Timer' },
  { key: 'Q', desc: 'Toggle Queue Drawer' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  if (!isOpen) return null;

  const isLiquid = theme === 'liquid-glass';
  const isLight = theme === 'studio-light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl p-5 shadow-2xl transition-all border ${
          isLiquid
            ? 'liquid-glass-elevated text-white'
            : isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
            : 'bg-zinc-950 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isLiquid ? 'bg-white/15' : isLight ? 'bg-slate-100 text-slate-800' : 'bg-zinc-900 text-amber-400'}`}>
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Keyboard Shortcuts</h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Control streaming with desktop hotkeys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="py-3 space-y-2 max-h-80 overflow-y-auto">
          {SHORTCUTS.map((sc) => (
            <div
              key={sc.key}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
              }`}
            >
              <span className={isLight ? 'text-slate-600' : 'text-zinc-300'}>{sc.desc}</span>
              <kbd
                className={`font-mono font-semibold px-2 py-0.5 rounded border text-[11px] shadow-xs ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : isLiquid
                    ? 'bg-white/15 border-white/25 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer ${
              isLight ? 'bg-slate-900 text-white' : 'bg-white text-zinc-950 hover:bg-white/90'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
