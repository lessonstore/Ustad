import { describe, expect, it, vi } from "vitest";
import { getPurchasedLesson } from "@/lib/lesson-access.server";
import { LESSON_COST } from "@/lib/plans";

describe("Paid lesson previews", () => {
  const input = { classId: "1", subject: "english", week: 1 };
  it("does not return lesson content without a purchase", async () => {
    await expect(getPurchasedLesson(input, async () => false)).rejects.toThrow("before previewing");
  });
  it("checks the exact lesson purchase before returning content", async () => {
    const owns = vi.fn(async (id: string) => id === "1-english-1");
    const result = await getPurchasedLesson(input, owns);
    expect(owns).toHaveBeenCalledWith("1-english-1");
    expect(result.objectives.length).toBe(3);
    await expect(getPurchasedLesson({ ...input, week: 2 }, owns)).rejects.toThrow("before previewing");
  });
  it("uses the required 10-token purchase price", () => {
    expect(LESSON_COST).toBe(10);
  });
});