"use server";

import { createClient } from "@/lib/supabase/server";

interface WaitlistResult {
  success: boolean;
  message: string;
}

export async function joinWaitlist(
  email: string,
  source?: string,
): Promise<WaitlistResult> {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("user_waitlist")
      .insert({ email: email.toLowerCase().trim(), source });

    if (error) {
      // Unique constraint violation — user already signed up
      if (error.code === "23505") {
        return {
          success: true,
          message: "You're already on the list! We'll be in touch.",
        };
      }
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }

    return {
      success: true,
      message: "You're on the list! We'll notify you when we launch.",
    };
  } catch {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
