import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 매 요청마다 만료된 Auth 토큰을 갱신하고 쿠키를 다시 심는다.
 * 서버 컴포넌트는 쿠키를 못 쓰기 때문에 이 미들웨어가 그 역할을 대신한다.
 *
 * "자동로그인" 토글을 끄고 로그인한 경우(lala_remember=0 쿠키), 여기서 토큰을 갱신할 때도
 * 인증 쿠키의 maxAge/expires를 계속 제거해서 세션 쿠키 상태를 유지시킨다.
 * 이걸 안 하면, 다음 요청 때 기본 로직이 다시 영구 쿠키로 덮어써서 토글이 무의미해진다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const rememberOff = request.cookies.get('lala_remember')?.value === '0';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = rememberOff ? { ...options, maxAge: undefined, expires: undefined } : options;
            response.cookies.set(name, value, finalOptions);
          });
        },
      },
    },
  );

  // 토큰 갱신 트리거 (반드시 호출). 이 줄과 createServerClient 사이에 로직 넣지 말 것.
  await supabase.auth.getUser();

  return response;
}
