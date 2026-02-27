import { prisma } from "@/lib/prisma";

export const COUNTDOWN_OPTIONS = [5, 10, 15] as const;
export type CountdownMinutes = (typeof COUNTDOWN_OPTIONS)[number];

export interface PrayerSettingsInput {
  /** Durasi countdown iqamah setelah azan berbunyi (menit) */
  iqamahCountdownMinutes: CountdownMinutes;
  adhanSoundPath: string;
  iqamahSoundPath: string;
  adhanAlarmEnabled: boolean;
  iqamahAlarmEnabled: boolean;
  /** Durasi overlay shalat biasa (menit) */
  salatDurationMinutes: number;
  /** Durasi Khutbah Jum'at sebelum iqamah (menit) */
  jumaahKhutbahMinutes: number;
  /** Durasi overlay shalat Jum'at (menit) */
  jumaahSalatDurationMinutes: number;
}

/** Ambil pengaturan, buat record default jika belum ada */
export async function getPrayerSettings() {
  const existing = await prisma.prayerSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.prayerSettings.create({
    data: {
      iqamahCountdownMinutes: 10,
      adhanSoundPath: "/sounds/adhan-default.mp3",
      iqamahSoundPath: "/sounds/iqamah-default.mp3",
      adhanAlarmEnabled: true,
      iqamahAlarmEnabled: true,
      salatDurationMinutes: 20,
      jumaahKhutbahMinutes: 30,
      jumaahSalatDurationMinutes: 15,
    },
  });
}

export async function updatePrayerSettings(data: Partial<PrayerSettingsInput>) {
  const settings = await getPrayerSettings();
  return prisma.prayerSettings.update({ where: { id: settings.id }, data });
}
