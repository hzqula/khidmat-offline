import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { createAnnouncement, listAnnouncements } from "@/lib/announcement";

export const GET = async () => {
  try {
    requireAuth();

    const announcements = await listAnnouncements();
    return NextResponse.json(announcements);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil pengumuman" },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  try {
    await requireAuth();

    const body = await req.json();
    const created = await createAnnouncement(body?.content ?? "");
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Isi pengumuman tidak boleh kosong" ||
        error.message === "Maksimal 10 pengumuman"
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat pengumuman" },
      { status: 500 },
    );
  }
};
