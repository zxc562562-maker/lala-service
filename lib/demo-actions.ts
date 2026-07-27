'use server';

// 개발/테스트 전용 — 내 렌탈 목록에서 실제 결제·배송 과정 없이 모든 주문 상태(+배송방법별 문구
// variant)를 한 번에 눈으로 확인할 수 있게, 상태별로 하나씩 가짜 주문을 DB에 직접 꽂아 넣는다.
// 실제 결제(Toss)는 전혀 거치지 않으므로 언제든 지우거나 다시 만들어도 안전하다.
import { supabaseAdmin, supabaseServer } from '@lala/shared/lib/supabase/server';
import { todayISO, addDays, iso, toDate } from '@lala/shared/lib/domain/reservation';

interface DemoOrderSpec {
  label: string;
  fulfillmentStatus: string;
  deliveryMethod: string;
  reservationStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  deliverySlot?: string;
  disputed?: boolean;
  disputeReason?: string;
  withReturnRequest?: boolean;
}

// order-status-labels.ts의 모든 문구 variant + 문제 분기 + 분쟁 상태를 한 번씩 다 보여주면서,
// 특히 직배송·직접 픽업 항목은 전부 delivery_slot을 채워 주문 상세 페이지의 배송방법+배송시간
// 알약(직배송/직접 픽업만 시간 표시)을 다양한 상태에서 확인할 수 있게 구성.
const DEMO_SPECS: DemoOrderSpec[] = [
  { label: '결제 완료 (직배송)', fulfillmentStatus: 'ORDERED', deliveryMethod: 'DIRECT', reservationStatus: 'ACTIVE', deliverySlot: '15' },
  { label: '상품 검수중 (직접 픽업)', fulfillmentStatus: 'PRE_INSPECTING', deliveryMethod: 'PICKUP', reservationStatus: 'ACTIVE', deliverySlot: '16' },
  { label: '배송 대기중 (택배)', fulfillmentStatus: 'READY', deliveryMethod: 'PARCEL', reservationStatus: 'ACTIVE' },
  { label: '배송중 (직배송)', fulfillmentStatus: 'SHIPPED', deliveryMethod: 'DIRECT', reservationStatus: 'ACTIVE', deliverySlot: '17' },
  { label: '퀵 배송중', fulfillmentStatus: 'SHIPPED', deliveryMethod: 'QUICK', reservationStatus: 'ACTIVE' },
  { label: '택배 배송중', fulfillmentStatus: 'SHIPPED', deliveryMethod: 'PARCEL', reservationStatus: 'ACTIVE' },
  { label: '배송 완료 (직배송)', fulfillmentStatus: 'DELIVERED', deliveryMethod: 'DIRECT', reservationStatus: 'ACTIVE', deliverySlot: '18' },
  { label: '배송 완료 (직접 픽업)', fulfillmentStatus: 'DELIVERED', deliveryMethod: 'PICKUP', reservationStatus: 'ACTIVE', deliverySlot: '19' },
  { label: '배송 완료 (택배, 반납접수 가능)', fulfillmentStatus: 'DELIVERED', deliveryMethod: 'PARCEL', reservationStatus: 'ACTIVE' },
  { label: '반납접수 요청 완료 (택배)', fulfillmentStatus: 'RETURN_REQUESTED', deliveryMethod: 'PARCEL', reservationStatus: 'ACTIVE', withReturnRequest: true },
  { label: '반납 요청 완료 (직접 픽업)', fulfillmentStatus: 'RETURN_REQUESTED', deliveryMethod: 'PICKUP', reservationStatus: 'ACTIVE', deliverySlot: '20' },
  { label: '반납 검수중', fulfillmentStatus: 'RETURN_INSPECTING', deliveryMethod: 'PARCEL', reservationStatus: 'ACTIVE' },
  { label: '반납 완료', fulfillmentStatus: 'REFUNDED', deliveryMethod: 'PARCEL', reservationStatus: 'COMPLETED' },
  { label: '보증금 환불 완료', fulfillmentStatus: 'DEPOSIT_REFUNDED', deliveryMethod: 'PARCEL', reservationStatus: 'COMPLETED' },
  { label: '상품검수중 오염·손상 확인', fulfillmentStatus: 'PRE_INSPECT_ISSUE', deliveryMethod: 'DIRECT', reservationStatus: 'ACTIVE', deliverySlot: '15' },
  { label: '오배송', fulfillmentStatus: 'MISDELIVERED', deliveryMethod: 'QUICK', reservationStatus: 'ACTIVE' },
  { label: '반납 검수중 오염·손상 확인', fulfillmentStatus: 'RETURN_ISSUE', deliveryMethod: 'PARCEL', reservationStatus: 'ACTIVE' },
  { label: '주문 취소', fulfillmentStatus: 'CANCELLED', deliveryMethod: 'DIRECT', reservationStatus: 'CANCELLED', deliverySlot: '16' },
  { label: '분쟁중 (택배)', fulfillmentStatus: 'SHIPPED', deliveryMethod: 'PARCEL', reservationStatus: 'ACTIVE', disputed: true, disputeReason: '분쟁 접수 예시' },
];

