"use client";

import { Mosque } from "@/lib/types/mosque";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { DevTool } from "@hookform/devtools";
import { toast } from "sonner";
import MapPicker from "@/components/map-picker";
import { Loader2, MapPin, Building2, Navigation, Search } from "lucide-react";
import { useState } from "react";

interface ReverseGeocodeResult {
  district: string;
  city: string;
  province: string;
}

const DashboardPage = () => {
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualError, setManualError] = useState("");

  const form = useForm<Mosque>({
    defaultValues: {
      name: "",
      address: "",
      city: "",
      province: "",
      timezone: "Asia/Jakarta",
      latitude: 0,
      longitude: 0,
    },
  });

  const { isLoading } = useQuery({
    queryKey: ["mosque"],
    queryFn: async () => {
      const { data } = await api.get("/admin/mosque");
      if (data) {
        form.reset({
          ...data,
          district: data.district ?? "",
          city: data.city ?? "",
          province: data.province ?? "",
        });
        if (data.latitude != null) setManualLat(String(data.latitude));
        if (data.longitude != null) setManualLng(String(data.longitude));
      }
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (newMosque: Mosque) => api.post("/admin/mosque", newMosque),
    onSuccess: () => toast.success("Data masjid berhasil disimpan!"),
    onError: () => toast.error("Gagal menyimpan data"),
  });

  const reverseGeocodeMutation = useMutation({
    mutationFn: async ({
      lat,
      lng,
    }: {
      lat: number;
      lng: number;
    }): Promise<ReverseGeocodeResult> => {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(lat),
        lon: String(lng),
        "accept-language": "id",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      );

      if (!response.ok) throw new Error("Gagal mengambil data wilayah");

      const result = await response.json();
      const address = result?.address ?? {};

      return {
        district:
          address.suburb ??
          address.city_district ??
          address.township ??
          address.village ??
          "",
        city:
          address.city ??
          address.county ??
          address.town ??
          address.state_district ??
          "",
        province: address.state ?? "",
      };
    },
    onSuccess: ({ district, city, province }) => {
      if (district) form.setValue("district", district, { shouldDirty: true });
      if (city) form.setValue("city", city, { shouldDirty: true });
      if (province) form.setValue("province", province, { shouldDirty: true });
      toast.success("Berhasil mendapatkan koordinat");
    },
    onError: () => {
      toast.error("Koordinat tersimpan, tapi autofill wilayah gagal.");
    },
  });

  // Handle manual coordinate input
  const handleApplyManualCoords = () => {
    setManualError("");
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualError("Latitude harus berupa angka antara -90 dan 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setManualError("Longitude harus berupa angka antara -180 dan 180.");
      return;
    }

    form.setValue("latitude", lat, { shouldDirty: true });
    form.setValue("longitude", lng, { shouldDirty: true });
    reverseGeocodeMutation.mutate({ lat, lng });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col p-6 bg-green-50/30 min-h-screen gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`space-y-2 ${i >= 1 && i <= 2 ? "md:col-span-2" : ""}`}
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <div className="md:col-span-2 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-80 w-full rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 bg-green-50/30 min-h-screen gap-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-4xl font-display text-emerald-900">
          Detail Masjid
        </h1>
        <p className="text-muted-foreground mt-1">
          Atur informasi dasar dan lokasi untuk jadwal shalat.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-6"
        >
          {/* Informasi Dasar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Informasi Masjid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Masjid</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Masjid Agung An-Nur"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Alamat Lengkap</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jl. Cendana No. 10..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Wilayah */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Wilayah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kecamatan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Mandau" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kabupaten / Kota</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Kota Pekanbaru"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Provinsi</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Riau" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lokasi Peta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-emerald-600" />
                Lokasi Geografis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Manual coordinate input */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-3">
                <p className="text-sm font-medium text-blue-800">
                  Input Koordinat Manual
                </p>
                <p className="text-xs text-blue-600">
                  Masukkan koordinat secara langsung jika sudah mengetahui nilai
                  latitude dan longitude masjid.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-blue-700">
                      Latitude
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Contoh: 0.507068"
                      value={manualLat}
                      onChange={(e) => {
                        setManualLat(e.target.value);
                        setManualError("");
                      }}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-blue-700">
                      Longitude
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Contoh: 101.447779"
                      value={manualLng}
                      onChange={(e) => {
                        setManualLng(e.target.value);
                        setManualError("");
                      }}
                      className="bg-white"
                    />
                  </div>
                </div>
                {manualError && (
                  <p className="text-xs text-red-600">{manualError}</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyManualCoords}
                  disabled={reverseGeocodeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {reverseGeocodeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Search className="h-3.5 w-3.5 mr-1" />
                  )}
                  Terapkan Koordinat
                </Button>
              </div>

              <Separator />

              <MapPicker
                lat={form.watch("latitude") ?? 0.507068}
                lng={form.watch("longitude") ?? 101.447779}
                onChange={(lat, lng) => {
                  form.setValue("latitude", lat, { shouldDirty: true });
                  form.setValue("longitude", lng, { shouldDirty: true });
                  setManualLat(String(lat));
                  setManualLng(String(lng));
                  reverseGeocodeMutation.mutate({ lat, lng });
                }}
              />
              <p className="text-sm text-muted-foreground">
                Klik peta untuk memilih lokasi, atau gunakan input koordinat
                manual di atas. Kecamatan, kabupaten/kota, dan provinsi akan
                dicoba diisi otomatis dan tetap bisa Anda edit.
              </p>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                        Latitude (Tersimpan)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                          {...field}
                          type="text"
                          readOnly
                          disabled
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                        Longitude (Tersimpan)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                          {...field}
                          type="text"
                          readOnly
                          disabled
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="w-full md:w-fit bg-emerald-600 hover:bg-emerald-700"
              disabled={mutation.isPending || reverseGeocodeMutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Form>

      <DevTool control={form.control} />
    </div>
  );
};

export default DashboardPage;
