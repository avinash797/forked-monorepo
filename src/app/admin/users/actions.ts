"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function removeFromWaitlist(id: string) {
  const supabase = await createClient();

  await supabase.from("user_waitlist").delete().eq("id", id);

  revalidatePath("/admin/users");
}
