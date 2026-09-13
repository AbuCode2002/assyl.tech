"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { getDb, schema } from "@/lib/db";
import { isLeadStatus, STATUS_LABELS } from "@/lib/admin/constants";
import { isUuid } from "@/lib/admin/queries";

export type ActionResult = { ok: boolean; error?: string };

export async function updateLeadStatus(leadId: string, status: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isUuid(leadId) || !isLeadStatus(status)) return { ok: false, error: "Некорректные данные" };

  const db = await getDb();
  const [lead] = await db.select({ status: schema.leads.status }).from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);
  if (!lead) return { ok: false, error: "Заявка не найдена" };
  if (lead.status === status) return { ok: true };

  await db.transaction(async (tx) => {
    await tx.update(schema.leads).set({ status, updatedAt: new Date() }).where(eq(schema.leads.id, leadId));
    await tx.insert(schema.leadNotes).values({
      leadId,
      authorId: admin.id,
      kind: "status",
      body: `Статус: ${STATUS_LABELS[lead.status]} → ${STATUS_LABELS[status]}`,
    });
  });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export type NoteState = { ok?: boolean; error?: string; nonce?: number } | undefined;

export async function addLeadNote(_prev: NoteState, formData: FormData): Promise<NoteState> {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!isUuid(leadId)) return { error: "Некорректная заявка" };
  if (!body) return { error: "Напишите текст заметки" };
  if (body.length > 5000) return { error: "Слишком длинная заметка (макс. 5000 символов)" };

  const db = await getDb();
  await db.insert(schema.leadNotes).values({ leadId, authorId: admin.id, kind: "note", body });
  await db.update(schema.leads).set({ updatedAt: new Date() }).where(eq(schema.leads.id, leadId));
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, nonce: Date.now() };
}

export async function deleteLeadNote(noteId: string, leadId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(noteId) || !isUuid(leadId)) return { ok: false, error: "Некорректные данные" };
  const db = await getDb();
  await db.delete(schema.leadNotes).where(eq(schema.leadNotes.id, noteId));
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(leadId)) return { ok: false, error: "Некорректная заявка" };
  const db = await getDb();
  await db.update(schema.visitors).set({ leadId: null }).where(eq(schema.visitors.leadId, leadId));
  await db.delete(schema.leads).where(eq(schema.leads.id, leadId));
  revalidatePath("/admin", "layout");
  redirect("/admin/leads");
}
