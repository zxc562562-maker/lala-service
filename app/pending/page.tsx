import { redirect } from 'next/navigation';
import { signOut } from '@/lib/actions';
import { getAccess } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function PendingPage() {
  const me = await getAccess();
  if (!me) redirect('/login');
  if (me.approved) redirect('/looks');
  if (me.status === 'unpaid') redirect('/membership');
  return (
    <main className="landing-wrap">
      <div className="landing">
        <div className="landing-lock">
          <span className="wordmark landing-word">Lala</span>
          <span className="gold-rule landing-rule" />
        </div>
        <div className="pending-box">
          <div className="pending-title">가입 신청이 접수되었어요</div>
          <p className="pending-desc">디렉터 또는 슈퍼바이저의 승인 후 이용할 수 있어요.<br />승인되면 로그인해 바로 시작할 수 있습니다.</p>
          <form action={signOut}>
            <button type="submit" className="cta ghost" style={{ width: 'auto', padding: '12px 22px' }}>로그아웃</button>
          </form>
        </div>
      </div>
    </main>
  );
}
