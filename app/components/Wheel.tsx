"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wisdom } from "@/data/wisdom";

export default function Wheel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  const next = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setDirection(1);
    setRotation((r) => r - 360);
    setTimeout(() => {
      setIndex((i) => (i + 1) % wisdom.length);
      setSpinning(false);
    }, 600);
  }, [spinning]);

  const prev = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setDirection(-1);
    setRotation((r) => r + 360);
    setTimeout(() => {
      setIndex((i) => (i - 1 + wisdom.length) % wisdom.length);
      setSpinning(false);
    }, 600);
  }, [spinning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) {
      dy < 0 ? next() : prev();
    } else if (Math.abs(dx) > 40) {
      dx > 0 ? next() : prev();
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-svh w-full select-none px-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Wheel ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-zinc-200 flex items-center justify-center cursor-pointer"
          onClick={next}
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
        tap the wheel or swipe
      </p>
    </div>
  );
}
