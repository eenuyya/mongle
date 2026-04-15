"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display_name = (formData.get("display_name") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, display_name, bio, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[updateProfile] upsert error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/profile");
  redirect("/profile");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
