import 'server-only';
import webpush from 'web-push';
import { supabaseAdmin } from './supabase/server';

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!publicKey || !privateKey) return; // 키 없으면 조용히 스킵(개발 초기 단계 배려)
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

/**
 * 특정 고객(customer_id)의 모든 구독 기기로 푸시를 보낸다.
 * 실패한 구독(만료·차단 등, statusCode 404/410)은 자동으로 정리한다.
 * VAPID 키가 설정돼 있지 않으면 조용히 아무 것도 하지 않는다(개발 중 에러로 앱이 죽지 않도록).
 */
export async function sendPushToCustomer(customerId: string, title: string, body: string): Promise<void> {
  ensureConfigured();
  if (!configured) return;

  const sb = supabaseAdmin();
  const { data: subs } = await sb.from('push_subscription').select('id,endpoint,p256dh,auth').eq('customer_id', customerId);
  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({ title, body });

  await Promise.all(subs.map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
    } catch (e) {
      const statusCode = (e as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // 구독이 더 이상 유효하지 않음 → 정리
        await sb.from('push_subscription').delete().eq('id', s.id);
      }
    }
  }));
}

/**
 * 여러 고객에게 동시에 발송(마케팅 알림 등 대량 발송용).
 * 구독이 여러 개(여러 기기) 있는 고객도 각 기기에 모두 보낸다.
 * @returns 실제로 (최소 1개 기기에서) 발송을 시도한 고객 ID 목록 — 구독 자체가 없는 고객은 제외됨.
 */
export async function sendPushToCustomers(customerIds: string[], title: string, body: string): Promise<string[]> {
  ensureConfigured();
  if (!configured || customerIds.length === 0) return [];

  const sb = supabaseAdmin();
  const { data: subs } = await sb.from('push_subscription').select('id,customer_id,endpoint,p256dh,auth').in('customer_id', customerIds);
  if (!subs || subs.length === 0) return [];

  const payload = JSON.stringify({ title, body });
  const reached = new Set<string>();

  await Promise.all(subs.map(async (s: { id: string; customer_id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      reached.add(s.customer_id);
    } catch (e) {
      const statusCode = (e as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await sb.from('push_subscription').delete().eq('id', s.id);
      }
    }
  }));

  return [...reached];
}
