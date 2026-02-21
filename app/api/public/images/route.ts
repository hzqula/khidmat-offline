import { NextResponse } from "next/server";
import { listDisplayImages } from "@/lib/display-image";

export const GET = async () => {
  try {
    const images = await listDisplayImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar gambar" },
      { status: 500 },
    );
  }
};
