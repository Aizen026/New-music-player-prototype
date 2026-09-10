import React from 'react';
import { X, Trash2, Play, Music, Disc } from 'lucide-react';
import { Track } from '../types/monochrome';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
  currentIndex: number;
  onPlayQueueItem: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrack,
  currentIndex,
  onPlayQueueItem,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="queue-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        id="queue-drawer-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-[#101115] border-l border-zinc-800 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Playback Queue</h3>
            <span className="text-xs font-mono text-zinc-400">({queue.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                id="queue-clear-btn"
                onClick={onClearQueue}
                className="p-1.5 text-xs text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear queue"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              id="queue-drawer-close-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close queue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 divide-y divide-zinc-800/60">
          {/* Now Playing section */}
          {currentTrack && (
            <div className="space-y-2 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Now Playing</span>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  {currentTrack.album?.cover ? (
                    <img src={currentTrack.album.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Disc className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-100 truncate">{currentTrack.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{currentTrack.artist?.name}</p>
                </div>
                <div className="flex items-end gap-0.5 h-3 pr-2">
                  <span className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite_100ms] h-full" />
                  <span className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite_300ms] h-full" />
                  <span className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite_200ms] h-full" />
                </div>
              </div>
            </div>
          )}

          {/* Next Up section */}
          <div className="space-y-2 pt-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Up Next</span>

            {queue.length === 0 ? (
              <p className="text-xs font-mono text-zinc-500 py-8 text-center">Queue is empty.</p>
            ) : (
              <div className="space-y-1">
                {queue.map((track, idx) => {
                  const isTrackActive = idx === currentIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      id={`queue-item-${idx}`}
                      className={`group flex items-center justify-between p-2 rounded-xl transition-colors ${
                        isTrackActive ? 'bg-zinc-800/80 border border-zinc-700' : 'hover:bg-zinc-900/60'
                      }`}
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => onPlayQueueItem(idx)}
                      >
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                          {track.album?.cover ? (
                            <img src={track.album.cover} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              <Disc className="w-4 h-4" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 fill-white text-white" />
                          </div>
                        </div>

                        <div className="min-w-0 pr-2">
                          <p className={`text-xs font-semibold truncate ${isTrackActive ? 'text-zinc-100' : 'text-zinc-300'}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">{track.artist?.name}</p>
                        </div>
                      </div>

                      <button
                        id={`queue-remove-${idx}`}
                        onClick={() => onRemoveFromQueue(idx)}
                        className="p-1.5 text-zinc-600 hover:text-rose-400 rounded-md opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
