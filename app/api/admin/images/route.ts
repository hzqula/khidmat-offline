import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { listDisplayImages } from "@/lib/display-image";
import { uploadDisplayImage } from "@/lib/upload";

export const GET = async () => {
  try {
    await requireAuth();
    const images = await listDisplayImages();
    return NextResponse.json(images);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal mengambil daftar gambar" },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak valid" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File harus berupa gambar" },
        { status: 400 },
      );
    }

    const record = await uploadDisplayImage(file);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Belum login" }, { status: 401 });
      }
      if (error.message === "Batas maksimal 10 gambar sudah tercapai") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Gagal menyimpan gambar" },
      { status: 500 },
    );
  }
};
