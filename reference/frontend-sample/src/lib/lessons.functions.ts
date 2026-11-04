import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const readPurchasedLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { classId: string; subject: string; week: number }) => {
    if (!input || typeof input.classId !== "string" || typeof input.subject !== "string" || !Number.isInteger(input.week) || input.week < 1 || input.week > 12) throw new Error("Invalid lesson");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { getPurchasedLesson } = await import("./lesson-access.server");
    return getPurchasedLesson(data, async (lessonId) => {
      const { data: purchase, error } = await context.supabase.from("unlocks")
        .select("lesson_id").eq("user_id", context.userId).eq("lesson_id", lessonId).maybeSingle();
      if (error) throw error;
      return !!purchase;
    });
  });