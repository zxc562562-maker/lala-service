import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseServer } from './supabase/server';

/**
 * 로그인 사용자 조회를 요청 단위로 캐시한다. supabase.auth.getUser()는 매번 Supabase Auth
 * 서버로 실제 네트워크 왕복을 하는 호출이라(로컬 JWT 디코드가 아니라 진짜 검증), 같은 요청 안에서
 * 레이아웃·헤더·페이지가 각자 따로 부르면 그만큼 왕복이 쌓인다. React의 cache()로 감싸면 같은
 * 서버 렌더링 요청 안에서는 실제 호출이 한 번만 나가고 나머지는 그 결과를 재사용한다.
 * (단, 서버 액션처럼 클라이언트에서 별도로 호출되는 요청까지 하나로 묶어주지는 못함 — 그런 호출들은
 * 각자 자기 요청 안에서만 캐시가 적용된다.)
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  return user;
});
