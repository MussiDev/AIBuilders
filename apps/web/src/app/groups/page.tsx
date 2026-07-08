import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getGroups, getMe, UnauthorizedError } from '@/lib/api.server';
import { AppNav } from '@/components/app-nav';
import { CreateGroupForm } from '@/components/create-group-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Grupos de gastos compartidos (Paso 3, RF-21). Lista + alta.
export default async function GroupsPage() {
  let me: { email: string };
  let groups: Awaited<ReturnType<typeof getGroups>>;
  try {
    [me, groups] = await Promise.all([getMe(), getGroups()]);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/login');
    throw error;
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <AppNav email={me.email} />
      <h1 className="mb-6 text-2xl font-bold">Grupos</h1>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tus grupos</CardTitle>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no formás parte de ningún grupo.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {groups.map((g) => (
                  <li key={g.id} className="py-3">
                    <Link
                      href={`/groups/${g.id}`}
                      className="flex items-center justify-between gap-2 hover:underline"
                    >
                      <span className="font-medium">{g.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {g.currencyCode}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo grupo</CardTitle>
            <CardDescription>La moneda no se puede cambiar luego.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateGroupForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
