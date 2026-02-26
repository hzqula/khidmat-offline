"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaMosque, FaLocationDot, FaSun, FaCloudSun } from "react-icons/fa6";
import { RiMoonClearFill } from "react-icons/ri";
import { GiStripedSun } from "react-icons/gi";
import { PiNetworkSlash, PiSunHorizonFill } from "react-icons/pi";
import Image from "next/image";
import api from "@/lib/axios";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import moment from "moment-timezone";
import type { Announcement } from "@/lib/types/announcement";
import type { DisplayImage } from "@/lib/types/display-image";
import type { WeeklyFinanceSummary } from "@/lib/types/finance";
import type { PrayerSettings } from "@/lib/types/prayer-settings";
import type { SimMessage } from "@/app/(admin)/settings/page";
import { Mosque } from "@/lib/types/mosque";

// ─────────────────────────────────────────────────────────────────────────────
const BROADCAST_CHANNEL = "khidmat-display-sim";
const PREVIEW_SECONDS = 10;
const ADHAN_ALARM_DURATION = 10; // detik overlay azan + bunyi alarm
const IQAMAH_ALARM_DURATION = 10; // detik overlay iqamah + bunyi alarm
const SALAT_DURATION_MINUTES = 20; // menit overlay "sedang shalat"

const PRAYER_STYLES = [
  { accent: "#4ade80" },
  { accent: "#fbbf24" },
  { accent: "#f97316" },
  { accent: "#60a5fa" },
  { accent: "#a78bfa" },
];

type DisplayPhase =
  | { phase: "idle" }
  | { phase: "adhan"; prayer: string; remainingSec: number; isSim?: boolean }
  | {
      phase: "iqamah";
      prayer: string;
      remainingSec: number;
      totalSec: number;
      isSim?: boolean;
    }
  | {
      phase: "salat-alarm";
      prayer: string;
      remainingSec: number;
      isSim?: boolean;
    }
  | {
      phase: "salat";
      prayer: string;
      remainingSec: number;
      totalSec: number;
      isSim?: boolean;
    };

type SimStage =
  | "preview"
  | "adhan-alarm"
  | "iqamah-countdown"
  | "salat-alarm"
  | "salat";

type SimState = {
  stage: SimStage;
  previewLeft: number;
  prayer: string;
  remainingSec: number;
  total: number;
  salatDurationSec: number;
  adhanSoundPath: string;
  iqamahSoundPath: string;
  adhanAlarmEnabled: boolean;
  iqamahAlarmEnabled: boolean;
};

