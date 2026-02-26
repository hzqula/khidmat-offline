import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import {
  createDisplayImage,
  deleteDisplayImage,
  listDisplayImages,
  MAX_DISPLAY_IMAGES,
} from "@/lib/display-image";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "display");

export async function uploadDisplayImage(file: File) {
  const existing = await listDisplayImages();
  if (existing.length >= MAX_DISPLAY_IMAGES) {
    throw new Error("Batas maksimal 10 gambar sudah tercapai");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomUUID()}.jpg`;
  const filepath = join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/display/${filename}`;
  return createDisplayImage({ imageUrl, imagePath: filename });
}

export async function removeDisplayImage(id: string, imagePath: string) {
  const filepath = join(UPLOAD_DIR, imagePath);

  try {
    await unlink(filepath);
  } catch {
    // file mungkin sudah tidak ada, lanjut hapus dari DB
  }

  return deleteDisplayImage(id);
}
