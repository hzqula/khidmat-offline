import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteDisplayImage } from "@/lib/display-image";
import { prisma } from "@/lib/prisma";

const BUCKET_NAME =
  process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || "display-images";

type Params = Promise<{ id: string }>;

export const DELETE = async (_req: Request, { params }: { params: Params }) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.displayImage.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan" },
        { status: 404 },
      );
    }

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([existing.imagePath]);

    if (storageError) {
      console.error(storageError);
    }

    await deleteDisplayImage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menghapus gambar" },
      { status: 500 },
    );
  }
};
