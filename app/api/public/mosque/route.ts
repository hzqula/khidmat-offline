import { NextResponse } from "next/server";
import { getOrCreateMosque } from "@/lib/mosque";

export const GET = async () => {
  try {
    const mosque = await getOrCreateMosque();
    return NextResponse.json(mosque);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
};
