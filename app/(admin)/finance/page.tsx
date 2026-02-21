"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { AxiosError } from "axios";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FinanceCategory,
  FinanceDashboardPayload,
  FinanceType,
} from "@/lib/types/finance";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface FormValues {
  nominal: number;
  category: FinanceCategory;
  type: FinanceType;
  description: string;
}

interface ErrorResponse {
  error: string;
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDisplay = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (formatted: string) => {
  return Number(formatted.replace(/\./g, ""));
};

const FinancePage = () => {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      nominal: 0,
      category: "INFAQ_MASJID",
      type: "PEMASUKAN",
      description: "",
    },
  });

  const { data, isLoading } = useQuery<FinanceDashboardPayload>({
    queryKey: ["finance-dashboard"],
    queryFn: async () => {
      const response = await api.get("/admin/finance");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FormValues) => {
      return api.post("/admin/finance", payload);
    },
    onSuccess: () => {
      form.reset({
        nominal: 0,
        category: "INFAQ_MASJID",
        type: "PEMASUKAN",
        description: "",
      });
      queryClient.invalidateQueries({ queryKey: ["finance-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["public-weekly-finance"] });
      toast.success("Transaksi berhasil disimpan");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.error || "Gagal menyimpan transaksi");
    },
  });

  const summaryCards = useMemo(() => {
    if (!data?.summary) return [];
    return [
      {
        label: "Masjid - Pemasukan",
        value: data.summary.totalMasukMasjid,
        type: "PEMASUKAN",
      },
      {
        label: "Masjid - Pengeluaran",
        value: data.summary.totalKeluarMasjid,
        type: "PENGELUARAN",
      },
      {
        label: "Yatim - Pemasukan",
        value: data.summary.totalMasukYatim,
        type: "PEMASUKAN",
      },
      {
        label: "Yatim - Pengeluaran",
        value: data.summary.totalKeluarYatim,
        type: "PENGELUARAN",
      },
    ];
  }, [data]);

  return (
    <div className="flex flex-col p-6 bg-green-50/30 min-h-screen gap-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-4xl font-display text-emerald-900">
          Catatan Keuangan
        </h1>
        <p className="text-muted-foreground mt-1">
          Input transaksi sekali, lalu sistem otomatis menghitung ringkasan
          pekan berjalan.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Input Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid md:grid-cols-2 gap-4"
              onSubmit={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
            >
              <FormField
                control={form.control}
                name="nominal"
                rules={{
                  required: "Nominal wajib diisi",
                  min: { value: 1, message: "Nominal harus lebih dari 0" },
                }}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nominal</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="pl-9"
                          value={formatDisplay(String(field.value || ""))}
                          onChange={(e) => {
                            const raw = parseNumber(e.target.value);
                            field.onChange(raw);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INFAQ_MASJID">
                          Infaq Masjid
                        </SelectItem>
                        <SelectItem value="INFAQ_ANAK_YATIM">
                          Infaq Anak Yatim
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PEMASUKAN">Pemasukan</SelectItem>
                        <SelectItem value="PENGELUARAN">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keterangan</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={!form.formState.isValid || createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan Transaksi
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="font-bold">{item.label}</CardHeader>
            <CardContent className="flex items-center justify-between mb-2">
              <p
                className={`text-2xl font-bold ${
                  item.type === "PEMASUKAN"
                    ? "text-emerald-900"
                    : "text-red-600"
                }`}
              >
                {formatRupiah(item.value)}
              </p>
              {item.type === "PEMASUKAN" ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : data?.transactions.length ? (
            <div className="space-y-3">
              {data.transactions.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-start justify-between gap-3 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-emerald-900">
                          {item.category === "INFAQ_MASJID"
                            ? "Infaq Masjid"
                            : "Infaq Anak Yatim"}
                        </p>
                        <Badge
                          variant={
                            item.type === "PEMASUKAN"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            item.type === "PEMASUKAN"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : ""
                          }
                        >
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description || "Tanpa keterangan"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-bold ${
                          item.type === "PEMASUKAN"
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {item.type === "PEMASUKAN" ? "+" : "-"}
                        {formatRupiah(item.nominal)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {moment(item.createdAt).format("DD MMM YYYY HH:mm")}
                      </p>
                    </div>
                  </div>
                  {index < data.transactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Belum ada transaksi.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePage;
