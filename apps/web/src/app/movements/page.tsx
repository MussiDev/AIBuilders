import { redirect } from 'next/navigation';
import {
  getCategories,
  getMe,
  getMovements,
  getPersonalBalance,
  UnauthorizedError,
} from '@/lib/api.server';
import { formatMoney } from '@/lib/format';
import { AppNav } from '@/components/app-nav';
import { CategoriesPanel } from '@/components/categories-panel';
import { MovementsPanel } from '@/components/movements-panel';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Finanzas personales (Paso 2, RF-08 a 15). Server component: consume el BFF.
export default async function MovementsPage() {
  let me: { email: string };
  let balance: Awaited<ReturnType<typeof getPersonalBalance>>;
  let page: Awaited<ReturnType<typeof getMovements>>;
  let categories: Awaited<ReturnType<typeof getCategories>>;
  try {
    [me, balance, page, categories] = await Promise.all([
      getMe(),
      getPersonalBalance(),
      getMovements(1),
      getCategories(),
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/login');
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <AppNav email={me.email} />
      <h1 className="mb-6 text-2xl font-bold">Finanzas personales</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardDescription>Saldo personal</CardDescription>
          <CardTitle className="text-3xl">
            {formatMoney(balance.balance, balance.currencyCode)}
          </CardTitle>
          <CardDescription>Ingresos menos egresos (RF-13)</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MovementsPanel
          movements={page.items}
          categories={categories}
          today={today}
        />
        <CategoriesPanel categories={categories} />
      </div>
    </main>
  );
}
