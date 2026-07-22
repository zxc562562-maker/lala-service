'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin, supabaseServer } from './supabase/server';
import { getAccess } from './roles';
import { getKoreanHolidays } from './holidays';

export interface ClosureDay {
  date: string;
  reason: string | null;
}

/** 법정 공휴일 + 관리자가 등록한 임시 휴무일을 합친 전체 휴무 날짜 목록(회원 캘린더용, 로그인 불필요) */
export async function getClosedDates(): Promise<string[]> {
  const sb = supabaseAdmin();
  const { data } = await sb.from('store_closure').select('date');
  const custom = (data ?? []).map((r: { date: string }) => r.date);
  return Array.from(new Set([...getKoreanHolidays(), ...custom]));
}

/** 관리자 화면용 — 사유 포함, 직접 등록한 임시 휴무일만(법정 공휴일은 별도 표시) */
export async function listClosuresAdmin(): Promise<ClosureDay[]> {
  const me = await getAccess();
  if (!me || !me.isApprover) return [];
  const sb = supabaseAdmin();
  const { data } = await sb.from('store_closure').select('date,reason').order('date', { ascending: true });
  return (data ?? []) as ClosureDay[];
}

/** 날짜 범위를 한 번에 임시휴무로 등록 (디렉터/슈퍼바이저 전용) */
export async function addClosureRange(
  startDate: string, endDate: string, reason: string,
): Promise<{ ok: boolean; reason?: string }> {
  const me = await getAccess();
  if (!me || !me.isApprover) return { ok: false, reason: '권한이 없습니다.' };
  if (!startDate || !endDate || startDate > endDate) return { ok: false, reason: '날짜를 확인해주세요.' };

  const dates: string[] = [];
  let cur = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cur.getTime() <= end.getTime()) {
    dates.push(cur.toISOString().slice(0, 10));
    cur = new Date(cur.getTime() + 86_400_000);
  }
  if (dates.length > 90) return { ok: false, reason: '한 번에 최대 90일까지 등록할 수 있습니다.' };

  const sb = supabaseAdmin();
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  const { error } = await sb.from('store_closure')
    .upsert(
      dates.map((date) => ({ date, reason: reason.trim() || null, created_by: user?.id ?? null })),
      { onConflict: 'date' },
    );
  if (error) return { ok: false, reason: '휴무일 등록에 실패했습니다.' };

  revalidatePath('/admin/closures');
  return { ok: true };
}

/** 임시 휴무일 취소 (디렉터/슈퍼바이저 전용) */
export async function removeClosureDate(date: string): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me || !me.isApprover) return { ok: false };
  const sb = supabaseAdmin();
  const { error } = await sb.from('store_closure').delete().eq('date', date);
  if (error) return { ok: false };
  revalidatePath('/admin/closures');
  return { ok: true };
}
