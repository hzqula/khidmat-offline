import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { removeDisplayImage } from "@/lib/upload";

type Params = Promise<{ id: string }>;

export const DELETE = async (_req: Request, { params }: { params: Params }) => {
  try {
    await requireAuth();

    const { id } = await params;

    const existing = await prisma.displayImage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan" },
        { status: 404 },
      );
    }

    await removeDisplayImage(id, existing.imagePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal menghapus gambar" },
      { status: 500 },
    );
  }
};
