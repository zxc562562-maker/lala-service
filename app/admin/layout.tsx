import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAccess } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getAccess();
  if (!me) redirect('/login?next=/admin');
  if (!me.isApprover) redirect('/');
  return (
    <>
      <header className="staff-header">
        <div className="wrap header-inner">
          <span className="staff-brand">Lala · 관리자</span>
          <nav className="staff-nav">
            <Link href="/admin">주문</Link>
            <Link href="/admin/approvals">승인</Link>
            <Link href="/admin/marketing">마케팅</Link>
            <Link href="/admin/address-log">배송정보 변경</Link>
            <Link href="/looks">고객앱</Link>
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
