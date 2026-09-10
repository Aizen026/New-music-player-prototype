import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, ShieldCheck, Zap, RefreshCw, Sliders, Music, Smartphone, Github, Copy, Check, Terminal } from 'lucide-react';
import { InstanceInfo, QualityTier, VisualizerMode } from '../types/monochrome';
import { monochromeApi } from '../services/monochromeService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioQuality: QualityTier;
  onQualityChange: (q: QualityTier) => void;
  visualizerMode: VisualizerMode;
  onVisualizerChange: (m: VisualizerMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  audioQuality,
  onQualityChange,
  visualizerMode,
  onVisualizerChange,
}) => {
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [customInstance, setCustomInstance] = useState('');
  const [backendGateway, setBackendGateway] = useState('');
  const [pinging, setPinging] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [gatewaySaved, setGatewaySaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomInstance(monochromeApi.getCustomInstance());
      setBackendGateway(monochromeApi.getBackendGateway());
      monochromeApi.getInstances().then(setInstances);
    }
  }, [isOpen]);

  const handleSaveCustomInstance = () => {
    monochromeApi.setCustomInstance(customInstance);
  };

  const handleSaveBackendGateway = () => {
    monochromeApi.setBackendGateway(backendGateway);
    setGatewaySaved(true);
    setTimeout(() => setGatewaySaved(false), 2000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handlePingInstances = async () => {
    setPinging(true);
    const updated = await Promise.all(
      instances.map(async (inst) => {
        const start = performance.now();
        try {
          // Quick ping check
          await fetch('/api/instances', { method: 'HEAD' });
          const latency = Math.round(performance.now() - start);
          return { ...inst, latency };
        } catch {
          return { ...inst, latency: 999 };
        }
      })
    );
    setInstances(updated);
    setPinging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="settings-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#111216] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-zinc-300" />
            <div>
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wider">Monochrome Settings</h2>
              <p className="text-xs text-zinc-400 font-mono">Stream source engines & audio parameters</p>
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
          {/* Section 1: Audio Quality */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Stream Quality Tier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="quality-tier-high-btn"
                onClick={() => onQualityChange('HIGH')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  audioQuality === 'HIGH'
                    ? 'bg-zinc-900 border-zinc-500 ring-1 ring-zinc-500/40'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-100">HIGH (320 kbps AAC)</span>
                  {audioQuality === 'HIGH' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Fastest buffering, optimal mobile bandwidth, pristine CD-grade audio.
                </p>
              </button>

              <button
                id="quality-tier-lossless-btn"
                onClick={() => onQualityChange('LOSSLESS')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  audioQuality === 'LOSSLESS'
                    ? 'bg-zinc-900 border-zinc-500 ring-1 ring-zinc-500/40'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-100">LOSSLESS (FLAC / Hi-Fi)</span>
                  {audioQuality === 'LOSSLESS' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Bit-perfect studio audio fidelity without perceptual compression.
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Visualizer Engine */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-zinc-300" />
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
                      ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-100'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Monochrome Instances & Sources */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Monochrome Instances & Infrastructure
              </h3>
              <button
                id="ping-instances-btn"
                onClick={handlePingInstances}
                disabled={pinging}
                className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${pinging ? 'animate-spin' : ''}`} />
                Test Latency
              </button>
            </div>

            <div className="space-y-2">
              {instances.map((inst, i) => (
                <div
                  key={i}
                  id={`instance-item-${i}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200">{inst.name}</span>
                      {inst.official && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">{inst.url}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{inst.notes}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {inst.latency !== undefined && (
                      <span className="font-mono text-[11px] text-zinc-400">
                        {inst.latency}ms
                      </span>
                    )}
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Custom Instance Endpoint */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Custom HiFi / Monochrome Endpoint (Optional)
            </h3>
            <div className="flex gap-2">
              <input
                id="custom-instance-input"
                type="text"
                value={customInstance}
                onChange={(e) => setCustomInstance(e.target.value)}
                placeholder="e.g. https://monochrome-api.samidy.com or http://localhost:8080"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                id="save-custom-instance-btn"
                onClick={handleSaveCustomInstance}
                className="px-4 py-2 bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs hover:bg-white cursor-pointer"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Defaults to Monochrome HiFi Direct Engine. Any custom endpoint must implement the Monochrome / HiFi API specification.
            </p>
          </div>

          {/* Section 5: Android APK & Automated GitHub Actions Workflow */}
          <div className="space-y-3 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-200 font-bold">
                Android APK & GitHub Release CI/CD
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-3 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Github className="w-4 h-4 text-white" />
                  Manual Release Workflow Configured
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  .github/workflows/release.yml
                </span>
              </div>

              <p className="text-zinc-400 leading-relaxed text-[11px]">
                You can manually trigger an Android APK release at any time from your GitHub repository under the <strong className="text-zinc-200">Actions</strong> tab.
              </p>

              <div className="space-y-2 bg-zinc-900/90 p-3 rounded-lg border border-zinc-800">
                <p className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  How to trigger a new APK Release:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
                  <li>In your GitHub repo, go to the <strong className="text-zinc-300">Actions</strong> tab.</li>
                  <li>Click <strong className="text-zinc-300">Build & Release Android APK</strong> in the left sidebar.</li>
                  <li>Click the <strong className="text-cyan-400">Run workflow</strong> dropdown button.</li>
                  <li>Type your desired version (e.g. <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">1.0.0</code>) and click <strong className="text-white">Run workflow</strong>.</li>
                  <li>Once complete (~2-3 mins), download the ready-to-install <code className="bg-zinc-800 px-1 py-0.5 rounded text-cyan-300">Monochrome-Audio-v1.0.0.apk</code> from Releases!</li>
                </ol>
              </div>

              {/* Quick Git Export Commands */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-zinc-400">Push project to your GitHub Repo:</span>
                  <button
                    onClick={() => copyToClipboard('git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git\ngit push -u origin main', 'git-cmd')}
                    className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {copiedCmd === 'git-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedCmd === 'git-cmd' ? 'Copied!' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 overflow-x-auto">
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git&#10;git branch -M main&#10;git push -u origin main
                </pre>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Tip: You can also use AI Studio's top-right menu <strong className="text-zinc-400">&quot;Export to GitHub&quot;</strong> or <strong className="text-zinc-400">&quot;Download ZIP&quot;</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Gateway Server URL for Android Native APK */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              APK Backend Gateway (Optional)
            </h3>
            <div className="flex gap-2">
              <input
                id="backend-gateway-input"
                type="text"
                value={backendGateway}
                onChange={(e) => setBackendGateway(e.target.value)}
                placeholder="e.g. https://your-domain.run.app or leave empty for auto-detect"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                id="save-backend-gateway-btn"
                onClick={handleSaveBackendGateway}
                className="px-4 py-2 bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs hover:bg-white cursor-pointer"
              >
                {gatewaySaved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              When installed natively as an APK, this URL handles Tidal authentication and audio proxies if not connecting direct.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