// ── Alarm hook
function useAlarm() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  const fire = useCallback((path: string, key: string) => {
    if (firedRef.current.has(key)) return;
    firedRef.current.add(key);
    audioRef.current?.pause();
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(() => console.warn("Audio gagal diputar:", path));
  }, []);

  const stopAll = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  // Bersihkan key kemarin tiap menit
  useEffect(() => {
    const id = setInterval(() => {
      const today = moment().format("YYYY-MM-DD");
      firedRef.current.forEach((k) => {
        if (!k.endsWith(today)) firedRef.current.delete(k);
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return { fire, stopAll };
}

// ── Preview badge (saat sim stage = "preview") ─────────────────────────────
function PreviewBadge({ sim }: { sim: SimState }) {
  if (sim.stage !== "preview") return null;
  const pct = (sim.previewLeft / PREVIEW_SECONDS) * 100;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
      style={{ animation: "fadeSlideDown 0.5s ease-out both" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-md"
        style={{
          background: "#60a5fa22",
          border: "1px solid #60a5fa60",
          color: "#60a5fa",
        }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse bg-[#60a5fa]" />
        SIMULASI — {sim.prayer}
      </div>
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg
          className="absolute inset-0 w-14 h-14 -rotate-90"
          viewBox="0 0 56 56"
        >
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>
        <span className="text-base font-black tabular-nums text-[#60a5fa]">
          {sim.previewLeft}
        </span>
      </div>
    </div>
  );
}

// ── Overlay: Sedang Azan ──────────────────────────────────────────────────────
function AdhanOverlay({
  prayer,
  remainingSec,
  isSim,
}: {
  prayer: string;
  remainingSec: number;
  isSim?: boolean;
}) {
  const pct = (remainingSec / ADHAN_ALARM_DURATION) * 100;
  const circumference = 2 * Math.PI * 52;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, #1a0f00 0%, #0d0800 50%, #000 100%)",
        animation: "fadeIn 0.6s ease-out both",
      }}
    >
      {/* BG glow rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, #d4af3710 0%, transparent 65%)",
            borderRadius: "50%",
            animation: "pulseRing 3s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 360,
            height: 360,
            background:
              "radial-gradient(circle, #d4af3718 0%, transparent 65%)",
            borderRadius: "50%",
            animation: "pulseRing 2s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        />
      </div>

      {isSim && (
        <div className="absolute top-4 right-4 bg-violet-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase z-10">
          SIMULASI
        </div>
      )}

      {/* Arabic text */}
      <p className="text-gold/40 text-3xl mb-4" style={{ fontFamily: "serif" }}>
        الله أكبر
      </p>

      {/* Ring countdown + bell */}
      <div className="relative flex items-center justify-center mb-6">
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          className="-rotate-90"
        >
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke="rgba(212,175,55,0.12)"
            strokeWidth="5"
          />
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke="#d4af37"
            strokeWidth="5"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className="text-5xl"
            style={{ animation: "pulseRing 1s ease-in-out infinite" }}
          >
            🔔
          </span>
          <span className="text-gold font-black text-xl tabular-nums mt-1">
            {remainingSec}s
          </span>
        </div>
      </div>

      <div
        className="text-center"
        style={{ animation: "fadeSlideUp 0.5s 0.2s ease-out both" }}
      >
        <p className="text-gold/60 text-xs tracking-[0.5em] uppercase font-semibold mb-2">
          Waktu Shalat
        </p>
        <p className="font-display font-black text-6xl text-gold mb-4">
          {prayer}
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gold/25" />
          <p className="text-white/40 text-sm tracking-widest">
            Iqamah segera dimulai
          </p>
          <div className="h-px w-16 bg-gold/25" />
        </div>
      </div>
    </div>
  );
}

// ── Overlay: Countdown Iqamah ─────────────────────────────────────────────────
function IqamahCountdownOverlay({
  prayer,
  remainingSec,
  totalSec,
  isSim,
}: {
  prayer: string;
  remainingSec: number;
  totalSec: number;
  isSim?: boolean;
}) {
  const accent = "#60a5fa";
  const pct = totalSec > 0 ? remainingSec / totalSec : 0;
  const circumference = 2 * Math.PI * 80;
  const m = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const s = String(remainingSec % 60).padStart(2, "0");

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #001629 0%, #000d1a 55%, #000 100%)",
        animation: "fadeIn 0.8s ease-out both",
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520,
            height: 520,
            background: `radial-gradient(circle, ${accent}12 0%, transparent 60%)`,
            borderRadius: "50%",
            animation: "pulseRing 3s ease-in-out infinite",
          }}
        />
      </div>

      {isSim && (
        <div className="absolute top-4 right-4 bg-violet-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
          SIMULASI
        </div>
      )}

      <p className="text-white/30 text-xs tracking-[0.6em] uppercase font-semibold mb-6">
        Countdown Iqamah
      </p>

      {/* Lingkaran countdown besar */}
      <div className="relative flex items-center justify-center mb-6">
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          className="-rotate-90"
        >
          <circle
            cx="110"
            cy="110"
            r="80"
            fill="none"
            stroke={`${accent}18`}
            strokeWidth="7"
          />
          <circle
            cx="110"
            cy="110"
            r="80"
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (1 - pct)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className="font-black tabular-nums leading-none"
            style={{ fontSize: "3.5rem", color: accent }}
          >
            {m}:{s}
          </span>
          <span
            className="text-xs font-semibold tracking-widest uppercase mt-1"
            style={{ color: `${accent}70` }}
          >
            menuju iqamah
          </span>
        </div>
      </div>

      <div
        className="text-center"
        style={{ animation: "fadeSlideUp 0.6s 0.3s ease-out both" }}
      >
        <p className="text-white/30 text-xs tracking-[0.4em] uppercase mb-2">
          Shalat
        </p>
        <p
          className="font-display font-black text-5xl"
          style={{ color: accent }}
        >
          {prayer}
        </p>
        <p className="text-white/25 text-sm mt-3 tracking-wide">
          Segara senyapkan HP
        </p>
      </div>
    </div>
  );
}

// ── Overlay: Alarm Iqamah (sebelum overlay shalat) ───────────────────────────
function IqamahAlarmOverlay({
  prayer,
  remainingSec,
  isSim,
}: {
  prayer: string;
  remainingSec: number;
  isSim?: boolean;
}) {
  const pct = (remainingSec / IQAMAH_ALARM_DURATION) * 100;
  const circumference = 2 * Math.PI * 52;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, #1a0029 0%, #0d0018 50%, #000 100%)",
        animation: "fadeIn 0.6s ease-out both",
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            height: 480,
            background:
              "radial-gradient(circle, #a78bfa12 0%, transparent 60%)",
            borderRadius: "50%",
            animation: "pulseRing 2s ease-in-out infinite",
          }}
        />
      </div>

      {isSim && (
        <div className="absolute top-4 right-4 bg-violet-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
          SIMULASI
        </div>
      )}

      <p
        className="text-purple-300/40 text-3xl mb-4"
        style={{ fontFamily: "serif" }}
      >
        الله أكبر
      </p>

      <div className="relative flex items-center justify-center mb-6">
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          className="-rotate-90"
        >
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke="rgba(167,139,250,0.12)"
            strokeWidth="5"
          />
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="5"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className="text-5xl"
            style={{ animation: "pulseRing 1s ease-in-out infinite" }}
          >
            📿
          </span>
          <span className="text-purple-300 font-black text-xl tabular-nums mt-1">
            {remainingSec}s
          </span>
        </div>
      </div>

      <div
        className="text-center"
        style={{ animation: "fadeSlideUp 0.5s 0.2s ease-out both" }}
      >
        <p className="text-purple-300/60 text-xs tracking-[0.5em] uppercase font-semibold mb-2">
          Iqamah
        </p>
        <p className="font-display font-black text-6xl text-purple-300 mb-4">
          {prayer}
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-purple-300/25" />
          <p className="text-white/40 text-sm tracking-widest">
            Shalat segera dimulai
          </p>
          <div className="h-px w-16 bg-purple-300/25" />
        </div>
      </div>
    </div>
  );
}

