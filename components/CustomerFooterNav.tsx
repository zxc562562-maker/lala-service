import Link from 'next/link';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import { signOut } from '@/lib/actions';

/** 예전엔 상단 헤더에 있던 계정 관련 링크들 — 페이지 맨 아래로 옮겼다(로그인 사용자만 노출). */
export default async function CustomerFooterNav() {
  const user = await getCachedUser();
  if (!user) return null;

  return (
    <footer className="site-footer-nav">
      <form action={signOut}>
        <button type="submit" className="linklike">로그아웃</button>
      </form>
      <span className="nav-dot" aria-hidden="true">·</span>
      <Link href="/guide" className="nav-guide">User Guide</Link>
      <span className="nav-dot" aria-hidden="true">·</span>
      <Link href="/profile">내 정보</Link>
      <span className="nav-dot" aria-hidden="true">·</span>
      <a href="/cart">CART</a>
      <span className="nav-dot" aria-hidden="true">·</span>
      <Link href="/account">내 렌탈</Link>
      <span className="nav-dot" aria-hidden="true">·</span>
      <Link href="/profile" className="nav-guide">탈퇴하기</Link>
    </footer>
  );
}
