'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/logout-button';

const LINKS = [
  { href: '/', label: 'Panel' },
  { href: '/movements', label: 'Movimientos' },
  { href: '/groups', label: 'Grupos' },
] as const;

/** Barra de navegación de las páginas autenticadas. */
export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <nav className="flex items-center gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{email}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
