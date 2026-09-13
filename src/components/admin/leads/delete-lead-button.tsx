"use client";

import { useState, useTransition } from "react";
import { deleteLead } from "@/app/admin/(panel)/leads/actions";
import { Button, Spinner } from "@/components/admin/ui/button";
import { Dialog } from "@/components/admin/ui/dialog";
import { IconTrash } from "@/components/admin/ui/icons";

export function DeleteLeadButton({ leadId, number, name }: { leadId: string; number: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <IconTrash size={15} /> Удалить заявку
      </Button>
      <Dialog
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={`Удалить заявку #${number}?`}
        description={`Заявка «${name}» и все заметки к ней будут удалены без возможности восстановления. Данные о визитах останутся.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Отмена
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteLead(leadId);
                  if (res && !res.ok) setError(res.error ?? "Не удалось удалить");
                })
              }
            >
              {pending ? <Spinner /> : <IconTrash size={15} />} Удалить
            </Button>
          </>
        }
      >
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      </Dialog>
    </>
  );
}
