"use client";

import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { EmptyState } from "@/components/admin/ui/empty-state";

export default function PanelError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Card>
      <EmptyState
        title="Не удалось загрузить страницу"
        description={
          process.env.NODE_ENV !== "production" ? error.message : `Попробуйте ещё раз${error.digest ? ` · код ${error.digest}` : ""}`
        }
        action={
          <Button variant="secondary" size="sm" onClick={() => retry()}>
            Повторить
          </Button>
        }
      />
    </Card>
  );
}
