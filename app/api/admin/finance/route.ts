import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createFinanceTransaction,
  FinanceCategory,
  FinanceType,
  getWeeklyFinanceSummary,
  listRecentFinanceTransactions,
} from "@/lib/finance";

const isValidCategory = (value: unknown): value is FinanceCategory => {
  return ["INFAQ_MASJID", "INFAQ_ANAK_YATIM"].includes(
    value as FinanceCategory,
  );
};

const isValidType = (value: unknown): value is FinanceType => {
  return ["PEMASUKAN", "PENGELUARAN"].includes(value as FinanceType);
};

const guardSession = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  return null;
};

export const GET = async () => {
  try {
    const unauthorized = await guardSession();

    if (unauthorized) {
      return unauthorized;
    }

    const [summary, transactions] = await Promise.all([
      getWeeklyFinanceSummary(),
      listRecentFinanceTransactions(),
    ]);

    return NextResponse.json({ summary, transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil data keuangan" },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const unauthorized = await guardSession();

    if (unauthorized) {
      return unauthorized;
    }

    const body = await req.json();

    if (!isValidCategory(body?.category) || !isValidType(body?.type)) {
      return NextResponse.json(
        { error: "Kategori atau tipe transaksi tidak valid" },
        { status: 400 },
      );
    }

    const transaction = await createFinanceTransaction({
      nominal: Number(body?.nominal),
      category: body.category,
      type: body.type,
      description: body?.description,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Nominal harus lebih dari 0"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi" },
      { status: 500 },
    );
  }
};
