import React from 'react';
import { X, Moon, Clock, Check, StopCircle } from 'lucide-react';
import { AppTheme } from '../types/monochrome';
import { audioEngine } from '../services/audioEngine';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  remainingSeconds: number | null;
  sleepTimerMode: 'minutes' | 'track' | null;
}

const TIMER_OPTIONS: Array<{ label: string; value: number | 'track' }> = [
  { label: '5 Minutes', value: 5 },
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '45 Minutes', value: 45 },
  { label: '1 Hour', value: 60 },
  { label: 'End of Current Track', value: 'track' },
];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  theme,
  remainingSeconds,
  sleepTimerMode,
}) => {
  if (!isOpen) return null;

  const isLiquid = theme === 'liquid-glass';
  const isLight = theme === 'studio-light';

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectOption = (val: number | 'track') => {
    audioEngine.startSleepTimer(val);
    onClose();
  };

  const handleCancelTimer = () => {
    audioEngine.cancelSleepTimer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl transition-all border ${
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
            <div className={`p-2 rounded-xl ${isLiquid ? 'bg-white/15' : isLight ? 'bg-slate-100 text-slate-800' : 'bg-zinc-900 text-indigo-400'}`}>
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Sleep Timer</h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Audio fades gracefully when time expires
              </p>
            </div>
          </div>
          <button
            id="close-sleep-timer-btn"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Timer Status Banner */}
        {sleepTimerMode && (
          <div className="my-3 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
              <div>
                <span className="font-semibold text-indigo-300">
                  {sleepTimerMode === 'track' ? 'Stopping after track' : 'Timer Running:'}
                </span>
                {remainingSeconds !== null && (
                  <span className="font-mono ml-1.5 text-white font-bold">
                    {formatRemaining(remainingSeconds)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleCancelTimer}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Turn Off
            </button>
          </div>
        )}

        {/* Options List */}
        <div className="py-2 space-y-1.5">
          {TIMER_OPTIONS.map((opt) => {
            const isCurrentMode =
              opt.value === 'track'
                ? sleepTimerMode === 'track'
                : sleepTimerMode === 'minutes' && remainingSeconds !== null;
            return (
              <button
                key={String(opt.value)}
                id={`sleep-opt-${opt.value}`}
                onClick={() => handleSelectOption(opt.value)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isCurrentMode
                    ? isLight
                      ? 'bg-slate-900 text-white'
                      : isLiquid
                      ? 'bg-white/30 text-white border border-white/40'
                      : 'bg-zinc-100 text-zinc-950 font-bold'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-700'
                    : isLiquid
                    ? 'liquid-glass-pill text-zinc-200 hover:bg-white/20'
                    : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/60'
                }`}
              >
                <span>{opt.label}</span>
                {isCurrentMode && <Check className="w-3.5 h-3.5 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-white/10 flex gap-2">
          {sleepTimerMode && (
            <button
              onClick={handleCancelTimer}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
            >
              Cancel Timer
            </button>
          )}
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                : isLiquid
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
