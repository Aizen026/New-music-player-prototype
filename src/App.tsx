import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Flame,
  Radio,
  Disc,
  Play,
  Heart,
  Clock,
  Trash2,
  ListMusic,
  Plus,
  ListPlus,
  FolderPlus,
  SlidersHorizontal,
  Palette,
  Moon,
  Keyboard,
  Music
} from 'lucide-react';
import {
  Track,
  AlbumBasic,
  ArtistDetail,
  SearchResults,
  RepeatMode,
  VisualizerMode,
  QualityTier,
  AppTheme,
  Playlist,
  EQSettings,
} from './types/monochrome';
import { monochromeApi } from './services/monochromeService';
import { audioEngine, AudioEngineState } from './services/audioEngine';
import {
  CURATED_TRACKS,
  CURATED_ALBUMS,
  QUICK_PICKS_TRACKS,
  TRENDING_TRACKS,
  RECOMMENDED_TRACKS,
  COVERS_REMIXES_TRACKS,
} from './data/defaultTracks';
import { localMusicService } from './services/localMusicService';
import { Navbar } from './components/Navbar';
import { TrackList } from './components/TrackList';
import { NowPlayingBar } from './components/NowPlayingBar';
import { QuickPicksSection } from './components/QuickPicksSection';
import { HorizontalTrackCarousel } from './components/HorizontalTrackCarousel';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AlbumModal } from './components/AlbumModal';
import { ArtistModal } from './components/ArtistModal';
import { SettingsModal } from './components/SettingsModal';
import { QueueDrawer } from './components/QueueDrawer';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { ThemeSwitcherModal } from './components/ThemeSwitcherModal';
import { EqualizerModal } from './components/EqualizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