export async function createDemoOrders(): Promise<
  { ok: true; created: number; skipped: string[] } | { ok: false; reason: string }
> {
  // 실제 고객이 쓰는 배포 환경에서 가짜 결제완료 주문을 아무나 만들 수 있으면 안 되므로,
  // 로컬 개발(npm run dev)에서만 동작하고 프로덕션 빌드에서는 항상 거부한다.
  if (process.env.NODE_ENV === 'production') return { ok: false, reason: '테스트 주문 생성은 개발 환경에서만 가능해요.' };
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return { ok: false, reason: '로그인이 필요합니다.' };

  const sb = supabaseAdmin();
  const { data: customer } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!customer) return { ok: false, reason: '고객 정보를 찾을 수 없습니다.' };

  // 매번 이 계정의 주문 목록을 깨끗한 상태에서 다시 보여주기 위해(데모든 실제 테스트 결제든),
  // 시작할 때 이 고객의 기존 주문을 전부 지운다 — 재고도 그만큼 다시 풀린다.
  const { data: oldOrders } = await sb.from('payment_order').select('id').eq('customer_id', customer.id);
  const oldIds = (oldOrders ?? []).map((o: { id: string }) => o.id);
  if (oldIds.length > 0) {
    await sb.from('reservation').delete().in('payment_order_id', oldIds);
    await sb.from('payment_order').delete().in('id', oldIds);
  }

  // 실제 존재하는 재고 아이템을 그대로 빌려 쓰되(가짜 상품을 새로 안 만듦), 이미 ACTIVE 예약이
  // 걸려있는 아이템을 고르면 DB의 no_double_booking 배타 제약에 걸려 실패하므로, ACTIVE 예약이
  // 하나도 없는 아이템만 후보로 삼고, 데모 항목마다 서로 다른 아이템을 하나씩 배정한다.
  const { data: busyRows } = await sb.from('reservation').select('item_id').eq('status', 'ACTIVE');
  const busyItemIds = new Set((busyRows ?? []).map((r: { item_id: string }) => r.item_id));
  const { data: candidates } = await sb.from('inventory_item').select('id,product:product_id(id,name,daily_price)').limit(200);
  const freeItems = (candidates ?? []).filter((c) => !busyItemIds.has(c.id));

  const today = toDate(todayISO());
  const checkout = iso(addDays(today, -5));
  const returnDate = iso(addDays(today, -2));
  const days = 3;

  const skipped: string[] = [];
  let created = 0;

  for (let i = 0; i < DEMO_SPECS.length; i++) {
    const spec = DEMO_SPECS[i];
    const item = freeItems[i];
    if (!item) { skipped.push(`${spec.label} (재고 부족)`); continue; }
    const product = item.product as unknown as { id: string; name: string; daily_price: number };
    const amount = product.daily_price * days + 50000; // 렌탈비 + 보증금(데모용 대략값)
    const orderId = `demo_${Date.now()}_${i}`;

    const { error: orderErr } = await sb.from('payment_order').insert({
      id: orderId, customer_id: customer.id, checkout, return_date: returnDate, days, amount,
      status: 'PAID', fulfillment_status: spec.fulfillmentStatus, delivery_method: spec.deliveryMethod,
      delivery_slot: spec.deliverySlot ?? null,
      disputed: spec.disputed ?? false, dispute_reason: spec.disputeReason ?? null,
      ...(spec.withReturnRequest ? {
        return_request_address: '서울특별시 강남구 테헤란로 1',
        return_request_jibun_address: '서울특별시 강남구 역삼동 1',
        return_request_detail_address: '101동 101호',
        return_request_message: '문 앞에 놔주세요',
        return_request_recipient_name: '홍길동',
        return_request_phone: '01000000000',
      } : {}),
    });
    if (orderErr) { skipped.push(`${spec.label} (주문 생성 실패: ${orderErr.message})`); continue; }

    const { error: resvErr } = await sb.from('reservation').insert({
      payment_order_id: orderId, customer_id: customer.id, item_id: item.id,
      checkout, return_date: returnDate, status: spec.reservationStatus,
    });
    if (resvErr) {
      // 예약 생성이 실패하면 방금 만든 주문만 덩그러니 남으니, 고아 데이터가 쌓이지 않게 같이 지운다.
      await sb.from('payment_order').delete().eq('id', orderId);
      skipped.push(`${spec.label} (예약 생성 실패: ${resvErr.message})`);
      continue;
    }
    created++;
  }

  if (created === 0) return { ok: false, reason: `데모 주문을 하나도 만들지 못했어요: ${skipped.join(', ')}` };
  return { ok: true, created, skipped };
}
