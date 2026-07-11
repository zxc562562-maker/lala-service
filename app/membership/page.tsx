import { redirect } from 'next/navigation';
import { getAccess } from '@/lib/roles';
import MembershipPayment from '@/components/MembershipPayment';

export const dynamic = 'force-dynamic';

export default async function MembershipPage() {
  const me = await getAccess();
  if (!me) redirect('/login?next=/membership');
  if (me.isApprover || me.role === 'delivery') redirect('/'); // 직원 계정은 해당 없음
  if (me.status === 'approved') redirect('/looks');
  if (me.status === 'pending') redirect('/pending');
  if (me.status === 'withdrawn') redirect('/');
  // status === 'unpaid' 인 경우에만 결제 화면 노출
  return <MembershipPayment />;
}
