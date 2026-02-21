export type FinanceCategory = "INFAQ_MASJID" | "INFAQ_ANAK_YATIM";
export type FinanceType = "PEMASUKAN" | "PENGELUARAN";

export interface FinanceTransaction {
  id: string;
  nominal: number;
  category: FinanceCategory;
  type: FinanceType;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyFinanceSummary {
  totalMasukMasjid: number;
  totalKeluarMasjid: number;
  totalMasukYatim: number;
  totalKeluarYatim: number;
  weekStart: string;
}

export interface FinanceDashboardPayload {
  summary: WeeklyFinanceSummary;
  transactions: FinanceTransaction[];
}
