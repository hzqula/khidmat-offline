import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteAnnouncement } from "@/lib/announcement";
export const DELETE = async (
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }

    const { id } = await params;
    await deleteAnnouncement(id);
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menghapus pengumuman" },
      { status: 500 },
    );
  }
};
