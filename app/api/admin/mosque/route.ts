import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getOrCreateMosque, updateMosque } from "@/lib/mosque";

export const GET = async () => {
  try {
    await requireAuth();
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

export const POST = async (req: Request) => {
  try {
    await requireAuth();
    const body = await req.json();
    const { id, ...mosqueData } = body;
    const mosque = await updateMosque(mosqueData);
    return NextResponse.json(mosque);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menyimpan data" },
      { status: 500 },
    );
  }
};
