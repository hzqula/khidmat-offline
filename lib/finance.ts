import moment from "moment-timezone";
import { prisma } from "@/lib/prisma";

export type FinanceCategory = "INFAQ_MASJID" | "INFAQ_ANAK_YATIM";
export type FinanceType = "PEMASUKAN" | "PENGELUARAN";

export interface CreateFinanceTransactionInput {
  nominal: number;
  category: FinanceCategory;
  type: FinanceType;
  description?: string;
}

const toPositiveInteger = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Nominal harus lebih dari 0");
  }

  return Math.floor(value);
};

export const createFinanceTransaction = async (
  payload: CreateFinanceTransactionInput,
) => {
  const nominal = toPositiveInteger(payload.nominal);

  return prisma.financeTransaction.create({
    data: {
      nominal,
      category: payload.category,
      type: payload.type,
      description: payload.description?.trim() || null,
    },
  });
};

const getWeekStartDate = async () => {
  const mosque = await prisma.mosque.findFirst({
    select: {
      timezone: true,
    },
  });

  const timezone = mosque?.timezone || "Asia/Jakarta";

  return moment.tz(timezone).startOf("isoWeek").toDate();
};

export const listRecentFinanceTransactions = async () => {
  return prisma.financeTransaction.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });
};

export const getWeeklyFinanceSummary = async () => {
  const weekStart = await getWeekStartDate();

  const grouped = await prisma.financeTransaction.groupBy({
    by: ["category", "type"],
    where: {
      createdAt: {
        gte: weekStart,
      },
    },
    _sum: {
      nominal: true,
    },
  });

  const summary = {
    totalMasukMasjid: 0,
    totalKeluarMasjid: 0,
    totalMasukYatim: 0,
    totalKeluarYatim: 0,
    weekStart,
  };

  for (const row of grouped) {
    const total = row._sum.nominal ?? 0;

    if (row.category === "INFAQ_MASJID" && row.type === "PEMASUKAN") {
      summary.totalMasukMasjid = total;
    }

    if (row.category === "INFAQ_MASJID" && row.type === "PENGELUARAN") {
      summary.totalKeluarMasjid = total;
    }

    if (row.category === "INFAQ_ANAK_YATIM" && row.type === "PEMASUKAN") {
      summary.totalMasukYatim = total;
    }

    if (row.category === "INFAQ_ANAK_YATIM" && row.type === "PENGELUARAN") {
      summary.totalKeluarYatim = total;
    }
  }

  return summary;
};
