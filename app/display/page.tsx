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

const DisplayPage = () => {
  const [now, setNow] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);
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
    const interval = setInterval(() => setNow(new Date()), 1000);
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
        border: "border-jewel-green",
        bgIcon: "text-jewel-green",
      },
      {
        nama: "Dzuhur",
        waktu: formatTime(prayerTimes.dhuhr),
        icon: <FaSun />,
        border: "border-jewel-yellow",
        bgIcon: "text-jewel-yellow",
      },
      {
        nama: "Ashar",
        waktu: formatTime(prayerTimes.asr),
        icon: <FaCloudSun />,
        border: "border-jewel-red",
        bgIcon: "text-jewel-red",
      },
      {
        nama: "Maghrib",
        waktu: formatTime(prayerTimes.maghrib),
        icon: <PiSunHorizonFill />,
        border: "border-jewel-blue",
        bgIcon: "text-jewel-blue",
      },
      {
        nama: "Isya",
        waktu: formatTime(prayerTimes.isha),
        icon: <RiMoonClearFill />,
        border: "border-jewel-purple",
        bgIcon: "text-jewel-purple",
      },
    ];
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
  const nextSholat =
    prayerData?.find((s) => s.waktu > currentTimeStr) || prayerData?.[0];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-emerald-900 text-white">
        Inisialisasi...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-screen h-screen bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 md:p-10 text-center shadow-2xl">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-4xl">
            <PiNetworkSlash />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Koneksi Bermasalah
          </h2>
          <p className="text-lg md:text-xl text-emerald-50 leading-relaxed">
            Gagal memuat data masjid. Silakan cek API/public endpoint atau
            koneksi jaringan perangkat display ini.
          </p>
        </div>
      </div>
    );
  }

  const financeText = weeklyFinance
    ? (() => {
        const saldoMasjid =
          weeklyFinance.totalMasukMasjid - weeklyFinance.totalKeluarMasjid;
        const saldoYatim =
          weeklyFinance.totalMasukYatim - weeklyFinance.totalKeluarYatim;

        const rupiah = (value: number) =>
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(value);

        return `Keuangan pekan ini - Kas Masjid: saldo ${rupiah(saldoMasjid)} (masuk ${rupiah(weeklyFinance.totalMasukMasjid)}, keluar ${rupiah(weeklyFinance.totalKeluarMasjid)}). Kas Yatim: saldo ${rupiah(saldoYatim)} (masuk ${rupiah(weeklyFinance.totalMasukYatim)}, keluar ${rupiah(weeklyFinance.totalKeluarYatim)}).`;
      })()
    : "";

  const runningAnnouncementText =
    announcementItems && announcementItems.length > 0
      ? announcementItems
          .map((announcement, index) => `${index + 1}. ${announcement.content}`)
          .join("   ✦   ") + (financeText ? `   ✦   ${financeText}` : "")
      : `Selamat Datang di ${mosque?.name ?? "Masjid"} - Jagalah kebersihan masjid kita bersama.${financeText ? `   ✦   ${financeText}` : ""}`;

  if (!prayerData) {
    return (
      <div className="w-screen h-screen bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 md:p-10 text-center shadow-2xl">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-4xl">
            <PiNetworkSlash />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Koordinat belum diatur
          </h2>
          <p className="text-lg md:text-xl text-emerald-50 leading-relaxed">
            Silakan buka dashboard admin lalu pilih lokasi pada peta agar jadwal
            sholat dapat dihitung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-white gap-0 flex flex-col overflow-hidden">
      {/* Header Dinamis */}
      <div className="bg-emerald-deep w-full flex items-center justify-between px-8 py-4 border-b-4 border-gold shrink-0">
        <div className="flex gap-6 items-center">
          <FaMosque className="size-12 text-gold" />
          <h1 className="font-display text-6xl font-extrabold text-gold uppercase">
            {mosque.name}
          </h1>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-7xl text-white font-bold tracking-tighter">
            {moment(now).format("HH:mm:ss")}
          </div>
          <div className="flex gap-3 mt-3">
            <span className="bg-emerald-600 text-white border border-emerald-500 px-4 py-1 rounded-full text-sm font-semibold">
              {moment(now).locale("id").format("dddd, DD MMMM YYYY")}
            </span>
          </div>
        </div>
        <div className="max-w-xs text-right">
          <p className="text-gold font-bold text-lg leading-tight">
            <FaLocationDot className="inline mr-2" />
            {mosque.address}, {mosque.city}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white flex-1 grid grid-cols-[1.2fr_2.8fr] gap-0 min-h-0">
        <div className="px-6 py-8 overflow-y-auto bg-gray-50/50">
          <div className="flex flex-col gap-5">
            {prayerData.map((item) => {
              const isActive = nextSholat?.nama === item.nama;
              return (
                <div
                  key={item.nama}
                  className={`
                    ${item.border} ${isActive ? "bg-emerald-600 border-none scale-105 shadow-xl" : "bg-white"} 
                    border-3 rounded-xl p-5 flex items-center gap-5 transition-all duration-500
                  `}
                >
                  <div
                    className={`${isActive ? "text-white" : item.bgIcon} text-5xl min-w-15 text-center`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <h3
                      className={`${isActive ? "text-white text-4xl" : "text-black text-2xl"} font-bold transition-all`}
                    >
                      {item.nama}
                    </h3>
                    <p
                      className={`${isActive ? "text-white" : "text-emerald-700"} text-5xl font-black`}
                    >
                      {item.waktu}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Image Slider Space */}
        <div className="py-4 pr-4 h-full w-full">
          <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-inner bg-gray-100 flex items-center justify-center border-2 border-gray-200">
            {currentSlide ? (
              <>
                <Image
                  key={currentSlide.id}
                  src={currentSlide.imageUrl}
                  alt="Slide Display"
                  fill
                  className="object-cover transition-opacity duration-700"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {displayImages?.map((image, index) => (
                    <span
                      key={image.id}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeSlide
                          ? "w-8 bg-white"
                          : "w-2.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : mosque.logoUrl ? (
              <Image
                src={mosque.logoUrl}
                alt="Logo"
                fill
                className="object-cover"
              />
            ) : (
              <p className="text-gray-400 italic">
                Belum ada gambar slider. Silakan unggah dari dashboard admin.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Pengumuman */}
      <div className="w-full h-14 border-t-2 border-gold/30 flex items-center bg-emerald-deep overflow-hidden shrink-0">
        {/* Label badge */}
        <div className="shrink-0 h-full flex items-center">
          <div className="bg-gold text-emerald-deep h-full px-6 flex items-center font-bold text-sm tracking-widest uppercase">
            📢 Pengumuman
          </div>
          {/* Chevron arrow — tinggi harus pas dengan h-14 = 56px, jadi border-t/b = 28px */}
          <div className="w-0 h-0 border-t-28 border-b-28 border-l-18 border-t-transparent border-b-transparent border-l-gold shrink-0" />
        </div>

        {/* Teks berjalan */}
        <div className="relative flex-1 overflow-hidden h-full flex items-center pl-4">
          <div
            className="marquee-text text-base font-semibold text-white whitespace-nowrap"
            style={{
              animationDuration: `${Math.max(20, runningAnnouncementText.length * 0.12)}s`,
            }}
          >
            {runningAnnouncementText}
            &nbsp;&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;&nbsp;
            {runningAnnouncementText}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayPage;
