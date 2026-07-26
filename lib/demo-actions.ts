'use server';

// 개발/테스트 전용 — 택배 반납접수요청 UI를 실제 결제·배송 과정 없이 바로 테스트해볼 수 있게
// "이미 결제완료 + 배송완료된 택배 주문"을 하나 만들어준다. 실제 결제(Toss)는 전혀 거치지 않고
// DB에 직접 꽂아 넣는 가짜 주문이라, 테스트가 끝나면 지워도 안전하다.
import { supabaseAdmin, supabaseServer } from '@lala/shared/lib/supabase/server';
import { todayISO, addDays, iso, toDate } from '@lala/shared/lib/domain/reservation';

export async function createDemoParcelOrder(): Promise<{ ok: true; orderId: string } | { ok: false; reason: string }> {
  // 실제 고객이 쓰는 배포 환경에서 가짜 결제완료 주문을 아무나 만들 수 있으면 안 되므로,
  // 로컬 개발(npm run dev)에서만 동작하고 프로덕션 빌드에서는 항상 거부한다.
  if (process.env.NODE_ENV === 'production') return { ok: false, reason: '테스트 주문 생성은 개발 환경에서만 가능해요.' };
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return { ok: false, reason: '로그인이 필요합니다.' };

  const sb = supabaseAdmin();
  const { data: customer } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!customer) return { ok: false, reason: '고객 정보를 찾을 수 없습니다.' };

  // 실제 존재하는 재고 아이템을 그대로 빌려 쓰되(가짜 상품을 새로 안 만듦), 이미 ACTIVE 예약이
  // 걸려있는 아이템을 고르면 DB의 no_double_booking 배타 제약에 걸려 실패하므로, ACTIVE 예약이
  // 하나도 없는(=날짜와 무관하게 안전한) 아이템을 찾을 때까지 후보를 넉넉히 훑는다.
  const { data: busyRows } = await sb.from('reservation').select('item_id').eq('status', 'ACTIVE');
  const busyItemIds = new Set((busyRows ?? []).map((r: { item_id: string }) => r.item_id));
  const { data: candidates } = await sb.from('inventory_item').select('id,product:product_id(id,name,daily_price)').limit(50);
  const item = (candidates ?? []).find((c) => !busyItemIds.has(c.id));
  if (!item) return { ok: false, reason: '지금 예약 가능한(대여 중이지 않은) 재고가 없어 데모 주문을 만들 수 없어요.' };
  const product = item.product as unknown as { id: string; name: string; daily_price: number };

  const today = toDate(todayISO());
  const checkout = iso(addDays(today, -5));
  const returnDate = iso(addDays(today, -2));
  const days = 3;
  const amount = product.daily_price * days + 50000; // 렌탈비 + 보증금(데모용 대략값)
  const orderId = `demo_${Date.now()}`;

  const { error: orderErr } = await sb.from('payment_order').insert({
    id: orderId, customer_id: customer.id, checkout, return_date: returnDate, days, amount,
    status: 'PAID', fulfillment_status: 'DELIVERED', delivery_method: 'PARCEL',
  });
  if (orderErr) return { ok: false, reason: `주문 생성 실패: ${orderErr.message}` };

  const { error: resvErr } = await sb.from('reservation').insert({
    payment_order_id: orderId, customer_id: customer.id, item_id: item.id, checkout, return_date: returnDate, status: 'ACTIVE',
  });
  if (resvErr) {
    // 예약 생성이 실패하면 방금 만든 주문만 덩그러니 남으니, 재시도 시 고아 데이터가 쌓이지 않게 같이 지운다.
    await sb.from('payment_order').delete().eq('id', orderId);
    return { ok: false, reason: `예약 생성 실패: ${resvErr.message}` };
  }

  return { ok: true, orderId };
}
