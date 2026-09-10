import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  Zap,
  Music,
  FolderPlus,
  Trash2,
  Sparkles,
  Server,
  Activity,
  Radio,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { QualityTier, VisualizerMode, InstanceInfo } from '../types/monochrome';
import { localMusicService } from '../services/localMusicService';
import { monochromeApi } from '../services/monochromeService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioQuality: QualityTier;
  onQualityChange: (q: QualityTier) => void;
  visualizerMode: VisualizerMode;
  onVisualizerChange: (m: VisualizerMode) => void;
  onImportFiles?: (files: FileList | File[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  audioQuality,
  onQualityChange,
  visualizerMode,
  onVisualizerChange,
  onImportFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Real-time latency tracking (only runs when observed / modal is open)
  const [latency, setLatency] = useState<number | null>(null);
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('Silly Player HiFi (Direct Engine)');
  const [isObservingLatency, setIsObservingLatency] = useState(true);

  useEffect(() => {
    // CRITICAL: Only checks latency per second when observed (modal is open & tab visible)
    if (!isOpen || !isObservingLatency) {
      setLatency(null);
      return;
    }

    let isMounted = true;

    // Load available node instances
    monochromeApi.getInstances().then((list) => {
      if (isMounted && list.length > 0) {
        setInstances(list);
      }
    });

    const measurePing = async () => {
      if (document.hidden) return;
      const start = performance.now();
      try {
        const res = await fetch('/api/ping', {
          cache: 'no-store',
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok && isMounted) {
          const ms = Math.round(performance.now() - start);
          setLatency(ms);
        }
      } catch {
        if (isMounted) setLatency(null);
      }
    };

    // Initial ping
    measurePing();

    // Periodic 1-second pulse while observed
    const intervalId = setInterval(measurePing, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isOpen, isObservingLatency]);

  if (!isOpen) return null;

  const localRecords = localMusicService.getSavedTrackRecords();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportStatus(`Importing ${e.target.files.length} file(s)...`);
      if (onImportFiles) {
        onImportFiles(e.target.files);
      } else {
        await localMusicService.importFiles(e.target.files);
      }
      setImportStatus(`Successfully added ${e.target.files.length} song(s) to library!`);
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('silly_player_local_tracks');
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch {}
  };

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="settings-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#0f1015] border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-wide">Player Settings</h2>
              <p className="text-xs text-zinc-400">Audio engine, live latency instance, and library settings</p>
            </div>
          </div>

          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Real-time Latency & Instance Monitor */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-300 flex items-center gap-2 font-semibold">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Live Node Latency
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsObservingLatency(!isObservingLatency)}
                  className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title={isObservingLatency ? 'Pause 1s latency polling' : 'Resume 1s latency polling'}
                >
                  {isObservingLatency ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-400" />
                      Live (1s)
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-zinc-500" />
                      Paused
                    </>
                  )}
                </button>

                {latency !== null ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {latency} ms
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    {isObservingLatency ? 'Checking...' : 'Idle'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Real-time latency check runs once per second <strong>strictly while this settings panel is observed</strong>, completely halting when closed to ensure zero audio lag or playback buffer contention.
            </p>

            {/* Instances list */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Active Streaming Node
              </span>
              <div className="space-y-1.5">
                {(instances.length > 0 ? instances : [
                  {
                    name: 'Silly Player HiFi (Direct Engine)',
                    url: 'https://api.tidal.com',
                    status: 'online',
                    type: 'official-client',
                    notes: 'High-res 320kbps AAC streaming with official HiFi audio engine',
                    official: true,
                  },
                  {
                    name: 'Monochrome Samidy API',
                    url: 'https://monochrome-api.samidy.com',
                    status: 'online',
                    type: 'rest-api',
                    notes: 'Official metadata proxy (v2.3 HiFi-RestAPI)',
                    official: true,
                  },
                  {
                    name: 'Lossless.wtf Mirror',
                    url: 'https://lossless.wtf',
                    status: 'online',
                    type: 'web-mirror',
                    notes: 'Official Monochrome web failover mirror',
                    official: true,
                  },
                ]).map((inst) => (
                  <button
                    key={inst.name}
                    onClick={() => setSelectedInstance(inst.name)}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedInstance === inst.name
                        ? 'bg-zinc-900/90 border-emerald-500/50 ring-1 ring-emerald-500/20'
                        : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200 truncate">{inst.name}</span>
                        {inst.official && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">{inst.url}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {selectedInstance === inst.name && (
                        <span className="text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Audio Playback Quality */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Stream & Audio Quality
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="quality-tier-high-btn"
                onClick={() => onQualityChange('HIGH')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  audioQuality === 'HIGH'
                    ? 'bg-zinc-900 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-100">High (320 kbps AAC)</span>
                  {audioQuality === 'HIGH' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Optimal bandwidth, instant buffering, pristine CD-grade audio.
                </p>
              </button>

              <button
                id="quality-tier-lossless-btn"
                onClick={() => onQualityChange('LOSSLESS')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  audioQuality === 'LOSSLESS'
                    ? 'bg-zinc-900 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-100">Lossless (FLAC / Studio)</span>
                  {audioQuality === 'LOSSLESS' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Bit-perfect studio fidelity without compression artifacts.
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Visualizer Engine */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
              <Music className="w-3.5 h-3.5 text-purple-400" />
              Real-time Web Audio Visualizer
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['bars', 'wave', 'glow', 'off'] as VisualizerMode[]).map((mode) => (
                <button
                  key={mode}
                  id={`visualizer-mode-${mode}-btn`}
                  onClick={() => onVisualizerChange(mode)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer uppercase font-mono text-xs ${
                    visualizerMode === mode
                      ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Local Device Library & Audio Files */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              Local Device Library
            </h3>
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Import Music from Device</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select MP3, FLAC, WAV, M4A, or AAC audio files to add to your library.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0 shadow-sm"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Select Audio Files
                </button>
              </div>

              {importStatus && (
                <p className="text-xs font-mono text-cyan-400 bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/40">
                  {importStatus}
                </p>
              )}

              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                <span>Imported device songs: <strong className="text-zinc-200">{localRecords.length}</strong></span>
                {localRecords.length > 0 && (
                  <button
                    onClick={handleClearCache}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-mono text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" />
                    {cacheCleared ? 'Cleared!' : 'Clear Device Cache'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: About Silly Player */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-xs text-zinc-400 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Silly Player
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Equipped with Quick Picks 4-row carousel, Trending songs, Covers and remixes, real-time parametric EQ, dynamic loudness compression, Apple Liquid Glass themes, and zero-overhead observed latency monitoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
