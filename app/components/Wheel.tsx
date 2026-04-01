"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wisdom } from "@/data/wisdom";

const ITEM_ANGLE = 360 / wisdom.length;

export default function Wheel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [animDuration, setAnimDuration] = useState(0.6);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const spinTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const advance = useCallback(
    (steps: number) => {
      if (spinning || steps === 0) return;
      const dir = steps > 0 ? 1 : -1;
      const absSteps = Math.abs(steps);
      const dur = Math.min(0.4 + absSteps * 0.02, 1.4);

      if (spinTimer.current) clearTimeout(spinTimer.current);
      setSpinning(true);
      setDirection(dir);
      setAnimDuration(dur);
      setRotation((r) => r - steps * ITEM_ANGLE);

      spinTimer.current = setTimeout(() => {
        setIndex(
          (i) => ((i + steps) % wisdom.length + wisdom.length) % wisdom.length
        );
        setSpinning(false);
      }, dur * 1000);
    },
    [spinning]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dt = Math.max(Date.now() - touchStartTime.current, 1);

    let primaryDelta: number;
    let dir: number;

    if (Math.abs(dy) > Math.abs(dx)) {
      if (Math.abs(dy) < 20) return;
      primaryDelta = Math.abs(dy);
      dir = dy < 0 ? 1 : -1;
    } else {
      if (Math.abs(dx) < 20) return;
      primaryDelta = Math.abs(dx);
      dir = dx > 0 ? 1 : -1;
    }

    const velocity = primaryDelta / dt; // px/ms
    const steps = Math.max(1, Math.min(Math.round(velocity * 12), 50));
    advance(steps * dir);
  };

  // Mouse wheel / scroll support for desktop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let accumulated = 0;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      accumulated += e.deltaY;

      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const steps = Math.round(accumulated / 40);
        if (steps !== 0) advance(steps);
        accumulated = 0;
      }, 80);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [advance]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-svh w-full select-none px-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Wheel ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: animDuration, ease: [0.23, 1, 0.32, 1] }}
          className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-zinc-200 flex items-center justify-center cursor-pointer"
          onClick={() => advance(1)}
        >
          {/* Tick marks around the wheel */}
          {Array.from({ length: 100 }).map((_, i) => {
            const angle = (i * 360) / 100;
            const isActive = i === index;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: "center",
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                }}
              >
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-0 transition-all duration-300 ${
                    isActive
                      ? "w-[3px] h-4 bg-zinc-900 rounded-full"
                      : "w-[1.5px] h-2 bg-zinc-300 rounded-full"
                  }`}
                />
              </div>
            );
          })}

          {/* Center dot */}
          <div className="w-2 h-2 bg-zinc-900 rounded-full" />
        </motion.div>
      </div>

      {/* Text display */}
      <div className="mt-10 max-w-sm sm:max-w-md min-h-[120px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: direction * 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction * -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center text-lg sm:text-xl leading-relaxed text-zinc-800 font-light"
          >
            {wisdom[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Counter */}
      <motion.span
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 text-xs text-zinc-400 tracking-widest font-mono"
      >
        {String(index + 1).padStart(3, "0")} / 100
      </motion.span>

      {/* Hint */}
      <p className="mt-8 text-[11px] text-zinc-300 tracking-wide">
        tap · swipe · scroll
      </p>
    </div>
  );
}
