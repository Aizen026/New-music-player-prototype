type AudioEventCallback = (state: AudioEngineState) => void;

export interface AudioEngineState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private listeners: Set<AudioEventCallback> = new Set();
  private state: AudioEngineState = {
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    isMuted: false,
    error: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';
    this.audio.volume = this.state.volume;

    this.audio.addEventListener('loadstart', () => {
      this.updateState({ isLoading: true, error: null });
    });

    this.audio.addEventListener('waiting', () => {
      this.updateState({ isLoading: true });
    });

    this.audio.addEventListener('canplay', () => {
      this.updateState({
        isLoading: false,
        duration: this.audio?.duration || 0,
      });
    });

    this.audio.addEventListener('play', () => {
      this.ensureAudioContext();
      this.updateState({ isPlaying: true, isLoading: false, error: null });
    });

    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.updateState({
          currentTime: this.audio.currentTime,
          duration: Number.isFinite(this.audio.duration) ? this.audio.duration : this.state.duration,
        });
      }
    });

    this.audio.addEventListener('ended', () => {
      this.updateState({ isPlaying: false, currentTime: 0 });
      this.onTrackEndedCallback?.();
    });

    this.audio.addEventListener('error', () => {
      const err = this.audio?.error;
      let msg = 'Playback error occurred';
      if (err) {
        if (err.code === 1) msg = 'Audio loading aborted';
        if (err.code === 2) msg = 'Network connection failed during audio stream';
        if (err.code === 3) msg = 'Audio decode error';
        if (err.code === 4) msg = 'Audio source format not supported';
      }
      this.updateState({ isPlaying: false, isLoading: false, error: msg });
    });
  }

  public onTrackEndedCallback: (() => void) | null = null;

  public ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (this.audioCtx && this.audio && !this.sourceNode) {
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn('AudioContext node connection error:', e);
      }
    }

    return this.audioCtx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public subscribe(cb: AudioEventCallback): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private updateState(partial: Partial<AudioEngineState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(fn => fn(this.state));
  }

  public getState(): AudioEngineState {
    return this.state;
  }

  public async loadAndPlay(streamUrl: string) {
    this.initAudio();
    if (!this.audio) return;

    this.updateState({ isLoading: true, error: null, currentTime: 0 });

    try {
      this.audio.src = streamUrl;
      this.audio.load();
      await this.audio.play();
    } catch (err: any) {
      // Browser autoplay policy might block un-interacted play
      if (err.name === 'NotAllowedError') {
        this.updateState({
          isPlaying: false,
          isLoading: false,
          error: 'Autoplay blocked. Tap play button to start listening.',
        });
      } else {
        this.updateState({
          isPlaying: false,
          isLoading: false,
          error: err.message || 'Failed to play track',
        });
      }
    }
  }

  public async play() {
    if (!this.audio) return;
    this.ensureAudioContext();
    try {
      await this.audio.play();
    } catch (e: any) {
      this.updateState({ error: e.message || 'Could not play audio' });
    }
  }

  public pause() {
    if (!this.audio) return;
    this.audio.pause();
  }

  public seek(seconds: number) {
    if (!this.audio) return;
    try {
      this.audio.currentTime = seconds;
      this.updateState({ currentTime: seconds });
    } catch (e) {
      console.warn('Seek error:', e);
    }
  }

  public setVolume(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = clamped;
    }
    this.updateState({ volume: clamped, isMuted: clamped === 0 });
  }

  public toggleMute() {
    if (!this.audio) return;
    const nextMuted = !this.state.isMuted;
    this.audio.muted = nextMuted;
    this.updateState({ isMuted: nextMuted });
  }
}

export const audioEngine = new AudioEngine();
