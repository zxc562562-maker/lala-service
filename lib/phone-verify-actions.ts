'use server';

import { supabaseAdmin } from '@lala/shared/lib/supabase/server';

const DAILY_LIMIT = 5;

/**
 * 휴대폰 인증 어뷰징 방지: 같은 번호로 하루 5회까지만 인증 시도(요청)를 허용한다.
 * 실제 인증 벤더(포트원 등)가 무엇이든 상관없이, "인증요청" 버튼을 누르는 시점에 호출한다.
 * 벤더 API를 호출하기 *전에* 반드시 이 함수로 먼저 확인할 것.
 */
export async function checkPhoneVerifyRateLimit(
  phone: string,
): Promise<{ ok: true; remaining: number } | { ok: false; reason: string }> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return { ok: false, reason: '전화번호를 입력해주세요.' };

  const sb = supabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await sb
    .from('phone_verify_attempt')
    .select('id', { count: 'exact', head: true })
    .eq('phone', cleanPhone)
    .gte('attempted_at', since);

  if (error) return { ok: false, reason: '인증 요청 확인 중 오류가 발생했습니다.' };
  if ((count ?? 0) >= DAILY_LIMIT) {
    return { ok: false, reason: '이 번호로 오늘 인증 시도 횟수(5회)를 모두 사용했습니다. 내일 다시 시도해주세요.' };
  }

  // 이번 시도를 기록(요청 자체를 카운트 — 실제 벤더 호출 성공 여부와 무관하게 시도 횟수로 집계)
  await sb.from('phone_verify_attempt').insert({ phone: cleanPhone });

  return { ok: true, remaining: DAILY_LIMIT - (count ?? 0) - 1 };
}
