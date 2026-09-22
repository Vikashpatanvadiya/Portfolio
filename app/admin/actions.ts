"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/auth";
import { normalizeContent, validateContent } from "@/lib/content/normalize";
import { CONTENT_TAG, writeContent } from "@/lib/content/store";
import type { SiteContent } from "@/lib/content/types";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return "Wrong password.";
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

export type SaveResult = { ok: true; content: SiteContent } | { ok: false; errors: string[] };

export async function saveContent(input: unknown): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, errors: ["Your session expired — log in again."] };

  const content = normalizeContent(input);
  const errors = validateContent(content);
  if (errors.length) return { ok: false, errors };

  content.updatedAt = new Date().toISOString();
  try {
    await writeContent(content);
  } catch (e) {
    return { ok: false, errors: [e instanceof Error ? e.message : "Could not save."] };
  }

  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  return { ok: true, content };
}
