import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateMosque, updateMosque } from "@/lib/mosque";

export const GET = async () => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Belum login" }, { status: 401 });

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
