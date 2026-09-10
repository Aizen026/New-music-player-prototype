import React, { useState, useEffect } from 'react';
import { X, Sliders, Volume2, Sparkles, RotateCcw, Check } from 'lucide-react';
import { EQSettings, EQPresetName, AppTheme } from '../types/monochrome';
import { audioEngine, EQ_PRESETS } from '../services/audioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [eq, setEq] = useState<EQSettings>(audioEngine.getEQ());

  useEffect(() => {
    if (isOpen) {
      setEq(audioEngine.getEQ());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLiquid = theme === 'liquid-glass';
  const isLight = theme === 'studio-light';

  const handlePresetSelect = (name: EQPresetName) => {
    const preset = EQ_PRESETS[name];
    const next: EQSettings = {
      ...eq,
      preset: name,
      bass: preset.bass,
      mid: preset.mid,
      treble: preset.treble,
    };
    setEq(next);
    audioEngine.setEQ(next);
  };

  const handleSliderChange = (band: 'bass' | 'mid' | 'treble', value: number) => {
    const next: EQSettings = {
      ...eq,
      preset: 'flat', // custom
      [band]: value,
    };
    setEq(next);
    audioEngine.setEQ(next);
  };

  const handleToggleSoundCheck = () => {
    const next: EQSettings = {
      ...eq,
      soundCheck: !eq.soundCheck,
    };
    setEq(next);
    audioEngine.setEQ(next);
  };

  const handleReset = () => {
    handlePresetSelect('flat');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all border ${
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
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Audio Equalizer & FX</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Hardware-accelerated Web Audio biquad filters
              </p>
            </div>
          </div>
          <button
            id="close-eq-btn"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EQ Presets Pills */}
        <div className="py-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-zinc-400'}>Presets</span>
            <button
              onClick={handleReset}
              className={`flex items-center gap-1 text-[11px] cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              Reset Flat
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EQ_PRESETS) as EQPresetName[]).map((key) => {
              const preset = EQ_PRESETS[key];
              const isSelected = eq.preset === key;
              return (
                <button
                  key={key}
                  id={`eq-preset-${key}`}
                  onClick={() => handlePresetSelect(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-md'
                        : isLiquid
                        ? 'bg-white/30 text-white border border-white/40 shadow-inner'
                        : 'bg-zinc-100 text-zinc-950 font-bold shadow'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : isLiquid
                      ? 'liquid-glass-pill text-zinc-200 hover:bg-white/20'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Band Graphic Sliders */}
        <div className="py-3 space-y-5">
          {/* Bass */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 opacity-70" />
                Bass (Sub & Kick, 100 Hz)
              </span>
              <span className="font-mono font-bold text-[11px]">
                {eq.bass > 0 ? `+${eq.bass}` : eq.bass} dB
              </span>
            </div>
            <input
              id="eq-slider-bass"
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eq.bass}
              onChange={(e) => handleSliderChange('bass', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Mid */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 opacity-70" />
                Mid (Vocals & Acoustics, 1 kHz)
              </span>
              <span className="font-mono font-bold text-[11px]">
                {eq.mid > 0 ? `+${eq.mid}` : eq.mid} dB
              </span>
            </div>
            <input
              id="eq-slider-mid"
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eq.mid}
              onChange={(e) => handleSliderChange('mid', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Treble */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 opacity-70" />
                Treble (Air & Presence, 3.2 kHz)
              </span>
              <span className="font-mono font-bold text-[11px]">
                {eq.treble > 0 ? `+${eq.treble}` : eq.treble} dB
              </span>
            </div>
            <input
              id="eq-slider-treble"
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eq.treble}
              onChange={(e) => handleSliderChange('treble', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>
        </div>

        {/* Sound Check / Dynamic Compression Toggle */}
        <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold">Sound Check (Auto-Volume)</div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Compresses dynamic peaks to equalize loud and quiet recordings
            </p>
          </div>
          <button
            id="toggle-soundcheck-btn"
            onClick={handleToggleSoundCheck}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              eq.soundCheck ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                eq.soundCheck ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Close Button */}
        <div className="pt-5 mt-2">
          <button
            id="done-eq-btn"
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : isLiquid
                ? 'bg-white text-zinc-950 hover:bg-white/90 shadow-lg'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
