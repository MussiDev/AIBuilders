'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/app/movements/actions';
import { DeleteButton } from '@/components/delete-button';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Category } from '@/lib/api.server';

export function CategoriesPanel({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createCategoryAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorías</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          ref={formRef}
          action={formAction}
          noValidate
          className="flex flex-col gap-1.5"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                name="name"
                placeholder="Nueva categoría"
                aria-invalid={!!state.fieldErrors?.name}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Agregando…' : 'Agregar'}
            </Button>
          </div>
          <FieldError messages={state.fieldErrors?.name} />
          {state.message && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}
        </form>

        <ul className="flex flex-col divide-y">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [state, formAction, pending] = useActionState(updateCategoryAction, {});

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state.ok]);

  if (editing) {
    return (
      <li className="py-2">
        <form action={formAction} noValidate className="flex flex-col gap-1.5">
          <input type="hidden" name="id" value={category.id} />
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!state.fieldErrors?.name}
              />
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                setName(category.name);
              }}
            >
              Cancelar
            </Button>
          </div>
          <FieldError messages={state.fieldErrors?.name} />
          {state.message && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <span className="flex items-center gap-2">
        {category.name}
        {category.isDefault && (
          <span className="text-xs text-muted-foreground">(predefinida)</span>
        )}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Renombrar
        </Button>
        <DeleteButton
          action={deleteCategoryAction}
          hidden={{ id: category.id }}
          confirmMessage={`¿Eliminar la categoría "${category.name}"?`}
        />
      </div>
    </li>
  );
}
