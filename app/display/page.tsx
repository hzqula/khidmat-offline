"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaMosque, FaLocationDot, FaSun, FaCloudSun } from "react-icons/fa6";
import { RiMoonClearFill } from "react-icons/ri";
import { GiStripedSun } from "react-icons/gi";
import { PiNetworkSlash, PiSunHorizonFill } from "react-icons/pi";
import Image from "next/image";
import api from "@/lib/axios";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import moment from "moment-timezone";
import { Announcement } from "@/lib/types/announcement";
import { DisplayImage } from "@/lib/types/display-image";
import { WeeklyFinanceSummary } from "@/lib/types/finance";

const PRAYER_STYLES = [
  { accent: "#4ade80" },
  { accent: "#fbbf24" },
  { accent: "#f97316" },
  { accent: "#60a5fa" },
  { accent: "#a78bfa" },
];

const DisplayPage = () => {
  const [now, setNow] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);
  const [tick, setTick] = useState(false);

  const {
    data: mosque,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["mosque-settings"],
    queryFn: async () => {
      const { data } = await api.get("/public/mosque");
      return data;
    },
    refetchInterval: 600000,
  });

  const { data: displayImages } = useQuery<DisplayImage[]>({
    queryKey: ["public-images"],
    queryFn: async () => {
      const { data } = await api.get("/public/images");
      return data;
    },
    refetchInterval: 120000,
  });

  const { data: announcementItems } = useQuery<Announcement[]>({
    queryKey: ["public-announcements"],
    queryFn: async () => {
      const { data } = await api.get("/public/announcements");
      return data;
    },
    refetchInterval: 60000,
  });

  const { data: weeklyFinance } = useQuery<WeeklyFinanceSummary>({
    queryKey: ["public-weekly-finance"],
    queryFn: async () => {
      const { data } = await api.get("/public/finance/weekly");
      return data;
    },
    refetchInterval: 1800000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      setTick((t) => !t);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const prayerData = useMemo(() => {
    if (!mosque || mosque?.latitude === null || mosque?.longitude === null)
      return null;

    const coords = new Coordinates(mosque.latitude, mosque.longitude);
    const params = CalculationMethod.Singapore();
    params.fajrAngle = 20;
    params.ishaAngle = 18;

    const prayerTimes = new PrayerTimes(coords, now, params);
    const tz = mosque.timezone || "Asia/Jakarta";
    const formatTime = (date: Date) => moment(date).tz(tz).format("HH:mm");

    return [
      {
        nama: "Subuh",
        waktu: formatTime(prayerTimes.fajr),
        icon: <GiStripedSun />,
      },
      { nama: "Dzuhur", waktu: formatTime(prayerTimes.dhuhr), icon: <FaSun /> },
      {
        nama: "Ashar",
        waktu: formatTime(prayerTimes.asr),
        icon: <FaCloudSun />,
      },
      {
        nama: "Maghrib",
        waktu: formatTime(prayerTimes.maghrib),
        icon: <PiSunHorizonFill />,
      },
      {
        nama: "Isya",
        waktu: formatTime(prayerTimes.isha),
        icon: <RiMoonClearFill />,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mosque, now.toDateString()]);

  useEffect(() => {
    if (!displayImages || displayImages.length <= 1) {
      setActiveSlide(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displayImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [displayImages]);

  const currentSlide =
    displayImages && displayImages.length > 0
      ? displayImages[activeSlide % displayImages.length]
      : null;

  const currentTimeStr = moment(now).format("HH:mm");
  const nextSholatIndex =
    prayerData?.findIndex((s) => s.waktu > currentTimeStr) ?? -1;
  const nextSholatName =
    nextSholatIndex >= 0
      ? prayerData?.[nextSholatIndex]?.nama
      : prayerData?.[0]?.nama;

  const financeText = weeklyFinance
    ? (() => {
        const rupiah = (v: number) =>
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(v);
        const saldoMasjid =
          weeklyFinance.totalMasukMasjid - weeklyFinance.totalKeluarMasjid;
        const saldoYatim =
          weeklyFinance.totalMasukYatim - weeklyFinance.totalKeluarYatim;
        return `KEUANGAN PEKAN INI — KAS MASJID: SALDO ${rupiah(saldoMasjid)} (MASUK ${rupiah(weeklyFinance.totalMasukMasjid)}, KELUAR ${rupiah(weeklyFinance.totalKeluarMasjid)}) · KAS YATIM: SALDO ${rupiah(saldoYatim)} (MASUK ${rupiah(weeklyFinance.totalMasukYatim)}, KELUAR ${rupiah(weeklyFinance.totalKeluarYatim)})`;
      })()
    : "";

  const runningText =
    announcementItems && announcementItems.length > 0
      ? announcementItems
          .map((a, i) => `${i + 1}. ${a.content.toUpperCase()}`)
          .join("   ✦   ") + (financeText ? `   ✦   ${financeText}` : "")
      : `SELAMAT DATANG DI ${(mosque?.name ?? "MASJID").toUpperCase()} — JAGALAH KEBERSIHAN MASJID KITA BERSAMA.${financeText ? `   ✦   ${financeText}` : ""}`;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a1f14] text-gold gap-4">
        <FaMosque className="text-6xl animate-pulse" />
        <p className="text-xl font-semibold tracking-widest uppercase">
          Inisialisasi…
        </p>
      </div>
    );
  }

  const ErrorScreen = ({ title, desc }: { title: string; desc: string }) => (
    <div className="w-screen h-screen bg-[#0a1f14] text-white flex items-center justify-center p-6">
      <div className="relative max-w-2xl w-full border border-gold/30 bg-white/5 backdrop-blur-md rounded-3xl p-10 text-center shadow-2xl">
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
        desc="Gagal memuat data masjid. Silakan cek koneksi jaringan atau API endpoint."
      />
    );
  if (!prayerData)
    return (
      <ErrorScreen
        title="Koordinat Belum Diatur"
        desc="Silakan buka dashboard admin dan pilih lokasi pada peta agar jadwal sholat dapat dihitung."
      />
    );

  return (
    <div className="w-screen h-screen bg-[#071410] overflow-hidden flex flex-col select-none">
      {/* ═══ HEADER ═══ */}
      <header className="relative bg-linear-to-r from-[#0d2b1a] via-[#0f3320] to-[#0d2b1a] border-b-2 border-gold/60 shrink-0 px-8 py-3 flex items-center justify-between gap-6 overflow-hidden">
        <div className="relative flex items-center gap-4 min-w-0">
          <div className="bg-gold/10 border border-gold/40 rounded-xl p-2.5 shrink-0">
            <FaMosque className="text-gold text-4xl" />
          </div>
          <div className="min-w-0">
            <h1 className="text-gold font-display font-extrabold text-5xl leading-tight tracking-wide truncate">
              {mosque.name}
            </h1>
          </div>
        </div>

        <div className="relative flex flex-col items-center shrink-0 mr-48">
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
            <span className="text-gold/70 ml-2" style={{ fontSize: "2.5rem" }}>
              {moment(now).format("ss")}
            </span>
          </div>
          <div className="mt-1 bg-gold/10 border border-gold/30 px-5 py-1 rounded-full">
            <span className="text-gold text-sm font-semibold tracking-widest">
              {moment(now).locale("id").format("dddd, DD MMMM YYYY")}
            </span>
          </div>
        </div>

        <div className="relative text-right max-w-xs shrink-0">
          <p className="text-gold/60 text-xs tracking-[0.3em] uppercase font-medium mb-1">
            Lokasi
          </p>
          <p className="text-white font-semibold text-base leading-snug">
            <FaLocationDot className="inline mr-1.5 text-gold" />
            {mosque.address}
          </p>
          <p className="text-gold/80 text-sm mt-0.5">{mosque.city}</p>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      {/* Prayer col wider (460px), image smaller with more padding */}
      <div className="flex-1 grid grid-cols-[460px_1fr] min-h-0">
        {/* ── Jadwal Sholat ── */}
        <aside className="relative bg-linear-to-b from-[#0d2b1a] to-[#071410] border-r border-gold/20 flex flex-col px-5 py-5 gap-4 overflow-hidden">
          <div className="relative text-center mb-0">
            <p className="text-gold/50 text-xs tracking-[0.4em] uppercase font-semibold">
              Jadwal Sholat
            </p>
            <p className="text-gold/30 text-xs mt-0.5">
              {moment(now).locale("id").format("DD MMMM YYYY")}
            </p>
          </div>
          {prayerData.map((item, idx) => {
            const isNext = nextSholatName === item.nama;
            const style = PRAYER_STYLES[idx];
            return (
              <div
                key={item.nama}
                className={`relative flex items-center gap-5 rounded-2xl px-6 py-5 transition-all duration-500 ${
                  isNext ? "pulse-ring" : "bg-white/3 border border-white/10"
                }`}
                style={
                  isNext
                    ? {
                        background: `linear-linear(135deg, ${style.accent}22, ${style.accent}08)`,
                        border: `1.5px solid ${style.accent}80`,
                      }
                    : {}
                }
              >
                <div
                  className="absolute left-0 top-4 bottom-4 w-1.5 rounded-full"
                  style={{
                    background: isNext ? style.accent : `${style.accent}40`,
                  }}
                />

                <div
                  className="text-5xl shrink-0"
                  style={{ color: isNext ? style.accent : `${style.accent}80` }}
                >
                  {item.icon}
                </div>

                <div className="flex-1">
                  <p
                    className="font-bold leading-none"
                    style={{
                      fontSize: "1.5rem",
                      color: isNext ? "#fff" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {item.nama}
                  </p>
                  {isNext && (
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
                    fontSize: isNext ? "3rem" : "2.5rem",
                    color: isNext ? style.accent : "rgba(255,255,255,0.85)",
                  }}
                >
                  {item.waktu}
                </p>
              </div>
            );
          })}
          <div className="mt-auto pt-2 text-center">
            <div className="border-t border-gold/15 pt-3">
              <p className="text-gold/30 text-lg tracking-widest">﷽</p>
            </div>
          </div>
        </aside>

        {/* ── Slider — padding lebih besar agar gambar lebih kecil ── */}
        <main className="relative p-8">
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gold/20 bg-[#0a1f14] shadow-2xl">
            {currentSlide ? (
              <>
                <Image
                  key={currentSlide.id}
                  src={currentSlide.imageUrl}
                  alt="Slide Display"
                  fill
                  className="object-cover transition-opacity duration-1000"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                {displayImages && displayImages.length > 1 && (
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

      {/* ═══ FOOTER — h-16, teks lebih besar ═══ */}
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
  );
};

export default DisplayPage;
