# Lala — 룩북 기반 의류 대여

Supabase Auth(이메일/비밀번호)를 붙여, 예약이 **로그인한 계정에 묶이도록** 했습니다.
세션은 쿠키로 관리하고, 미들웨어가 매 요청마다 토큰을 갱신합니다.
DB에는 RLS를 켜서 "내 예약만 보이게" 했습니다.

## 설정

1. **스키마/시드** — SQL Editor에서 순서대로 실행
   `db/schema.sql` → `db/seed.sql` → `db/auth.sql` → `db/cart.sql` → `db/payments.sql` → `db/roles.sql` → `db/profile-fields.sql` → `db/username-auth.sql` → `db/fitting-delivery.sql` → `db/address-detail.sql` → `db/jibun-address.sql` → `db/entrance-password.sql` → `db/membership-fee.sql` → `db/push-subscriptions.sql` → `db/phone-verify-limit.sql` → `db/marketing-broadcast.sql` → `db/marketing-compliance.sql` → `db/marketing-schedule.sql` → `db/marketing-granular-consent.sql` → `db/address-change-log.sql` → `db/reservation-order-link.sql` → `db/fulfillment-status-v2.sql` → `db/product-unique-name-size.sql` → `db/store-pickup-return.sql` → `db/delivery-time-slot.sql` → `db/store-closures.sql` → `db/reservation-item-issue.sql` → `db/drop-fitting-info.sql` → `db/address-book.sql` → `db/order-cancel.sql` → `db/delivery-method.sql` → `db/delivery-zonecode.sql` → `db/delivery-recipient-name.sql` → `db/address-book-zonecode.sql` → `db/return-request.sql` → `db/return-tracking.sql` → `db/packaging-photo.sql` → `db/rls-closure-phone-verify.sql`
2. **이메일 확인 끄기(개발용)** — Supabase > Authentication > Sign In/Providers
   > Email 에서 "Confirm email" 끄면 가입 즉시 로그인됩니다. (운영에선 켜두기)
3. **환경변수** — `.env.local.example` → `.env.local` 복사 후 값 채우기
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (브라우저/세션용)
   - `SUPABASE_SECRET_KEY` (서버 전용)
4. **실행** — `npm install && npm run dev` → http://localhost:3000

## 인증 구조

| 클라이언트 | 키 | 용도 |
|---|---|---|
| `lib/supabase/client.ts` | publishable | 브라우저(로그인/가입 폼) |
| `lib/supabase/server.ts` `supabaseServer()` | publishable + 쿠키 | 로그인 사용자 본인으로 읽기(RLS 적용) |
| `lib/supabase/server.ts` `supabaseAdmin()` | secret | 가용성 계산·예약 INSERT(RLS 우회) |

- `middleware.ts` — 매 요청 세션 토큰 갱신 (서버 컴포넌트는 쿠키를 못 쓰므로 필수)
- `app/signup`, `app/login` — 이메일/비밀번호 인증. 가입 시 이름·연락처를
  user_metadata에 저장 → 첫 예약 때 `customer` 프로필 자동 생성
- `app/auth/confirm` — 가입 확인 메일 링크 처리
- `app/account` — 내 대여 내역 (RLS로 본인 것만 조회)


## 화면/라우트 (룩북 흐름)

- `app/page.tsx` — 홈 = **룩북 그리드** (`components/LookGrid.tsx`, 성격별 필터). 룩 데이터는 `lib/looks.ts`(정적, 구성 상품을 이름으로 참조).
- `app/looks/[id]/page.tsx` — **룩 상세**. 그 룩을 구성하는 상품들을 2열 카드로 나열(`components/LookItems.tsx`)하고 각 아이템을 개별로 장바구니에 담습니다(비로그인은 로그인으로 보냈다가 복귀 시 자동 담기). 여기엔 달력이 없습니다.
- `app/cart/page.tsx` — **장바구니 + 예약 달력**. 담긴 상품을 보여주고, 여기서 예약일·반납일을 한 번 고르면 담긴 모든 상품에 같은 기간이 적용됩니다. 달력의 '렌탈 중'은 담긴 상품들의 예약을 합쳐 반영합니다. '예약 확정' 시 상품마다 예약을 생성합니다.

## 장바구니(DB)

- `db/cart.sql` — `cart_item(customer_id, product_id)` (계정 귀속, `unique(customer_id, product_id)`로 중복 방지). **예약일은 담을 때가 아니라 예약 확정 시점에 선택**하므로 카트에는 날짜가 없습니다.
- `lib/cart-actions.ts` — `addCartItem(productId)` / `getCartItems()` / `removeCartItem(id)` / `getCartBusyDates()`(담긴 상품들의 예약 불가일 합집합) / `checkoutCart(checkout, return)`(전체를 그 기간으로 예약 확정 후 비움).

