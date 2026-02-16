import { prisma } from "@/lib/prisma";

type MosqueInput = {
  name: string;
  address: string;
  city: string;
  province: string;
  timezone: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  logoUrl?: string | null;
};

const DEFAULT_MOSQUE: MosqueInput = {
  name: "Masjid",
  address: "",
  city: "",
  province: "",
  timezone: "Asia/Jakarta",
  latitude: null,
  longitude: null,
  description: null,
  logoUrl: null,
};

export async function getOrCreateMosque() {
  const existing = await prisma.mosque.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return prisma.mosque.create({ data: DEFAULT_MOSQUE });
}

export async function updateMosque(data: Partial<MosqueInput>) {
  const mosque = await getOrCreateMosque();

  return prisma.mosque.update({
    where: { id: mosque.id },
    data,
  });
}
