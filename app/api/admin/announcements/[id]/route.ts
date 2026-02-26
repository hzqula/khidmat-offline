import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/announcement";

export const DELETE = async (
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    await requireAuth();

    const { id } = await params;
    await deleteAnnouncement(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menghapus pengumuman" },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await req.json();
    const updated = await updateAnnouncement(id, body?.content ?? "");

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Isi pengumuman tidak boleh kosong" ||
        error.message === "Pengumuman tidak ditemukan"
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengumuman" },
      { status: 500 },
    );
  }
};
