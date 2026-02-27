"use client";

import { AxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Trash2, Loader2, Pencil, Check, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Announcement } from "@/lib/types/announcement";
import { toast } from "sonner";

interface AnnouncementForm {
  content: string;
}

interface ErrorResponse {
  error: string;
}

const MAX_ANNOUNCEMENTS = 10;
const MAX_CHARS = 200;

// ── Inline edit row ────────────────────────────────────────────────────────────
function EditableRow({
  announcement,
  index,
  onDeleted,
  onUpdated,
}: {
  announcement: Announcement;
  index: number;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(announcement.content);

  const deleteMutation = useMutation({
    mutationFn: async () =>
      api.delete(`/admin/announcements/${announcement.id}`),
    onSuccess: () => {
      toast.success("Pengumuman berhasil dihapus");
      onDeleted();
    },
    onError: () => toast.error("Gagal menghapus pengumuman"),
  });

  const updateMutation = useMutation({
    mutationFn: async (content: string) =>
      api.patch(`/admin/announcements/${announcement.id}`, { content }),
    onSuccess: () => {
      toast.success("Pengumuman berhasil diperbarui");
      setEditing(false);
      onUpdated();
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(
        error.response?.data?.error || "Gagal memperbarui pengumuman",
      );
    },
  });

  const handleSave = () => {
    if (!editValue.trim()) {
      toast.error("Isi pengumuman tidak boleh kosong");
      return;
    }
    updateMutation.mutate(editValue);
  };

  const handleCancel = () => {
    setEditValue(announcement.content);
    setEditing(false);
  };

  return (
    <div className="flex items-start justify-between gap-3 py-4">
      <div className="space-y-1 flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">#{index + 1}</p>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              className="min-h-20 text-sm"
              maxLength={MAX_CHARS}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              {editValue.length}/{MAX_CHARS} karakter
            </p>
          </div>
        ) : (
          <p className="font-medium text-emerald-950 wrap-break-word">
            {announcement.content}
          </p>
        )}
      </div>

      <div className="flex gap-1.5 shrink-0">
        {editing ? (
          <>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={updateMutation.isPending}
              onClick={handleSave}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Simpan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              Batal
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const AnnouncementsPage = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({ queryKey: ["public-announcements"] });
  };

  const form = useForm<AnnouncementForm>({
    mode: "onChange",
    defaultValues: { content: "" },
  });

  const { data: announcementItems, isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await api.get("/admin/announcements");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: AnnouncementForm) =>
      api.post("admin/announcements", payload),
    onSuccess: () => {
      form.reset();
      invalidate();
      toast.success("Pengumuman berhasil dibuat");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.error || "Gagal membuat pengumuman");
    },
  });

  const announcements = announcementItems ?? [];
  const contentValue = form.watch("content") ?? "";
  const isAtLimit = announcements.length >= MAX_ANNOUNCEMENTS;

  return (
    <div className="flex flex-col p-6 bg-green-50/30 min-h-screen gap-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-4xl font-display text-emerald-900">
          Pengumuman
        </h1>
        <p className="text-muted-foreground mt-1">
          Buat pengumuman untuk berjalan di halaman display (maksimal{" "}
          {MAX_ANNOUNCEMENTS} item).
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah Pengumuman</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="content"
                rules={{
                  required: "Isi pengumuman wajib diisi",
                  validate: (value) =>
                    value.trim().length > 0 || "Pengumuman tidak boleh kosong",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Isi Pengumuman</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-28"
                        placeholder="Contoh: Kajian ba'da Maghrib dimulai pukul 18.45 WIB"
                        maxLength={MAX_CHARS}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <p className="text-xs text-muted-foreground ml-auto">
                        {contentValue.length}/{MAX_CHARS} karakter
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {isAtLimit && (
                <p className="text-sm text-red-600">
                  Batas maksimal {MAX_ANNOUNCEMENTS} pengumuman sudah tercapai.
                  Hapus salah satu untuk menambah baru.
                </p>
              )}

              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={
                  createMutation.isPending ||
                  isAtLimit ||
                  !form.formState.isValid
                }
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tambah Pengumuman
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="pb-0">
        <CardHeader>
          <CardTitle>
            Daftar Pengumuman
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({announcements.length}/{MAX_ANNOUNCEMENTS})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground pb-6">
              Belum ada pengumuman.
            </p>
          ) : (
            <div className="space-y-0">
              {announcements.map((announcement, index) => (
                <div key={announcement.id}>
                  <EditableRow
                    announcement={announcement}
                    index={index}
                    onDeleted={invalidate}
                    onUpdated={invalidate}
                  />
                  {index < announcements.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementsPage;