export default function App() {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<'explore' | 'library' | 'queue' | 'mix' | 'analytics'>('explore');
  const [librarySubTab, setLibrarySubTab] = useState<'favorites' | 'playlists' | 'device' | 'history'>('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'tracks' | 'albums' | 'artists'>('all');
  const [searchResults, setSearchResults] = useState<SearchResults>({ tracks: [], albums: [], artists: [] });

  // Curated Explore Feed - Preloaded with curated studio tracks so library is never empty
  const [featuredHeadline, setFeaturedHeadline] = useState('Silly Player Spotlight');
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>(CURATED_TRACKS);
  const [featuredAlbums, setFeaturedAlbums] = useState<AlbumBasic[]>(CURATED_ALBUMS);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const exploreFileInputRef = useRef<HTMLInputElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  // Queue & Player State
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [audioState, setAudioState] = useState<AudioEngineState>(audioEngine.getState());
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [audioQuality, setAudioQuality] = useState<QualityTier>('HIGH');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [playbackRate, setPlaybackRate] = useState<number>(() => audioEngine.getPlaybackRate());

  // Themes & Appearances
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      return (localStorage.getItem('monochrome_theme') as AppTheme) || 'liquid-glass';
    } catch {
      return 'liquid-glass';
    }
  });

  // Equalizer & Sleep Timer State
  const [currentEQ, setCurrentEQ] = useState<EQSettings>(() => audioEngine.getEQ());
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [sleepTimerMode, setSleepTimerMode] = useState<'minutes' | 'track' | null>(null);

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('monochrome_playlists');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'chill-hifi',
          name: 'Chill & Ambient HiFi',
          description: 'Soothing lossless tracks for late-night listening and deep work',
          tracks: [],
          createdAt: Date.now(),
        },
      ];
    } catch {
      return [];
    }
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreatePlaylistForm, setShowCreatePlaylistForm] = useState(false);

  // Library & Persistence
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('monochrome_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('monochrome_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Drawers
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<number | string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isEQModalOpen, setIsEQModalOpen] = useState(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null);

  // Synchronize audio engine state and sleep timer updates
  useEffect(() => {
    const unsub = audioEngine.subscribe((state) => {
      setAudioState({ ...state });
    });
    audioEngine.onSleepTimerTick = (remaining, mode) => {
      setSleepTimerRemaining(remaining);
      setSleepTimerMode(mode);
    };
    return unsub;
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('monochrome_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  }, [theme]);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('monochrome_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
  }, [favorites]);

  // Save playlists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('monochrome_playlists', JSON.stringify(playlists));
    } catch (e) {
      console.warn('Failed to save playlists:', e);
    }
  }, [playlists]);

  // Save recently played to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('monochrome_history', JSON.stringify(recentlyPlayed.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [recentlyPlayed]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute Search
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults({ tracks: [], albums: [], artists: [] });
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    monochromeApi
      .search(debouncedQuery)
      .then((res) => {
        if (isMounted) {
          setSearchResults(res);
          setIsSearching(false);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        if (isMounted) setIsSearching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Load Curated Featured Tracks & Albums
  useEffect(() => {
    let isMounted = true;
    setLoadingFeatured(true);

    monochromeApi
      .getFeatured()
      .then((feed) => {
        if (isMounted) {
          setFeaturedHeadline(feed.featuredHeadline || 'Silly Player Spotlight');
          setFeaturedTracks(feed.tracks && feed.tracks.length > 0 ? feed.tracks : CURATED_TRACKS);
          setFeaturedAlbums(feed.albums && feed.albums.length > 0 ? feed.albums : CURATED_ALBUMS);
          setLoadingFeatured(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load explore feed:', err);
        if (isMounted) {
          setFeaturedTracks(CURATED_TRACKS);
          setFeaturedAlbums(CURATED_ALBUMS);
          setLoadingFeatured(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Core Play Track Function
  const playTrack = useCallback(
    async (track: Track, fromQueueList?: Track[], indexInQueue?: number) => {
      setCurrentTrack(track);

      // Record in recently played history
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered].slice(0, 30);
      });

      // Update queue context if provided
      if (fromQueueList) {
        setQueue(fromQueueList);
        setCurrentQueueIndex(
          indexInQueue !== undefined ? indexInQueue : fromQueueList.findIndex((t) => t.id === track.id)
        );
      } else {
        // If track played on its own, append to queue if not present
        setQueue((prev) => {
          const idx = prev.findIndex((t) => t.id === track.id);
          if (idx !== -1) {
            setCurrentQueueIndex(idx);
            return prev;
          }
          const next = [...prev, track];
          setCurrentQueueIndex(next.length - 1);
          return next;
        });
      }

      // Stream track via AudioEngine
      try {
        const streamUrl = monochromeApi.getStreamUrl(track, audioQuality);
        await audioEngine.loadAndPlay(streamUrl);
      } catch (err) {
        console.error('Failed to stream track:', err);
      }
    },
    [audioQuality]
  );

  // Import local audio files from device
  const handleImportFiles = useCallback(
    async (files: FileList | File[]) => {
      const imported = await localMusicService.importFiles(files);
      if (imported.length > 0) {
        setLocalTracks((prev) => [...imported, ...prev]);
        setLibrarySubTab('device');
        if (!currentTrack) {
          playTrack(imported[0], imported, 0);
        }
      }
    },
    [currentTrack, playTrack]
  );

  // Play Next Track
  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      audioEngine.seek(0);
      audioEngine.play();
      return;
    }

    let nextIndex = currentQueueIndex + 1;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      playTrack(nextTrack, queue, nextIndex);
    }
  }, [queue, currentQueueIndex, repeatMode, isShuffle, currentTrack, playTrack]);

  // Play Previous Track
  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;

    if (audioState.currentTime > 3) {
      audioEngine.seek(0);
      return;
    }

    let prevIndex = currentQueueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      playTrack(prevTrack, queue, prevIndex);
    }
  }, [queue, currentQueueIndex, audioState.currentTime, playTrack]);

  // Handle Track Ended Event
  const playNextRef = useRef(playNext);
  playNextRef.current = playNext;

  useEffect(() => {
    audioEngine.onTrackEndedCallback = () => {
      playNextRef.current();
    };
  }, []);

  // Queue Operations
  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    if (index === currentQueueIndex) {
      playNext();
    } else if (index < currentQueueIndex) {
      setCurrentQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentQueueIndex(-1);
  };

  // Play Entire Album or Track Array
  const playAlbumTracks = (albumTracks: Track[]) => {
    if (albumTracks.length === 0) return;
    playTrack(albumTracks[0], albumTracks, 0);
  };

  // Favorite Operations
  const isFavorite = useCallback(
    (trackId: number) => favorites.some((t) => t.id === trackId),
    [favorites]
  );

  const toggleFavorite = (track: Track) => {
    setFavorites((prev) => {
      if (prev.some((t) => t.id === track.id)) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleVisualizer = () => {
    setVisualizerMode((prev) => {
      if (prev === 'bars') return 'wave';
      if (prev === 'wave') return 'glow';
      if (prev === 'glow') return 'off';
      return 'bars';
    });
  };

  // Cycle Playback Speed
  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0, 0.75];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = currentIndex !== -1 && currentIndex < rates.length - 1 ? rates[currentIndex + 1] : rates[0];
    audioEngine.setPlaybackRate(nextRate);
    setPlaybackRate(nextRate);
  };

  // Equalizer Change Handler
  const handleEQChange = (eq: EQSettings) => {
    audioEngine.setEQ(eq);
    setCurrentEQ(eq);
  };

  // Sleep Timer Handler
  const handleSetSleepTimer = (minutes: number | null, mode: 'minutes' | 'track' | null) => {
    audioEngine.setSleepTimer(minutes, mode);
    setSleepTimerMode(mode);
    if (!mode) {
      setSleepTimerRemaining(null);
    }
  };

  // Playlist Operations
  const handleCreatePlaylist = (name: string, description?: string) => {
    if (!name.trim()) return;
    const newPl: Playlist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      description: description || 'Custom collection of lossless tracks',
      tracks: [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [newPl, ...prev]);
    setNewPlaylistName('');
    setShowCreatePlaylistForm(false);
  };

  const handleToggleTrackInPlaylist = (playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.tracks.some((t) => t.id === track.id);
        const nextTracks = exists ? pl.tracks.filter((t) => t.id !== track.id) : [...pl.tracks, track];
        return { ...pl, tracks: nextTracks };
      })
    );
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
    }
  };

  const openAddToPlaylist = (track: Track) => {
    setTrackForPlaylist(track);
    setIsAddToPlaylistModalOpen(true);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (audioState.isPlaying) {
            audioEngine.pause();
          } else {
            audioEngine.play();
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault();
            playNext();
          } else {
            e.preventDefault();
            audioEngine.seek(Math.min(audioState.duration, audioState.currentTime + 5));
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault();
            playPrevious();
          } else {
            e.preventDefault();
            audioEngine.seek(Math.max(0, audioState.currentTime - 5));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          audioEngine.setVolume(Math.min(1, audioState.volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          audioEngine.setVolume(Math.max(0, audioState.volume - 0.05));
          break;
        case 'KeyM':
          audioEngine.toggleMute();
          break;
        case 'KeyF':
          setIsFullscreenOpen((prev) => !prev);
          break;
        case 'KeyL':
          if (currentTrack) toggleFavorite(currentTrack);
          break;
        case 'KeyS':
          setIsShuffle((prev) => !prev);
          break;
        case 'KeyR':
          toggleRepeat();
          break;
        case 'KeyE':
          setIsEQModalOpen((prev) => !prev);
          break;
        case 'KeyT':
          setIsThemeModalOpen((prev) => !prev);
          break;
        case 'KeyZ':
          setIsSleepTimerModalOpen((prev) => !prev);
          break;
        case 'KeyQ':
          setIsQueueOpen((prev) => !prev);
          break;
        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault();
            setIsShortcutsModalOpen(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioState.isPlaying, audioState.duration, audioState.currentTime, audioState.volume, currentTrack, playNext, playPrevious]);

  // MediaSession API Integration for Android Notification Shade, Lockscreen & Bluetooth Audio
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      const artworkSrc = currentTrack.album?.cover_big || currentTrack.album?.cover_medium || currentTrack.album?.cover || '/icon.svg';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist.name,
        album: currentTrack.album?.title || 'Monochrome Music',
        artwork: [
          { src: artworkSrc, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '128x128', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '256x256', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '384x384', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    }

    navigator.mediaSession.playbackState = audioState.isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      audioEngine.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioEngine.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrevious();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        audioEngine.seek(details.seekTime);
      }
    });

    if ('setPositionState' in navigator.mediaSession && audioState.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audioState.duration,
          playbackRate: audioState.playbackRate,
          position: Math.min(audioState.currentTime, audioState.duration),
        });
      } catch {}
    }
  }, [currentTrack, audioState.isPlaying, audioState.currentTime, audioState.duration, audioState.playbackRate, playNext, playPrevious]);

  const isLiquid = theme === 'liquid-glass';
  const isLight = theme === 'studio-light';
  const isSapphire = theme === 'midnight-sapphire';
  const isSunset = theme === 'cyber-amber';

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div
      id="app-root"
      className={`min-h-screen relative flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-300 ${
        isLiquid
          ? 'bg-[#07090e] text-zinc-100'
          : isLight
          ? 'bg-[#f8fafc] text-slate-900'
          : isSapphire
          ? 'bg-[#060b18] text-zinc-100'
          : isSunset
          ? 'bg-[#0f090a] text-zinc-100'
          : 'bg-[#09090b] text-zinc-100'
      }`}
    >
      {/* Dynamic Ambient Fluid Mesh for Liquid Glass */}
      {isLiquid && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-cyan-600/35 via-blue-600/25 to-indigo-600/15 blur-[120px] animate-float-orb-1" />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-fuchsia-600/30 via-violet-600/20 to-pink-600/15 blur-[130px] animate-float-orb-2" />
          <div className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full bg-gradient-to-t from-sky-500/25 via-teal-600/20 to-blue-700/15 blur-[140px] animate-float-orb-3" />
        </div>
      )}

      {/* Ambient background for Midnight Sapphire */}
      {isSapphire && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[130px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-700/10 blur-[140px]" />
        </div>
      )}

      {/* Ambient background for Sunset Neon */}
      {isSunset && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-600/10 blur-[130px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-rose-700/10 blur-[140px]" />
        </div>
      )}

      {/* Global Navigation Header */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedPlaylistId(null);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        audioQuality={audioQuality}
        onQualityChange={setAudioQuality}
        isStreaming={audioState.isBuffering || audioState.isPlaying}
        favoritesCount={favorites.length}
        queueCount={queue.length}
        theme={theme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenEQModal={() => setIsEQModalOpen(true)}
        onOpenSleepTimerModal={() => setIsSleepTimerModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        sleepTimerRemaining={sleepTimerRemaining}
        sleepTimerMode={sleepTimerMode}
      />

      {/* Main View Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 pb-44 md:pb-36">
        {searchQuery.trim() ? (
          /* 1. SEARCH RESULTS VIEW */
          <div id="search-results-view" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <h1 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  Search Results for "{searchQuery}"
                </h1>
                <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Monochrome gateway indexing tracks, albums, and master sources
                </p>
              </div>

              {/* Filter Tabs */}
              <div
                className={`flex items-center gap-1 p-1 rounded-xl text-xs font-mono ${
                  isLiquid
                    ? 'liquid-glass-pill'
                    : isLight
                    ? 'bg-slate-200/80 border border-slate-300'
                    : 'bg-zinc-900 border border-zinc-800'
                }`}
              >
                {(['all', 'tracks', 'albums', 'artists'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSearchCategory(cat)}
                    className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                      searchCategory === cat
                        ? isLight
                          ? 'bg-slate-900 text-white font-semibold'
                          : isLiquid
                          ? 'bg-white/30 text-white shadow-inner font-semibold'
                          : 'bg-zinc-100 text-zinc-950 font-bold'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {isSearching ? (
              <div className="py-20 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
                <Disc className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Searching Monochrome catalog...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Track Results */}
                {(searchCategory === 'all' || searchCategory === 'tracks') && searchResults.tracks.length > 0 && (
                  <section id="search-tracks-section" className="space-y-3">
                    <h3 className={`text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-600' : 'text-zinc-400'
                    }`}>
                      <Music className="w-3.5 h-3.5" />
                      Tracks ({searchResults.tracks.length})
                    </h3>
                    <TrackList
                      tracks={searchResults.tracks}
                      currentTrack={currentTrack}
                      isPlaying={audioState.isPlaying}
                      onPlayTrack={(t) => playTrack(t, searchResults.tracks)}
                      onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
                      onAddToQueue={addToQueue}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={isFavorite}
                      onSelectAlbum={setSelectedAlbumId}
                      onSelectArtist={setSelectedArtistId}
                      onOpenAddToPlaylist={openAddToPlaylist}
                      theme={theme}
                    />
                  </section>
                )}

                {/* Album Results */}
                {(searchCategory === 'all' || searchCategory === 'albums') && searchResults.albums.length > 0 && (
                  <section id="search-albums-section" className="space-y-3">
                    <h3 className={`text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-600' : 'text-zinc-400'
                    }`}>
                      <Disc className="w-3.5 h-3.5" />
                      Albums ({searchResults.albums.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {searchResults.albums.map((album) => (
                        <div
                          key={album.id}
                          id={`album-card-${album.id}`}
                          onClick={() => setSelectedAlbumId(album.id!)}
                          className={`group p-3 rounded-2xl transition-all cursor-pointer shadow-sm ${
                            isLiquid
                              ? 'liquid-glass-card hover:scale-[1.02]'
                              : isLight
                              ? 'bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md'
                              : 'bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-2.5">
                            {album.cover ? (
                              <img
                                src={album.cover}
                                alt={album.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <Disc className="w-8 h-8" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="w-6 h-6 fill-white text-white" />
                            </div>
                          </div>
                          <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
                            {album.title}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            {album.artist}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Artist Results */}
                {(searchCategory === 'all' || searchCategory === 'artists') && searchResults.artists.length > 0 && (
                  <section id="search-artists-section" className="space-y-3">
                    <h3 className={`text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-600' : 'text-zinc-400'
                    }`}>
                      <Radio className="w-3.5 h-3.5" />
                      Artists ({searchResults.artists.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {searchResults.artists.map((artist) => (
                        <div
                          key={artist.id}
                          id={`artist-card-${artist.id}`}
                          onClick={() => setSelectedArtistId(artist.id!)}
                          className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                            isLiquid
                              ? 'liquid-glass-card hover:scale-[1.02]'
                              : isLight
                              ? 'bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md'
                              : 'bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-600'
                          }`}
                        >
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 mb-2 border border-zinc-700/60">
                            {artist.picture ? (
                              <img
                                src={artist.picture}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <Radio className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <p className={`text-xs font-bold truncate w-full ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
                            {artist.name}
                          </p>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase mt-0.5">Artist</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {searchResults.tracks.length === 0 &&
                  searchResults.albums.length === 0 &&
                  searchResults.artists.length === 0 && (
                    <div className="py-20 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded-2xl">
                      No results found for "{searchQuery}". Try another keyword or artist.
                    </div>
                  )}
              </div>
            )}
          </div>
        ) : activeTab === 'explore' ? (
          /* 2. CURATED EXPLORE FEED */
          <div id="explore-view" className="space-y-6 sm:space-y-7">
            {/* 1. Quick Picks: High-density 4-row horizontal scrolling grid */}
            <QuickPicksSection
              tracks={QUICK_PICKS_TRACKS}
              currentTrack={currentTrack}
              isPlaying={audioState.isPlaying}
              onPlayTrack={(t, list) => playTrack(t, list)}
              onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
              onAddToQueue={addToQueue}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onStartRadio={(t) => {
                playTrack(t, [...QUICK_PICKS_TRACKS, ...TRENDING_TRACKS, ...RECOMMENDED_TRACKS]);
                setIsShuffle(true);
              }}
            />

            {/* 2. Trending songs for you */}
            <HorizontalTrackCarousel
              id="trending-songs-carousel"
              title="Trending songs for you"
              subtitle="GLOBAL & VIRAL CHARTS"
              tracks={TRENDING_TRACKS}
              currentTrack={currentTrack}
              isPlaying={audioState.isPlaying}
              onPlayTrack={(t, list) => playTrack(t, list)}
              onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onStartRadio={(t) => {
                playTrack(t, [...TRENDING_TRACKS, ...RECOMMENDED_TRACKS]);
                setIsShuffle(true);
              }}
            />

            {/* 3. Recommended for you */}
            <HorizontalTrackCarousel
              id="recommended-songs-carousel"
              title="Recommended for you"
              subtitle="BASED ON YOUR TASTE & GENRES"
              tracks={RECOMMENDED_TRACKS}
              currentTrack={currentTrack}
              isPlaying={audioState.isPlaying}
              onPlayTrack={(t, list) => playTrack(t, list)}
              onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onStartRadio={(t) => {
                playTrack(t, [...RECOMMENDED_TRACKS, ...QUICK_PICKS_TRACKS]);
                setIsShuffle(true);
              }}
            />

            {/* 4. Covers and remixes */}
            <HorizontalTrackCarousel
              id="covers-remixes-carousel"
              title="Covers and remixes"
              subtitle="COMMUNITY CUTS & REWORKS"
              tracks={COVERS_REMIXES_TRACKS}
              currentTrack={currentTrack}
              isPlaying={audioState.isPlaying}
              onPlayTrack={(t, list) => playTrack(t, list)}
              onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onStartRadio={(t) => {
                playTrack(t, [...COVERS_REMIXES_TRACKS, ...TRENDING_TRACKS]);
                setIsShuffle(true);
              }}
            />

            {/* Curated Spotlight Hero Banner */}
            <div
              id="curated-hero"
              className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all ${
                isLiquid
                  ? 'liquid-glass-elevated border-cyan-400/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]'
                  : isLight
                  ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl'
                  : 'bg-gradient-to-br from-zinc-900 via-[#10121a] to-zinc-950 border border-zinc-800/90 shadow-xl'
              }`}
            >
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Curated Spotlight
                  </span>
                  <span className="text-xs font-mono text-zinc-400 uppercase">24-Bit Master FLAC</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
                  {featuredHeadline}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed mb-6 max-w-xl">
                  Hi-Res studio lossless streaming and local device playback with bit-perfect fidelity, 3-band parametric EQ, and Apple Liquid Glass design.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {featuredTracks.length > 0 && (
                    <button
                      id="hero-play-all-btn"
                      onClick={() => playAlbumTracks(featuredTracks)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-100 hover:scale-105 transition-all text-xs cursor-pointer shadow-lg"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      Play Spotlight ({featuredTracks.length})
                    </button>
                  )}
                  <input
                    type="file"
                    ref={exploreFileInputRef}
                    onChange={(e) => {
                      if (e.target.files) handleImportFiles(e.target.files);
                    }}
                    multiple
                    accept="audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg"
                    className="hidden"
                  />
                  <button
                    onClick={() => exploreFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-medium text-xs transition-all cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Import Audio
                  </button>
                  <button
                    onClick={() => setIsThemeModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition-all cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-cyan-300" />
                    Switch Theme
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Albums Carousel */}
            {featuredAlbums.length > 0 && (
              <section id="featured-albums" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 ${
                    isLight ? 'text-slate-600' : 'text-zinc-400'
                  }`}>
                    <Disc className="w-3.5 h-3.5" />
                    Essential High-Fidelity Albums
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5">
                  {featuredAlbums.map((album) => (
                    <div
                      key={album.id}
                      id={`featured-album-${album.id}`}
                      onClick={() => setSelectedAlbumId(album.id!)}
                      className={`group p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shadow-sm ${
                        isLiquid
                          ? 'liquid-glass-card hover:scale-[1.02]'
                          : isLight
                          ? 'bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md'
                          : 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/90'
                      }`}
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2">
                        {album.cover ? (
                          <img
                            src={album.cover}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Disc className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-5 h-5 fill-white text-white" />
                        </div>
                      </div>
                      <p className={`text-[13px] font-semibold truncate leading-tight ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
                        {album.title}
                      </p>
                      <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {album.artist}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
                        <span>{album.releaseDate?.split('-')[0] || 'Album'}</span>
                        <span className="uppercase text-cyan-400 font-bold">{album.audioQuality || 'HiFi'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Tracks Feed */}
            <section id="trending-tracks" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Trending High-Fidelity Tracks
                </h3>
              </div>

              {loadingFeatured ? (
                <div className="py-16 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
                  <Disc className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Connecting to Monochrome stream catalog...</span>
                </div>
              ) : (
                <TrackList
                  tracks={featuredTracks}
                  currentTrack={currentTrack}
                  isPlaying={audioState.isPlaying}
                  onPlayTrack={(t) => playTrack(t, featuredTracks)}
                  onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
                  onAddToQueue={addToQueue}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  onSelectAlbum={setSelectedAlbumId}
                  onSelectArtist={setSelectedArtistId}
                  onOpenAddToPlaylist={openAddToPlaylist}
                  theme={theme}
                />
              )}
            </section>
          </div>
        ) : activeTab === 'mix' ? (
          /* 3. INFINITE RADIO MIX VIEW */
          <div id="mix-view" className="space-y-6">
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              isLiquid ? 'liquid-glass-elevated border-cyan-400/30' : 'bg-zinc-900/60 border-zinc-800'
            }`}>
              <span className="text-[11px] uppercase tracking-widest font-mono text-cyan-400 font-semibold block mb-1">
                LIVE SOUNDSTREAM
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Infinite Mix Station
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                Continuous non-stop playback curated from your Quick Picks, favorite artists, and trending radio streams.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <button
                  onClick={() => {
                    const mixList = [...QUICK_PICKS_TRACKS, ...TRENDING_TRACKS, ...COVERS_REMIXES_TRACKS];
                    playTrack(mixList[Math.floor(Math.random() * mixList.length)], mixList);
                    setIsShuffle(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                >
                  <Radio className="w-4 h-4 text-zinc-950" />
                  Start Dynamic Radio
                </button>

                <button
                  onClick={() => {
                    playTrack(TRENDING_TRACKS[0], TRENDING_TRACKS);
                    setIsShuffle(true);
                  }}
                  className="px-4 py-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition-colors cursor-pointer"
                >
                  Trending Mix
                </button>

                <button
                  onClick={() => {
                    playTrack(COVERS_REMIXES_TRACKS[0], COVERS_REMIXES_TRACKS);
                    setIsShuffle(true);
                  }}
                  className="px-4 py-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition-colors cursor-pointer"
                >
                  Lo-Fi & Remixes
                </button>
              </div>
            </div>

            {/* Quick picks within mix */}
            <QuickPicksSection
              tracks={QUICK_PICKS_TRACKS}
              currentTrack={currentTrack}
              isPlaying={audioState.isPlaying}
              onPlayTrack={(t, list) => playTrack(t, list)}
              onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
              onAddToQueue={addToQueue}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onStartRadio={(t) => {
                playTrack(t, [...QUICK_PICKS_TRACKS, ...TRENDING_TRACKS]);
                setIsShuffle(true);
              }}
            />

            {/* Full mix catalog */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-tight">Queued Radio Recommendations</h2>
              <TrackList
                tracks={[...TRENDING_TRACKS, ...COVERS_REMIXES_TRACKS]}
                currentTrack={currentTrack}
                isPlaying={audioState.isPlaying}
                onPlayTrack={(t) => playTrack(t, [...TRENDING_TRACKS, ...COVERS_REMIXES_TRACKS])}
                onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
                onAddToQueue={addToQueue}
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite}
                onSelectAlbum={setSelectedAlbumId}
                onSelectArtist={setSelectedArtistId}
                onOpenAddToPlaylist={openAddToPlaylist}
                theme={theme}
              />
            </section>
          </div>
        ) : activeTab === 'analytics' ? (
          /* 4. ANALYTICS & EQUALIZER VIEW */
          <div id="analytics-view" className="space-y-6">
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              isLiquid ? 'liquid-glass-elevated border-cyan-400/30' : 'bg-zinc-900/60 border-zinc-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-mono text-emerald-400 font-semibold block mb-1">
                    STUDIO AUDIO ENGINE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Audio FX & Parametric EQ
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                    Real-time parametric equalization, Web Audio spectrum visualizer, and live node latency monitor.
                  </p>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700 cursor-pointer self-start sm:self-auto"
                >
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                  Live Latency Settings
                </button>
              </div>

              {/* Spectrum Visualizer Canvas */}
              <div className="mt-6 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Spectrum Visualizer ({visualizerMode.toUpperCase()})
                  </span>
                  <div className="flex gap-1">
                    {(['bars', 'wave', 'glow'] as VisualizerMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setVisualizerMode(m)}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                          visualizerMode === m ? 'bg-cyan-500 text-zinc-950 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-28 w-full">
                  <AudioVisualizer mode={visualizerMode} isPlaying={audioState.isPlaying} height={112} />
                </div>
              </div>

              {/* 3-Band Parametric Equalizer Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/70 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold">Bass (100Hz)</span>
                    <span className="text-cyan-400">{currentEQ.low > 0 ? `+${currentEQ.low}` : currentEQ.low} dB</span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={currentEQ.low}
                    onChange={(e) => handleEQChange({ ...currentEQ, low: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/70 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold">Mids (1kHz)</span>
                    <span className="text-cyan-400">{currentEQ.mid > 0 ? `+${currentEQ.mid}` : currentEQ.mid} dB</span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={currentEQ.mid}
                    onChange={(e) => handleEQChange({ ...currentEQ, mid: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/70 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold">Treble (10kHz)</span>
                    <span className="text-cyan-400">{currentEQ.high > 0 ? `+${currentEQ.high}` : currentEQ.high} dB</span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={currentEQ.high}
                    onChange={(e) => handleEQChange({ ...currentEQ, high: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'library' ? (
          /* 3. MY LIBRARY / PLAYLISTS / FAVORITES VIEW */
          <div id="library-view" className="space-y-6">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
              isLight ? 'border-slate-200' : 'border-zinc-800'
            }`}>
              <div>
                <h1 className={`text-2xl font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  Music Library
                </h1>
                <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Manage your favorite tracks, custom playlists, and local listening history
                </p>
              </div>

              {/* Library Navigation Sub-Tabs */}
              <div
                className={`flex items-center gap-1 p-1 rounded-xl text-xs font-medium ${
                  isLiquid
                    ? 'liquid-glass-pill'
                    : isLight
                    ? 'bg-slate-200/90 border border-slate-300'
                    : 'bg-zinc-900 border border-zinc-800'
                }`}
              >
                <button
                  onClick={() => {
                    setLibrarySubTab('favorites');
                    setSelectedPlaylistId(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    librarySubTab === 'favorites' && !selectedPlaylistId
                      ? isLight
                        ? 'bg-slate-900 text-white font-bold'
                        : isLiquid
                        ? 'bg-white/30 text-white shadow-inner font-bold'
                        : 'bg-zinc-100 text-zinc-950 font-bold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
                  Favorites ({favorites.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('playlists');
                    setSelectedPlaylistId(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    librarySubTab === 'playlists' || selectedPlaylistId
                      ? isLight
                        ? 'bg-slate-900 text-white font-bold'
                        : isLiquid
                        ? 'bg-white/30 text-white shadow-inner font-bold'
                        : 'bg-zinc-100 text-zinc-950 font-bold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5 text-cyan-400" />
                  Playlists ({playlists.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('device');
                    setSelectedPlaylistId(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    librarySubTab === 'device' && !selectedPlaylistId
                      ? isLight
                        ? 'bg-slate-900 text-white font-bold'
                        : isLiquid
                        ? 'bg-white/30 text-white shadow-inner font-bold'
                        : 'bg-zinc-100 text-zinc-950 font-bold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                  Device Songs ({localTracks.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('history');
                    setSelectedPlaylistId(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    librarySubTab === 'history' && !selectedPlaylistId
                      ? isLight
                        ? 'bg-slate-900 text-white font-bold'
                        : isLiquid
                        ? 'bg-white/30 text-white shadow-inner font-bold'
                        : 'bg-zinc-100 text-zinc-950 font-bold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  History ({recentlyPlayed.length})
                </button>
              </div>
            </div>

            {/* Selected Custom Playlist View */}
            {selectedPlaylist ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <button
                      onClick={() => setSelectedPlaylistId(null)}
                      className="text-xs font-mono text-cyan-400 hover:underline mb-2 inline-block cursor-pointer"
                    >
                      ← Back to All Playlists
                    </button>
                    <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                      {selectedPlaylist.name}
                    </h2>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {selectedPlaylist.description || 'Custom playlist'} • {selectedPlaylist.tracks.length} track{selectedPlaylist.tracks.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedPlaylist.tracks.length > 0 && (
                      <button
                        onClick={() => playAlbumTracks(selectedPlaylist.tracks)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white transition-all text-xs cursor-pointer shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        Play Playlist
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <TrackList
                  tracks={selectedPlaylist.tracks}
                  currentTrack={currentTrack}
                  isPlaying={audioState.isPlaying}
                  onPlayTrack={(t) => playTrack(t, selectedPlaylist.tracks)}
                  onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
                  onAddToQueue={addToQueue}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  onSelectAlbum={setSelectedAlbumId}
                  onSelectArtist={setSelectedArtistId}
                  onOpenAddToPlaylist={openAddToPlaylist}
                  theme={theme}
                  emptyMessage="This playlist is empty. Add songs from Explore or Search using the '+' icon on any track."
                />
              </div>
            ) : librarySubTab === 'playlists' ? (
              /* Playlists Overview Grid */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs uppercase font-mono tracking-wider ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    Your Playlists ({playlists.length})
                  </h3>
                  <button
                    onClick={() => setShowCreatePlaylistForm(!showCreatePlaylistForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    New Playlist
                  </button>
                </div>

                {/* Create Playlist Form Inline */}
                {showCreatePlaylistForm && (
                  <div className={`p-4 rounded-2xl border ${
                    isLiquid
                      ? 'liquid-glass-card'
                      : isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-zinc-900/90 border-zinc-800'
                  }`}>
                    <h4 className="text-sm font-bold mb-2">Create New Playlist</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Playlist title (e.g. Late Night Beats, Workout FLAC)..."
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreatePlaylist(newPlaylistName);
                        }}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none ${
                          isLiquid
                            ? 'liquid-glass-input text-white'
                            : isLight
                            ? 'bg-slate-100 border border-slate-300 text-slate-900'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-100'
                        }`}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCreatePlaylist(newPlaylistName)}
                          className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-white transition-all cursor-pointer"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => setShowCreatePlaylistForm(false)}
                          className="px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => setSelectedPlaylistId(pl.id)}
                      className={`group p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between ${
                        isLiquid
                          ? 'liquid-glass-card hover:scale-[1.02]'
                          : isLight
                          ? 'bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md'
                          : 'bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-105 transition-transform">
                          <ListMusic className="w-6 h-6" />
                        </div>
                        <h4 className={`text-base font-bold truncate ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                          {pl.name}
                        </h4>
                        <p className={`text-xs line-clamp-2 mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          {pl.description || 'Custom playlist'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50 text-[11px] font-mono text-zinc-400">
                        <span>{pl.tracks.length} track{pl.tracks.length === 1 ? '' : 's'}</span>
                        <span className="text-cyan-400 group-hover:underline">Open →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : librarySubTab === 'favorites' ? (
              /* Favorites View */
              <div className="space-y-4">
                {favorites.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      id="library-play-all-btn"
                      onClick={() => playAlbumTracks(favorites)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white transition-all text-xs cursor-pointer shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      Play All Favorites ({favorites.length})
                    </button>
                  </div>
                )}

                <TrackList
                  tracks={favorites}
                  currentTrack={currentTrack}
                  isPlaying={audioState.isPlaying}
                  onPlayTrack={(t) => playTrack(t, favorites)}
                  onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
                  onAddToQueue={addToQueue}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  onSelectAlbum={setSelectedAlbumId}
                  onSelectArtist={setSelectedArtistId}
                  onOpenAddToPlaylist={openAddToPlaylist}
                  theme={theme}
                  emptyMessage="No favorites yet. Click the heart icon on any song to save it to your library."
                />
              </div>
            ) : librarySubTab === 'device' ? (
              /* Device Songs View */
              <div className="space-y-4">
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${
                    isLiquid
                      ? 'liquid-glass-card'
                      : isLight
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800'
                  }`}
                >
                  <div>
                    <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                      <FolderPlus className="w-4 h-4 text-emerald-400" />
                      Local Device Music
                    </h3>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Import your MP3, FLAC, WAV, or M4A audio files from your phone or device to play offline anytime.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="file"
                      ref={libraryFileInputRef}
                      onChange={(e) => {
                        if (e.target.files) handleImportFiles(e.target.files);
                      }}
                      multiple
                      accept="audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg"
                      className="hidden"
                    />
                    <button
                      onClick={() => libraryFileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow"
                    >
                      <Plus className="w-4 h-4" />
                      Import Audio Files
                    </button>
                    {localTracks.length > 0 && (
                      <button
                        onClick={() => playAlbumTracks(localTracks)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white transition-all text-xs cursor-pointer shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        Play All ({localTracks.length})
                      </button>
                    )}
                  </div>
                </div>

                <TrackList
                  tracks={localTracks}
                  currentTrack={currentTrack}
                  isPlaying={audioState.isPlaying}
                  onPlayTrack={(t) => playTrack(t, localTracks)}
                  onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
                  onAddToQueue={addToQueue}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  onSelectAlbum={setSelectedAlbumId}
                  onSelectArtist={setSelectedArtistId}
                  onOpenAddToPlaylist={openAddToPlaylist}
                  theme={theme}
                  emptyMessage="No device songs loaded yet. Tap 'Import Audio Files' above to load music from your device."
                />
              </div>
            ) : (
              /* History View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs uppercase font-mono tracking-wider ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    Recently Streamed ({recentlyPlayed.length})
                  </h3>
                  {recentlyPlayed.length > 0 && (
                    <button
                      id="clear-history-btn"
                      onClick={() => setRecentlyPlayed([])}
                      className="text-[11px] font-mono text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear History
                    </button>
                  )}
                </div>

                <TrackList
                  tracks={recentlyPlayed}
                  currentTrack={currentTrack}
                  isPlaying={audioState.isPlaying}
                  onPlayTrack={(t) => playTrack(t, recentlyPlayed)}
                  onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
                  onAddToQueue={addToQueue}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  onSelectAlbum={setSelectedAlbumId}
                  onSelectArtist={setSelectedArtistId}
                  onOpenAddToPlaylist={openAddToPlaylist}
                  theme={theme}
                  emptyMessage="No listening history yet. Start exploring music to see your past streams here."
                />
              </div>
            )}
          </div>
        ) : (
          /* 4. QUEUE VIEW */
          <div id="queue-view" className="space-y-6">
            <div className={`flex items-center justify-between border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-zinc-800'
            }`}>
              <div>
                <h1 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  Live Playback Queue
                </h1>
                <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  {queue.length} track{queue.length === 1 ? '' : 's'} staged for continuous playback
                </p>
              </div>

              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Queue
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded-2xl">
                The playback queue is empty. Click "+" on any track to stage it here.
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((track, idx) => {
                  const isCurrent = idx === currentQueueIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                        isCurrent
                          ? isLiquid
                            ? 'liquid-glass-elevated border-cyan-400/40 text-white'
                            : isLight
                            ? 'bg-slate-200 text-slate-900 font-medium'
                            : 'bg-zinc-900 border border-zinc-700 text-zinc-100'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-700'
                          : 'hover:bg-zinc-900/50 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs font-mono text-zinc-500 w-5 text-right">{idx + 1}</span>
                        <div
                          onClick={() => playTrack(track, queue, idx)}
                          className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 cursor-pointer"
                        >
                          {track.album?.cover ? (
                            <img src={track.album.cover} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              <Disc className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{track.title}</p>
                          <p className="text-xs text-zinc-400 truncate">{track.artist?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            NOW PLAYING
                          </span>
                        )}
                        <button
                          onClick={() => removeFromQueue(idx)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg cursor-pointer"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Persistent Bottom Audio Player Bar */}
      <NowPlayingBar
        currentTrack={currentTrack}
        isPlaying={audioState.isPlaying}
        isLoading={audioState.isLoading || audioState.isBuffering}
        currentTime={audioState.currentTime}
        duration={audioState.duration}
        volume={audioState.volume}
        isMuted={audioState.isMuted}
        playbackRate={playbackRate}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        visualizerMode={visualizerMode}
        theme={theme}
        onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
        onSeek={(sec) => audioEngine.seek(sec)}
        onPrevious={playPrevious}
        onNext={playNext}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        onVolumeChange={(vol) => audioEngine.setVolume(vol)}
        onToggleMute={() => audioEngine.toggleMute()}
        onCyclePlaybackRate={cyclePlaybackRate}
        onToggleVisualizer={toggleVisualizer}
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
        onOpenAddToPlaylist={() => currentTrack && openAddToPlaylist(currentTrack)}
        onOpenEQ={() => setIsEQModalOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerModalOpen(true)}
        isFavorite={currentTrack ? isFavorite(currentTrack.id) : false}
        onToggleFavorite={() => currentTrack && toggleFavorite(currentTrack)}
        queueLength={queue.length}
      />

      {/* Album Explorer Modal */}
      <AlbumModal
        albumId={selectedAlbumId}
        onClose={() => setSelectedAlbumId(null)}
        currentTrack={currentTrack}
        isPlaying={audioState.isPlaying}
        onPlayTrack={playTrack}
        onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
        onAddToQueue={addToQueue}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        onPlayAlbum={playAlbumTracks}
      />

      {/* Artist Explorer Modal */}
      <ArtistModal
        artistId={selectedArtistId}
        onClose={() => setSelectedArtistId(null)}
        currentTrack={currentTrack}
        isPlaying={audioState.isPlaying}
        onPlayTrack={playTrack}
        onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
        onAddToQueue={addToQueue}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        onSelectAlbum={(albId) => {
          setSelectedArtistId(null);
          setSelectedAlbumId(albId);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioQuality={audioQuality}
        onQualityChange={setAudioQuality}
        visualizerMode={visualizerMode}
        onVisualizerChange={setVisualizerMode}
        onImportFiles={handleImportFiles}
      />

      {/* Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentTrack={currentTrack}
        currentIndex={currentQueueIndex}
        onPlayQueueItem={(idx) => {
          const t = queue[idx];
          if (t) playTrack(t, queue, idx);
        }}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
      />

      {/* Fullscreen Player Mode */}
      <FullscreenPlayer
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        currentTrack={currentTrack}
        isPlaying={audioState.isPlaying}
        currentTime={audioState.currentTime}
        duration={audioState.duration}
        volume={audioState.volume}
        isMuted={audioState.isMuted}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        visualizerMode={visualizerMode}
        theme={theme}
        onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
        onSeek={(sec) => audioEngine.seek(sec)}
        onPrevious={playPrevious}
        onNext={playNext}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        onVolumeChange={(vol) => audioEngine.setVolume(vol)}
        onToggleMute={() => audioEngine.toggleMute()}
        isFavorite={currentTrack ? isFavorite(currentTrack.id) : false}
        onToggleFavorite={() => currentTrack && toggleFavorite(currentTrack)}
      />

      {/* Theme Switcher Modal */}
      <ThemeSwitcherModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
      />

      {/* Equalizer & Audio FX Modal */}
      <EqualizerModal
        isOpen={isEQModalOpen}
        onClose={() => setIsEQModalOpen(false)}
        currentEQ={currentEQ}
        onChangeEQ={handleEQChange}
        theme={theme}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerModalOpen}
        onClose={() => setIsSleepTimerModalOpen(false)}
        activeMode={sleepTimerMode}
        remainingSeconds={sleepTimerRemaining}
        onSetTimer={handleSetSleepTimer}
        theme={theme}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistModalOpen}
        onClose={() => {
          setIsAddToPlaylistModalOpen(false);
          setTrackForPlaylist(null);
        }}
        track={trackForPlaylist}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
        theme={theme}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        theme={theme}
      />
    </div>
  );
}
