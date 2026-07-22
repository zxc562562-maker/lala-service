import { redirect } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';
import PushPermissionPrompt from '@/components/PushPermissionPrompt';
import { getAccess } from '@/lib/roles';

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
      <PushPermissionPrompt />
    </>
  );
}
