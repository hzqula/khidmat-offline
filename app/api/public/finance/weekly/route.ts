import { NextResponse } from "next/server";
import { getWeeklyFinanceSummary } from "@/lib/finance";

export const GET = async () => {
  try {
    const summary = await getWeeklyFinanceSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil ringkasan keuangan" },
      { status: 500 },
    );
  }
};
