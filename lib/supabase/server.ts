import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * 쿠키 기반 서버 클라이언트 — 로그인한 "사용자 본인"으로 동작한다.
 * RLS 정책이 적용되므로, 이걸로 읽으면 본인 데이터만 보인다.
 * (서버 컴포넌트/서버 액션/라우트 핸들러에서 사용)
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 쿠키 쓰기가 막힌다.
            // 세션 갱신은 middleware가 담당하므로 무시해도 안전.
          }
        },
      },
    },
  );
}

/**
 * secret 키를 쓰는 관리자 클라이언트 — RLS를 우회한다.
 * 가용성 계산(전체 예약 조회)·예약 INSERT 등 "서버가 신뢰 주체로" 처리할 때만.
 * 절대 클라이언트 컴포넌트에서 import 하지 말 것.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 를 설정하세요 (.env.local).');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
