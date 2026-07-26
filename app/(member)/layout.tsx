import { redirect } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';
import CustomerFooterNav from '@/components/CustomerFooterNav';
import PushPermissionPrompt from '@/components/PushPermissionPrompt';
import { getAccess } from '@lala/shared/lib/roles';

export const dynamic = 'force-dynamic';

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const me = await getAccess();
  if (!me) redirect('/login?next=/cart');
  if (me.status === 'unpaid') redirect('/membership');
  if (!me.approved) redirect('/pending');
  return (
    <>
      <CustomerHeader />
      <main className="wrap">{children}</main>
      <CustomerFooterNav />
      <PushPermissionPrompt />
    </>
  );
}
