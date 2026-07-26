import Link from 'next/link';
import { getCachedUser } from '@lala/shared/lib/auth-cache';

/**
 * 예전엔 상단 헤더에 있던 계정 관련 링크들 — 페이지 맨 아래 고정 바로 옮겼다(로그인 사용자만 노출).
 * 로그아웃·탈퇴하기는 내 정보 페이지로 옮겨져서 여기엔 없음.
 */
export default async function CustomerFooterNav() {
  const user = await getCachedUser();
  if (!user) return null;

  return (
    <footer className="site-footer-nav">
      <Link href="/guide" className="nav-guide">User Guide</Link>
      <span className="nav-dot" aria-hidden="true">·</span>
      <Link href="/profile">내 정보</Link>
      <span className="nav-dot" aria-hidden="true">·</span>
      <a href="/cart">CART</a>
      <span className="nav-dot" aria-hidden="true">·</span>
      <Link href="/account">내 렌탈</Link>
    </footer>
  );
}
