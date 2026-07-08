import { redirect } from 'next/navigation';
import { getDashboard, getMe, UnauthorizedError } from '@/lib/api.server';
import { formatMoney } from '@/lib/format';
import { LogoutButton } from '@/components/logout-button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Panel inicial (RF-38 / AC-36). Server component: lee la sesión y consume la
// API a través del BFF. Si no hay sesión válida, redirige a /login.
export default async function DashboardPage() {
  let me: { email: string };
  let summary: Awaited<ReturnType<typeof getDashboard>>;
  try {
    [me, summary] = await Promise.all([getMe(), getDashboard()]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/login');
    }
    throw error;
  }

  const cards = [
    {
      label: 'Saldo personal',
      value: formatMoney(summary.personal.balance, summary.personal.currencyCode),
      description: 'Ingresos menos egresos',
      tone: 'text-foreground',
    },
    {
      label: 'Te deben',
      value: formatMoney(summary.groups.totalToCollect, summary.personal.currencyCode),
      description: 'Por cobrar en tus grupos',
      tone: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Debés',
      value: formatMoney(summary.groups.totalOwed, summary.personal.currencyCode),
      description: 'Adeudado en tus grupos',
      tone: 'text-destructive',
    },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Panel</h1>
          <p className="text-sm text-muted-foreground">{me.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className={`text-2xl ${card.tone}`}>
                {card.value}
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
