"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function register(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (process.env.ALLOW_PUBLIC_REGISTRATION === "false") {
    return { error: "Pendaftaran publik tidak diizinkan." };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };

  if (data.user) {
    await prisma.profile.upsert({
      where: {
        id: data.user.id,
      },
      update: {
        email,
        name: fullName,
      },
      create: {
        id: data.user.id,
        email,
        name: fullName,
      },
    });
  }

  redirect("/dashboard");
}
