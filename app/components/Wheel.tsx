"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wisdom } from "@/data/wisdom";

const COUNT = wisdom.length;
const ITEM_ANGLE = 360 / COUNT;

function getAngleFromCenter(
  cx: number,
  cy: number,
  px: number,
  py: number
): number {
  return Math.atan2(py - cy, px - cx) * (180 / Math.PI);
}

function normalizeIndex(i: number): number {
  return ((i % COUNT) + COUNT) % COUNT;
}

export default function Wheel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [rotation, setRotation] = useState(0);

  // For momentum after drag release
  const [momentum, setMomentum] = useState<{
    velocity: number;
    startRotation: number;
    targetRotation: number;
  } | null>(null);

  const isDragging = useRef(false);
  const dragStartAngle = useRef(0);
  const dragStartRotation = useRef(0);
  const lastAngle = useRef(0);
  const velocity = useRef(0);
  const lastTime = useRef(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCenter = useCallback(() => {
    const el = wheelRef.current;
    if (!el) return { cx: 0, cy: 0 };
    const rect = el.getBoundingClientRect();
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
  }, []);

  // Snap rotation to nearest item and update index
  const snapToNearest = useCallback(
    (currentRotation: number, vel: number) => {
      // Add momentum: coast based on velocity
      const coast = vel * 8;
      const targetRaw = currentRotation + coast;
      const snapped =
        Math.round(targetRaw / ITEM_ANGLE) * ITEM_ANGLE;
      const newIndex = normalizeIndex(Math.round(-snapped / ITEM_ANGLE));
      const dir = snapped < currentRotation ? 1 : -1;

      setDirection(dir);
      setMomentum({
        velocity: Math.abs(vel),
        startRotation: currentRotation,
        targetRotation: snapped,
      });
      setRotation(snapped);
      setIndex(newIndex);
    },
    []
  );

  // --- Pointer (touch + mouse) drag handlers ---
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Don't start drag on tick tap (handled separately)
      isDragging.current = false;
      const { cx, cy } = getCenter();
      const angle = getAngleFromCenter(cx, cy, e.clientX, e.clientY);
      dragStartAngle.current = angle;
      dragStartRotation.current = rotation;
      lastAngle.current = angle;
      velocity.current = 0;
      lastTime.current = Date.now();
      setMomentum(null);

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getCenter, rotation]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!e.buttons && e.pointerType !== "touch") return;
      const { cx, cy } = getCenter();
      const angle = getAngleFromCenter(cx, cy, e.clientX, e.clientY);

      // Detect if we've actually started dragging (threshold)
      const totalDelta = angle - dragStartAngle.current;
      if (!isDragging.current && Math.abs(totalDelta) < 2) return;
      isDragging.current = true;

      // Handle angle wrap-around
      let delta = angle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const now = Date.now();
      const dt = Math.max(now - lastTime.current, 1);
      velocity.current = delta / dt; // degrees per ms
      lastTime.current = now;
      lastAngle.current = angle;

      setRotation((r) => r + delta);
    },
    [getCenter]
  );

  const onPointerUp = useCallback(() => {
    if (isDragging.current) {
      snapToNearest(rotation, velocity.current);
    }
    isDragging.current = false;
  }, [rotation, snapToNearest]);

  // --- Tap on a tick mark to jump ---
  const handleTickTap = useCallback(
    (tickIndex: number) => {
      if (isDragging.current) return;
      const diff = tickIndex - index;
      // Find shortest path
      let steps = diff;
      if (steps > COUNT / 2) steps -= COUNT;
      if (steps < -COUNT / 2) steps += COUNT;

      const dir = steps > 0 ? 1 : -1;
      setDirection(dir);
      const newRotation = -tickIndex * ITEM_ANGLE;
      setMomentum({
        velocity: 0,
        startRotation: rotation,
        targetRotation: newRotation,
      });
      setRotation(newRotation);
      setIndex(tickIndex);
    },
    [index, rotation]
  );

  // --- Mouse wheel support ---
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
        if (steps !== 0) {
          const dir = steps > 0 ? 1 : -1;
          setDirection(dir);
          setRotation((r) => {
            const newR = r - steps * ITEM_ANGLE;
            const snapped =
              Math.round(newR / ITEM_ANGLE) * ITEM_ANGLE;
            const newIndex = normalizeIndex(
              Math.round(-snapped / ITEM_ANGLE)
            );
            setIndex(newIndex);
            return snapped;
          });
        }
        accumulated = 0;
      }, 80);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // Momentum animation duration
  const animDuration = momentum
    ? Math.min(
        0.4 +
          Math.abs(momentum.targetRotation - momentum.startRotation) * 0.001 +
          momentum.velocity * 2,
        1.6
      )
    : 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-svh w-full select-none px-6"
      style={{ touchAction: "none" }}
    >
      {/* Wheel ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          ref={wheelRef}
          animate={{ rotate: rotation }}
          transition={
            isDragging.current
              ? { duration: 0 }
              : {
                  duration: animDuration,
                  ease: [0.23, 1, 0.32, 1],
                }
          }
          className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-zinc-200 flex items-center justify-center"
          style={{ touchAction: "none", cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Tick marks */}
          {Array.from({ length: COUNT }).map((_, i) => {
            const angle = i * ITEM_ANGLE;
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTickTap(i);
                  }}
                  className={`absolute left-1/2 -translate-x-1/2 top-0 transition-all duration-300 ${
                    isActive
                      ? "w-[3px] h-5 bg-zinc-900 rounded-full"
                      : "w-[1.5px] h-2.5 bg-zinc-300 rounded-full"
                  }`}
                  style={{ padding: "6px 8px", margin: "-6px -8px", background: "transparent", cursor: "pointer" }}
                >
                  <div
                    className={`w-full h-full rounded-full transition-all duration-300 ${
                      isActive ? "bg-zinc-900" : "bg-zinc-300"
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {/* Center dot */}
          <div className="w-2 h-2 bg-zinc-900 rounded-full pointer-events-none" />
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
        {String(index + 1).padStart(3, "0")} / {String(COUNT).padStart(3, "0")}
      </motion.span>

      {/* Hint */}
      <p className="mt-8 text-[11px] text-zinc-300 tracking-wide">
        drag · tap · scroll
      </p>
    </div>
  );
}
