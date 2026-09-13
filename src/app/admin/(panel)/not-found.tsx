import { ButtonLink } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { EmptyState } from "@/components/admin/ui/empty-state";

export default function PanelNotFound() {
  return (
    <Card>
      <EmptyState
        title="Не найдено"
        description="Запись удалена или ссылка неверная."
        action={
          <ButtonLink href="/admin" variant="secondary" size="sm">
            На обзор
          </ButtonLink>
        }
      />
    </Card>
  );
}