// ── Overlay: Sedang Shalat ────────────────────────────────────────────────────
function SalatOverlay({
  prayer,
  remainingSec,
  totalSec,
  isSim,
}: {
  prayer: string;
  remainingSec: number;
  totalSec: number;
  isSim?: boolean;
}) {
  const accent = "#4ade80";
  const pct = totalSec > 0 ? remainingSec / totalSec : 0;
  const m = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const s = String(remainingSec % 60).padStart(2, "0");

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #001a0d 0%, #000e07 55%, #000 100%)",
        animation: "fadeIn 0.8s ease-out both",
      }}
    >
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            background: `radial-gradient(circle, ${accent}0d 0%, transparent 60%)`,
            borderRadius: "50%",
            animation: "pulseRing 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Progress bar atas */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: `${accent}18` }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct * 100}%`,
            background: `linear-gradient(to right, ${accent}80, ${accent})`,
            transition: "width 0.9s linear",
            boxShadow: `0 0 10px ${accent}60`,
          }}
        />
      </div>

      {isSim && (
        <div className="absolute top-4 right-4 bg-violet-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
          SIMULASI
        </div>
      )}

      {/* Mosque icon */}
      <div className="mb-5">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: `${accent}12`,
            border: `1.5px solid ${accent}35`,
            animation: "pulseRing 3s ease-in-out infinite",
            boxShadow: `0 0 40px ${accent}25`,
          }}
        >
          🕌
        </div>
      </div>

      <div
        className="text-center mb-5"
        style={{ animation: "fadeSlideUp 0.5s 0.2s ease-out both" }}
      >
        <p className="text-white/35 text-xs tracking-[0.6em] uppercase font-semibold mb-2">
          Sedang Shalat
        </p>
        <p
          className="font-display font-black text-6xl mb-5"
          style={{ color: accent }}
        >
          {prayer}
        </p>

        {/* Instruksi */}
        <div
          className="flex flex-col items-center gap-2.5 px-8 py-4 rounded-2xl mx-auto"
          style={{
            background: `${accent}08`,
            border: `1px solid ${accent}18`,
            maxWidth: 340,
          }}
        >
          {[
            { icon: "📏", text: "Luruskan shaf" },
            { icon: "🤝", text: "Rapatkan barisan" },
            { icon: "📵", text: "Senyapkan handphone" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{
                animation: `fadeSlideUp 0.5s ${0.35 + i * 0.12}s ease-out both`,
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-white/75 font-semibold text-base tracking-wide">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timer selesai shalat */}
      <div className="flex items-center gap-3">
        <div className="h-px w-12" style={{ background: `${accent}35` }} />
        <span
          className="font-black tabular-nums text-2xl"
          style={{ color: `${accent}cc` }}
        >
          {m}:{s}
        </span>
        <div className="h-px w-12" style={{ background: `${accent}35` }} />
      </div>
      <p className="text-white/25 text-xs mt-1 tracking-widest">
        estimasi selesai
      </p>
    </div>
  );
}

// ── Main Display Page ─────────────────────────────────────────────────────────
const DisplayPage = () => {
  const [now, setNow] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);
  const [tick, setTick] = useState(false);

  // ── Fase display utama
  const [displayPhase, setDisplayPhase] = useState<DisplayPhase>({
    phase: "idle",
  });
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Simulasi
  const [sim, setSim] = useState<SimState | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { fire, stopAll } = useAlarm();

  // ── Helper: mulai fase dengan timer ─────────────────────────────────────
  const startPhaseTimer = useCallback(
    (
      initialPhase: DisplayPhase,
      onTick: (prev: DisplayPhase) => DisplayPhase | null,
    ) => {
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      setDisplayPhase(initialPhase);
      phaseTimerRef.current = setInterval(() => {
        setDisplayPhase((prev) => {
          const next = onTick(prev);
          if (next === null) {
            clearInterval(phaseTimerRef.current!);
            phaseTimerRef.current = null;
            return { phase: "idle" };
          }
          return next;
        });
      }, 1000);
    },
    [],
  );

  const clearPhase = useCallback(() => {
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    setDisplayPhase({ phase: "idle" });
  }, []);

  useEffect(
    () => () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    },
    [],
  );

  // ── BroadcastChannel: terima sinyal dari Settings tab ─────────────────
  useEffect(() => {
    const ch = new BroadcastChannel(BROADCAST_CHANNEL);

    ch.onmessage = (event: MessageEvent<SimMessage>) => {
      const msg = event.data;

      if (msg.type === "STOP_SIM") {
        if (simTimerRef.current) {
          clearInterval(simTimerRef.current);
          simTimerRef.current = null;
        }
        setSim(null);
        clearPhase();
        stopAll();
        return;
      }

      if (msg.type === "START_SIM") {
        if (simTimerRef.current) {
          clearInterval(simTimerRef.current);
          simTimerRef.current = null;
        }
        stopAll();

        // Fase 1: preview (10 detik normal)
        setSim({
          stage: "preview",
          previewLeft: PREVIEW_SECONDS,
          prayer: msg.prayer,
          remainingSec: msg.iqamahDurationSec,
          total: msg.iqamahDurationSec,
          salatDurationSec: msg.salatDurationSec,
          adhanSoundPath: msg.adhanSoundPath,
          iqamahSoundPath: msg.iqamahSoundPath,
          adhanAlarmEnabled: msg.adhanAlarmEnabled,
          iqamahAlarmEnabled: msg.iqamahAlarmEnabled,
        });
        clearPhase();

        simTimerRef.current = setInterval(() => {
          setSim((prev) => {
            if (!prev) return null;

            // ── Preview countdown ──────────────────────────────────────
            if (prev.stage === "preview") {
              const next = prev.previewLeft - 1;
              if (next <= 0) {
                // Mulai fase adhan overlay
                if (prev.adhanAlarmEnabled) {
                  const audio = new Audio(prev.adhanSoundPath);
                  audio.play().catch(() => {});
                }
                // Set display phase: adhan
                setDisplayPhase({
                  phase: "adhan",
                  prayer: prev.prayer,
                  remainingSec: ADHAN_ALARM_DURATION,
                  isSim: true,
                });
                return {
                  ...prev,
                  stage: "adhan-alarm",
                  remainingSec: ADHAN_ALARM_DURATION,
                };
              }
              return { ...prev, previewLeft: next };
            }

            // ── Adhan alarm countdown ──────────────────────────────────
            if (prev.stage === "adhan-alarm") {
              const next = prev.remainingSec - 1;
              setDisplayPhase({
                phase: "adhan",
                prayer: prev.prayer,
                remainingSec: next,
                isSim: true,
              });
              if (next <= 0) {
                // Masuk countdown iqamah
                setDisplayPhase({
                  phase: "iqamah",
                  prayer: prev.prayer,
                  remainingSec: prev.total,
                  totalSec: prev.total,
                  isSim: true,
                });
                return {
                  ...prev,
                  stage: "iqamah-countdown",
                  remainingSec: prev.total,
                };
              }
              return { ...prev, remainingSec: next };
            }

            // ── Iqamah countdown ───────────────────────────────────────
            if (prev.stage === "iqamah-countdown") {
              const next = prev.remainingSec - 1;
              setDisplayPhase({
                phase: "iqamah",
                prayer: prev.prayer,
                remainingSec: next,
                totalSec: prev.total,
                isSim: true,
              });
              if (next <= 0) {
                // Bunyikan alarm iqamah
                if (prev.iqamahAlarmEnabled) {
                  const audio = new Audio(prev.iqamahSoundPath);
                  audio.play().catch(() => {});
                }
                // Masuk salat-alarm
                setDisplayPhase({
                  phase: "salat-alarm",
                  prayer: prev.prayer,
                  remainingSec: IQAMAH_ALARM_DURATION,
                  isSim: true,
                });
                return {
                  ...prev,
                  stage: "salat-alarm",
                  remainingSec: IQAMAH_ALARM_DURATION,
                };
              }
              return { ...prev, remainingSec: next };
            }

            // ── Salat alarm countdown ──────────────────────────────────
            if (prev.stage === "salat-alarm") {
              const next = prev.remainingSec - 1;
              setDisplayPhase({
                phase: "salat-alarm",
                prayer: prev.prayer,
                remainingSec: next,
                isSim: true,
              });
              if (next <= 0) {
                const salatTotal = prev.salatDurationSec;
                setDisplayPhase({
                  phase: "salat",
                  prayer: prev.prayer,
                  remainingSec: salatTotal,
                  totalSec: salatTotal,
                  isSim: true,
                });
                return {
                  ...prev,
                  stage: "salat",
                  remainingSec: salatTotal,
                  total: salatTotal,
                };
              }
              return { ...prev, remainingSec: next };
            }

            // ── Shalat overlay countdown ───────────────────────────────
            if (prev.stage === "salat") {
              const next = prev.remainingSec - 1;
              setDisplayPhase({
                phase: "salat",
                prayer: prev.prayer,
                remainingSec: next,
                totalSec: prev.total,
                isSim: true,
              });
              if (next <= 0) {
                // Selesai simulasi
                setTimeout(() => {
                  if (simTimerRef.current) {
                    clearInterval(simTimerRef.current);
                    simTimerRef.current = null;
                  }
                  setSim(null);
                  setDisplayPhase({ phase: "idle" });
                }, 1500);
                return { ...prev, remainingSec: 0 };
              }
              return { ...prev, remainingSec: next };
            }

            return prev;
          });
        }, 1000);
      }
    };

    return () => ch.close();
  }, [clearPhase, stopAll]);

  // ── Queries ──────────────────────────────────────────────────────────────
  const {
    data: mosque,
    isLoading,
    isError,
  } = useQuery<Mosque>({
    queryKey: ["mosque-settings"],
    queryFn: async () => {
      const { data } = await api.get("/public/mosque");
      return data;
    },
    refetchInterval: 600_000,
  });
  const { data: displayImages } = useQuery<DisplayImage[]>({
    queryKey: ["public-images"],
    queryFn: async () => {
      const { data } = await api.get("/public/images");
      return data;
    },
    refetchInterval: 120_000,
  });
  const { data: announcementItems } = useQuery<Announcement[]>({
    queryKey: ["public-announcements"],
    queryFn: async () => {
      const { data } = await api.get("/public/announcements");
      return data;
    },
    refetchInterval: 60_000,
  });
  const { data: weeklyFinance } = useQuery<WeeklyFinanceSummary>({
    queryKey: ["public-weekly-finance"],
    queryFn: async () => {
      const { data } = await api.get("/public/finance/weekly");
      return data;
    },
    refetchInterval: 1_800_000,
  });
  const { data: prayerSettings } = useQuery<PrayerSettings>({
    queryKey: ["public-prayer-settings"],
    queryFn: async () => {
      const { data } = await api.get("/public/prayer-settings");
      return data;
    },
    refetchInterval: 300_000,
  });

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      setTick((t) => !t);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Prayer times ─────────────────────────────────────────────────────────
  const prayerData = useMemo(() => {
    if (!mosque || mosque.latitude == null || mosque.longitude == null)
      return null;
    const coords = new Coordinates(mosque.latitude, mosque.longitude);
    const params = CalculationMethod.Singapore();
    params.fajrAngle = 20;
    params.ishaAngle = 18;
    const pt = new PrayerTimes(coords, now, params);
    const tz = mosque.timezone || "Asia/Jakarta";
    const fmt = (d: Date) => moment(d).tz(tz).format("HH:mm");
    return [
      {
        nama: "Subuh",
        waktu: fmt(pt.fajr),
        rawDate: pt.fajr,
        icon: <GiStripedSun />,
      },
      {
        nama: "Dzuhur",
        waktu: fmt(pt.dhuhr),
        rawDate: pt.dhuhr,
        icon: <FaSun />,
      },
      {
        nama: "Ashar",
        waktu: fmt(pt.asr),
        rawDate: pt.asr,
        icon: <FaCloudSun />,
      },
      {
        nama: "Maghrib",
        waktu: fmt(pt.maghrib),
        rawDate: pt.maghrib,
        icon: <PiSunHorizonFill />,
      },
      {
        nama: "Isya",
        waktu: fmt(pt.isha),
        rawDate: pt.isha,
        icon: <RiMoonClearFill />,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mosque, now.toDateString()]);

  // ── Real-time phase logic ─────────────────────────────────────────────────
  //
  // Alur nyata per waktu shalat:
  //   1. Waktu azan tiba → phase "adhan" (ADHAN_ALARM_DURATION detik) + bunyi alarm azan
  //   2. Selesai → phase "iqamah" (iqamahCountdownMinutes menit)
  //   3. Countdown habis → phase "salat-alarm" (IQAMAH_ALARM_DURATION detik) + bunyi alarm iqamah
  //   4. Selesai → phase "salat" (SALAT_DURATION_MINUTES menit)
  //   5. Selesai → kembali idle
  //
  useEffect(() => {
    if (!prayerData || !prayerSettings || sim) return;

    const iqamahMin = (prayerSettings.iqamahCountdownMinutes ?? 10) * 60;
    const nowSec = now.getTime() / 1000;
    const today = moment(now).format("YYYY-MM-DD");

    // Jangan proses ulang jika fase sudah aktif (bukan idle)
    // Kita biarkan phaseTimer yang mengatur transisi antar fase
    if (displayPhase.phase !== "idle") return;

    for (const prayer of prayerData) {
      const prayerSec = prayer.rawDate.getTime() / 1000;
      const adhanEndSec = prayerSec + ADHAN_ALARM_DURATION;
      const iqamahEndSec = prayerSec + iqamahMin;
      const salatEndSec =
        iqamahEndSec + IQAMAH_ALARM_DURATION + SALAT_DURATION_MINUTES * 60;

      const diffToAdhan = nowSec - prayerSec;

      // Waktu azan: window 0 ~ ADHAN_ALARM_DURATION
      if (diffToAdhan >= 0 && diffToAdhan < ADHAN_ALARM_DURATION) {
        const remaining = Math.floor(ADHAN_ALARM_DURATION - diffToAdhan);

        // Bunyi alarm azan (sekali)
        if (prayerSettings.adhanAlarmEnabled) {
          fire(prayerSettings.adhanSoundPath, `adhan-${prayer.nama}-${today}`);
        }

        // Mulai fase adhan
        startPhaseTimer(
          { phase: "adhan", prayer: prayer.nama, remainingSec: remaining },
          (prev) => {
            if (prev.phase !== "adhan") return null;
            const next = prev.remainingSec - 1;
            if (next <= 0) {
              // Transisi ke iqamah countdown
              return {
                phase: "iqamah",
                prayer: prev.prayer,
                remainingSec: iqamahMin,
                totalSec: iqamahMin,
              };
            }
            return { ...prev, remainingSec: next };
          },
        );
        break;
      }

      // Iqamah countdown: window ADHAN_ALARM_DURATION ~ iqamahMin
      if (diffToAdhan >= ADHAN_ALARM_DURATION && nowSec < iqamahEndSec) {
        const elapsed = diffToAdhan - ADHAN_ALARM_DURATION;
        const iqamahCountdownTotal = iqamahMin - ADHAN_ALARM_DURATION;
        const remaining = Math.floor(iqamahCountdownTotal - elapsed);
        if (remaining <= 0) continue;

        startPhaseTimer(
          {
            phase: "iqamah",
            prayer: prayer.nama,
            remainingSec: remaining,
            totalSec: iqamahCountdownTotal,
          },
          (prev) => {
            if (prev.phase !== "iqamah") return null;
            const next = prev.remainingSec - 1;
            if (next <= 0) {
              // Bunyi alarm iqamah, masuk salat-alarm
              if (prayerSettings.iqamahAlarmEnabled) {
                fire(
                  prayerSettings.iqamahSoundPath,
                  `iqamah-${prayer.nama}-${today}`,
                );
              }
              return {
                phase: "salat-alarm",
                prayer: prev.prayer,
                remainingSec: IQAMAH_ALARM_DURATION,
              };
            }
            return { ...prev, remainingSec: next };
          },
        );
        break;
      }

      // Salat alarm: window iqamahEnd ~ iqamahEnd + IQAMAH_ALARM_DURATION
      const salatAlarmEnd = iqamahEndSec + IQAMAH_ALARM_DURATION;
      if (nowSec >= iqamahEndSec && nowSec < salatAlarmEnd) {
        const remaining = Math.floor(salatAlarmEnd - nowSec);

        if (prayerSettings.iqamahAlarmEnabled) {
          fire(
            prayerSettings.iqamahSoundPath,
            `iqamah-${prayer.nama}-${today}`,
          );
        }

        const salatTotal = SALAT_DURATION_MINUTES * 60;
        startPhaseTimer(
          {
            phase: "salat-alarm",
            prayer: prayer.nama,
            remainingSec: remaining,
          },
          (prev) => {
            if (prev.phase !== "salat-alarm") return null;
            const next = prev.remainingSec - 1;
            if (next <= 0) {
              return {
                phase: "salat",
                prayer: prev.prayer,
                remainingSec: salatTotal,
                totalSec: salatTotal,
              };
            }
            return { ...prev, remainingSec: next };
          },
        );
        break;
      }

      // Shalat overlay: window salatAlarmEnd ~ salatEnd
      if (nowSec >= salatAlarmEnd && nowSec < salatEndSec) {
        const salatTotal = SALAT_DURATION_MINUTES * 60;
        const elapsed = nowSec - salatAlarmEnd;
        const remaining = Math.floor(salatTotal - elapsed);
        if (remaining <= 0) continue;

        startPhaseTimer(
          {
            phase: "salat",
            prayer: prayer.nama,
            remainingSec: remaining,
            totalSec: salatTotal,
          },
          (prev) => {
            if (prev.phase !== "salat") return null;
            const next = prev.remainingSec - 1;
            if (next <= 0) return null; // → idle
            return { ...prev, remainingSec: next };
          },
        );
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, prayerData, prayerSettings, sim]);

  // ── Slide rotation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!displayImages || displayImages.length <= 1) {
      setActiveSlide(0);
      return;
    }
    const id = setInterval(
      () => setActiveSlide((p) => (p + 1) % displayImages.length),
      8000,
    );
    return () => clearInterval(id);
  }, [displayImages]);

  // ── Derived state ────────────────────────────────────────────────────────
  const currentSlide = displayImages?.length
    ? displayImages[activeSlide % displayImages.length]
    : null;
  const currentTimeStr = moment(now).format("HH:mm");
  const nextIdx = prayerData?.findIndex((s) => s.waktu > currentTimeStr) ?? -1;
  const nextName =
    nextIdx >= 0 ? prayerData?.[nextIdx]?.nama : prayerData?.[0]?.nama;

  // Apakah slider harus di-dim
  const sliderDimmed =
    displayPhase.phase !== "idle" || (sim?.stage === "preview" ? false : !!sim);

  // Running text
  const financeText = weeklyFinance
    ? (() => {
        const rp = (v: number) =>
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(v);
        const sm =
          weeklyFinance.totalMasukMasjid - weeklyFinance.totalKeluarMasjid;
        const sy =
          weeklyFinance.totalMasukYatim - weeklyFinance.totalKeluarYatim;
        return `KEUANGAN PEKAN INI — KAS MASJID: SALDO ${rp(sm)} (MASUK ${rp(weeklyFinance.totalMasukMasjid)}, KELUAR ${rp(weeklyFinance.totalKeluarMasjid)}) · KAS YATIM: SALDO ${rp(sy)} (MASUK ${rp(weeklyFinance.totalMasukYatim)}, KELUAR ${rp(weeklyFinance.totalKeluarYatim)})`;
      })()
    : "";
  const runningText = announcementItems?.length
    ? announcementItems
        .map((a, i) => `${i + 1}. ${a.content.toUpperCase()}`)
        .join("   ✦   ") + (financeText ? `   ✦   ${financeText}` : "")
    : `SELAMAT DATANG DI ${(mosque?.name ?? "MASJID").toUpperCase()} — JAGALAH KEBERSIHAN MASJID KITA BERSAMA.${financeText ? `   ✦   ${financeText}` : ""}`;

  // ── Loading / error screens ──────────────────────────────────────────────
  if (isLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a1f14] gap-4">
        <FaMosque className="text-6xl text-gold animate-pulse" />
        <p className="text-xl font-semibold tracking-widest uppercase text-gold">
          Inisialisasi…
        </p>
      </div>
    );

  const ErrorScreen = ({ title, desc }: { title: string; desc: string }) => (
    <div className="w-screen h-screen bg-[#0a1f14] text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full border border-gold/30 bg-white/5 backdrop-blur-md rounded-3xl p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-5xl">
          <PiNetworkSlash />
        </div>
        <h2 className="text-4xl font-bold mb-3 text-gold">{title}</h2>
        <p className="text-lg text-emerald-100 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
  if (isError)
    return (
      <ErrorScreen
        title="Koneksi Bermasalah"
        desc="Gagal memuat data masjid. Silakan cek koneksi jaringan."
      />
    );
  if (!prayerData)
    return (
      <ErrorScreen
        title="Koordinat Belum Diatur"
        desc="Buka dashboard admin dan pilih lokasi pada peta."
      />
    );

  return (
    <>
      <style>{`
        @keyframes fadeIn        { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateX(-50%) translateY(-16px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
        @keyframes fadeSlideUp   { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulseRing     { 0%,100% { opacity: 0.8; transform: scale(1) } 50% { opacity: 1; transform: scale(1.03) } }
      `}</style>

      <div className="w-screen h-screen bg-[#071410] overflow-hidden flex flex-col select-none">
        {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
        <header className="relative bg-linear-to-r from-[#0d2b1a] via-[#0f3320] to-[#0d2b1a] border-b-2 border-gold/60 shrink-0 px-8 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="bg-gold/10 border border-gold/40 rounded-xl p-2.5 shrink-0">
              <FaMosque className="text-gold text-4xl" />
            </div>
            <h1 className="text-gold font-display font-extrabold text-5xl leading-tight tracking-wide truncate">
              {mosque?.name}
            </h1>
          </div>

          <div className="flex flex-col items-center shrink-0 mr-48">
            <div
              className="text-white font-black tracking-tight"
              style={{ fontSize: "5rem", lineHeight: 1 }}
            >
              {moment(now).format("HH")}
              <span
                className="transition-opacity duration-200"
                style={{ opacity: tick ? 1 : 0.2 }}
              >
                :
              </span>
              {moment(now).format("mm")}
              <span
                className="text-gold/70 ml-2"
                style={{ fontSize: "2.5rem" }}
              >
                {moment(now).format("ss")}
              </span>
            </div>
            <div className="mt-1 bg-gold/10 border border-gold/30 px-5 py-1 rounded-full">
              <span className="text-gold text-sm font-semibold tracking-widest">
                {moment(now).locale("id").format("dddd, DD MMMM YYYY")}
              </span>
            </div>
          </div>

          <div className="text-right max-w-xs shrink-0">
            <p className="text-gold/60 text-xs tracking-[0.3em] uppercase font-medium mb-1">
              Lokasi
            </p>
            <p className="text-white font-semibold text-base leading-snug">
              <FaLocationDot className="inline mr-1.5 text-gold" />
              {mosque?.address}
            </p>
            <p>{mosque?.district}</p>
            <p className="text-gold/80 text-sm mt-0.5">{mosque?.city}</p>
          </div>
        </header>

        {/* ═══ BODY ════════════════════════════════════════════════════════ */}
        <div className="flex-1 grid grid-cols-[460px_1fr] min-h-0">
          {/* ── Jadwal Sholat ── */}
          <aside className="relative bg-linear-to-b from-[#0d2b1a] to-[#071410] border-r border-gold/20 flex flex-col px-5 py-5 gap-4 overflow-hidden">
            <div className="text-center">
              <p className="text-gold/50 text-xs tracking-[0.4em] uppercase font-semibold">
                Jadwal Sholat
              </p>
              <p className="text-gold/30 text-xs mt-0.5">
                {moment(now).locale("id").format("DD MMMM YYYY")}
              </p>
            </div>
            {prayerData.map((item, idx) => {
              const isNext = nextName === item.nama;
              const style = PRAYER_STYLES[idx];
              // Highlight jika sedang dalam fase shalat ini
              const isActive =
                displayPhase.phase !== "idle" &&
                "prayer" in displayPhase &&
                displayPhase.prayer === item.nama;
              return (
                <div
                  key={item.nama}
                  className={`relative flex items-center gap-5 rounded-2xl px-6 py-5 transition-all duration-500`}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${style.accent}30, ${style.accent}12)`,
                          border: `2px solid ${style.accent}`,
                          boxShadow: `0 0 20px ${style.accent}30`,
                        }
                      : isNext
                        ? {
                            background: `linear-gradient(135deg, ${style.accent}22, ${style.accent}08)`,
                            border: `1.5px solid ${style.accent}80`,
                          }
                        : {
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }
                  }
                >
                  <div
                    className="absolute left-0 top-4 bottom-4 w-1.5 rounded-full"
                    style={{
                      background:
                        isActive || isNext ? style.accent : `${style.accent}40`,
                    }}
                  />
                  <div
                    className="text-5xl shrink-0"
                    style={{
                      color:
                        isActive || isNext ? style.accent : `${style.accent}80`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-bold leading-none"
                      style={{
                        fontSize: "1.5rem",
                        color:
                          isActive || isNext ? "#fff" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {item.nama}
                    </p>
                    {isActive && (
                      <p
                        className="text-xs mt-1 tracking-[0.2em] uppercase font-semibold animate-pulse"
                        style={{ color: style.accent }}
                      >
                        {displayPhase.phase === "adhan"
                          ? "Azan"
                          : displayPhase.phase === "iqamah"
                            ? "Countdown Iqamah"
                            : displayPhase.phase === "salat-alarm"
                              ? "Iqamah"
                              : displayPhase.phase === "salat"
                                ? "Shalat Berlangsung"
                                : ""}
                      </p>
                    )}
                    {!isActive && isNext && (
                      <p
                        className="text-xs mt-1 tracking-[0.2em] uppercase"
                        style={{ color: style.accent }}
                      >
                        Berikutnya
                      </p>
                    )}
                  </div>
                  <p
                    className="font-black tabular-nums tracking-tight"
                    style={{
                      fontSize: isActive || isNext ? "3rem" : "2.5rem",
                      color:
                        isActive || isNext
                          ? style.accent
                          : "rgba(255,255,255,0.85)",
                    }}
                  >
                    {item.waktu}
                  </p>
                </div>
              );
            })}
            <div className="mt-auto border-t border-gold/15 pt-3 text-center">
              <p className="text-gold/30 text-lg tracking-widest">﷽</p>
            </div>
          </aside>

          {/* ── Slider area ── */}
          <main className="relative p-8">
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gold/20 bg-[#0a1f14] shadow-2xl">
              {/* Preview badge saat sim.stage === "preview" */}
              {sim && <PreviewBadge sim={sim} />}

              {/* ── Overlay sesuai fase ── */}
              {displayPhase.phase === "adhan" && (
                <AdhanOverlay
                  prayer={displayPhase.prayer}
                  remainingSec={displayPhase.remainingSec}
                  isSim={displayPhase.isSim}
                />
              )}
              {displayPhase.phase === "iqamah" && (
                <IqamahCountdownOverlay
                  prayer={displayPhase.prayer}
                  remainingSec={displayPhase.remainingSec}
                  totalSec={displayPhase.totalSec}
                  isSim={displayPhase.isSim}
                />
              )}
              {displayPhase.phase === "salat-alarm" && (
                <IqamahAlarmOverlay
                  prayer={displayPhase.prayer}
                  remainingSec={displayPhase.remainingSec}
                  isSim={displayPhase.isSim}
                />
              )}
              {displayPhase.phase === "salat" && (
                <SalatOverlay
                  prayer={displayPhase.prayer}
                  remainingSec={displayPhase.remainingSec}
                  totalSec={displayPhase.totalSec}
                  isSim={displayPhase.isSim}
                />
              )}

              {/* Slider image */}
              {currentSlide ? (
                <>
                  <Image
                    key={currentSlide.id}
                    src={currentSlide.imageUrl}
                    alt="Slide Display"
                    fill
                    className={`object-cover transition-opacity duration-1000 ${sliderDimmed ? "opacity-10" : "opacity-100"}`}
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                  {displayImages &&
                    displayImages.length > 1 &&
                    !sliderDimmed && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {displayImages.map((img, idx) => (
                          <span
                            key={img.id}
                            className="block rounded-full transition-all duration-500"
                            style={{
                              width: idx === activeSlide ? 28 : 8,
                              height: 8,
                              background:
                                idx === activeSlide
                                  ? "#d4af37"
                                  : "rgba(212,175,55,0.35)",
                            }}
                          />
                        ))}
                      </div>
                    )}
                </>
              ) : mosque?.logoUrl ? (
                <Image
                  src={mosque.logoUrl}
                  alt="Logo Masjid"
                  fill
                  className="object-contain p-12"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <FaMosque className="text-gold/30 text-8xl" />
                  <p className="text-gold/40 text-sm italic text-center px-8">
                    Belum ada gambar slider. Unggah dari dashboard admin.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ═══ FOOTER ══════════════════════════════════════════════════════ */}
        <footer className="relative shrink-0 h-16 bg-linear-to-r from-[#0d2b1a] via-[#0f3320] to-[#0d2b1a] border-t border-gold/40 flex items-center overflow-hidden">
          <div className="shrink-0 flex items-center h-full">
            <div className="bg-gold h-full px-6 flex items-center">
              <span className="text-[#0d2b1a] font-black text-sm tracking-[0.25em] uppercase">
                📢 Pengumuman
              </span>
            </div>
            <div
              className="w-0 h-0 shrink-0"
              style={{
                borderTop: "32px solid transparent",
                borderBottom: "32px solid transparent",
                borderLeft: "18px solid #d4af37",
              }}
            />
          </div>
          <div className="w-3 h-3 rounded-full bg-gold/40 mx-4 shrink-0" />
          <div className="flex-1 overflow-hidden h-full flex items-center">
            <div
              className="marquee-run text-gold font-bold whitespace-nowrap tracking-wider text-2xl"
              style={{
                animationDuration: `${Math.max(25, runningText.length * 0.3)}s`,
              }}
            >
              {runningText}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;{runningText}
              &nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DisplayPage;
