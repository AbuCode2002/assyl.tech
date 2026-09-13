"use client";

import { useActionState, useTransition } from "react";
import { addLeadNote, deleteLeadNote, type NoteState } from "@/app/admin/(panel)/leads/actions";
import { Button, Spinner, buttonClasses } from "@/components/admin/ui/button";
import { Textarea } from "@/components/admin/ui/input";
import { IconTrash } from "@/components/admin/ui/icons";

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState<NoteState, FormData>(addLeadNote, undefined);

  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="leadId" value={leadId} />
      <Textarea
        key={state?.nonce ?? "initial"}
        name="body"
        rows={3}
        maxLength={5000}
        placeholder="Заметка: о чём договорились, следующий шаг, сумма…"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") e.currentTarget.form?.requestSubmit();
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-danger">{state?.error}</p>
        <button type="submit" disabled={pending} className={buttonClasses("primary", "sm")}>
          {pending ? <Spinner /> : null}
          Добавить заметку
        </button>
      </div>
    </form>
  );
}

export function DeleteNoteButton({ noteId, leadId }: { noteId: string; leadId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      aria-label="Удалить заметку"
      title="Удалить заметку"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Удалить заметку?")) return;
        startTransition(async () => {
          await deleteLeadNote(noteId, leadId);
        });
      }}
    >
      <IconTrash size={14} />
    </Button>
  );
}