## 예약 흐름의 변화

전: 이름·연락처를 폼에 직접 입력 → 예약
후: **로그인 필수**. 비로그인 시 버튼이 "로그인하고 예약하기"로 바뀌고,
로그인 후 돌아와 예약하면 계정에 연결됩니다. (`createReservation`이
`getUser()`로 본인 확인 → `customer` 프로필 연결 → INSERT)

중복 예약 방어(DB `EXCLUDE` 제약)는 그대로 유지됩니다.

## 보안 메모

- 카탈로그(product/inventory)는 공개 읽기 정책.
- customer/reservation은 `auth.uid()` 기준 본인 행만 SELECT 가능.
- 예약 생성은 서버가 secret 키로 처리하되, **그 전에 반드시 `getUser()`로
  로그인 여부를 확인**한 뒤에만 INSERT 합니다.

## 다음 단계

1. **결제** — 포트원/토스페이먼츠 + 보증금 hold
2. **관리자 화면** — 재고 상태 전이(회수→세탁→검수→재투입)
3. 비밀번호 재설정·소셜 로그인(카카오 등) 추가

## 결제 (토스페이먼츠 v2)

- `.env.local` 에 `NEXT_PUBLIC_TOSS_CLIENT_KEY`(클라이언트), `TOSS_SECRET_KEY`(서버) 설정. 기본값은 토스 공용 **테스트 키**라 바로 테스트 결제가 됩니다(실결제는 본인 상점 키로 교체 + PG 심사 필요).
- 흐름: 카트 `결제하기` → `/checkout`(토스 결제위젯: `createOrder`로 주문 생성 후 금액 세팅) → 토스 결제창 → `/payments/success`(`confirmPayment`: 서버에서 secret 키로 승인 API 호출·금액 검증 → 예약 확정 → 카트 비움) / `/payments/fail`.
- `db/payments.sql` — `payment_order`(orderId·금액·상태). 승인/갱신은 서버(secret)에서만.
- 결제 금액 = 렌탈비용 + 보증금. 보증금은 반납검수 후 환불(운영 정책으로 처리).

### 웹훅 (권장)

- 라우트: `POST /api/payments/webhook` (`app/api/payments/webhook/route.ts`). 토스 상점관리자 > 웹훅에 `https://<도메인>/api/payments/webhook` 등록.
- 동작: 웹훅 본문을 신뢰하지 않고 토스 결제조회 API로 상태를 재확인(status=DONE, 금액 일치) 후, 세션 없이 주문의 `customer_id`로 예약을 확정합니다(`lib/payments.ts`의 `finalizeOrderById`). 결제 성공 리다이렉트가 유실돼도 예약이 누락되지 않습니다.
- 승인 경로(리다이렉트)와 웹훅이 동시에 와도 `payment_order`를 PENDING→PAID로 원자적 선점해 **한 번만** 예약 확정됩니다.

## 3개 앱(고객·관리자·배송) + 역할 + 실시간

하나의 코드베이스/하나의 Supabase에서 역할별로 화면을 나눕니다(라우트 그룹).

- 라우트: 고객 = `app/(customer)/*` (URL 그대로 `/`, `/cart`, `/looks/...` 등), 관리자 = `/admin`, 배송 = `/delivery`.
- 역할: `db/roles.sql`의 `staff(auth_user_id, role)` — 여기 없으면 자동으로 '고객'. `lib/roles.ts`의 `getRole()`로 판별하고, `/admin`·`/delivery` 레이아웃에서 접근을 막습니다(비직원은 리다이렉트).
- 권한(RLS): 고객은 본인 주문만, 직원은 전체 조회. 배송기사는 본인에게 배정된 건만 수정. Supabase Realtime도 RLS를 따릅니다.
- 이행상태: `payment_order.fulfillment_status`(PREPARING→SHIPPED→DELIVERED→PICKUP→INSPECTING→REFUNDED) + `assigned_to`(배송기사). `lib/staff-actions.ts`에서 관리자/배송 액션 제공.
- 실시간: `payment_order`·`reservation`을 `supabase_realtime` 퍼블리케이션에 추가. 관리자/배송 화면은 `postgres_changes`를 구독해 변경 시 자동 갱신(`components/AdminOrders.tsx`, `DeliveryList.tsx`) — 한 화면에서 상태를 바꾸면 다른 화면에 바로 반영됩니다.

### 직원 계정 만들기
1. 앱에서 평소처럼 회원가입(로그인).
2. Supabase에서 그 사용자의 auth id 확인 후 SQL 실행:
   ```sql
   insert into staff(auth_user_id, role, name)
   values ('<AUTH_USER_UUID>', 'admin', '관리자');   -- 배송기사는 'delivery'
   ```
3. 다시 로그인하면 `/admin` 또는 `/delivery` 접근 가능.
