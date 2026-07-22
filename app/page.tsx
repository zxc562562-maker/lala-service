import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCachedUser } from '@lala/shared/lib/auth-cache';

export const dynamic = 'force-dynamic';

export default async function Landing() {
  const user = await getCachedUser();
  if (user) redirect('/looks');

  return (
    <main className="landing-wrap">
      <div className="landing">
        <div className="landing-lock">
          <span className="wordmark landing-word">Lala</span>
          <span className="gold-rule landing-rule" />
        </div>
        <div className="landing-row">
          <Link href="/signup" className="land-btn">멤버십 가입</Link>
          <Link href="/login" className="land-btn">로그인</Link>
          <Link href="/looks" className="land-btn">둘러보기</Link>
        </div>
      </div>
    </main>
  );
}
