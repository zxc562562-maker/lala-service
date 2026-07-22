import Link from 'next/link';
import { getCachedUser } from '@/lib/auth-cache';
import { signOut } from '@/lib/actions';

export default async function CustomerHeader() {
  const user = await getCachedUser();
  const name = (user?.user_metadata as { name?: string } | undefined)?.name ?? user?.email ?? '';

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/looks" className="brand-lock" aria-label="Lala">
          <span className="wordmark">Lala</span>
          <span className="gold-rule" />
        </Link>
        <nav className={`nav-links ${user ? 'logged-in' : ''}`}>
          {user ? (
            <>
              <span className="who">{name}님</span>
              <span className="nav-actions">
                <Link href="/guide" className="nav-guide">User Guide</Link>
                <span className="nav-dot" aria-hidden="true">·</span>
                <Link href="/profile">내 정보</Link>
                <span className="nav-dot" aria-hidden="true">·</span>
                <a href="/cart">CART</a>
                <span className="nav-dot" aria-hidden="true">·</span>
                <Link href="/account">내 렌탈</Link>
                <span className="nav-dot" aria-hidden="true">·</span>
                <form action={signOut}>
                  <button type="submit" className="linklike">로그아웃</button>
                </form>
              </span>
            </>
          ) : (
            <>
              <Link href="/cart">CART</Link>
              <Link href="/login">로그인</Link>
              <Link href="/signup" className="nav-cta">가입</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
