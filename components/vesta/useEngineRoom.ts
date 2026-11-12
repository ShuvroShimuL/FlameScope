"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { ENGINE_LABELS, ENGINE_ORDER, type EngineChoice, type EngineId, type EngineInfo } from "@/lib/vesta/engines";
import type { FreeLLMAPIStatus } from "@/lib/vesta/freellmapi-status";

/** Shown until /api/vesta/engines answers: only the engines that never need a key are usable. */
const FALLBACK: EngineInfo[] = (["auto", ...ENGINE_ORDER] as EngineChoice[]).map((id) => ({ id, label: ENGINE_LABELS[id], available: id === "auto" || id === "offline" }));

export interface Meter {
  cooldowns: { id: EngineId; seconds_left: number; total_seconds: number; reason: string }[];
  freellmapi: FreeLLMAPIStatus | null;
  /** When the reading arrived, so countdowns keep ticking between polls. */
  at: number;
}

/** Engine list from the server (id, label, available). Falls back to Auto if the saved choice has no key. */
export function useEngines(): EngineInfo[] {
  const setEngine = useAppStore((s) => s.setEngine);
  const [engines, setEngines] = useState<EngineInfo[]>(FALLBACK);
  useEffect(() => {
    let alive = true;
    fetch("/api/vesta/engines")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list: EngineInfo[]) => {
        if (!alive || !Array.isArray(list)) return;
        setEngines(list);
        const cur = list.find((e) => e.id === useAppStore.getState().engine);
        if (!cur || !cur.available) setEngine("auto");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [setEngine]);
  return engines;
}

const POLL_OPEN_MS = 15_000;
const POLL_CLOSED_MS = 60_000;

/** Engine room readings: polled faster while the room is open, and refreshed right after each answer. */
export function useMeter(open: boolean): { meter: Meter | null; refresh: () => void; loading: boolean } {
  const busy = useAppStore((s) => s.busy);
  const [meter, setMeter] = useState<Meter | null>(null);
  const [loading, setLoading] = useState(false);
  const inflight = useRef(false);

  const refresh = useRef(() => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    fetch("/api/vesta/meter", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((m: Omit<Meter, "at">) => setMeter({ cooldowns: Array.isArray(m.cooldowns) ? m.cooldowns : [], freellmapi: m.freellmapi ?? null, at: Date.now() }))
      .catch(() => {})
      .finally(() => {
        inflight.current = false;
        setLoading(false);
      });
  }).current;

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, open ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => clearInterval(t);
  }, [open, refresh]);

  // after an answer finishes, FreeLLMAPI's counter and our cooldowns have moved
  const wasBusy = useRef(busy);
  useEffect(() => {
    if (wasBusy.current && !busy) {
      const t = setTimeout(refresh, 600);
      wasBusy.current = busy;
      return () => clearTimeout(t);
    }
    wasBusy.current = busy;
  }, [busy, refresh]);

  return { meter, refresh, loading };
}

/** A clock that ticks once a second while `on` (for countdowns and elapsed time). */
export function useNow(on: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [on]);
  return now;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Rolls a number up to its new value (instant when reduced motion is preferred). */
export function useCountUp(target: number, ms = 700): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion() || from.current === target) {
      from.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (target - a) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, ms]);
  return shown;
}

/** Share (0–1) of an engine's rest still to go, for the little countdown bar. */
export function restShare(meter: Meter | null, id: EngineId, now: number): number {
  const c = meter?.cooldowns.find((x) => x.id === id);
  if (!c || !(c.total_seconds > 0)) return 0;
  return Math.min(1, restLeft(meter, id, now) / c.total_seconds);
}

/** Seconds left on an engine's rest, counting down from when the reading arrived. */
export function restLeft(meter: Meter | null, id: EngineId, now: number): number {
  const c = meter?.cooldowns.find((x) => x.id === id);
  if (!c) return 0;
  return Math.max(0, c.seconds_left - Math.floor((now - meter!.at) / 1000));
}
