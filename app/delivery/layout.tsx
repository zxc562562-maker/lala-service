import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAccess } from '@lala/shared/lib/roles';

export const dynamic = 'force-dynamic';

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const me = await getAccess();
  if (!me) redirect('/login?next=/delivery');
  if (me.role !== 'delivery' && !me.isApprover) redirect('/');
  return (
    <>
      <header className="staff-header">
        <div className="wrap header-inner">
          <span className="staff-brand">Lala · 배송</span>
          <nav className="staff-nav">
            <Link href="/delivery">배송</Link>
            <Link href="/looks">고객앱</Link>
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
