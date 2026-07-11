import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions';

export default async function CustomerHeader() {
  const { data: { user } } = await supabaseServer().auth.getUser();
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
                <Link href="/profile">내 정보</Link>
                <Link href="/cart">CART</Link>
                <Link href="/account">My 렌탈</Link>
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
