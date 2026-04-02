"use client";

import { useState, useRef, useCallback, useEffect } from "react";

import { wisdom } from "@/data/wisdom";

const COUNT = wisdom.length;
const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 7;
const CENTER = Math.floor(VISIBLE_ITEMS / 2);
const DECEL = 0.95;
const MIN_VELOCITY = 0.3;

export default function Wheel() {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isDragging = useRef(false);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizeOffset = (o: number): number => {
    const total = COUNT * ITEM_HEIGHT;
    return ((o % total) + total) % total;
  };

  const getIndex = useCallback((o: number): number => {
    const norm = normalizeOffset(o);
    return Math.round(norm / ITEM_HEIGHT) % COUNT;
  }, []);

  const snapTo = useCallback((o: number): number => {
    const norm = normalizeOffset(o);
    const snapped = Math.round(norm / ITEM_HEIGHT) * ITEM_HEIGHT;
    return snapped;
  }, []);

  const updateOffset = useCallback((newOffset: number) => {
    offsetRef.current = newOffset;
    setOffset(newOffset);
  }, []);

  // Momentum animation
  const animateSnap = useCallback((target: number) => {
    const start = offsetRef.current;
    const dist = target - start;
    if (Math.abs(dist) < 0.5) {
      updateOffset(target);
      return;
    }
    const startTime = performance.now();
    const duration = Math.min(250, 120 + Math.abs(dist) * 2);

    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic

    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      updateOffset(start + dist * ease(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [updateOffset]);

  const animateMomentum = useCallback(() => {
    if (isDragging.current) return;

    const v = velocityRef.current;
    if (Math.abs(v) > MIN_VELOCITY) {
      velocityRef.current *= DECEL;
      updateOffset(offsetRef.current + velocityRef.current);
      rafRef.current = requestAnimationFrame(animateMomentum);
    } else {
      // Snap with smooth animation
      velocityRef.current = 0;
      const snapped = snapTo(offsetRef.current);
      animateSnap(snapped);
    }
  }, [snapTo, updateOffset, animateSnap]);

  // Touch / pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    velocityRef.current = 0;
    lastYRef.current = e.clientY;
    lastTimeRef.current = Date.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const now = Date.now();
    const dt = Math.max(now - lastTimeRef.current, 1);
    const dy = lastYRef.current - e.clientY;

    velocityRef.current = (dy / dt) * 16; // normalize to ~60fps frame
    lastYRef.current = e.clientY;
    lastTimeRef.current = now;

    updateOffset(offsetRef.current + dy);
  }, [updateOffset]);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (Math.abs(velocityRef.current) > MIN_VELOCITY) {
      rafRef.current = requestAnimationFrame(animateMomentum);
    } else {
      const snapped = snapTo(offsetRef.current);
      updateOffset(snapped);
    }
  }, [animateMomentum, snapTo, updateOffset]);

  // Mouse wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const target = snapTo(offsetRef.current + Math.sign(e.deltaY) * ITEM_HEIGHT);
      animateSnap(target);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [snapTo, animateSnap]);

  const goNext = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    animateSnap(snapTo(offsetRef.current + ITEM_HEIGHT));
  }, [snapTo, animateSnap]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        animateSnap(snapTo(offsetRef.current - ITEM_HEIGHT));
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [snapTo, animateSnap, goNext]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const currentIndex = getIndex(offset);

  // Build visible items
  const items: { index: number; posFromCenter: number }[] = [];
  const normOffset = normalizeOffset(offset);
  const baseIndex = Math.round(normOffset / ITEM_HEIGHT);

  for (let i = -CENTER - 1; i <= CENTER + 1; i++) {
    const itemIdx = ((baseIndex + i) % COUNT + COUNT) % COUNT;
    items.push({ index: itemIdx, posFromCenter: i });
  }

  // Fractional sub-item offset for smooth scrolling
  const fractional = (normOffset / ITEM_HEIGHT) - baseIndex;

  return (
    <div className="flex flex-col items-center justify-center min-h-svh w-full select-none">
      {/* Title */}
      <h1 className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 mb-8 font-medium">
        Wheel of 35
      </h1>

      {/* Drum picker */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[340px] overflow-hidden"
        style={{
          height: VISIBLE_ITEMS * ITEM_HEIGHT,
          touchAction: "none",
          cursor: "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Selection highlight band */}
        <div
          className="absolute left-0 right-0 pointer-events-none z-10"
          style={{
            top: CENTER * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
            borderTop: "1px solid #e4e4e7",
            borderBottom: "1px solid #e4e4e7",
          }}
        />

        {/* Fade overlays */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none z-20"
          style={{
            height: CENTER * ITEM_HEIGHT,
            background: "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
          style={{
            height: CENTER * ITEM_HEIGHT,
            background: "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* Items */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: 0,
            willChange: "transform",
          }}
        >
          {items.map(({ index: itemIdx, posFromCenter }) => {
            const y = (posFromCenter - fractional) * ITEM_HEIGHT + CENTER * ITEM_HEIGHT;
            const distFromCenter = Math.abs(posFromCenter - fractional);
            const isSelected = itemIdx === currentIndex;
            const opacity = Math.max(0, 1 - distFromCenter * 0.28);
            // 3D barrel effect
            const rotateX = (posFromCenter - fractional) * -18;
            const scale = 1 - Math.min(distFromCenter * 0.04, 0.2);

            return (
              <div
                key={`${itemIdx}-${posFromCenter}`}
                className="absolute left-0 right-0 flex items-center justify-center px-6"
                style={{
                  height: ITEM_HEIGHT,
                  top: y,
                  opacity,
                  transform: `perspective(800px) rotateX(${rotateX}deg) scale(${scale})`,
                  transformOrigin: "center center",
                  transition: isDragging.current ? "none" : "opacity 0.15s ease",
                  pointerEvents: "none",
                }}
              >
                <span
                  className={`font-mono text-center leading-tight transition-colors duration-150 ${
                    isSelected
                      ? "text-zinc-900 text-[15px] font-semibold"
                      : "text-zinc-400 text-[13px] font-normal"
                  }`}
                >
                  {String(itemIdx + 1).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wisdom text */}
      <div className="mt-8 px-8 max-w-sm min-h-[100px] flex items-start justify-center">
        <p
          key={currentIndex}
          className="text-center text-[17px] leading-relaxed text-zinc-700 font-light animate-fade-in"
        >
          {wisdom[currentIndex]}
        </p>
      </div>

      {/* Counter */}
      <span className="mt-4 text-[11px] text-zinc-400 tracking-[0.2em] font-mono">
        {String(currentIndex + 1).padStart(3, "0")} / {String(COUNT).padStart(3, "0")}
      </span>

      {/* Next button */}
      <button
        onClick={goNext}
        className="mt-6 px-6 py-2.5 text-[13px] font-medium tracking-wide text-zinc-500 border border-zinc-200 rounded-full hover:text-zinc-800 hover:border-zinc-400 active:scale-95 transition-all duration-150"
      >
        Next →
      </button>

      {/* Hint */}
      <p className="mt-4 text-[10px] text-zinc-300 tracking-widest uppercase">
        or drag to explore
      </p>
    </div>
  );
}
