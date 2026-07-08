import { redirect } from 'next/navigation';
import { getMe, UnauthorizedError } from '@/lib/api.server';
import { AcceptInvitation } from '@/components/accept-invitation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Aceptación de invitación por enlace (RF-23). Requiere sesión (RNF-06):
// si no hay sesión, se envía a /login conservando el token de retorno.
export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    await getMe();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect(`/login?next=/invitations/${token}`);
    }
    throw error;
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invitación a un grupo</CardTitle>
          <CardDescription>
            Te invitaron a un grupo de gastos compartidos. Aceptá para unirte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitation token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
