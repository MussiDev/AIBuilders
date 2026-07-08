'use client';

import { useState } from 'react';
import { deleteMovementAction } from '@/app/movements/actions';
import { DeleteButton } from '@/components/delete-button';
import { MovementForm } from '@/components/movement-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import type { Category, Movement } from '@/lib/api.server';

interface Props {
  movements: Movement[];
  categories: Category[];
  today: string;
}

export function MovementsPanel({ movements, categories, today }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Creá una categoría antes de cargar movimientos.
            </p>
          ) : (
            <MovementForm categories={categories} today={today} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no cargaste movimientos.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {movements.map((m) => {
                const auto = m.sourceShareId !== null;
                if (editingId === m.id) {
                  return (
                    <li key={m.id} className="py-4">
                      <MovementForm
                        mode="edit"
                        movement={m}
                        categories={categories}
                        today={today}
                        onSuccess={() => setEditingId(null)}
                        onCancel={() => setEditingId(null)}
                      />
                    </li>
                  );
                }
                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <span
                          className={
                            m.type === 'INCOME'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-destructive'
                          }
                        >
                          {m.type === 'INCOME' ? '+' : '−'}
                          {formatMoney(m.amount, m.currencyCode)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {categoryName.get(m.categoryId) ?? 'Sin categoría'}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {m.date.slice(0, 10)}
                        {m.note ? ` · ${m.note}` : ''}
                        {auto ? ' · gasto compartido' : ''}
                      </p>
                    </div>
                    {auto ? (
                      <span className="text-xs text-muted-foreground">
                        Automático
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(m.id)}
                        >
                          Editar
                        </Button>
                        <DeleteButton
                          action={deleteMovementAction}
                          hidden={{ id: m.id }}
                          confirmMessage="¿Eliminar este movimiento?"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
