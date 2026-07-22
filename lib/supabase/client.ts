'use client';
import { createBrowserClient, type CookieOptions } from '@supabase/ssr';

function parseBrowserCookies(): { name: string; value: string }[] {
  if (typeof document === 'undefined') return [];
  return document.cookie
    .split('; ')
    .filter(Boolean)
    .map((c) => {
      const idx = c.indexOf('=');
      return { name: c.slice(0, idx), value: decodeURIComponent(c.slice(idx + 1)) };
    });
}

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트. publishable 키 사용.
 * rememberMe: false로 호출하면(로그인 화면의 "자동로그인" 토글을 끈 경우), 인증 쿠키를
 * 만료 기한이 없는 "세션 쿠키"로 저장해 브라우저/앱을 완전히 종료하면 로그인이 풀리게 만든다.
 * 생략(기본값 true)하면 기존과 동일하게 항상 로그인이 유지된다.
 */
export function supabaseBrowser(opts?: { rememberMe?: boolean }) {
  if (opts?.rememberMe === false) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return parseBrowserCookies();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // maxAge/expires를 빼면 브라우저가 "세션 쿠키"로 취급 — 앱/브라우저를 완전히 닫으면 사라짐
              let str = `${name}=${encodeURIComponent(value)}`;
              if (options?.path) str += `; path=${options.path}`;
              if (options?.sameSite) {
                const sameSite = typeof options.sameSite === 'string' ? options.sameSite : 'strict';
                str += `; samesite=${sameSite}`;
              }
              if (options?.secure) str += '; secure';
              document.cookie = str;
            });
          },
        },
      },
    );
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
