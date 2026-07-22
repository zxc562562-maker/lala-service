'use server';

import { supabaseServer, supabaseAdmin } from '@lala/shared/lib/supabase/server';

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** 브라우저에서 구독(subscribe) 성공 후 호출: 서버에 저장 */
export async function savePushSubscription(sub: PushSubscriptionInput): Promise<{ ok: boolean }> {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return { ok: false };

  const sb = supabaseAdmin();
  const { data: customer } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!customer) return { ok: false };

  const { error } = await sb.from('push_subscription').upsert(
    { customer_id: customer.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    { onConflict: 'endpoint' },
  );
  return { ok: !error };
}

/** 알림 끄기: 이 기기의 구독을 삭제(본인 소유 구독만) */
export async function removePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return { ok: false };

  const sb = supabaseAdmin();
  const { data: customer } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!customer) return { ok: false };

  const { error } = await sb.from('push_subscription').delete().eq('endpoint', endpoint).eq('customer_id', customer.id);
  return { ok: !error };
}
