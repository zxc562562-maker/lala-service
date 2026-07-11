> **업데이트**: 아래 4건(🔴 1건 + 🟢 2건, 🟡 1건은 애초에 코드가 없어 조치 불필요)은 모두 처리 완료. 최신 기록은 `HANDOFF.md`의 "[Cowork 세션] 정적 코드 감사 + 버그 수정 4건" 항목 참고. 이 파일은 감사 당시 스냅샷으로 남겨둠.

# Lala 코드 정적 감사 결과

실행 환경(샌드박스)이 이번 세션에서 열리지 않아 `npm install`/`npm run build`/`tsc`를 직접 돌리지는 못했습니다. 대신 HANDOFF.md에서 가장 자주 변경된 핵심 경로(회원가입·승인·멤버십결제·카트·결제·주문상태·마케팅 발송)를 중심으로 함수 시그니처, DB 컬럼, 타입, import를 코드 상에서 손으로 추적했습니다. 아래는 발견 사항입니다.

## 🔴 심각 (실사용 시 기능이 막힘)

### 1. 카트 캘린더가 "2026년 7~8월"에 하드코딩되어 있음
`app/(member)/cart/page.tsx`

```ts
const [month, setMonth] = useState(() => new Date(Date.UTC(2026, 6, 1))); // 2026년 7월로 고정
...
<button disabled={m <= 6} ...>‹</button>   // 7월보다 이전으로 못 감
<button disabled={m >= 7} ...>›</button>   // 8월보다 이후로 못 감
```

캘린더 초기월이 실제 오늘 날짜가 아니라 "2026-07"로 고정되어 있고, 이전/다음 달 버튼도 딱 7월·8월만 보여주도록 막혀 있습니다. 다른 곳(`lib/domain/reservation.ts`의 `todayISO()`)은 전부 `new Date()` 기준 실제 오늘 날짜를 쓰는데, 이 파일만 개발 중 테스트용으로 하드코딩된 값이 남아있는 것으로 보입니다.

**영향**: 이 상태로 배포하면 2026년 9월부터는(혹은 애초에 7~8월이 아닌 시점엔) 카트에서 예약일을 아예 선택할 수 없어 결제 자체가 불가능합니다. 지금 당장도 "8월 이후" 날짜로는 예약을 잡을 수 없습니다.

**제안 수정**: 초기월을 `new Date()` 기준으로 계산하고, 버튼 비활성 조건을 "과거로만 못 가게" 정도로 완화.
```ts
const now = new Date();
const [month, setMonth] = useState(() => new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
...
disabled={y === todayY && m <= todayM}  // 과거로만 제한, 미래는 자유롭게
// 다음 달 버튼은 disabled 제거(또는 예약 가능 범위 정책에 맞게 별도 상한)
```

## 🟡 문서-코드 불일치 (기능 자체는 동작하나, HANDOFF에 "완료"로 적힌 것과 다름)

### 2. "일당 비용 크게 보여주기"(`.cart-daily-highlight`) 미반영
HANDOFF.md의 "[디자인 결정] 카트 화면 — '일당 비용'은 크게…" 항목은 `.cart-daily-highlight`(22px 굵게, 일당 가격 합계)를 카트 상단에 추가했다고 적혀 있지만, 실제 `app/(member)/cart/page.tsx`·`app/globals.css` 어디에도 이 요소가 없습니다.
"결제 금액" 글자 크기를 13px로 줄인 부분(`.row.total .amt`)만 실제로 반영돼 있고, 그 대신 눈에 띄게 보여주기로 했던 일당 비용 강조 표시는 빠져 있습니다.

**제안**: 필요하면 카트 아이템 목록 위에 일당 합계(`items.reduce((a,c)=>a+c.dailyPrice,0)`)를 굵은 글씨로 추가.

## 🟢 경미 (버그는 아니지만 정리 여지)

### 3. `lib/cart-actions.ts`/`lib/actions.ts`의 customer 자동 생성 경로
`resolveCustomerId()`(cart-actions.ts)와 `createReservation()`(actions.ts)이 `customer` 행이 없으면 `status` 없이(=컬럼 기본값에 의존) 바로 insert합니다. 일반 회원은 (member) 레이아웃이 승인 전 접근을 막아 이 경로를 안 타지만(디렉터가 회원 앱을 테스트할 때 등 의도된 예외), 이 기본값은 `db/membership-fee.sql`이 실행돼 `status` 컬럼 기본값이 `unpaid`로 바뀐 뒤에만 유효합니다. 마이그레이션 순서가 어긋나면 `pending`으로 생성돼 결제 없이 승인 대기 상태가 될 수 있습니다. 큰 문제는 아니지만 명시적으로 `status: 'unpaid'`를 지정해두면 더 안전합니다.

### 4. `lib/actions.ts`의 `createReservation`은 죽은 코드
카트→결제(`createOrder`/`finalizeOrderById`) 흐름으로 완전히 대체되어, 현재 어떤 화면에서도 `createReservation`을 호출하지 않습니다(README/HANDOFF 텍스트에만 언급). 빌드를 깨뜨리진 않지만, 유지보수 시 혼동을 줄이려면 정리 대상입니다.

## ✅ 확인 완료 (문제 없음)

다음 핵심 경로는 함수 시그니처·DB 컬럼·타입이 서로 정확히 맞물려 있는 것을 확인했습니다.
- 회원가입: `signup/page.tsx` → `createAccountById` → `registerMembership`(피팅/배송 정보 포함) → `/membership`
- 멤버십 결제: `MembershipPayment.tsx` → `createMembershipOrder`/`confirmMembershipPayment` → `finalizeMembershipById`(웹훅과 `mem_`/`lala_` 접두사로 공유)
- 대여 결제: `cart` → `checkout` → `createOrder`/`confirmPayment` → `finalizeOrderById` → `reserveItemForCustomer`
- 승인/역할: `roles.ts`(`getAccess`) ↔ `roles-actions.ts`(`registerMembership`/`approveMember`) ↔ `db/roles.sql`/`db/membership-fee.sql`의 `status` 체크 제약
- 주문 이행상태 10단계: `db/fulfillment-status-v2.sql` ↔ `staff-actions.ts`의 `Fulfillment` 타입 ↔ `AdminOrders.tsx`/`DeliveryList.tsx`/`account` 페이지들의 라벨 매핑
- 내 정보(`/profile`): `getProfile`/`updateProfile` ↔ `db/*.sql` 누적 컬럼(피팅·배송·마케팅 세분화 동의) ↔ `ProfileForm.tsx`
- 사이즈 선택/재고: `queries.ts`의 `getSizeAvailabilityByNames`/`getSizeAvailabilityForRange` ↔ `LookItems.tsx`/`LookGrid.tsx`
- 마케팅 발송(예약·야간제한·감사로그): `marketing-actions.ts`/`marketing-send.ts` ↔ `db/marketing-*.sql` ↔ `AdminMarketing.tsx`
- 자동로그인 토글(세션쿠키 vs 영속쿠키): `login/page.tsx` ↔ `lib/supabase/client.ts` ↔ `lib/supabase/middleware.ts`

## 검토하지 못한 부분
이번 세션에서는 `npm install`/`npm run build`/`tsc --noEmit`을 실제로 실행하지 못했습니다(샌드박스 인프라 오류). 위 확인은 전부 코드를 손으로 대조한 결과이며, 실제 TypeScript 컴파일 에러(예: 타입 추론 엣지케이스)까지는 100% 보장하지 못합니다. 로컬 환경에서 `npm install && npm run build`를 가장 먼저 실행해 실제 컴파일 결과를 확인하시길 권장합니다.
