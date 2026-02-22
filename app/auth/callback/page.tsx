"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { FaMosque } from "react-icons/fa6";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      setErrorMessage("Kode verifikasi tidak ditemukan.");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setErrorMessage(error.message || "Verifikasi gagal. Coba lagi.");
        } else {
          setStatus("success");
          setTimeout(() => router.push("/dashboard"), 2500);
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Terjadi kesalahan tak terduga.");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-green-50/30 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4">
            <FaMosque className="text-white text-3xl" />
          </div>
          <h1 className="font-bold text-3xl font-display text-emerald-900">
            Khidmat
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sistem Informasi Masjid
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-emerald-900 font-display">
                  Memverifikasi Akun…
                </h2>
                <p className="text-sm text-muted-foreground">
                  Mohon tunggu, kami sedang memproses verifikasi email Anda.
                </p>
              </div>
              <div className="flex justify-center gap-1.5 pt-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-emerald-900 font-display">
                  Email Terverifikasi!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Akun Anda berhasil diverifikasi. Anda akan diarahkan ke
                  dashboard secara otomatis…
                </p>
              </div>
              <div className="pt-2">
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 w-full"
                >
                  <Link href="/dashboard">Masuk ke Dashboard Sekarang</Link>
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="w-9 h-9 text-red-500" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-red-700 font-display">
                  Verifikasi Gagal
                </h2>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <div className="pt-2 space-y-2">
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 w-full"
                >
                  <Link href="/auth/login">Kembali ke Halaman Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/register">Daftar Ulang</Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Butuh bantuan?{" "}
          <a
            href="mailto:admin@masjid.com"
            className="text-emerald-600 hover:underline"
          >
            Hubungi administrator
          </a>
        </p>
      </div>
    </div>
  );
}
