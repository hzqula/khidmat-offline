"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FaSpinner, FaTrash } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { DisplayImage } from "@/lib/types/display-image";

const MAX_IMAGES = 10;
const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 900;

type CropConfig = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

const createCroppedFile = async (
  file: File,
  config: CropConfig,
): Promise<File> => {
  const img = document.createElement("img");
  const imageUrl = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(imageUrl);
    throw new Error("Canvas tidak tersedia");
  }

  const coverScale = Math.max(
    TARGET_WIDTH / img.width,
    TARGET_HEIGHT / img.height,
  );
  const scale = coverScale * config.zoom;

  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;

  const x =
    (TARGET_WIDTH - drawWidth) / 2 +
    (config.offsetX / 100) * (TARGET_WIDTH / 2);
  const y =
    (TARGET_HEIGHT - drawHeight) / 2 +
    (config.offsetY / 100) * (TARGET_HEIGHT / 2);

  ctx.drawImage(img, x, y, drawWidth, drawHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Gagal memproses gambar"));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      0.92,
    );
  });

  URL.revokeObjectURL(imageUrl);

  return new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}-cropped.jpg`, {
    type: "image/jpeg",
  });
};

const ImagesPage = () => {
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropConfig, setCropConfig] = useState<CropConfig>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const { data, isLoading } = useQuery<DisplayImage[]>({
    queryKey: ["display-images"],
    queryFn: async () => {
      const response = await api.get("/admin/images");
      return response.data;
    },
  });

  const images = data ?? [];
  const remaining = Math.max(0, MAX_IMAGES - images.length);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return api.post("/admin/images", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["display-images"] });
      queryClient.invalidateQueries({ queryKey: ["public-images"] });
      toast.success("Gambar berhasil diunggah");
      setSelectedFile(null);
      setCropConfig({ zoom: 1, offsetX: 0, offsetY: 0 });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Gagal mengunggah gambar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/images/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["display-images"] });
      queryClient.invalidateQueries({ queryKey: ["public-images"] });
      toast.success("Gambar berhasil dihapus");
    },
    onError: () => {
      toast.error("Gagal menghapus gambar");
    },
  });

  const onPickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      event.target.value = "";
      return;
    }

    if (images.length >= MAX_IMAGES) {
      toast.error("Batas maksimal 10 gambar sudah tercapai");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setCropConfig({ zoom: 1, offsetX: 0, offsetY: 0 });
    event.target.value = "";
  };

  const onUpload = async () => {
    if (!selectedFile) return;

    try {
      const cropped = await createCroppedFile(selectedFile, cropConfig);
      uploadMutation.mutate(cropped);
    } catch {
      toast.error("Gagal memproses crop gambar");
    }
  };

  return (
    <div className="flex flex-col p-6 bg-green-50/30 min-h-screen gap-6">
      <div>
        <h1 className="font-bold text-4xl font-display text-emerald-900">
          Unggah Gambar Display
        </h1>
        <p className="text-muted-foreground">
          Maksimal {MAX_IMAGES} gambar. Setiap gambar akan dicrop rasio 16:9
          agar pas dengan slider di halaman display.
        </p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Total gambar:{" "}
            <span className="font-semibold text-emerald-800">
              {images.length}
            </span>{" "}
            /{MAX_IMAGES} (sisa slot: {remaining})
          </p>
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
              disabled={remaining === 0 || uploadMutation.isPending}
            />
            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:opacity-50">
              Pilih Gambar
            </span>
          </label>
        </div>

        {selectedFile && previewUrl && (
          <div className="border rounded-xl p-4 space-y-4">
            <h2 className="font-semibold text-emerald-900">
              Crop sebelum upload (16:9)
            </h2>

            <div className="w-full max-w-3xl mx-auto aspect-video rounded-lg overflow-hidden relative bg-gray-100 border">
              <Image
                src={previewUrl}
                alt="Preview crop"
                fill
                unoptimized
                className="object-cover"
                style={{
                  transform: `scale(${cropConfig.zoom})`,
                  objectPosition: `${50 + cropConfig.offsetX}% ${50 + cropConfig.offsetY}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Zoom ({cropConfig.zoom.toFixed(2)}x)
                </label>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.01}
                  value={cropConfig.zoom}
                  onChange={(event) =>
                    setCropConfig((prev) => ({
                      ...prev,
                      zoom: Number(event.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Geser Horizontal ({cropConfig.offsetX}%)
                </label>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={cropConfig.offsetX}
                  onChange={(event) =>
                    setCropConfig((prev) => ({
                      ...prev,
                      offsetX: Number(event.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Geser Vertikal ({cropConfig.offsetY}%)
                </label>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={cropConfig.offsetY}
                  onChange={(event) =>
                    setCropConfig((prev) => ({
                      ...prev,
                      offsetY: Number(event.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={uploadMutation.isPending}
                onClick={onUpload}
              >
                {uploadMutation.isPending ? (
                  <>
                    <FaSpinner className="animate-spin" /> Mengunggah...
                  </>
                ) : (
                  "Upload ke Supabase"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={uploadMutation.isPending}
                onClick={() => setSelectedFile(null)}
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Daftar Gambar</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-full" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="text-muted-foreground">
            Belum ada gambar untuk display.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden bg-white"
              >
                <div className="aspect-video relative bg-gray-100">
                  <Image
                    src={item.imageUrl}
                    alt={`Slide ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Slide #{index + 1}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    <FaTrash /> Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesPage;
