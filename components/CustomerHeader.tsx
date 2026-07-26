import Link from 'next/link';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import { signOut } from '@/lib/actions';

export default async function CustomerHeader() {
  const user = await getCachedUser();

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/looks" className="brand-lock" aria-label="Lala">
          <span className="wordmark">Lala</span>
          <span className="gold-rule" />
        </Link>
        {!user && (
          <nav className="nav-links">
            <Link href="/cart">CART</Link>
            <Link href="/login">로그인</Link>
            <Link href="/signup" className="nav-cta">가입</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
