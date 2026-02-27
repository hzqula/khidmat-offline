import { NextResponse } from "next/server";
import {
  getPrayerSettings,
  updatePrayerSettings,
  COUNTDOWN_OPTIONS,
  type CountdownMinutes,
} from "@/lib/prayer-settings";
import { requireAuth } from "@/lib/session";

export const GET = async () => {
  try {
    await requireAuth();
    return NextResponse.json(await getPrayerSettings());
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Gagal mengambil pengaturan" },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  try {
    await requireAuth();

    const body = await req.json();
    const iqamahCountdown = Number(body?.iqamahCountdownMinutes);

    if (!COUNTDOWN_OPTIONS.includes(iqamahCountdown as CountdownMinutes)) {
      return NextResponse.json(
        { error: "Nilai countdown tidak valid. Pilih 5, 10, atau 15 menit." },
        { status: 400 },
      );
    }

    const salatDurationMinutes = Number(body?.salatDurationMinutes);
    if (!Number.isFinite(salatDurationMinutes) || salatDurationMinutes < 1) {
      return NextResponse.json(
        { error: "Durasi shalat tidak valid." },
        { status: 400 },
      );
    }

    const jumaahKhutbahMinutes = Number(body?.jumaahKhutbahMinutes);
    if (!Number.isFinite(jumaahKhutbahMinutes) || jumaahKhutbahMinutes < 1) {
      return NextResponse.json(
        { error: "Durasi khutbah tidak valid." },
        { status: 400 },
      );
    }

    const jumaahSalatDurationMinutes = Number(body?.jumaahSalatDurationMinutes);
    if (
      !Number.isFinite(jumaahSalatDurationMinutes) ||
      jumaahSalatDurationMinutes < 1
    ) {
      return NextResponse.json(
        { error: "Durasi shalat Jum'at tidak valid." },
        { status: 400 },
      );
    }

    const updated = await updatePrayerSettings({
      iqamahCountdownMinutes: iqamahCountdown as CountdownMinutes,
      adhanSoundPath: body?.adhanSoundPath ?? "/sounds/adhan-default.mp3",
      iqamahSoundPath: body?.iqamahSoundPath ?? "/sounds/iqamah-default.mp3",
      adhanAlarmEnabled: Boolean(body?.adhanAlarmEnabled),
      iqamahAlarmEnabled: Boolean(body?.iqamahAlarmEnabled),
      salatDurationMinutes,
      jumaahKhutbahMinutes,
      jumaahSalatDurationMinutes,
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan" },
      { status: 500 },
    );
  }
};
