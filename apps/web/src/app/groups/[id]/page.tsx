import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  getExpenses,
  getGroup,
  getGroupBalance,
  getMe,
  UnauthorizedError,
} from '@/lib/api.server';
import { AppNav } from '@/components/app-nav';
import { GroupDetailPanel } from '@/components/group-detail-panel';

// Detalle de un grupo (Pasos 3/4): balances, miembros, gastos, pagos, salir.
export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let me: { email: string };
  let group: Awaited<ReturnType<typeof getGroup>>;
  let expenses: Awaited<ReturnType<typeof getExpenses>>;
  let balances: Awaited<ReturnType<typeof getGroupBalance>>;
  try {
    [me, group, expenses, balances] = await Promise.all([
      getMe(),
      getGroup(id),
      getExpenses(id),
      getGroupBalance(id),
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/login');
    // 403/404: no es miembro o el grupo no existe (RNF-06).
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <AppNav email={me.email} />
      <div className="mb-6">
        <Link href="/groups" className="text-sm text-muted-foreground hover:underline">
          ← Grupos
        </Link>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">Moneda: {group.currencyCode}</p>
      </div>

      <GroupDetailPanel
        group={group}
        expenses={expenses}
        balances={balances}
        today={today}
      />
    </main>
  );
}
