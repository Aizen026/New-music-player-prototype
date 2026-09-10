import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Flame,
  Radio,
  Disc,
  Play,
  Heart,
  Clock,
  Music2,
  Trash2,
  Layers
} from 'lucide-react';
import {
  Track,
  AlbumBasic,
  ArtistDetail,
  SearchResults,
  RepeatMode,
  VisualizerMode,
  QualityTier,
} from './types/monochrome';
import { monochromeApi } from './services/monochromeService';
import { audioEngine, AudioEngineState } from './services/audioEngine';
import { Navbar } from './components/Navbar';
import { TrackList } from './components/TrackList';
import { NowPlayingBar } from './components/NowPlayingBar';
import { AlbumModal } from './components/AlbumModal';
import { ArtistModal } from './components/ArtistModal';
import { SettingsModal } from './components/SettingsModal';
import { QueueDrawer } from './components/QueueDrawer';
import { FullscreenPlayer } from './components/FullscreenPlayer';

export default function App() {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<'explore' | 'library' | 'queue'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'tracks' | 'albums' | 'artists'>('all');
  const [searchResults, setSearchResults] = useState<SearchResults>({ tracks: [], albums: [], artists: [] });

  // Curated Explore Feed
  const [featuredHeadline, setFeaturedHeadline] = useState('Monochrome Spotlight');
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [featuredAlbums, setFeaturedAlbums] = useState<AlbumBasic[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Queue & Player State
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [audioState, setAudioState] = useState<AudioEngineState>(audioEngine.getState());
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [audioQuality, setAudioQuality] = useState<QualityTier>('HIGH');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

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

  // Synchronize audio engine state
  useEffect(() => {
    const unsub = audioEngine.subscribe((state) => {
      setAudioState({ ...state });
    });
    return unsub;
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('monochrome_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
  }, [favorites]);

  // Save recently played to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('monochrome_history', JSON.stringify(recentlyPlayed.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [recentlyPlayed]);

  // Load initial featured feed
  useEffect(() => {
    setLoadingFeatured(true);
    monochromeApi
      .getFeatured()
      .then((data) => {
        setFeaturedHeadline(data.featuredHeadline);
        setFeaturedTracks(data.tracks);
        setFeaturedAlbums(data.albums);
        setLoadingFeatured(false);
      })
      .catch((e) => {
        console.warn('Error loading featured feed:', e);
        setLoadingFeatured(false);
      });
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults({ tracks: [], albums: [], artists: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    monochromeApi
      .search(debouncedQuery, 30)
      .then((results) => {
        setSearchResults(results);
        setIsSearching(false);
      })
      .catch((e) => {
        console.error('Search error:', e);
        setIsSearching(false);
      });
  }, [debouncedQuery]);

  // Core Play Track Function
  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[], startIndex?: number) => {
      let targetQueue = newQueue || queue;
      let targetIndex = startIndex !== undefined ? startIndex : targetQueue.findIndex((t) => t.id === track.id);

      if (targetIndex === -1) {
        targetQueue = [...targetQueue, track];
        targetIndex = targetQueue.length - 1;
      }

      setQueue(targetQueue);
      setCurrentQueueIndex(targetIndex);
      setCurrentTrack(track);

      // Add to history
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered];
      });

      // Stream track via Monochrome API
      const streamUrl = monochromeApi.getStreamUrl(track.id, audioQuality);
      await audioEngine.loadAndPlay(streamUrl);
    },
    [queue, audioQuality]
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

  const genrePresets = [
    { label: 'Electronic', query: 'Daft Punk Kraftwerk Justice' },
    { label: 'Synthwave', query: 'Kavinsky Perturbator Carpenter Brut' },
    { label: 'Hip Hop', query: 'Kendrick Lamar Travis Scott MF DOOM' },
    { label: 'Classic Rock', query: 'Pink Floyd Led Zeppelin Queen' },
    { label: 'Ambient / Chill', query: 'Brian Eno Tycho Aphex Twin' },
    { label: 'Modern Pop', query: 'The Weeknd Dua Lipa Billie Eilish' },
    { label: 'Film Scores', query: 'Hans Zimmer Ennio Morricone Ludwig Göransson' },
  ];

  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 flex flex-col font-sans selection:bg-zinc-100 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        audioQuality={audioQuality}
        onQualityChange={setAudioQuality}
        isStreaming={audioState.isPlaying}
        favoritesCount={favorites.length}
        queueCount={queue.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 pb-28">
        {/* Error notification banner if any */}
        {audioState.error && (
          <div
            id="player-error-banner"
            className="mb-6 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs font-mono flex items-center justify-between"
          >
            <span>{audioState.error}</span>
            <button
              onClick={() => currentTrack && playTrack(currentTrack)}
              className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. SEARCH RESULTS VIEW */}
        {debouncedQuery ? (
          <div id="search-view" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
                  <span>Results for "{debouncedQuery}"</span>
                  {isSearching && <span className="text-xs font-mono text-cyan-400 font-normal">Searching Monochrome...</span>}
                </h1>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Source: Monochrome Tidal Hi-Fi Catalog
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'tracks', 'albums', 'artists'] as const).map((cat) => (
                  <button
                    key={cat}
                    id={`search-filter-${cat}-btn`}
                    onClick={() => setSearchCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer ${
                      searchCategory === cat
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tracks Section */}
            {(searchCategory === 'all' || searchCategory === 'tracks') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-zinc-300" />
                    Tracks ({searchResults.tracks.length})
                  </h2>
                </div>
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
                  emptyMessage="No tracks matched your search query."
                />
              </div>
            )}

            {/* Albums Section */}
            {(searchCategory === 'all' || searchCategory === 'albums') && searchResults.albums.length > 0 && (
              <div className="space-y-3 pt-4">
                <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-zinc-300" />
                  Albums ({searchResults.albums.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {searchResults.albums.map((album) => (
                    <div
                      key={album.id}
                      id={`album-card-${album.id}`}
                      onClick={() => setSelectedAlbumId(album.id!)}
                      className="group p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/90 transition-all cursor-pointer shadow-sm"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2.5">
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
                      <p className="text-sm font-semibold text-zinc-200 truncate">{album.title}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{album.artist}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1">
                        <span>{album.releaseDate?.split('-')[0] || 'Album'}</span>
                        <span className="uppercase text-zinc-400">{album.audioQuality || 'HiFi'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artists Section */}
            {(searchCategory === 'all' || searchCategory === 'artists') && searchResults.artists.length > 0 && (
              <div className="space-y-3 pt-4">
                <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-300" />
                  Artists ({searchResults.artists.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.artists.map((artist: ArtistDetail) => (
                    <div
                      key={artist.id}
                      id={`artist-card-${artist.id}`}
                      onClick={() => setSelectedArtistId(artist.id)}
                      className="group p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/90 transition-all cursor-pointer text-center"
                    >
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-zinc-800 mb-2.5 border border-zinc-700/60">
                        {artist.picture ? (
                          <img
                            src={artist.picture}
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Music2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-zinc-200 truncate">{artist.name}</p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Artist</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'explore' ? (
          /* 2. EXPLORE FEED VIEW */
          <div id="explore-view" className="space-y-10">
            {/* Spotlight Hero Banner */}
            <section
              id="spotlight-hero"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 border border-zinc-800/90 p-6 sm:p-8"
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Lossless Hi-Fi Engine
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Source: monochrome.tf</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                    {featuredHeadline}
                  </h1>

                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Stream high-resolution master audio directly through Monochrome's authenticated playback network.
                    Explore albums, track waveforms, sync lyrics, and curate your queue.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {featuredTracks.length > 0 && (
                      <button
                        id="hero-play-featured-btn"
                        onClick={() => playAlbumTracks(featuredTracks)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white hover:scale-105 transition-all shadow-lg cursor-pointer text-sm"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                        Play Spotlight Selection
                      </button>
                    )}

                    <button
                      id="hero-explore-queue-btn"
                      onClick={() => setIsQueueOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-sm font-medium transition-colors cursor-pointer"
                    >
                      View Live Queue ({queue.length})
                    </button>
                  </div>
                </div>

                {/* Hero Mini Album Art Mosaic */}
                {featuredAlbums.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5 w-full md:w-56 flex-shrink-0">
                    {featuredAlbums.slice(0, 4).map((alb) => (
                      <div
                        key={alb.id}
                        id={`hero-album-thumb-${alb.id}`}
                        onClick={() => setSelectedAlbumId(alb.id!)}
                        className="aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/60 group cursor-pointer relative shadow"
                      >
                        {alb.cover && (
                          <img
                            src={alb.cover}
                            alt={alb.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-5 h-5 fill-white text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Quick Genre & Presets Search Buttons */}
            <section id="genre-spotlights" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-zinc-300" />
                  Genre & Vibe Spotlights
                </h3>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {genrePresets.map((genre) => (
                  <button
                    key={genre.label}
                    id={`genre-btn-${genre.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setSearchQuery(genre.query)}
                    className="flex-shrink-0 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-medium"
                  >
                    {genre.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Featured Albums Carousel / Shelf */}
            {featuredAlbums.length > 0 && (
              <section id="featured-albums" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-zinc-300" />
                    Iconic Albums
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {featuredAlbums.map((album) => (
                    <div
                      key={album.id}
                      id={`featured-album-card-${album.id}`}
                      onClick={() => setSelectedAlbumId(album.id!)}
                      className="group p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/90 transition-all cursor-pointer shadow-sm"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2.5">
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
                      <p className="text-sm font-semibold text-zinc-200 truncate">{album.title}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{album.artist}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1">
                        <span>{album.releaseDate?.split('-')[0] || 'Album'}</span>
                        <span className="uppercase text-zinc-400">{album.audioQuality || 'HiFi'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Tracks Feed */}
            <section id="trending-tracks" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-zinc-300" />
                  Trending High-Fidelity Tracks
                </h3>
              </div>

              {loadingFeatured ? (
                <div className="py-16 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
                  <Disc className="w-4 h-4 animate-spin" />
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
                />
              )}
            </section>
          </div>
        ) : activeTab === 'library' ? (
          /* 3. MY LIBRARY / FAVORITES VIEW */
          <div id="library-view" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400 fill-current" />
                  My Favorites ({favorites.length})
                </h1>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Saved lossless tracks stored locally in your browser
                </p>
              </div>

              {favorites.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    id="library-play-all-btn"
                    onClick={() => playAlbumTracks(favorites)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white transition-all text-xs cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    Play All
                  </button>
                </div>
              )}
            </div>

            {/* Favorite Tracks */}
            <div className="space-y-3">
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
                emptyMessage="No favorites yet. Click the heart icon on any song to save it to your library."
              />
            </div>

            {/* Recently Played History */}
            {recentlyPlayed.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-300" />
                    Recently Played History ({recentlyPlayed.length})
                  </h3>
                  <button
                    id="clear-history-btn"
                    onClick={() => setRecentlyPlayed([])}
                    className="text-[11px] font-mono text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear History
                  </button>
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
                />
              </div>
            )}
          </div>
        ) : (
          /* 4. QUEUE VIEW */
          <div id="queue-view" className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-100">Live Playback Queue</h1>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {queue.length} track{queue.length === 1 ? '' : 's'} staged for continuous playback
                </p>
              </div>

              {queue.length > 0 && (
                <button
                  id="page-queue-clear-btn"
                  onClick={clearQueue}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>

            <TrackList
              tracks={queue}
              currentTrack={currentTrack}
              isPlaying={audioState.isPlaying}
              onPlayTrack={(t, idx) => playTrack(t, queue, idx)}
              onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
              onAddToQueue={addToQueue}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onSelectAlbum={setSelectedAlbumId}
              onSelectArtist={setSelectedArtistId}
              emptyMessage="Your playback queue is empty. Click '+' or play any album to queue up music."
            />
          </div>
        )}
      </main>

      {/* Sticky Bottom Now Playing Bar */}
      <NowPlayingBar
        currentTrack={currentTrack}
        isPlaying={audioState.isPlaying}
        isLoading={audioState.isLoading}
        currentTime={audioState.currentTime}
        duration={audioState.duration}
        volume={audioState.volume}
        isMuted={audioState.isMuted}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        visualizerMode={visualizerMode}
        onTogglePlay={() => (audioState.isPlaying ? audioEngine.pause() : audioEngine.play())}
        onSeek={(sec) => audioEngine.seek(sec)}
        onPrevious={playPrevious}
        onNext={playNext}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        onVolumeChange={(vol) => audioEngine.setVolume(vol)}
        onToggleMute={() => audioEngine.toggleMute()}
        onToggleVisualizer={toggleVisualizer}
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
        isFavorite={currentTrack ? isFavorite(currentTrack.id) : false}
        onToggleFavorite={() => currentTrack && toggleFavorite(currentTrack)}
        queueLength={queue.length}
      />

      {/* Album Modal */}
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

      {/* Artist Modal */}
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
    </div>
  );
}
