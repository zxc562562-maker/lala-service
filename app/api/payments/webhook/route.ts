import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { tossGetPayment, finalizeOrderById } from '@/lib/payments';
import { finalizeMembershipById } from '@/lib/membership';

// 토스페이먼츠 웹훅 (상점관리자 > 웹훅에 이 URL 등록: https://<도메인>/api/payments/webhook)
// 대여 주문(lala_...)과 멤버십 가입비(mem_...)를 orderId 접두사로 구분해 함께 처리한다.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  // v2 페이로드: { eventType, data: { paymentKey, orderId, status, ... } }
  const data = (body as { data?: Record<string, unknown> })?.data ?? (body as Record<string, unknown>);
  const paymentKey = data?.paymentKey as string | undefined;
  const orderId = data?.orderId as string | undefined;
  if (!paymentKey || !orderId) return NextResponse.json({ received: true });

  // 웹훅 본문을 신뢰하지 않고, 토스 API로 실제 결제를 재조회해 검증
  const look = await tossGetPayment(paymentKey);
  if (!look.ok) return NextResponse.json({ received: true });

  const status = look.data?.status as string | undefined;      // DONE / CANCELED / ...
  const totalAmount = look.data?.totalAmount as number | undefined;
  if (look.data?.orderId !== orderId) return NextResponse.json({ received: true });

  if (status === 'DONE') {
    const sb = supabaseAdmin();
    if (orderId.startsWith('mem_')) {
      const { data: order } = await sb.from('membership_payment').select('amount,status').eq('id', orderId).maybeSingle();
      if (order && order.status !== 'PAID' && order.amount === totalAmount) {
        await finalizeMembershipById(orderId, paymentKey);
      }
    } else {
      const { data: order } = await sb.from('payment_order').select('amount,status').eq('id', orderId).maybeSingle();
      if (order && order.status !== 'PAID' && order.amount === totalAmount) {
        await finalizeOrderById(orderId, paymentKey); // 리다이렉트가 유실돼도 여기서 예약 확정
      }
    }
  }

  // 토스는 2xx 응답을 기대한다.
  return NextResponse.json({ received: true });
}
