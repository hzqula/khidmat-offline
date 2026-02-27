import { prisma } from "@/lib/prisma";

export const ANNOUNCEMENT_LIMIT = 10;

export const listAnnouncements = async () => {
  return prisma.announcement.findMany({
    take: ANNOUNCEMENT_LIMIT,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createAnnouncement = async (content: string) => {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Isi pengumuman tidak boleh kosong");
  }

  const total = await prisma.announcement.count();

  if (total >= ANNOUNCEMENT_LIMIT) {
    throw new Error("Maksimal 5 pengumuman");
  }

  return prisma.announcement.create({
    data: {
      content: trimmedContent,
    },
  });
};

export const updateAnnouncement = async (id: string, content: string) => {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Isi pengumuman tidak boleh kosong");
  }

  const existing = await prisma.announcement.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Pengumuman tidak ditemukan");
  }

  return prisma.announcement.update({
    where: { id },
    data: { content: trimmedContent },
  });
};

export const deleteAnnouncement = async (id: string) => {
  return prisma.announcement.delete({
    where: {
      id,
    },
  });
};
