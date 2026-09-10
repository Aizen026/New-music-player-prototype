import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types/monochrome';

interface AudioVisualizerProps {
  mode?: VisualizerMode;
  isPlaying?: boolean;
  className?: string;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode = 'bars',
  isPlaying = false,
  className = '',
  height = 48,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'off') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle container resizing with ResizeObserver
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = (height || rect.height || 48) * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(container);

    let idlePhase = 0;

    const render = () => {
      animIdRef.current = requestAnimationFrame(render);
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const h = height || rect.height || 48;

      ctx.clearRect(0, 0, width, h);

      const analyser = audioEngine.getAnalyser();

      if (analyser && isPlaying) {
        if (mode === 'bars') {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          const barCount = Math.min(48, Math.floor(width / 6));
          const barWidth = Math.max(2, (width / barCount) - 2);
          const step = Math.floor(bufferLength / barCount);

          for (let i = 0; i < barCount; i++) {
            const val = dataArray[i * step] / 255;
            const barHeight = Math.max(3, val * (h - 6));
            const x = i * (barWidth + 2);
            const y = h - barHeight;

            // Sleek monochrome styling: brighter white tops, cool metallic base
            const grad = ctx.createLinearGradient(0, y, 0, h);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(1, 'rgba(160, 160, 175, 0.25)');

            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        } else if (mode === 'wave') {
          const bufferLength = analyser.fftSize;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteTimeDomainData(dataArray);

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(240, 240, 245, 0.85)';
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        } else if (mode === 'glow') {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < 30; i++) sum += dataArray[i];
          const energy = (sum / 30) / 255;

          const activeWidth = width * Math.min(1, Math.max(0.1, energy * 1.4));
          const grad = ctx.createLinearGradient(0, 0, activeWidth, 0);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

          ctx.fillStyle = grad;
          ctx.fillRect(0, h / 2 - 2, activeWidth, 4);
        }
      } else {
        // Subtle ambient idle state when paused or buffering
        idlePhase += 0.04;
        const barCount = Math.min(36, Math.floor(width / 8));
        const barWidth = Math.max(2, (width / barCount) - 3);

        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(idlePhase + i * 0.25) * 0.5 + 0.5;
          const barHeight = isPlaying ? 4 + wave * 8 : 3;
          const x = i * (barWidth + 3);
          const y = h - barHeight;

          ctx.fillStyle = isPlaying ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }
    };

    render();

    return () => {
      observer.disconnect();
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, [mode, isPlaying, height]);

  if (mode === 'off') return null;

  return (
    <div
      id="audio-visualizer-container"
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <canvas
        id="audio-visualizer-canvas"
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
