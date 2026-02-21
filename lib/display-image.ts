import { prisma } from "@/lib/prisma";

export const MAX_DISPLAY_IMAGES = 10;

export async function listDisplayImages() {
  return prisma.displayImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createDisplayImage(data: {
  imageUrl: string;
  imagePath: string;
}) {
  const count = await prisma.displayImage.count();

  if (count >= MAX_DISPLAY_IMAGES) {
    throw new Error("Batas maksimal 10 gambar sudah tercapai");
  }

  const maxSort = await prisma.displayImage.aggregate({
    _max: { sortOrder: true },
  });

  return prisma.displayImage.create({
    data: {
      imageUrl: data.imageUrl,
      imagePath: data.imagePath,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function deleteDisplayImage(id: string) {
  return prisma.displayImage.delete({ where: { id } });
}
