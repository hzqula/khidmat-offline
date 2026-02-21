import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDisplayImage,
  listDisplayImages,
  MAX_DISPLAY_IMAGES,
} from "@/lib/display-image";

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET!;

export const GET = async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }

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

export const POST = async (req: Request) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }

    const existingImages = await listDisplayImages();

    if (existingImages.length >= MAX_DISPLAY_IMAGES) {
      return NextResponse.json(
        { error: "Batas maksimal 10 gambar sudah tercapai" },
        { status: 400 },
      );
    }

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const imagePath = `display/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(imagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: "Gagal mengunggah ke Supabase Storage" },
        { status: 500 },
      );
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(imagePath);

    const record = await createDisplayImage({
      imageUrl: publicData.publicUrl,
      imagePath,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Gagal menyimpan gambar" },
      { status: 500 },
    );
  }
};
