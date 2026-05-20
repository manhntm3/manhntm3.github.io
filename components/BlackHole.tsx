"use client";

import { useEffect, useRef, useState } from "react";
import { createCamera, setupCameraControls } from "@/lib/blackhole/camera";
import { BlackHoleRenderer } from "@/lib/blackhole/blackhole";

type Props = {
  className?: string;
};

export default function BlackHole({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);
  const rafRef = useRef<number | null>(null);

  const [status, setStatus] = useState("Starting…");
  const [fps, setFps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let cancelled = false;
    let teardownControls: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const camera = createCamera();
    const renderer = new BlackHoleRenderer({
      canvas,
      camera,
      onStatus: (m) => {
        if (!cancelled) setStatus(m);
      },
    });
    rendererRef.current = renderer;

    let startTime = performance.now();
    let lastFrame = startTime;
    let frameCount = 0;

    const loop = () => {
      if (cancelled) return;
      const now = performance.now();
      const delta = (now - lastFrame) / 1000;
      lastFrame = now;
      frameCount++;

      if (frameCount % 30 === 0 && delta > 0) {
        setFps(Math.round(1 / delta));
      }

      renderer.render((now - startTime) / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        await renderer.init();
        if (cancelled) return;

        teardownControls = setupCameraControls(canvas, camera);

        resizeObserver = new ResizeObserver(() => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            try {
              renderer.resize();
            } catch (e) {
              console.error(e);
            }
          }, 100);
        });
        resizeObserver.observe(container);

        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      teardownControls?.();
      renderer.destroy?.();
      rendererRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black ${className ?? ""}`}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
      />
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md mono text-sm text-red-300 border border-red-900/50 bg-red-950/40 rounded p-4">
            <p className="mb-2 font-semibold">WebGPU error</p>
            <p className="text-red-200/70 text-xs leading-relaxed break-words">
              {error}
            </p>
            <p className="mt-3 text-[var(--color-muted)] text-xs">
              Try a recent Chrome, Edge, or Safari with WebGPU enabled.
            </p>
          </div>
        </div>
      ) : (
        <div className="absolute top-3 left-3 mono text-[11px] text-[var(--color-muted)] bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
          <span className="text-[var(--color-accent)]">●</span> {status}
          {fps !== null && (
            <span className="ml-3 text-[var(--color-dim)]">{fps} fps</span>
          )}
        </div>
      )}
      <div className="absolute bottom-3 right-3 mono text-[10px] text-white/40 select-none">
        drag · scroll
      </div>
    </div>
  );
}
