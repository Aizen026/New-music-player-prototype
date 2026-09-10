import React, { useState } from 'react';
import { X, Plus, ListMusic, Check } from 'lucide-react';
import { Track, Playlist, AppTheme } from '../types/monochrome';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onCreatePlaylist: (name: string) => Playlist;
  onToggleTrackInPlaylist: (playlistId: string, track: Track) => void;
  theme: AppTheme;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onCreatePlaylist,
  onToggleTrackInPlaylist,
  theme,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !track) return null;

  const isLiquid = theme === 'liquid-glass';
  const isLight = theme === 'studio-light';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = onCreatePlaylist(newPlaylistName.trim());
    onToggleTrackInPlaylist(created.id, track);
    setNewPlaylistName('');
    setIsCreating(false);
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
            <div className={`p-2 rounded-xl ${isLiquid ? 'bg-white/15' : isLight ? 'bg-slate-100 text-slate-800' : 'bg-zinc-900 text-cyan-400'}`}>
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Add to Playlist</h3>
              <p className={`text-[11px] truncate max-w-[200px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                {track.title} • {track.artist.name}
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

        {/* Existing Playlists list */}
        <div className="py-3 space-y-1.5 max-h-60 overflow-y-auto">
          {playlists.length === 0 && !isCreating ? (
            <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
              No custom playlists created yet. Create your first playlist below!
            </div>
          ) : (
            playlists.map((pl) => {
              const inPlaylist = pl.tracks.some((t) => t.id === track.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => onToggleTrackInPlaylist(pl.id, track)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    inPlaylist
                      ? isLight
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : isLiquid
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-900 text-cyan-400 font-semibold border border-zinc-700'
                      : isLight
                      ? 'hover:bg-slate-50 text-slate-700'
                      : isLiquid
                      ? 'hover:bg-white/10 text-zinc-300'
                      : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold">{pl.name}</div>
                    <div className="text-[10px] opacity-70">{pl.tracks.length} tracks</div>
                  </div>
                  {inPlaylist ? (
                    <div className="w-5 h-5 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-current opacity-40" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create new playlist form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="pt-2 border-t border-white/10 space-y-2">
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                  : isLiquid
                  ? 'liquid-glass-input text-white focus:border-cyan-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-600'
              }`}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isLight ? 'bg-slate-900 text-white' : 'bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                }`}
              >
                Create & Add
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className={`px-3 py-2 rounded-xl text-xs cursor-pointer ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-zinc-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-3 border-t border-white/10">
            <button
              onClick={() => setIsCreating(true)}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : isLiquid
                  ? 'bg-white/15 hover:bg-white/25 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
