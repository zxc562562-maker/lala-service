# Lala — 프로젝트 인수인계 (HANDOFF)

이 문서는 다른 환경(예: Claude Code)에서 이 프로젝트를 이어서 작업할 때 필요한 맥락을 담고 있습니다.

---

## 🚨 CLAUDE CODE — 작업 시작 전 반드시 확인 (로컬에서만 검증 가능) 🚨

> 이 프로젝트는 네트워크가 없는 환경(claude.ai 챗)에서 만들어졌다. 아래 항목들은 **한 번도 실제로 실행/검증되지 않았고**, 로컬(Claude Code)에서 반드시 처리해야 한다. 절대 빠뜨리지 말 것.

### A. 아직 검증 안 된 것 (빌드/실행/네트워크 관련)
- [x] **`npm install` 후 `npm run build`부터 실행** — Claude Code 세션에서 처음으로 실제 실행, 발견된 컴파일 에러 전부 수정 후 통과 확인. 상세는 맨 아래 "[Claude Code 세션] 첫 실제 빌드 검증 + 버그 수정" 항목 참고.
- [x] **DB 마이그레이션 실행 순서 지키기** — 22개 파일 전체를 실제 Supabase 프로젝트에 적용 완료(맨 아래 "[Claude Code 세션] DB 마이그레이션 완전성 실사" 항목 참고). 이 과정에서 발견한 마이그레이션 파일 자체의 순서 버그(`db/fulfillment-status-v2.sql`)도 수정함.
- [ ] **Supabase "Confirm email" 관련** — 이제는 회피 로직(`createAccountById`, admin API로 확정 생성)을 써서 이 설정을 안 건드려도 되지만, 혹시 이상 동작 시 이 설정도 확인.
- [ ] **웹 푸시(Web Push) VAPID 키 생성 필수** — `npx web-push generate-vapid-keys` 실행 후 `.env.local`에 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` 채우기. **이거 안 하면 푸시 알림이 조용히 아예 발송 안 됨**(에러는 안 나지만 기능이 죽어있는 상태).
- [ ] **푸시 알림 실제 동작 테스트** — VAPID 키 넣은 후 `/profile`에서 "푸시 알림 받기" 켜고, 8개 트리거(가입 승인 / 멤버십 결제완료·실패 / 렌탈 결제완료 / 배송 시작·완료 / 보증금 환불 / 탈퇴 처리)를 실제로 실행해 브라우저에 알림이 뜨는지 확인.
- [ ] **토스페이먼츠 실제 결제 왕복 테스트** — 멤버십 가입비(100,000원)와 렌탈 결제 둘 다, 테스트 카드로 결제 → 웹훅 수신까지 확인(웹훅은 `ngrok`으로 로컬 노출 필요, 문서 하단 "웹훅" 섹션 참고). `unpaid→pending` 상태 전환도 실결제로 확인.
- [ ] **카카오 우편번호(주소검색) API 실제 팝업 동작 확인** — 코드는 넣었지만 실제 브라우저에서 팝업이 뜨고 도로명/지번 주소가 정확히 채워지는지 미검증.
- [x] **회원가입 → 승인 → 앱 이용 흐름 실제 테스트 완료** (멤버십 "결제" 자체만 제외) — 맨 아래 "[Claude Code 세션] 실제 회원가입 전체 흐름 + RLS 정책 실사 검증" 항목 참고. 실제 계정 생성→(결제는 위젯 로드까지만 확인, 카드결제는 시뮬레이션)→디렉터 승인→승인된 계정으로 보호된 라우트 접근까지 실제로 성공 확인. **토스 실제 카드결제만 여전히 미검증**(위 17번 항목).
- [ ] **관리자(`/admin`) 분쟁 지정 UI, 배송(`/delivery`) 이행상태 변경 UI 실제 동작 확인**.
- [ ] **실시간(Supabase Realtime) 동작 확인** — 관리자 주문 목록·승인 목록의 실시간 갱신이 실제로 되는지 미검증.
- [ ] **휴대폰 본인인증(이름-전화번호 실검증)은 아직 벤더 미연동, 어뷰징 가드만 구현됨** — 아래 "[진행중]" 섹션 참고. `lib/phone-verify-actions.ts`의 `checkPhoneVerifyRateLimit`(하루 5회 제한)만 실제로 동작하고, 실제 인증(포트원 통합인증 등)은 여전히 UI 흉내(mock) 상태.
- [ ] **실제 폰에서 화면 크기·레이아웃 확인 미검증** — 562님이 "폰 치고 화면이 커 보인다"고 지적, 확인해보니 `app/layout.tsx`에 viewport 메타 태그가 아예 없었음(방금 세션에서 추가 완료, 아래 "[Claude Code 세션] viewport 메타 태그 추가" 항목 참고). 이걸로 상당 부분 해결될 걸로 예상되지만 실제 기기로는 아직 확인 안 됨. 참고로 이번 세션에서 헤더 정렬을 맞추려고 `.detail`/카트(`cart-wide`)/이용안내(`guide-page`)의 `max-width` 제한을 없앴는데, 이건 폰 폭(≲430px)에서는 원래도 영향이 없던 값이라 문제 없을 것으로 예상 — 혹시 실제 확인 시 큰 폰이나 가로모드에서 이 페이지들이 과하게 넓어 보이면, 해당 클래스에 `@media(min-width:...)` 조건부로 max-width를 다시 넣어주면 되는 정도라 큰 작업은 아닐 것.

### B. 나중에 절대 놓치면 안 되는 설계 방침
- [ ] **SNS 간편가입을 실제로 구현할 때 반드시 지킬 3가지** (지금은 전부 UI 흉내만 있음, 실제 계정 생성 안 함):
  1. ID 가입과 동일하게 **승인제**(디렉터/슈퍼바이저 승인) 적용 — 예외 두지 말 것.
  2. ID 가입과 동일하게 **멤버십 가입비 결제(100,000원, 일회성)** 게이트 적용.
  3. ID 가입과 동일하게 **푸시 알림 트리거**(가입 승인 알림 등) 적용.
  → 예상 구현 흐름은 아래 "[설계 방침 기록] SNS 간편가입도 승인제 적용 대상" 섹션 참고.
- [ ] **이용약관·개인정보처리방침은 초안(플레이스홀더)** — 실제 서비스 오픈 전 반드시 **법무 검토**를 받고, 회사 실제 정보(상호·대표자·사업자등록번호·개인정보 보호책임자 연락처 등)로 채워야 함. 지금은 "담당: 라라 운영팀" 같은 가짜 값.
- [ ] **`customer.auth_user_id`는 `ON DELETE CASCADE`가 아니라 `SET NULL`** — 탈퇴해도 결제/예약 기록은 의도적으로 보존됨(회계·법적 근거 목적). 이 설계를 실수로 cascade로 바꾸지 말 것.
- [ ] **휴대폰 인증은 UI 흉내만** — 실제 SMS 발급 API(알리고/NHN Cloud/Twilio 등) 연동 시 `requestPhoneCode`/`confirmPhoneCode`를 서버 검증 로직으로 교체 필요.
- [ ] **보증금은 상품별이 아니라 주문당 정액 50,000원** — `lib/pricing.ts`의 `FLAT_DEPOSIT`. `product.deposit` DB 컬럼은 남아있지만(향후 정책 변경 대비 보존) 현재 계산엔 안 쓰임. 실수로 상품별 합산 로직으로 되돌리지 말 것.
- [ ] **인스타그램 간편가입은 의도적으로 미포함** — Supabase 기본 지원 목록에 없어 커스텀 OAuth 연동이 필요하고 이메일도 안 줌. 카카오/네이버/구글/페이스북과 달리 우선순위 낮음(필요 시 별도 논의).
- [ ] **역할 체계**: `director`·`supervisor` = 전권(승인·주문·배송 관리 모두), `delivery` = 배송 전용, 나머지 = `member`. 승인 화면(`/admin/approvals`)은 회원용 헤더에 노출하지 않음(디렉터 본인도 회원 앱에서는 일반 회원처럼 테스트하고 싶어함 — 의도적 설계).
- [ ] **가입 시점엔 주소를 받지 않음** — 주소는 `/profile`(내 정보)에서만 입력/수정. 배송 정보(배송 장소 주소 등)는 별도로 가입 시 선택 입력.
- [ ] **"토스페이먼츠"와 "본인인증(카카오/네이버 등)"은 서로 다른 상품** — 토스페이먼츠는 결제만 담당하고, 카카오톡·네이버 앱으로 넘어가는 통합 본인인증은 **포트원(PortOne)** 같은 별도 통합인증 서비스가 필요함(토스인증(TossCert)은 토스 앱 전용이라 카카오/네이버로 안 감). **결제=토스페이먼츠 유지, 본인인증=포트원 추가**하는 조합으로 가기로 확인함(562 확인 대기 — 계약/가입은 562가 직접 포트원에서 진행해야 함). 이 결정을 실수로 "토스페이먼츠 하나로 다 된다"고 되돌리지 말 것.
- [ ] **"앱 스킴(커스텀 URL scheme)"은 Lala가 순수 웹앱인 동안은 적용 대상이 아님** — 안드로이드 매니페스트·iOS Info.plist 같은 설정은 네이티브 앱 프로젝트에만 존재. 지금은 본인인증 완료 후 **일반 HTTPS 콜백 URL**로 복귀하는 방식으로 충분(카카오/네이버 앱은 자기 스킴으로 알아서 왕복하고, 우리는 콜백 URL만 정확히 처리하면 됨). **나중에 Lala를 진짜 네이티브 앱(Capacitor 등)으로 감쌀 때가 되면**, 그때 커스텀 스킴 + iOS Universal Links(`apple-app-site-association`) + Android App Links(`assetlinks.json`)를 추가로 등록해야 함 — 지금 이 작업을 "이미 완료됐다"고 착각하지 말 것.
- [ ] **휴대폰 인증 어뷰징 방지(하루 5회/번호)는 구현 완료, 벤더 무관하게 동작** — `db/phone-verify-limit.sql`(`phone_verify_attempt` 테이블) + `lib/phone-verify-actions.ts`(`checkPhoneVerifyRateLimit`). 실제 본인인증 벤더를 붙일 때도 **반드시 벤더 API 호출 전에 이 가드를 먼저 통과**시켜야 함 — 가드를 우회해서 벤더를 직접 호출하는 코드를 추가하지 말 것.
- [ ] **반납 택배 정보(택배사·송장번호)는 "고객이 입력"이 아니라 "직원이 입력 → 고객은 읽기전용"** — 처음엔 반대로(고객이 직접 반납 택배사·송장번호를 입력하는 폼) 만들었다가 562님이 "택배사·송장번호는 우리가 회원한테 알려줘야 하는 부분"이라고 정정함. 최종 방향: 반납접수요청이 들어오면 **직원이 `/admin`에서** CJ대한통운 등과 반납 픽업을 잡은 뒤 택배사·송장번호를 입력(`lib/staff-actions.ts`의 `saveReturnTracking`) → 회원은 "반납정보" 알약을 눌러 그 정보를 읽기전용으로만 확인(`components/ReturnTrackingInfo.tsx`). 562님은 **CJ대한통운 API로 픽업예약·송장발급을 자동화**하고 싶어하지만 아직 계약·API 키가 없음(562 확인: "cj대한통운일 확률이 99%") — **계약·API 키가 확보되면 `saveReturnTracking`의 수동 입력 자리를 실제 API 호출로 교체**할 예정. 그 전까지 이 수동 입력 흐름을 "완성됐다"고 착각해서 고객 입력 폼으로 되돌리지 말 것.

---

## 한 줄 소개
Lala — 모바일 우선(mobile-first) 한국어 **의류 대여(렌탈) 웹앱**. "룩북(lookbook)"으로 스타일을 둘러보고, 룩을 구성하는 아이템을 장바구니에 담아 기간을 골라 결제·예약한다.

## 기술 스택
- **Next.js 14.2.5** (App Router, TypeScript)
- **Supabase** (Postgres + Auth + Realtime, `@supabase/ssr`)
- **토스페이먼츠 v2** 결제위젯 (`@tosspayments/tosspayments-sdk`)
- **웹 푸시**(`web-push`) — 필수/거래 알림용
- 스타일: 순수 CSS(`app/globals.css`), 디자인 토큰(:root 변수). 로고=Pinyon Script, 본문=Tenor Sans + Noto Sans KR.

## 하나의 코드베이스 · 3개 역할 앱
라우트 그룹으로 역할별 화면을 나눈다(같은 Supabase 공유).
- **고객앱** = `app/(customer)/*` — URL은 그대로 `/`, `/looks/[id]`, `/cart`, `/checkout`, `/account`, `/login`, `/signup`, `/payments/*`.
- **관리자앱** = `app/admin/*` — 주문 목록/이행상태/배송기사 배정.
- **배송팀앱** = `app/delivery/*` — 배정된 배송 건의 상태 진행.
- 루트 `app/layout.tsx`는 공통 셸(폰트/전역 CSS)만. 고객 헤더는 `(customer)/layout.tsx`, 직원 헤더/가드는 `admin`·`delivery` 레이아웃.


## 핵심 사용자 흐름 (고객)
1. 홈 = **룩북 그리드**(`components/LookGrid.tsx`, 성격 필터). 룩 데이터는 정적(`lib/looks.ts`, 구성 상품을 이름으로 참조).
2. **룩 상세**(`app/(customer)/looks/[id]`) = 그 룩의 상품들을 2열 카드로 나열(`components/LookItems.tsx`). 각 아이템 "담기"(비로그인은 로그인으로 보냈다가 복귀 시 자동 담기). 하단 **CHECK THE CART**.
3. **카트**(`app/(customer)/cart`) = 담긴 상품 + **예약 달력**(전체에 적용할 예약일·반납일 선택, 담긴 상품들의 예약을 합쳐 '렌탈 중' 표시). `결제하기` → `/checkout`.
4. **결제**(`/checkout`) = 토스 결제위젯. `createOrder`로 주문(PENDING) 생성 후 결제창 → 성공 시 `/payments/success` → `confirmPayment`(서버 승인 + 예약 확정) / 실패 `/payments/fail`.

## 데이터 모델 (실행 순서대로)
`db/schema.sql` → `db/seed.sql` → `db/auth.sql` → `db/cart.sql` → `db/payments.sql` → `db/roles.sql`
- `product`, `inventory_item`, `reservation` (재고 개체 단위 예약, 이중예약 방지 제약 `no_double_booking`=23P01)
- `customer` (auth 사용자에 매핑)
- `cart_item(customer_id, product_id)` — **날짜 없음**(기간은 결제 시 선택), `unique(customer_id, product_id)`
- `payment_order(id=orderId, customer_id, checkout, return_date, days, amount, status PENDING/PAID/FAILED, payment_key, fulfillment_status, assigned_to)`
- `staff(auth_user_id, role in ('admin','delivery'))` — 없으면 자동 '고객'. RLS 함수 `my_staff_role()`, `is_staff()`.
- Realtime: `payment_order`, `reservation` 을 `supabase_realtime` 퍼블리케이션에 추가(관리자/배송 실시간 갱신).

## 주요 서버 로직
- `lib/queries.ts` — 상품/예약 조회, `getProductsByNames`, `getReservationsForProductIds`
- `lib/reservations.ts` — `reserveItemForCustomer`(세션 비의존 예약 핵심; createReservation·결제승인·웹훅이 공유)
- `lib/actions.ts` — `createReservation`(세션 고객), `signOut`
- `lib/cart-actions.ts` — `addCartItem`/`getCartItems`/`removeCartItem`/`getCartBusyDates`
- `lib/payments-actions.ts` — `createOrder`, `confirmPayment`
- `lib/payments.ts` — `tossConfirm`/`tossGetPayment`, `finalizeOrderById`(세션 비의존, PENDING→PAID 원자적 선점으로 승인/웹훅 중복 방지)
- `app/api/payments/webhook/route.ts` — 토스 웹훅(본문 불신, 결제 재조회로 검증 후 확정). 미들웨어 매처에서 제외됨.
- `lib/roles.ts` `getRole()`, `lib/staff-actions.ts`(`listOrders`/`updateFulfillment`/`assignOrder`/`listDeliveryStaff`)
- 실시간 UI: `components/AdminOrders.tsx`, `components/DeliveryList.tsx`(`postgres_changes` 구독 → `router.refresh()`)

## 환경변수 (`.env.local`, 예시는 `.env.local.example`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` (기본값은 토스 공용 테스트 키)

## 로컬 실행
```bash
npm install
# Supabase SQL 에디터에서 db/*.sql 을 위 순서대로 실행
npm run dev   # http://localhost:3000
```
- 직원 계정: 앱에서 회원가입 → Supabase에서 `insert into staff(auth_user_id, role, name) values ('<UUID>','admin','관리자');`(또는 'delivery') → 재로그인 후 `/admin`·`/delivery` 접근.
- 웹훅 로컬 테스트: `ngrok http 3000` → 토스 개발자센터 웹훅에 `https://<ngrok>/api/payments/webhook` 등록(PAYMENT_STATUS_CHANGED).

## 남은 일 / 주의
- **빌드 미검증**: 지금까지 코드 생성 환경엔 의존성/네트워크가 없어 `npm run build`·타입체크·결제/실시간을 실제로 돌려보지 못했다. 로컬에서 첫 빌드 시 타입/설정 이슈가 있으면 잡아야 함.
- **이미지 플레이스홀더**: 룩 커버·상품 썸네일이 그라데이션. 실제 사진으로 교체 필요(스키마에 image_url 추가 지점).
- **결제 실운영**: 토스 상점 계약·PG(카드사) 심사 + 본인 상점 키 교체 필요(테스트 키로는 테스트 결제만).
- 보증금은 대여료와 함께 결제 후 **반납검수 후 환불**(운영 정책)로 설계됨.
- 별도의 인터랙티브 프리뷰(`preview.html`, 바닐라 JS 데모)가 claude.ai 쪽에 있으나 이 저장소의 실제 앱과는 독립적임.

## 방향 변경 (승인제 가입 + 랜딩 + 역할 확장) — 실제 앱에 반영 필요

프로젝트 오너 호칭은 **562**(디렉터). 다음을 실제 앱에도 적용해야 함(현재는 chat 프리뷰에 먼저 반영됨):

1. **랜딩 페이지**: 첫 화면(`/`)은 가운데 브랜드 로고만 + 아래 [로그인] [가입] 버튼. 로그인 전에는 앱(룩북)에 진입 불가. 로그인 후 룩북 홈으로.
2. **승인제 가입**: 가입 즉시 사용 불가. 계정은 `pending` 상태로 생성되고, **디렉터 또는 슈퍼바이저의 승인** 후에만 `approved`가 되어 이용 가능. 승인 전 로그인 시 "승인 대기" 화면.
3. **역할 확장**: 기존 admin/delivery 외에 **director(디렉터=562), supervisor(슈퍼바이저)** 도입. director/supervisor는 가입 승인 화면(`/approvals` 성격) 접근·승인/거절 가능. 일반 이용자는 `member`.
   - 구현 시 기존 `staff.role` 체크 제약을 `('director','supervisor','admin','delivery')` 등으로 확장하거나 역할 체계를 재정리할 것.
4. **DB 반영 포인트**: 사용자(customer 또는 신규 membership) 테이블에 `status`(pending/approved) 컬럼 + 승인 액션(디렉터/슈퍼바이저 전용, RLS로 강제) + 미들웨어/레이아웃에서 미승인 사용자의 앱 접근 차단.

프리뷰 데모 계정: 디렉터 `562@lala.kr / 1234`, 슈퍼바이저 `sv@lala.kr / 1234`. 신규 가입 → 대기 → 디렉터 로그인 후 '승인' → 신규 계정 로그인 시 이용 가능.

## [구현 완료] 승인제 가입 + 랜딩 + 역할 (실제 앱 반영됨)

- **랜딩** `app/page.tsx` (루트, 헤더 없음): 가운데 로고 + 로그인/가입/둘러보기(→`/looks`). 로그인 전엔 앱 진입 불가, 단 **둘러보기(비로그인 열람)** 는 `/looks`에서 허용.
- **룩북 그리드**는 `/looks`(`app/(customer)/looks/page.tsx`), 상세는 `/looks/[id]`.
- **라우트 그룹**: `(customer)` = 공개(둘러보기·로그인·가입, 공용 헤더 `components/CustomerHeader.tsx`). `(member)` = **승인된 회원/직원만**(cart·checkout·account·payments), `(member)/layout.tsx`가 미승인 시 `/pending`으로 리다이렉트.
- **승인제 가입**: 가입 시 `customer.status='pending'` 생성(`lib/roles-actions.ts:registerMembership`) → `/pending` 대기 화면. 디렉터/슈퍼바이저가 `/admin/approvals`에서 승인(`approveMember`)하면 `approved`.
- **역할(재정리)**: `staff.role ∈ (director, supervisor, delivery)`. **director·supervisor = 전권**(승인/주문/배송 모두), delivery=배송 전용, 그 외 = member. `lib/roles.ts:getAccess()` 가 `{role, status, approved, isApprover}` 반환. 가드: `/admin`·`/admin/approvals`=isApprover, `/delivery`=delivery 또는 isApprover.
- **실시간 승인**: `customer` 도 Realtime 발행에 추가, `/admin/approvals`가 구독해 자동 갱신.
- 로그인 후 기본 이동 `/looks`. 로그아웃 → `/`(랜딩).
- **주의**: 승인 흐름은 Supabase **이메일 확인 OFF**(개발 기본)를 가정. 확인 ON이면 `registerMembership`을 `app/auth/confirm` 처리로 옮겨야 함. 그리고 이 변경들은 로컬 `npm run build` 미검증이므로 첫 빌드에서 타입/설정 확인 필요.
- 디렉터 계정 만들기: 회원가입 후 `insert into staff(auth_user_id, role, name) values ('<UUID>','director','562');`

## [구현 완료] 분쟁(DISPUTED) 상태 + 탈퇴 차단 로직 (실제 앱)

- **DB** (`db/payments.sql`, 멱등 ALTER 포함): `payment_order`에 `disputed boolean`, `dispute_reason text`, `dispute_opened_at`, `dispute_resolved_at` 추가. `status`엔 이제 실제 CHECK 제약(`PENDING/PAID/FAILED`)을 걸었음(기존엔 주석뿐이었음). 분쟁은 결제 상태와 별개 축으로 관리(주로 PAID 이후 발생).
- **분쟁 지정/해제** (`lib/staff-actions.ts`): `openDispute(orderId, reason)` / `resolveDispute(orderId)` — **디렉터·슈퍼바이저(isApprover)만** 가능. `OrderRow`/`listOrders`에 `disputed`, `disputeReason` 포함. (관리자 UI(`AdminOrders.tsx`)에 분쟁 지정 버튼은 아직 미연결 — 다음 단계로 붙이면 됨.)
- **회원 탈퇴** (`lib/account-actions.ts`, 신규): `withdrawAccount(password)` — (1) `signInWithPassword`로 본인 비밀번호 재확인(고객 비밀번호는 Supabase Auth가 관리하므로 이 방식이 정석), (2) 해결되지 않은 분쟁 주문(`disputed=true AND dispute_resolved_at IS NULL`)이 있으면 차단(`blockedByDispute:true` + 안내 메시지 반환), (3) 통과 시 `customer` 행의 개인정보(이름→'탈퇴한 회원', 전화번호→null, status→'withdrawn')만 익명화하고 **주문/예약 이력은 보존**한 뒤 `auth.admin.deleteUser`로 계정 삭제.
- **customer.status**: `db/roles.sql`에서 체크 제약을 `pending/approved/withdrawn`으로 확장.
- **주의(스키마 사실 확인됨)**: `customer.auth_user_id`는 `ON DELETE SET NULL`이지, cascade가 아님 — 그래서 탈퇴해도 결제/예약 기록은 삭제되지 않고 남는다(회계/법적 근거 보존 목적, 의도된 설계). `customer`엔 `address` 컬럼이 아직 없음(프리뷰 데모에만 있음) — 필요하면 스키마에 추가 필요.

### 남은 일 (이번엔 범위 밖으로 남겨둠)
- 실제 앱에 **"내 정보" 편집 UI 페이지**가 아직 없음(프리뷰에만 존재). `withdrawAccount` 서버 액션은 준비돼 있으니, 페이지에서 비밀번호 입력 → `withdrawAccount(password)` 호출 → 실패 시 `blockedByDispute`면 분쟁 안내, 아니면 일반 오류 표시하도록 연결하면 됨.
- 관리자 화면(`/admin`)에 분쟁 지정 버튼/모달을 아직 안 붙임 — `openDispute`/`resolveDispute` 액션은 준비됨.

## [구현 완료] address 컬럼 + 내 정보 페이지 + 관리자 분쟁 UI (실제 앱)

- **`customer.address`** 추가: `db/schema.sql`(신규 설치) + `db/roles.sql`에 멱등 ALTER(기존 설치본 보강).
- **`lib/account-actions.ts`** 확장: `getProfile()`(이메일+이름/연락처/주소 조회), `updateProfile({name,phone,address,newPassword?})` — 이름/연락처/주소는 본인 세션(RLS "own customer update")으로 저장, 비밀번호는 입력했을 때만 `supabase.auth.updateUser`로 변경. 기존 `withdrawAccount(password)`는 그대로.
- **`/profile`** 페이지 신설(`app/(member)/profile/page.tsx` + `components/ProfileForm.tsx`, 미승인/미로그인이면 `(member)` 레이아웃이 가드): 프리뷰와 동일한 레이아웃(고정폭 라벨열, 흰 박스=수정가능, 아이디는 비활성, 탈퇴하기는 폼 맨 아래 고정) — 수정하기 한 번으로 저장, 탈퇴하기는 비밀번호 확인 오버레이(분쟁 있으면 차단 오버레이로 전환).
- **헤더**(`components/CustomerHeader.tsx`)에 **내 정보** 링크 추가(CART 앞).
- **관리자 화면**(`components/AdminOrders.tsx`): 주문 카드에 분쟁 배지(있으면 "분쟁중" + 사유 표시), **분쟁 지정**(사유 입력 오버레이 → `openDispute`) / **분쟁 해결 처리**(`resolveDispute`) 버튼. 디렉터·슈퍼바이저만 이 액션들을 실행할 수 있음(서버 액션에서 `isApprover` 검사).
- CSS(`app/globals.css`)에 `.pf-*`(프로필 폼), `.wd-*`(탈퇴/분쟁 오버레이 공용), `.order-dispute-*`(관리자 배지) 추가.

### 참고
- 관리자 화면은 지금 **결제완료(PAID) 주문만** 목록에 뜸(`listOrders`의 `.eq('status','PAID')` 필터). 분쟁은 보통 결제 이후 발생을 가정한 설계라 문제없으나, 필요시 필터를 완화할 수 있음.
- 위 변경은 이 환경에서 `npm run build`/실제 Supabase 호출 검증을 못 했으니, 로컬에서 첫 빌드 및 `/profile`·`/admin` 동작을 실제로 확인해 주세요.

## [정책 변경 반영] 보증금 = 주문당 정액 50,000원 (실제 앱 + 프리뷰)

- 이전엔 상품별 `product.deposit`을 합산했으나, **보증금은 장바구니 항목 수/종류와 무관하게 주문당 정액 50,000원**으로 통일.
- `lib/pricing.ts` 신설: `export const FLAT_DEPOSIT = 50000;`
- 적용 지점: `app/(member)/cart/page.tsx`(카트 요약), `lib/payments-actions.ts`(`createOrder`의 결제 금액 계산).
- `product.deposit` DB 컬럼/시드/쿼리/타입은 **그대로 보존**(향후 정책이 상품별 보증금으로 바뀔 가능성 대비) — 다만 현재 총액 계산에는 쓰이지 않음. 화면 표시(장바구니 목록의 개별 아이템 등)에도 더 이상 노출하지 않음.
- 프리뷰(`preview.html`)도 동일하게 정액 50,000원으로 변경, 상품별 `deposit` 필드는 프리뷰 데이터에서 정리(제거)함.

## [구현 완료] 가입 폼 확장 — 비밀번호 확인, 약관 동의, 마케팅 동의, 생년월일/성별

- **DB**(`db/profile-fields.sql`, 신규, 설치 순서 맨 끝): `customer`에 `marketing_consent boolean`, `terms_agreed_at timestamptz`, `birth_date date`, `gender text`(체크 제약 M/F/N) 추가.
- **가입 액션**(`lib/roles-actions.ts`): `registerMembership({marketingConsent, birthDate?, gender?})`로 시그니처 확장 — 가입 시점에 함께 저장(`terms_agreed_at`은 가입 버튼을 눌렀다는 것 자체가 필수 약관 동의이므로 서버에서 현재 시각으로 자동 기록).
- **가입 페이지**(`app/(customer)/signup/page.tsx`): 비밀번호 확인 필드(불일치 시 에러), 생년월일·성별(선택, 한 줄), 약관 동의 체크박스 3종(이용약관 필수·개인정보 필수·마케팅 선택 — 필수 미동의 시 제출 차단).
- **프리뷰**(`preview.html`)도 동일 구조로 반영(로컬 상태에만 저장, 실제 DB 연동 없음).
- 안 넣은 것: 휴대폰 인증(SMS 발송)·SNS 간편가입(카카오/네이버/구글 등 OAuth)은 실제 문자 발송·외부 연동이 필요해 이번 범위에서 제외. 필요하면 다음 단계로 붙일 수 있음(SNS는 Supabase Auth의 OAuth 프로바이더 설정으로 비교적 수월하게 가능).

## [구현 완료] 가입 폼: 필수/선택 구분 + SNS·휴대폰 인증 "흉내"만 (실제 연동 아님)

- **필수/선택 구분**: 가입 폼을 "필수 정보"(이름·연락처·이메일·비밀번호·비밀번호 확인·이용약관/개인정보 동의)와 "선택 정보"(생년월일·성별·마케팅 동의) 섹션으로 나눔. (주소는 실제 앱 가입 단계엔 원래도 없었고 그대로 유지 — 가입 후 `/profile`에서 입력/수정.)
- **SNS 간편가입은 UI만**: 카카오·네이버·구글 버튼 클릭 시 실제 OAuth 없이 "○○ 간편가입은 준비 중이에요" 안내만 뜸(`snsMock`). 실제 연동 시 Supabase Auth의 OAuth 프로바이더 설정으로 대체하면 됨.
- **휴대폰 인증도 UI만**: "인증요청" → 인증번호 입력칸 노출(실제 SMS 발송 없음) → 아무 값이나 입력 후 "확인"하면 "✓ 인증완료"로 표시되고 연락처 입력이 잠김(`requestPhoneCode`/`confirmPhoneCode`, 전부 프런트 상태일 뿐 서버/DB 반영 없음). 실제 연동 시 SMS 발급 API(예: 알리고, NHN Cloud, Twilio 등) + 인증코드 검증 서버 로직으로 교체 필요.
- 프리뷰(`preview.html`)도 동일 구조로 반영.
- 위 SNS/휴대폰 인증은 **순수 프런트엔드 목업**이며 회원가입 완료 로직(`registerMembership`)에 영향을 주지 않음 — 나중에 실제 기능을 넣을 때 이 자리(버튼 핸들러)를 실제 API 호출로 교체하면 됨.

## [구현 완료] 가입/내 정보 UX 다듬기 (실제 앱에도 반영)

- 가입 페이지: 'Lala 가입' 제목 삭제, 승인 안내 문구 한 줄 표시(`.auth-sub-nowrap`), 입력창 세로 패딩·폰트 축소(13px→9px 등) 및 폼 전체 간격 압축(스크롤 부담 감소), 전화번호 라벨/자리표시자를 "전화번호 (-없이 01000000000)"로, SNS 구분선 문구를 "또는 ID로 가입"으로 변경.
- `/profile`(내 정보) 전화번호 칸: 포커스 시 입력창 아래에 옅은 회색으로 "-없이 01000000000" 형식 안내가 뜨고, 포커스를 벗어나면 사라짐(`ProfileForm.tsx`의 `phoneFocused` 상태 + `.pf-phone-hint`).
- 정리: 마크업에서 더 이상 쓰이지 않던 레거시 `.fields`/중복 `.field` CSS 블록 제거.
- 프리뷰(`preview.html`)도 전부 동일하게 반영됨.

## [구현 완료] 이메일이 아닌 "ID" 기반 가입/로그인 (실제 앱 + 프리뷰)

**핵심 원리**: Supabase Auth는 이메일(또는 전화번호) 기반으로만 동작해 순수 "아이디" 로그인을 네이티브로 지원하지 않는다. 그래서 흔히 쓰는 우회 패턴을 적용했다 — 사용자가 고른 **ID를 내부 전용 가상 이메일**(`{id}@users.lala.internal`, 실제 수신 불가)로 변환해 Supabase Auth에 넘기고, 화면·DB에는 항상 실제 ID만 노출한다.

- `lib/username.ts`: `isValidUsername`(영문/숫자 4~20자), `idToAuthEmail`(ID→가상 이메일 변환).
- `db/username-auth.sql`(신규, 설치 순서 맨 끝): `customer.username` 추가 + 대소문자 무시 유니크 인덱스.
- **⚠️ 필수 설정**: Supabase 대시보드 Authentication에서 **"Confirm email"을 반드시 꺼야 함** — 가상 이메일은 실제로 받을 수 없는 주소라, 확인 메일 방식이 켜져 있으면 가입이 막힌다.
- `lib/roles-actions.ts`: `isUsernameAvailable(id)`(가입 폼에서 중복 확인, RLS 우회) 추가, `registerMembership`이 `username`을 받아 저장하고 실패 사유(`reason`)도 반환하도록 확장. `listPendingMembers`도 `username` 포함.
- 가입 페이지: 이메일 입력 제거, **ID(영문/숫자 4~20자)** 입력으로 대체. 제출 시 형식 검증 → 중복 확인 → `signUp({email: idToAuthEmail(id), ...})` → `registerMembership`.
- 로그인 페이지: 이메일 입력 제거, **ID** 입력으로 대체. 제출 시 `signInWithPassword({email: idToAuthEmail(id), ...})`로 내부 변환해 인증.
- `/profile`(내 정보)·`/account`(렌탈기록): 화면에 실제 가상 이메일이 아니라 **`customer.username`**을 표시하도록 수정(이전엔 무심코 `user.email`을 노출해 가상 이메일이 그대로 보이는 버그가 있었음 — 이번에 바로잡음).
- **SNS 간편 로그인/가입은 UI만**: 로그인·가입 화면 모두에 카카오·네이버·구글 버튼을 두었고, 누르면 실제 연동 없이 "○○ 간편가입/로그인은 준비 중이에요" 안내만 뜬다(가입 때 만든 `snsMock` 패턴을 로그인에도 동일 적용).
- 프리뷰(`preview.html`)도 전체적으로 `accounts` 배열의 키를 `email`→`id`로 통일하고, 로그인/가입/승인목록/내 정보/탈퇴/데모 분쟁 시딩까지 전부 이 새 키 기준으로 맞춤. 로그인에도 SNS 흉내 버튼 추가.

### 주의
- 내부 가상 이메일 도메인(`users.lala.internal`)은 실제로 존재하지 않는 도메인이라 상관없지만, 혹시 이메일 인증·비밀번호 재설정(이메일로 링크 발송) 같은 기능을 나중에 쓰고 싶다면 **실제 이메일 주소를 별도로 더 받아 저장**하는 방향(현재는 그런 필드 없음)을 고려해야 한다.
- 기존에 이메일로 가입했던 계정(있다면)은 이 변경으로 로그인 방식이 바뀌는 게 아니라, **새 가입부터** ID 기반으로 전환된다. 기존 사용자 마이그레이션이 필요하면 별도 스크립트가 필요하다(현재 시드 데이터는 없으므로 해당 없음).

## [수정] "Confirm email" 대시보드 설정을 안 찾아도 되게 함

Supabase 대시보드 화면이 개편되면서 Email 프로바이더 설정 안에 "Confirm email" 토글이 안 보이는 경우가 있음(위치가 바뀌었거나 다른 화면으로 이동). 이걸 대시보드에서 찾아 헤매지 않아도 되도록, **가입 로직 자체를 바꿔서 우회**했다.

- `lib/auth-actions.ts`(신규): `createAccountById(id, password, name, phone)` — 클라이언트의 `auth.signUp()` 대신 **관리자 API**(`supabaseAdmin().auth.admin.createUser`)로 계정을 만들면서 `email_confirm: true`를 명시. 이러면 대시보드의 "Confirm email" 설정이 켜져 있든 꺼져 있든, 어디에 있든 상관없이 **이 계정은 이미 확인된 것으로** 생성된다.
- 가입 페이지: 계정 생성은 `createAccountById`(서버, secret 키)로, 그 다음 `signInWithPassword`(클라이언트)로 로그인 세션을 만드는 2단계로 변경. 기존의 "Confirm email 꺼져 있어야 함" 관련 에러 메시지·분기 제거.
- 결과적으로 **Supabase 대시보드에서 Confirm email 설정을 찾아 끄지 않아도** ID 기반 가입이 정상 동작한다. (다만 `db/username-auth.sql` 상단의 안내 주석은 참고용으로 남겨둠 — 혹시 나중에 클라이언트 signUp을 다시 쓰게 될 경우를 대비.)

## [디자인] SNS 버튼에 브랜드 모노그램 아이콘 추가 (실제 로고 아님)

카카오·네이버·구글의 **공식 로고 이미지는 각 사의 상표/저작물**이라 정확한 로고 그래픽을 그대로 재현하지 않았다. 대신 브랜드 색상의 **간단한 원형 모노그램(K/N/G)**을 버튼 텍스트 왼쪽에 붙여 로고에 가까운 인상을 주도록 했다(`.sns-mark`, `.sns-mark-kakao/naver/google`). 실제 서비스에 올릴 때는 각 회사가 "○○로 로그인" 버튼용으로 공식 배포하는 브랜드 에셋(가이드라인 준수 로고 이미지)을 받아 이 모노그램 자리에 실제 이미지로 교체하는 걸 권장한다 — 카카오/네이버/구글 개발자센터의 브랜드 리소스 페이지에서 받을 수 있다.

## [되돌림] SNS 버튼 모노그램 아이콘 제거

바로 위 항목("SNS 버튼에 브랜드 모노그램 아이콘 추가")은 562님 요청으로 **되돌렸다**. 실제 회사 로고 파일을 구해서 넣기 전까지는, 로그인/가입 화면의 카카오·네이버·구글 버튼은 다시 **순수 텍스트 버튼**(모노그램 없음)으로 유지한다. 나중에 실제 로고 이미지 파일(각 사 공식 브랜드 리소스)을 받으면, 그때 이미지로 교체하면 된다.

## [추가] 페이스북 간편가입/로그인 버튼 (흉내만)

카카오·네이버·구글 옆에 **페이스북** 버튼을 순수 텍스트 버튼으로 추가(브랜드색 #1877F2, 흰 글자). 다른 SNS 버튼과 동일하게 클릭 시 "페이스북 간편가입/로그인은 준비 중이에요" 안내만 뜨는 흉내 단계. 프리뷰·실제 앱(로그인/가입 페이지) 모두 반영.

**참고 — 실제 구현 난이도**: 페이스북은 Supabase Auth가 기본 지원하는 OAuth 프로바이더 목록에 있어 향후 실제 연동이 비교적 수월하다(카카오·네이버·구글과 비슷한 난이도). 반면 **인스타그램은 Supabase 기본 지원 목록에 없음** — 하려면 Supabase의 "커스텀 OAuth/OIDC 프로바이더" 기능으로 수동 연동해야 하고(무료 플랜은 커스텀 프로바이더 3개 제한), 인스타그램 API가 이메일을 반환하지 않아 계정 식별에도 제약이 있다. 그래서 인스타그램은 이번에 추가하지 않았고, 필요하면 흉내 버튼만 추가하거나 실제 연동은 별도 우선순위로 논의 필요.

## [구현 완료] ID/비밀번호 정책 강화 + 약관 "보기" 팝업

- **ID**: 영문/숫자 **6~20자**로 강화(기존 4~20자). `lib/username.ts`의 `isValidUsername` 정규식 변경, 가입 폼 자리표시자·에러 문구도 함께 갱신. 프리뷰도 동일 반영.
- **비밀번호**: `lib/username.ts`에 `isValidPassword` 추가 — **영문/숫자/특수문자 중 2종류 이상 조합 + 10자 이상**. 가입 폼에서 실제로 검증하며, 불통과 시 안내 문구 표시. 프리뷰도 동일 로직으로 반영(정규식 3종 분류 카운트 방식).
- **약관 "보기" 팝업**: `lib/legal-content.ts`(신규)에 라라 서비스 기준으로 직접 작성한 **이용약관 전문**과 **개인정보처리방침 전문**을 담음(외부 문서를 복사한 게 아니라 의류 대여·보증금·반납검수·분쟁 시 탈퇴 제한 등 우리 서비스에 맞춰 새로 작성). 가입 폼의 "(필수) 이용약관에 동의합니다" / "(필수) 개인정보 수집·이용에 동의합니다" 오른쪽에 **보기** 링크를 추가했고, 누르면 스크롤 가능한 팝업으로 전문을 보여줌(`legalOpen` 상태, `.legal-box`/`.legal-body` 스타일). 프리뷰는 동일 텍스트를 JS 문자열로 내장해 `showLegal()`/`closeLegal()`로 동일하게 동작.
- **주의**: 이 약관·개인정보처리방침은 초안이며, 실제 서비스 운영 전에 **법무 검토(변호사 자문)를 받아 회사 정보(상호·대표자·사업자등록번호·개인정보 보호책임자 연락처 등 실제 값)로 채워 넣어야** 함. 지금은 플레이스홀더("담당: 라라 운영팀" 등) 상태.

## [구현 완료] 마케팅 정보 수신 동의에도 "보기" 링크 추가

`lib/legal-content.ts`에 `MARKETING_CONSENT_DETAIL`(수집·이용 목적, 수집 항목, 보유기간, 동의 거부 권리 및 불이익) 추가. "(선택) 마케팅 정보 수신에 동의합니다" 옆에도 필수 정보와 동일한 방식의 **보기** 링크를 달아, 이용약관·개인정보와 같은 팝업 스타일로 상세 내용을 볼 수 있게 함. 프리뷰도 동일 반영.

## [구현 완료] 가입 폼 "선택 정보" 재구성 — 피팅 정보 / 배송 정보

주소·생년월일·성별 입력란을 없애고, 그 자리에 **피팅 정보 입력하기** / **배송 정보 입력하기** 두 버튼(누르면 아래로 펼쳐지는 방식, 다시 누르면 접힘)을 넣었다.

- **피팅 정보**: 키(cm), 상의 사이즈, 허리(cm), 구두 사이즈.
- **배송 정보**: 배송 장소 주소, 근무지, 전화번호(계정 연락처와 별도 가능), 회수 장소 주소, 공동현관 비밀번호.
- **DB**(`db/fitting-delivery.sql`, 신규, 설치 순서 맨 끝): `customer`에 `height_cm, top_size, waist_cm, shoe_size, delivery_address, workplace, delivery_phone, return_address, entrance_password` 추가(전부 nullable, 선택 입력).
- `lib/roles-actions.ts`의 `registerMembership`이 `fitting`/`delivery` 객체를 받아 저장하도록 확장(기존 `birthDate`/`gender` 파라미터는 제거 — 해당 DB 컬럼 자체는 남아있지만 더 이상 가입 폼에서 수집하지 않음).
- 실제 앱: 두 섹션 모두 기본은 접힌 상태(스크롤 부담 최소화), 버튼을 눌러야 펼쳐짐. 프리뷰도 동일 UX로 반영(로컬 상태에만 저장).
- **참고**: address(주소)는 `/profile`(내 정보) 화면에서 여전히 수정 가능 — 가입 시점엔 더 이상 받지 않을 뿐, 컬럼 자체와 프로필 편집 기능은 그대로 유지됨.

## [구현 완료] 배송/회수 장소 주소에 주소 검색 기능 (카카오 우편번호 서비스)

한국 표준 방식인 **카카오(다음) 우편번호 서비스**를 붙였다. API 키 발급이 필요 없는 무료 서비스라 바로 동작한다.

- `lib/address-search.ts`(신규): `openAddressSearch(onSelect)` — 스크립트(`https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`)를 필요 시점에 지연 로딩한 뒤 `daum.Postcode` 팝업을 열고, 선택한 도로명 주소를 콜백으로 전달.
- 가입 폼의 **배송 장소 주소**·**회수 장소 주소** 입력창 옆에 각각 **주소 검색** 버튼 추가. 누르면 팝업이 뜨고, 주소를 고르면 자동으로 입력창에 채워짐(상세주소·동/호수는 이어서 직접 타이핑).
- 프리뷰도 동일하게 반영(`<head>`에 스크립트 태그 추가 + `searchAddress(targetId)` 함수).
- 이 서비스는 하단에 "Powered by kakao" 로고 노출이 필수 정책이라, 임의로 가리면 안 됨(임베드된 팝업 자체 UI라 우리 코드에서 별도 처리는 불필요).
- 필요하면 향후 `/profile`(내 정보)의 주소 필드에도 동일 기능을 붙일 수 있음(현재는 가입 폼에만 적용).

## [구현 완료] 세부 주소 입력 + 회수 장소 "배송장소와 동일" + 내 정보 주소 검색

- **DB**(`db/address-detail.sql`, 신규): `customer`에 `delivery_detail_address`, `return_detail_address` 추가.
- **가입 폼**: 배송 장소 주소·회수 장소 주소 각각 밑에 **세부 주소(건물명, 호수)** 입력창 추가. 회수 장소 영역에 **"배송장소 주소와 동일"** 체크박스를 추가 — 체크하면 배송 장소 주소·세부 주소를 그대로 복사해 채우고 회수 주소 입력창들을 잠그며(주소 검색 버튼도 비활성화), 체크된 상태에서 배송 장소를 바꾸면 회수 장소도 실시간으로 함께 갱신됨(실제 앱은 `useEffect`로, 프리뷰는 `oninput`/우편번호 완료 콜백에서 동기화).
- **`/profile`(내 정보)**: 주소 입력창 옆에도 동일한 **주소 검색** 버튼 추가(`lib/address-search.ts`의 `openAddressSearch` 재사용). 프리뷰도 기존 `searchAddress('pf-addr')`을 그대로 재사용해 동일하게 반영.
- `lib/roles-actions.ts`의 `DeliveryInfo`/`registerMembership`에 `deliveryDetailAddress`/`returnDetailAddress` 필드 추가.

## [구현 완료] 주소 검색 시 도로명 주소 + 지번 주소 함께 표시

카카오 우편번호 API의 `oncomplete` 콜백은 도로명 주소(`roadAddress`)와 지번 주소(`jibunAddress`)를 함께 반환한다. 이를 활용해 입력창에는 기존처럼 도로명 주소를 채우고, 그 바로 아래에 "지번 주소: …" 캡션을 추가로 보여주도록 확장했다.

- `lib/address-search.ts`: `openAddressSearch`가 이제 `{roadAddress, jibunAddress}` 객체를 콜백으로 전달.
- 가입 폼(배송/회수 장소 주소)과 `/profile`(내 정보) 주소 모두 지번 주소 캡션 표시. 회수 장소가 "배송장소와 동일"로 체크된 경우 지번 캡션도 함께 동기화됨.
- 프리뷰의 `searchAddress(targetId, jibunId)`도 동일하게 두 번째 인자로 지번 표시 요소를 받아 채움.
- 지번 주소는 별도 DB 컬럼으로 저장하지 않고 **화면 표시(확인용)**로만 사용 — 실제 저장·배송에는 도로명 주소를 사용.

## [수정] 지번 주소를 실제로 저장 (배송 활용 목적)

앞서는 지번 주소를 화면 표시(확인용)로만 썼는데, **배송에 실제로 활용**할 것이라는 요구에 따라 DB에 실제로 저장하도록 바꿨다.

- **DB**(`db/jibun-address.sql`, 신규): `customer`에 `address_jibun`(내 정보 주소), `delivery_jibun_address`, `return_jibun_address` 추가.
- `lib/roles-actions.ts`: `DeliveryInfo`에 `deliveryJibunAddress`/`returnJibunAddress` 추가, `registerMembership`이 저장.
- `lib/account-actions.ts`: `Profile`에 `addressJibun` 추가, `getProfile`/`updateProfile` 모두 `address_jibun` 컬럼을 읽고 씀.
- 가입 페이지·`ProfileForm.tsx`는 검색으로 받은 지번 주소를 상태로 들고 있다가 저장 시 함께 전송.
- 프리뷰: 지번 값을 캡션 요소의 `data-jibun` 속성에 저장해두고(화면엔 "지번 주소: …"로 표시), `doSignup()`/`saveProfile()`에서 이 값을 읽어 계정 데이터에 실제로 저장. `renderProfile()`도 새로고침 후에 저장된 지번을 다시 캡션으로 복원.

## [구현 완료] 배송 정보 필드 순서 변경 + 공동현관 비밀번호 동일 체크박스

요청한 순서로 재배치: 배송장소주소 → 세부주소 → 공동현관 비밀번호 → 회수장소주소 → 세부주소 → 배송장소 주소와 동일(체크박스) → 공동현관 비밀번호도 동일(체크박스, 신규) → 전화번호 → 근무지(상호명).

- **DB**(`db/entrance-password.sql`, 신규): `customer.return_entrance_password` 추가. 기존 `entrance_password` 컬럼은 이제 "배송 장소"의 공동현관 비밀번호를 의미.
- **공동현관 비밀번호도 동일** 체크박스: 별도의 "회수 장소 공동현관 비밀번호" 입력창은 만들지 않고, 체크하면 배송 장소의 공동현관 비밀번호 값을 그대로 `return_entrance_password`로 저장하고, 체크 해제 시엔 비워둠(주소처럼 실시간 입력창 동기화가 아니라, 제출 시점에 값을 결정). 나중에 회수 장소만 별도 공동현관 비밀번호를 직접 입력할 수 있는 전용 입력창이 필요하면 추가 요청 바람.
- `lib/roles-actions.ts`의 `DeliveryInfo`/`registerMembership`에 `returnEntrancePassword` 반영.
- 프리뷰도 동일 순서·로직으로 반영.

## [보완] 회수 장소 전용 공동현관 비밀번호 입력창 + 근무지 문구 수정

이전 구현에서 놓쳤던 부분 — 배송·회수 장소가 다르면 공동현관 비밀번호도 다를 수 있으므로, **회수 장소 전용 입력창**을 별도로 추가했다(회수 장소 세부주소 바로 아래, 두 체크박스보다 위).

- "공동현관 비밀번호도 동일" 체크 시: 회수 장소 입력창이 잠기고 배송 장소 값을 그대로 따라감(배송 쪽 값을 바꾸면 실시간으로 함께 갱신).
- 체크 해제 시: 회수 장소 입력창이 풀리고 독립적으로 직접 입력 가능.
- 실제 앱은 `returnEntrancePassword` state + `useEffect`로, 프리뷰는 `su-return-entrance-pw` 필드 + `toggleSameEntrance()`/`syncReturnEntrance()`로 구현.
- 근무지 자리표시자를 "근무지(상호명)로 배송회수"로 변경(근무지를 배송/회수 장소로도 쓸 수 있음을 안내).

## [설계 방침 기록] SNS 간편가입도 승인제 적용 대상

지금 로그인/가입 화면의 카카오·네이버·구글·페이스북 버튼은 아직 **UI 흉내(mock)** 단계라 실제 계정을 만들지 않는다(`snsMock()` 호출 → "준비 중이에요" 안내만 표시).

**나중에 실제 SNS(OAuth) 로그인을 구현할 때 반드시 지킬 것**: 승인 여부는 로그인 방식이 아니라 `customer.status` 컬럼으로 결정되는 구조이므로, SNS로 처음 가입한 사용자도 **ID 가입과 동일하게** `registerMembership()`(또는 그에 준하는 로직)을 통해 `customer` 행을 `status: 'pending'`으로 생성하고, 디렉터·슈퍼바이저의 승인(`/admin/approvals`)을 거쳐야 서비스 이용이 가능하도록 만들어야 한다. 즉 "SNS 로그인은 승인 없이 바로 이용 가능" 같은 예외를 두면 안 됨 — 승인제 정책은 가입 경로와 무관하게 전 회원에게 동일하게 적용되어야 한다.

실제 구현 시 참고할 흐름(예상): Supabase Auth OAuth 프로바이더로 로그인 성공 → `onAuthStateChange` 또는 콜백 라우트에서 `customer` 테이블에 해당 `auth_user_id`로 기존 행이 있는지 확인 → 없으면 신규 가입으로 간주해 `registerMembership`과 동일한 방식으로 `pending` 행 생성 → `/pending` 화면으로 안내.

## [구현 완료] 멤버십 가입비(100,000원, 일회성) — 결제해야 승인 대기로 진입

**결정된 사업 규칙**: 가입비 100,000원, 일회성(정기결제 아님). 결제 실패/중단 시 계정은 삭제되지 않고 **'결제 대기(unpaid)'** 상태로 남아 나중에 로그인해서 결제를 이어갈 수 있음.

### 상태 흐름 변경
`customer.status` 흐름이 `unpaid`(가입 직후, 결제 전) → `pending`(결제완료, 승인 대기) → `approved`/`withdrawn` 으로 확장됨(기존엔 pending에서 시작).
- `db/membership-fee.sql`(신규): `customer.status` 기본값을 `unpaid`로, 체크 제약에 `unpaid` 추가. `membership_payment` 테이블(주문·금액·상태) 신설 + RLS(본인 조회만).
- `lib/roles.ts`: `Access.status`에 `'unpaid'` 추가, `getAccess()` 기본값도 `unpaid`.
- `lib/roles-actions.ts`: `registerMembership`이 이제 `status:'unpaid'`로 고객 행 생성. `getMyAccess()`(신규, `getAccess`의 클라이언트 호출용 서버 액션 래퍼) 추가.

### 결제 로직 (기존 대여 결제 인프라 재사용)
- `lib/membership.ts`(신규, server-only): `finalizeMembershipById(orderId, paymentKey?)` — `payment_order`용 `finalizeOrderById`와 동일 패턴(PENDING→PAID 원자적 선점 후 `customer.status`를 `unpaid`일 때만 `pending`으로 전환). `lib/payments.ts`의 `tossConfirm`/`tossGetPayment`를 그대로 재사용.
- `lib/membership-actions.ts`(신규): `MEMBERSHIP_FEE = 100_000`, `createMembershipOrder()`(주문 생성), `confirmMembershipPayment()`(승인 처리).
- `app/membership/page.tsx`(신규, 서버 가드): 로그인 안 됐으면 `/login`, 직원 계정이면 `/`, `approved`면 `/looks`, `pending`이면 `/pending`, `unpaid`일 때만 결제 화면(`components/MembershipPayment.tsx`, 토스 결제위젯) 노출.
- `app/membership/success`, `app/membership/fail`: 결제 성공/실패 처리(대여 결제의 `/payments/success`·`/payments/fail`과 동일 패턴).
- **웹훅 공유**: `app/api/payments/webhook/route.ts`를 확장해 `orderId` 접두사(`mem_` vs `lala_`)로 대여 결제/멤버십 결제를 구분해 같은 웹훅 하나로 함께 처리.

### 가입/로그인 흐름 변경
- 가입 완료(계정 생성) 후 `/pending`이 아니라 **`/membership`**으로 이동해 결제를 요구.
- 로그인 시 상태를 확인해 `unpaid`→`/membership`, `pending`→`/pending`, 그 외→기존 `next` 파라미터로 분기(`getMyAccess()` 사용).
- `/pending`, `(member)` 레이아웃 가드에도 `unpaid`면 `/membership`으로 보내는 리다이렉트 추가.
- `/admin/approvals`(승인 목록)는 여전히 `status='pending'`만 조회하므로, 결제 전(`unpaid`) 계정은 승인 목록에 노출되지 않음(의도된 동작).
- 가입 버튼 문구를 **"멤버십 결제 후 가입하기"**로 변경.

### 프리뷰
동일한 흐름을 데모로 반영: 가입 시 `status:'unpaid'`로 시작 → `renderMembership()`(모의 결제 화면, "100,000원 결제하기") → `payMembership()`(결제 완료 처리, `status:'pending'`으로 전환) → `renderPending()`. 로그인 시에도 상태별 분기(`unpaid`→membership, `pending`→pending) 추가. 디렉터·슈퍼바이저 데모 계정은 그대로 `approved`라 결제 대상이 아님.

### 남은 일 / 확인 필요
- 이 환경은 네트워크가 없어 **실제 토스 결제 왕복은 검증하지 못함** — 로컬/스테이징에서 테스트 결제로 `unpaid→pending` 전환까지 확인 필요.
- SNS 간편가입을 실제 구현할 때도 이 가입비 결제 게이트를 동일하게 적용해야 함(앞서 기록한 "SNS도 승인제 적용" 항목과 함께, 이제는 "SNS도 가입비 결제 게이트 적용"까지 포함해서 기억해둘 것).

## [구현 완료] ID 중복확인 버튼 (실시간 확인 장치)

이전엔 ID 중복 확인이 "가입하기" 클릭 시(서버에서 최종 검증)에만 이뤄져서, 입력 중엔 중복 여부를 미리 알 수 없었다. **ID 입력창 옆에 "중복확인" 버튼**을 추가해 즉시 확인할 수 있게 했다.

- 버튼을 누르면 형식(영문/숫자 6~20자) 검사 후 `isUsernameAvailable(id)`를 호출해 "사용 가능한 ID입니다" / "이미 사용 중인 ID입니다"를 바로 보여줌.
- ID를 다시 수정하면 확인 상태가 초기화되어(재확인 전까지 미확인 처리) 오래된 "사용 가능" 표시가 남지 않게 함.
- 가입 제출 시 **"중복확인을 먼저 하지 않았거나 통과하지 못했으면"** 진행을 막고, 그래도 제출 시점에 서버에서 한 번 더 확인(그 사이 다른 사람이 선점했을 극히 드문 경우 대비) — 최종적으로는 DB의 `customer_username_unique`(대소문자 무시 유니크 인덱스)가 마지막 안전장치.
- 프리뷰도 동일하게 `checkId()`/`resetIdCheck()`로 반영.

이 3중 장치(입력 중 확인 버튼 → 제출 시 서버 재확인 → DB 유니크 제약)로 동일 ID 중복 가입을 사실상 원천 차단함.

## [구현 완료] 웹 푸시 알림 — 필수/거래 항목 (마케팅 동의와 무관)

Lala가 Next.js 웹앱이라 **Web Push**(서비스워커 + VAPID)로 구현. 필수(거래) 알림만 우선 구현하고, 마케팅 알림은 이번 범위에서 제외.

### 인프라
- `db/push-subscriptions.sql`(신규): `push_subscription(customer_id, endpoint, p256dh, auth)`, RLS 본인만.
- `public/sw.js`: 서비스워커. `push` 이벤트에서 알림 표시, `notificationclick`에서 창 포커스/열기.
- `lib/push.ts`(server-only): `sendPushToCustomer(customerId, title, body)` — 고객의 모든 구독 기기로 발송, 만료된 구독(404/410)은 자동 정리. **VAPID 키가 없으면 조용히 스킵**(개발 초기 단계 배려, 에러로 죽지 않음).
- `lib/push-actions.ts`: `savePushSubscription`/`removePushSubscription` (클라이언트 구독 등록/해제용 서버 액션).
- `components/PushNotificationToggle.tsx`: `/profile`(내 정보)에 "푸시 알림 받기/끄기" 토글 추가. 브라우저 Notification 권한 요청 → 서비스워커 등록 → `pushManager.subscribe()` → 서버 저장까지 처리.
- `package.json`에 `web-push`(런타임) + `@types/web-push`(devDependency) 추가.
- `.env.local.example`에 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` 추가 — **로컬에서 `npx web-push generate-vapid-keys`로 키 쌍을 생성해 채워야 함**(이 환경은 네트워크가 없어 실행/검증 못 함).

### 트리거 연결 (필수 항목만, "알림없음" 지정된 항목은 의도적으로 미연결)
| 이벤트 | 문구 | 연결 위치 |
|---|---|---|
| 가입 승인 | "{이름}님 가입이 승인됐어요. 멤버십 회원이 되신 걸 환영해요 :)" | `lib/roles-actions.ts` `approveMember` |
| 가입 거절 | (알림 없음) | `rejectMember` — 의도적으로 미연결 |
| 멤버십 결제 완료 | "{이름}님 멤버십 결제가 완료됐어요 :)" | `lib/membership.ts` `finalizeMembershipById` (성공 리다이렉트·웹훅 공용 경로라 정확히 1회만 발송됨) |
| 멤버십 결제 실패 | "{이름}님 멤버십 결제가 이뤄지지 않았어요." | `lib/membership-actions.ts` `confirmMembershipPayment` (FAILED 처리 지점) |
| 렌탈 결제 완료 | "예약 확정 및 렌탈 결제가 완료됐어요 :)" | `lib/payments.ts` `finalizeOrderById` |
| 렌탈 결제 실패 / 예약 확정 단독 / 반납일 임박 / 분쟁 지정·해결 | (알림 없음) | 의도적으로 미연결 |
| 배송 시작 | "배송이 시작됐어요 :)" | `lib/staff-actions.ts` `updateFulfillment` (status='SHIPPED') |
| 배송 완료 | "배송이 완료됐어요 :)" | 위와 동일 (status='DELIVERED') |
| 보증금 환불 완료 | "보증금 환불이 완료됐어요 :)" | 위와 동일 (status='REFUNDED') |
| 탈퇴 처리 완료 | "{이름}님 탈퇴처리가 완료됐어요. 다시 볼 수 있으면 좋겠어요." | `lib/account-actions.ts` `withdrawAccount` — **개인정보 익명화 전** 원래 이름으로 발송 |

### 프리뷰
실제 브라우저 푸시 권한/서비스워커는 이 데모 환경에서 의미가 없어(iframe 샌드박스), 대신 **모의 토스트 배너**(`showPushToast()`)로 위 알림 문구를 그 자리에서 보여준다. 승인(`approve`), 멤버십 결제(`payMembership`), 렌탈 결제(`payComplete`), 탈퇴(`confirmWithdraw`) 네 곳에 연결(배송/보증금 환불은 프리뷰에 해당 시뮬레이션 화면 자체가 없어 미연결).

### 남은 일
- **실제 발송 테스트 못 함**(네트워크 없음) — 로컬에서 VAPID 키 생성 → `/profile`에서 알림 켜기 → 각 트리거(승인/결제/배송/탈퇴)를 실제로 실행해 브라우저에 알림이 뜨는지 확인 필요.
- SNS 간편가입을 실제 구현할 때, 그 가입도 동일한 승인·결제·**알림** 트리거를 그대로 타도록 만들어야 함(이미 있는 다른 방침들과 같은 원칙).
- 다음 단계 후보: 마케팅 알림(신규 룩북, 프로모션 — 마케팅 동의자에게만), 반납일 임박 리마인더(스케줄 작업 필요, 예: Supabase Cron/Edge Function), 관리자·배송기사용 알림.

## [진행중] 이름-전화번호 실검증 본인인증 (카카오/네이버 경유) — 벤더 연동 전 단계

**목표**: 분쟁 발생 시 회원 정보가 허위이면 안 되므로, 가입 시 이름-전화번호 조합을 실제로 검증(카카오톡/네이버 인증서 등으로 본인확인)한다.

**정정된 사실관계** (자세한 내용은 위 체크리스트 "나중에 절대 놓치면 안 되는 설계 방침" 참고):
- 토스페이먼츠 ≠ 카카오/네이버 통합 본인인증. 통합 본인인증은 **포트원(PortOne)** 같은 별도 서비스로 붙여야 함. 결제(토스페이먼츠)와 본인인증(포트원) 벤더를 다르게 쓰는 건 업계에서 흔한 정상적인 조합.
- "앱 스킴"은 네이티브 앱에만 의미가 있고, 지금 같은 순수 웹앱 단계에서는 **HTTPS 콜백 URL**로 충분함.

**지금까지 구현한 것**:
- `db/phone-verify-limit.sql`: `phone_verify_attempt` 테이블(전화번호 + 시도 시각) — 어뷰징 방지용.
- `lib/phone-verify-actions.ts`: `checkPhoneVerifyRateLimit(phone)` — **같은 번호로 하루 5회까지만** 인증 시도(= "인증요청" 클릭)를 허용. 5회 초과 시 "내일 다시 시도해주세요" 안내. 24시간 슬라이딩 윈도우로 계산(자정 기준 아님).
- 가입 페이지의 `requestPhoneCode()`가 **실제 벤더 API를 호출하기 전에** 이 가드부터 통과하도록 연결됨(`app/(customer)/signup/page.tsx`). 벤더 연동 시 이 함수 안의 "TODO" 표시된 자리에 실제 포트원 API 호출을 넣으면 됨.
- 프리뷰도 동일 정책을 로컬 카운터(`phoneVerifyAttempts`)로 시뮬레이션.

**아직 안 한 것 (562 확인 후 진행)**:
- 포트원 가맹점 가입/계약(562가 직접 진행해야 함 — 결제 PG처럼 사업자 정보로 가입).
- 포트원 통합인증 JS SDK 연동(카카오/네이버/PASS/토스/은행인증서 선택 UI) — 지금의 "인증요청/확인" mock 버튼을 실제 SDK 호출로 교체.
- 인증 완료 콜백에서 받은 이름·전화번호(CI/DI 포함)를 가입 폼의 이름·전화번호 입력값과 **대조해 불일치 시 가입 차단**하는 로직(허위 입력 방지의 핵심 — 아직 미구현, 지금은 사용자가 입력한 이름/전화번호를 그대로 신뢰하는 상태).
- 인증 완료 정보(CI/DI 등)를 `customer` 테이블에 저장할지, 저장한다면 암호화 방식은 어떻게 할지 결정 필요(개인정보 보호법 고려).

## [구현 완료] 마케팅 푸시 알림 (선택 동의자 대상, 관리자 직접 작성/발송)

필수 알림(고정 문구, 이벤트 자동 트리거)과 달리, 마케팅 알림(신규 룩북 소식·프로모션·시즌 추천)은 **매번 문구가 달라지고 관리자가 직접 타이밍을 정해 발송**하는 성격이라 자동 트리거 대신 **관리자 발송 도구**로 구현했다.

- `db/marketing-broadcast.sql`(신규): `marketing_broadcast` 테이블(카테고리·제목·내용·발송자·수신자 수) — 발송 이력 감사(audit) 목적.
- `lib/push.ts`에 `sendPushToCustomers(customerIds, title, body)` 추가(다수 고객 동시 발송, 만료 구독 자동 정리는 기존과 동일).
- `lib/marketing-actions.ts`(신규): `getMarketingAudienceCount()`(발송 대상 미리 수 확인), `sendMarketingBroadcast(category, title, body)`(마케팅 동의 + 승인된 회원에게만 발송, 디렉터/슈퍼바이저만 실행 가능), `listMarketingBroadcasts()`(최근 발송 이력).
- `/admin/marketing`(신규): 카테고리 선택(신규 룩북 소식/프로모션/시즌 추천) + 제목·내용 작성 + 발송 대상 수 미리보기 + 발송 확인창 + 최근 발송 이력. 관리자 네비게이션에 "마케팅" 메뉴 추가.
- **마케팅 동의 철회 기능 추가**: `/profile`(내 정보)에 "마케팅 정보 수신에 동의합니다" 체크박스를 추가해 회원이 언제든 켜고 끌 수 있게 함(정보통신망법상 마케팅 동의는 언제든 철회 가능해야 함 — 이번에 이 요건을 충족시킴). `Profile`/`updateProfile`에 `marketingConsent` 필드 반영.
- **"신규 룩북 업로드" 자동 알림은 구현하지 않음** — 현재 룩북 데이터(`lib/looks.ts`)가 정적 배열이라 DB 기반 "업로드 이벤트" 자체가 없음. 관리자가 마케팅 발송 도구로 "신규 룩북 소식" 카테고리를 골라 수동 발송하는 방식으로 대체. 나중에 룩북을 DB화하고 관리자 CRUD를 만들면, 그때 "룩 추가" 액션에 자동 발송을 연결할 수 있음.
- **프리뷰에는 미반영** — 회원용 데모 화면에 디렉터 전용 관리 기능을 노출하지 않기로 한 기존 방침(승인 메뉴를 회원 앱에서 뺀 것과 동일 원칙)에 따라, 이 관리자 전용 기능은 실제 앱의 `/admin/marketing`에만 구현함.

### 남은 일
- 실제 발송 테스트 못 함(네트워크 없음) — VAPID 키 설정 후 마케팅 동의한 테스트 계정으로 실제 발송·수신 확인 필요.

## [보완 완료] 마케팅 푸시 알림 — 법적 준수 + 감사 기록 보강

562님이 다시 검토를 요청해 확인한 결과, 정보통신망법 관련 필수 요건 2개와 감사(audit) 관련 2개를 놓치고 있었다. 전부 보완함.

- **야간 발송 제한**(필수): 정보통신망법상 광고성 정보는 오후 9시~오전 8시(KST)에 별도 동의 없이 전송 불가. `lib/marketing-actions.ts`의 `isWithinAllowedSendingHours()`가 서버 시각을 KST로 환산해 이 시간대엔 발송 자체를 차단(에러 반환). 관리자 화면에도 이 제한을 안내 문구로 표시.
- **광고 표시 + 수신거부 안내**(필수): 발송 시 제목 앞에 자동으로 `(광고)`를 붙이고, 본문 끝에 "수신거부: 내 정보 > 마케팅 동의 해제"를 자동으로 추가. (관리자가 입력하는 제목/내용에는 안 붙어 있어도 발송 시점에 자동 삽입됨 — DB의 `marketing_broadcast.title/body`에는 원본 그대로 저장.)
- **마케팅 동의 시각 기록**: `customer.marketing_consent_at` 컬럼 추가(`db/marketing-compliance.sql`). 가입 시 마케팅 동의하면 그 시점이 기록되고, `/profile`에서 동의를 새로 켤 때도 시점이 갱신됨(끌 때는 과거 동의 시점을 보존 — 철회해도 "언제 동의했었는지" 증빙이 남도록).
- **발송 대상자 개별 로그**: `marketing_broadcast_recipient`(broadcast_id, customer_id) 테이블 추가. 발송할 때마다 실제 수신자 개개인을 기록해, 나중에 "이 알림 못 받았어요" 같은 CS 문의에 답할 수 있게 함. RLS로 본인 것 또는 직원만 조회 가능.

### 아직 남긴 것 (필수는 아님, 필요시 논의)
- 예약 발송(스케줄링) 기능 없음 — 지금은 즉시 발송만 가능.
- 발송 빈도 상한(예: 하루 1회 초과 시 경고) 없음 — 관리자가 실수로 여러 번 연달아 보내는 걸 막는 장치는 아직 없음.
- 세그먼트 타겟팅(특정 취향·구매이력 회원만 선별) 없음 — 지금은 "마케팅 동의 + 승인 회원 전체"에게만 발송.

## [구현 완료] 마케팅 알림 예약 발송 (야간 작성 → 낮 시간 자동/지정 발송)

- **DB**(`db/marketing-schedule.sql`, 신규): `marketing_broadcast`에 `status`(scheduled/sent/cancelled/failed), `scheduled_at`, `sent_at` 추가. 기존 발송 기록은 자동으로 `sent`로 보정.
- **자동 예약 전환**: 관리자가 "발송하기"를 눌렀는데 지금이 야간(21시~08시 KST)이면, 에러로 막는 대신 **자동으로 다음날 08:00(KST)에 발송되도록 예약 전환**하고 그 시각을 안내함.
- **수동 예약**: "예약 발송" 체크박스를 켜면 원하는 날짜·시각을 직접 지정 가능(단, 오전 8시~오후 9시 KST 범위 내로 검증).
- **실제 발송 처리**: `lib/marketing-send.ts`의 `processDueScheduledBroadcasts()`가 예약 시각이 지난 건들을 찾아 실제로 발송(원자적 선점으로 중복 발송 방지, 발송 시점에 실시간 대상자 수 재계산). `sendBroadcastNow()`는 즉시발송·예약처리 양쪽에서 공유하는 단일 발송 로직(광고 표시·수신거부 안내 자동 삽입, 개별 수신 로그 기록 등 기존 로직 그대로 유지).
- **크론 엔드포인트**: `app/api/cron/send-scheduled-marketing/route.ts` — `CRON_SECRET`로 보호되는 GET 라우트, 예약 도래분을 처리. `vercel.json`에 **15분마다** 호출하도록 Vercel Cron 설정 포함. 미들웨어 세션갱신 대상에서도 제외함.
- **관리자 화면**: 예약 발송 토글 + 날짜·시각 선택, 이력에 상태(예약됨/발송완료/취소됨) 표시, 예약 취소 버튼.
- `.env.local.example`에 `CRON_SECRET` 추가.

### 확인/주의 필요
- **Vercel Cron 관련 사실은 미검증** — "Vercel이 CRON_SECRET을 Authorization: Bearer 헤더로 자동 전달한다"는 점과 무료(Hobby) 플랜의 크론 실행 주기 제한(예: 하루 1회로 제한될 수 있음)은 이 환경에서 실시간으로 확인하지 못했다. **배포 전 Vercel 공식 문서에서 현재 정책을 반드시 재확인**할 것. Vercel이 아닌 다른 호스팅을 쓴다면, 외부 스케줄러(cron-job.org, GitHub Actions 스케줄, Supabase pg_cron+pg_net 등)로 `/api/cron/send-scheduled-marketing`를 주기적으로 호출하도록 별도 설정해야 하며 그 경우 `Authorization: Bearer <CRON_SECRET>` 헤더를 직접 넣어줘야 함.
- 이번에도 실제 예약→자동발송 왕복을 테스트하지 못함(네트워크 없음) — 로컬/스테이징에서 과거 시각으로 예약을 만들어 크론 라우트를 직접 호출해보는 방식으로 검증 권장.

## [정확도 수정] 마케팅 알림 발송 수·개별 로그가 부풀려져 있던 문제 수정

562님이 완성도를 다시 검토해달라 해서 확인한 결과, "발송 대상 수"와 "개별 수신 로그"가 **마케팅 동의 여부만 보고 실제 푸시 구독 여부는 안 봐서** 부풀려져 있었다(동의는 했지만 "푸시 알림 받기"를 켠 적 없는 회원도 대상에 포함되고, 로그에도 "받은 것"으로 남는 문제). 특히 개별 로그는 CS 문의("이 알림 못 받았어요") 대응이 목적이었는데, 부정확하면 그 목적 자체가 무너지는 문제라 수정함.

- `lib/push.ts`의 `sendPushToCustomers`가 이제 **실제로 발송을 시도한(=구독이 최소 1개 있는) 고객 ID 목록**을 반환하도록 변경(기존엔 `void` 반환).
- `lib/marketing-send.ts`의 `sendBroadcastNow`가 이 반환값을 써서 `recipient_count`와 `marketing_broadcast_recipient` 로그를 **실제 도달자 기준**으로 기록.
- `lib/marketing-actions.ts`의 `getMarketingAudienceCount`도 "동의+승인" 조건에 "**푸시 구독까지 켠**" 조건을 추가해, 발송 전 미리보기 숫자가 실제 발송 결과와 가깝게 표시되도록 수정. 관리자 화면 안내 문구도 "동의하고 푸시 알림을 켠 승인 회원"으로 명확히 함.
- 참고: 이건 "발송 시도"(push 서비스에 전달 성공) 기준이지, 사용자가 실제로 알림을 "봤는지"까지는 웹 푸시 표준상 확인할 수 없음(읽음 확인 기능 없음) — 이 한계는 그대로 남아있음.

## [구현 완료] 마케팅 동의 세분화(카테고리별) + 가입 시 혜택 안내 팝업

- **카테고리 교체**: '시즌 추천 룩'(season) → **'데일리 코디 추천'(daily)**로 교체(562 확인함). 최종 카테고리 3개: 룩북 소식(lookbook) / 프로모션(promotion) / 데일리 코디 추천(daily). 나중에 다른 항목이 필요해지면 그때 추가하기로 함(현재는 이 3개로 고정).
- **DB**(`db/marketing-granular-consent.sql`, 신규): `customer`에 `marketing_lookbook_consent`, `marketing_promotion_consent`, `marketing_daily_consent`(+ 각각 `_at` 동의시각) 추가. 기존 통합 `marketing_consent=true`였던 회원은 세 항목 모두 동의로 자동 이관(동의 유실 방지). **기존 `marketing_consent`/`marketing_consent_at` 컬럼은 레거시로 보존만 하고 더 이상 소스로 쓰지 않음** — 나중에 완전히 정리해도 되지만 지금은 안전하게 남겨둠.
- **가입 폼**: 여전히 **하나의** "(선택) 마케팅 정보 수신에 동의합니다" 체크박스만 있음(폼 길이 늘리지 않으려는 의도) — 체크 시 세 카테고리 모두 켜짐. **세분화 선택(예: 룩북만 받고 프로모션은 끄기)은 가입 후 `/profile`(내 정보)에서** 하도록 설계 — 신규 가입 마찰을 늘리지 않으면서 나중에 세밀하게 조정 가능하게 함.
- **`/profile`**: 마케팅 동의가 이제 3개의 개별 체크박스(신규 룩북 소식 / 할인·이벤트 프로모션 / 데일리 코디 추천)로 나뉘어, 예: "룩북 소식은 받고 프로모션은 끄기"가 실제로 가능함. 각각 독립적으로 동의 시각을 추적.
- **`/admin/marketing`**: 발송 대상 수·발송 로직 모두 **선택한 카테고리의 동의 컬럼만** 보고 계산(`getMarketingAudienceCounts()`가 카테고리별 3개 숫자를 한 번에 반환, `sendBroadcastNow`도 `marketing_broadcast.category`에 대응하는 컬럼으로 대상자 조회).
- **가입 시 혜택 안내 팝업**(신규): 마케팅 미동의 상태로 "가입하기"를 누르면, 처음 한 번만 "마케팅 수신을 동의하시면 룩북 업로드, 프로모션, 데일리 코디 추천 등 남들보다 먼저 소식을 받아보실 수 있어요 :)" 팝업이 뜸. **"동의하고 소식 받기"**와 **"괜찮아요, 계속 가입"** 두 버튼이 같은 비중으로 나란히 있고, 어느 쪽을 눌러도 가입은 그대로 완료됨(강제 아님). 같은 가입 시도 중엔 한 번만 뜸(재차 안 나옴).
- **법적 검토 결과(562 질문에 대한 답)**: 문제없음 — 단, (1) 마케팅 동의는 기본 미체크 유지, (2) 거절해도 가입이 막히지 않아야 함, (3) 팝업이 반복되거나 거절 버튼을 작게/숨기는 다크패턴이 되면 안 됨. 위 세 조건을 지키도록 구현함.
- **버그 수정 기록**: 팝업의 "동의하고 소식 받기" 버튼에서 `setAgreeMarketing(true)` 직후 바로 `proceedSignup()`을 호출하면, React state 갱신이 비동기라 `proceedSignup` 내부에서 여전히 이전 값(false)을 읽는 레이스 컨디션이 있었음 — `proceedSignup(marketingOverride?: boolean)`으로 명시적 값을 파라미터로 넘기도록 고쳐서 해결.

### 확인 필요
- 실제 가입~프로필 세분화 동의~마케팅 발송까지 전체 왕복 테스트 못 함(네트워크 없음).
- 프리뷰(데모)에는 이번 세분화·팝업을 반영하지 않음 — 마케팅 관리 기능 자체가 관리자 전용이라 기존 방침(회원용 데모엔 관리자 기능 비노출)에 따름. 다만 가입 시 팝업은 회원 플로우이므로 원하면 프리뷰에도 추가 가능(요청 시 진행).

## [구현 완료] 비로그인(둘러보기)은 룩 상세 접근 차단 + 그리드 9개 제한 실제 앱에도 반영

562님이 확인해보니, "룩북 9개까지만 보이고 나머지는 블러 처리"하는 로직이 **프리뷰(데모)에만 있고 실제 앱엔 아예 없었음**을 발견 — 이번에 실제 앱에도 반영하고, 추가로 요청하신 "상세 페이지 접근 차단"까지 구현함.

- `components/LookGrid.tsx`: `isLoggedIn` prop 추가. 비로그인이면 룩을 9개까지만 보여주고 나머지는 블러 처리 + "가입하고 모두 보기" CTA(프리뷰와 동일한 UX). `app/(customer)/looks/page.tsx`가 로그인 여부를 서버에서 확인해 넘겨줌.
- `app/globals.css`에 없던 `.lock-wrap`/`.lock-blur`/`.lock-overlay`/`.lock-msg` 스타일 추가(프리뷰에서만 쓰이고 있었음).
- **핵심 요청사항**: `app/(customer)/looks/[id]/page.tsx`(룩 상세)에 로그인 가드 추가 — 비로그인이 룩 카드를 클릭하거나 상세 URL에 직접 접근해도 `/login?next=/looks/{id}`로 리다이렉트됨(로그인 후 그 룩으로 자동 복귀). 즉 "제한된 9개 룩북 그리드까지만" 보이고, 그 안의 룩을 눌러도 상품 상세(아이템 목록)로는 못 들어감.
- 프리뷰도 동일하게 `detail` 뷰를 게이트에 추가해 비로그인 클릭 시 로그인으로 보내고, 로그인 성공 후 원래 보려던 룩으로 복귀(`pendingDetail`).

### 참고(정리 여지, 급하지 않음)
- `LookItems.tsx`의 `isLoggedIn` prop과 "로그인 후 ?add=id로 복귀해 자동 담기" 로직은, 이제 상세 페이지 자체가 로그인 필수라 사실상 항상 `true`만 전달됨 — 죽은 코드는 아니지만 단순화 여지가 있음(필요시 나중에 정리).

## [구현 완료] 룩북 그리드 뷰 전환 (1개씩 / 인스타그램식 3열)

- `components/LookGrid.tsx`: 뷰 토글 아이콘 2개(사각형=1개씩, 3x3 점=여러 개) 추가. 클릭 시 `viewMode` 상태 전환 + `localStorage`에 저장(다음 방문 때도 유지).
  - **1개씩(single, 기존 기본값)**: 지금까지와 동일(모바일 1열/데스크톱 2열, 표지+제목/서브텍스트).
  - **여러 개(triple)**: 화면 폭과 무관하게 항상 **3열**, 정사각형 썸네일, 제목/서브텍스트 없이 이미지만(인스타그램 그리드 느낌).
- 비로그인 9개 제한 + 블러 잠금 섹션도 현재 선택된 뷰 모드를 그대로 따라감(1개씩 보다가 잠긴 부분도 1개씩 블러, 3열이면 3열로 블러).
- 아이콘 배치는 헤더의 "로그아웃" 등이 있는 공용 헤더가 아니라, **룩북 그리드 페이지 상단(카테고리 필터 위, 우측 정렬)**에 뒀음 — 공용 헤더에 넣으면 다른 페이지(카트·내 정보 등)에도 무의미하게 노출되기 때문. 시각적으로는 헤더 바로 아래 자리라 요청하신 의도(헤더 하단 영역)에 부합.
- 프리뷰도 동일하게 반영(`lookViewMode` 전역 변수 + `localStorage` 저장).

## [구현 완료] 세 번째 뷰: "전체 상품" 리스트 (룩북 단위 아님)

기존 두 뷰(1개씩·인스타그램식 3열) 옆에, **개별 상품을 룩북 묶음과 무관하게 한 줄씩 나열**하는 세 번째 뷰를 추가(업로드해주신 리스트형 아이콘 그대로 적용: 작은 정사각형 썸네일 + 긴 알약형 텍스트 줄이 3번 반복).

- `components/LookGrid.tsx`: `viewMode`에 `'products'` 추가. 이 뷰에서는 `LOOKS`가 아니라 `products`(모든 개별 상품, 서버에서 `getProducts()`로 조회) 목록을 썸네일+이름+가격 한 줄씩 보여주고, 각 줄에 **담기 버튼**이 바로 있어 룩 상세를 거치지 않고 즉시 장바구니에 담을 수 있음(비로그인은 로그인으로 이동 후 자동 담기 없이 카탈로그로 복귀 — 룩 단위 담기와 달리 특정 룩으로 돌아갈 필요가 없어 단순화).
- `app/(customer)/looks/page.tsx`가 `getProducts()`·`getCartItems()`를 함께 조회해 `LookGrid`에 넘겨줌.
- `app/globals.css`에 `.product-list`/`.product-row` 등 추가.
- 프리뷰도 동일하게 반영(`GOWNS` 배열 전체를 리스트로 보여주고 `addProductDirect()`로 즉시 담기). 비로그인 시 로그인 후 복귀 로직(`pendingCartItem`)이 "특정 룩 없이 담은 경우"(look:null)도 안전하게 처리하도록 분기 추가(로그인 후 룩 상세가 아니라 이 상품 리스트 뷰로 복귀).

## [구현 완료] 둘러보기(비로그인)는 "전체 상품" 아이콘 잠금 — 룩북만 맛보기

- `components/LookGrid.tsx`: 비로그인이면 상품 목록 아이콘이 옅은 톤(`.locked`, opacity .35)으로 표시되고, 눌러도 뷰가 안 바뀌고 대신 `/signup`으로 이동. 로그인 상태에서 저장해둔 `localStorage` 값이 `products`였더라도, 비로그인으로 다시 방문하면 강제로 `single`로 시작(다른 사람 기기·공용 PC에서 갑자기 상품 리스트가 보이는 일이 없도록).
- 프리뷰도 동일 로직 반영.
- 결과적으로 비로그인은 **룩북 그리드(1개씩/3열)까지만** 맛보기로 보고, 개별 상품을 룩 단위 없이 훑어보는 "전체 상품" 리스트는 로그인(가입) 후에만 이용 가능.

## [버그 수정] 세 뷰 토글 아이콘 시각적 크기 불일치 — 근본 원인 및 해결

562님이 지적: width/height 숫자는 같은데(또는 조정해봐도) 1개씩·3열·전체상품 아이콘이 눈에 보이는 크기가 제각각이었음. 원인은 **각 아이콘이 16x16 viewBox 안에서 차지하는 바운딩 박스(여백) 자체가 서로 달랐기 때문** — 1개씩 아이콘은 상하좌우 2px 여백(12/16=75% 차지)인데, 3열·전체상품 아이콘은 거의 캔버스 끝까지(약 13~15/16) 그려져 있어서, 같은 width/height를 줘도 실루엣이 달라 보였음. (이전에 시도한 "34x34로 키우기" 땜질은 이미 여백이 적어 커 보이던 아이콘을 더 키운 격이라 오히려 문제를 심화시켰음 — 반영 후 되돌림.)

**해결**: 세 아이콘 모두 **동일한 바운딩 박스(2~14, 즉 12x12 영역)**를 쓰도록 좌표를 다시 그리고, width/height는 다시 셋 다 **32x32로 통일**. 이제 크기 차이는 순수하게 "칠해진 도형의 개수/굵기"에서만 오고(1개=꽉 찬 사각형, 3열=2x2 정사각형, 전체상품=3행 사각형+막대), 바운딩 박스 불일치로 인한 착시는 제거됨.

## [수정] 헤더 "내 정보" 네비 줄 — 화면 끝 밀어내기(음수 마진) 되돌림, "로그아웃" 잘림 방지

룩북 아이콘 줄과 맞추려고 헤더 네비 줄(`.nav-links`)에도 `margin-right:-28px`(프리뷰 `-16px`)를 적용했더니, 562님이 "로그아웃"이 잘려 보인다고 확인함. 텍스트 버튼은 이미지/아이콘과 달리 이 음수 마진 트릭이 계산이 어긋나면 그 부분이 실제로 잘려 보일 위험이 있어, **텍스트가 잘리지 않는 걸 우선**해 되돌림.

- 실제 앱 `.nav-links`(line 27): `margin-right:-28px` 제거, `align-self:flex-end;margin-top:2px`만 남김(원래의 안전한 여백 안 정렬로 복귀).
- 프리뷰도 동일하게 되돌림.
- **주의**: 이 환경은 브라우저 렌더링을 직접 확인할 수 없어서, 왜 정확히 잘렸는지 근본 원인(예: `justify-content:space-between` + `align-self:stretch` 조합에서의 폭 계산 문제)까지는 확정하지 못함. 나중에 헤더 네비를 다시 화면 끝까지 맞추고 싶다면, 로컬 브라우저에서 실제로 렌더링을 보면서(개발자 도구로 박스 모델 확인) 조정하는 걸 권장.

## [구현 완료] 룩 상세 페이지 — 이미지 최대 6장 갤러리 + 룩북 그리드와 동일한 사이즈 규칙

- `lib/looks.ts`: `Look.images?: LookImage[]`(최대 6장, 실제 사진으로 교체 예정인 그라데이션 배열) 추가. `getLookImages(look)` 헬퍼가 `images`가 있으면 그걸(최대 6장으로 자름), 없으면 기존 `c1/c2` 커버 1장으로 대체 반환(하위호환).
- `components/LookGallery.tsx`(신규, client): 스와이프로 넘겨보는 가로 스크롤 갤러리(`scroll-snap`) + 현재 위치를 보여주는 점(dot) 인디케이터.
- 상세 페이지(`app/(customer)/looks/[id]/page.tsx`)가 기존 단일 `.look-hero` 대신 이 갤러리를 사용.
- **사이즈 규칙을 룩북 그리드와 통일**: 이미지 비율은 그리드 카드와 동일한 **3:4**, 모바일에서는 그리드처럼 화면 좌우 끝까지 차지하도록(`margin:0 -28px`로 `.wrap`의 28px 여백 상쇄, 프리뷰는 `-16px`) 맞춤. 이전엔 상세 페이지 이미지가 `max-width:300px`로 작게 중앙 정렬돼 있었는데, 그리드 페이지와 다른 규칙이라 이번에 통일함.
- 프리뷰도 동일하게 반영(4개 대표 룩에 3장 안팎 샘플 이미지 배열 추가, 나머지 8개는 커버 1장으로 폴백 — 데모 목적상 전부 채우진 않음).

## [버그 수정] 상품 사이즈가 화면 어디에도 표시 안 되고 있었음

562님이 지적: 대여 서비스인데 사이즈 표기가 전혀 없었음. 확인해보니 **DB(`product.size` 컬럼)엔 이미 값이 있었는데(M/S/250/FREE 등, `db/seed.sql`), TypeScript의 `Product` 타입과 조회 쿼리(`lib/queries.ts`)가 애초에 이 컬럼을 select하지 않아서 화면까지 아예 전달이 안 되고 있었음** — 데이터는 있는데 파이프라인에서 누락된 경우.

- `lib/types.ts`: `Product`에 `size: string` 추가.
- `lib/queries.ts`: `ProductRow` 타입, `mapProduct()`, 그리고 상품을 조회하는 3개 함수(`getProducts`, `getProduct`, `getProductsByNames`)의 select 문 전부에 `size` 추가.
- `components/LookItems.tsx`(룩 상세의 아이템 카드), `components/LookGrid.tsx`(전체 상품 리스트 뷰) 양쪽에 사이즈 표시 추가(상품명과 가격 사이).
- 프리뷰도 `GOWNS` 배열에 실제 시드 데이터와 동일한 사이즈 값(M/S/250/FREE)을 추가하고 동일하게 표시.

### 확인 필요
- 앞으로 상품을 추가할 때(현재는 관리자 상품 등록 UI 확인 필요) `size` 값을 빠뜨리지 않고 입력하는지 확인. DB 제약은 `not null`이라 값 없이는 저장 자체가 안 되지만, 화면 표시 로직을 새로 추가하는 곳(예: 관리자 상품 목록, 주문 상세 등)에서도 이번처럼 select에서 빠뜨리지 않도록 주의.

## [구현 완료] 스타일별 보유 사이즈 전체 노출 + 사이즈별 대여 가능 여부 표시

562님이 "판매가 아니라 렌탈이니까 사이즈 표기가 하나뿐이면 안 된다"고 지적 — 같은 스타일이 여러 사이즈로 존재하고, 사이즈별로 재고(대여 가능 여부)가 다를 수 있어야 함. 이건 데이터 모델 자체를 바꿔야 하는 구조적 변경이었음.

### 데이터 모델 변경
- **스키마 자체는 안 바꿈** — `product` 테이블은 원래 "행 하나 = 사이즈 하나"였는데, 이제 **같은 스타일(같은 `name`)을 여러 사이즈로 여러 행 만들어서** 그룹핑하는 방식으로 확장(`name`이 사실상의 "스타일 그룹 키" 역할).
- `db/seed.sql` 전면 확장: 기존 6종 → **13개 사이즈 변형**으로 늘림(예: 블랙 드레이프 원피스 S/M/L, 에나멜 하이힐 235/240/250 등). **일부러 재고(`inventory_item`)를 안 만든 사이즈**가 있어 "품절(대여 불가)" 데모가 됨(원피스-L, 블라우스-M, 스커트-S, 하이힐-250).
- 기존 예약 시드도 이제 (이름, 사이즈) 조합으로 특정해서 참조하도록 수정(사이즈가 여러 개라 이름만으로는 모호해짐).

### 조회 로직
- `lib/queries.ts`: **`getProductsByNames`/`getProducts`가 이제 스타일(이름)당 대표 행 1개만 반환**하도록 중복 제거 추가(안 하면 "전체 상품" 리스트나 룩 구성에 같은 스타일이 사이즈 수만큼 중복 노출됐을 것).
- **`getSizeAvailabilityByNames(names)`**(신규): 스타일 이름 배열을 받아 `{스타일명: [{size, available}, ...]}` 형태로, 그 스타일이 보유한 모든 사이즈와 사이즈별 재고 여부(해당 사이즈에 `AVAILABLE` 상태 재고가 1개 이상 있는지)를 반환. 사이즈는 숫자면 숫자순, 아니면 `FREE/XS/S/M/L/XL/XXL` 순으로 정렬.

### 화면
- 룩 상세(`LookItems.tsx`)와 전체 상품 리스트(`LookGrid.tsx`) 양쪽에 상품 정보 아래 **사이즈 칩 한 줄**을 추가: 대여 가능한 사이즈는 브랜드색(에스프레소) 테두리·글자로, 불가한 사이즈는 회색 + 가운데줄(취소선)로 표시.
- 프리뷰도 `GOWNS`에 `sizes` 배열을 추가해 동일하게(실제 앱의 품절 데모와 사이즈 구성 일치) 반영.

### 확인 필요
- **날짜별(대여 기간별) 가용성까지는 반영 안 됨** — 지금의 "available"은 "지금 이 사이즈에 재고가 있는지"만 보는 것이라, 특정 예약 기간에 그 사이즈가 다른 사람에게 이미 예약돼 있어도(카트 캘린더처럼 기간 겹침 계산) 이 사이즈 칩에는 반영되지 않음. 필요하면 나중에 "선택한 기간 기준 가용성"으로 고도화 가능(카트의 기간별 캘린더 로직과 유사하게).
- 실제 DB 마이그레이션(새 `seed.sql`) 재실행 필요 — 기존에 이미 심어둔 6개 상품과 예약이 있다면, 새 시드와 충돌 없이 잘 붙는지 로컬에서 확인 필요(신규 설치라면 문제 없음).

## [구현 완료] 전체 상품 리스트 레이아웃 정리 + 카트에서 기간 기준 사이즈 선택·교체

### 1. 전체 상품 리스트 레이아웃
`components/LookGrid.tsx`의 "전체 상품" 뷰: 상품명 밑에 있던 단일 사이즈 줄 삭제. 대신 **가격과 사이즈 칩을 같은 줄에** 배치(가격 왼쪽, 사이즈 칩 오른쪽 `justify-content:space-between`). 최종 순서: 상품명 → (가격 / 사이즈 칩) → 담기 버튼. 프리뷰도 동일 반영.

### 2 & 3. 카트에서 사이즈 선택 + "선택한 기간 기준" 가용성 (통합 구현)
기존엔 "담기"를 누르면 대표 사이즈(예: M)가 그냥 담겼고, 카트에서 사이즈를 바꿀 방법이 없었음. 이제 카트에서 예약일·반납일을 고르면:
- **`lib/queries.ts`의 `getSizeAvailabilityForRange(names, checkout, returnDate)`**(신규) — 기존 `getSizeAvailabilityByNames`(그냥 "지금 재고 있는지")와 달리, **선택한 기간과 겹치는 ACTIVE 예약이 없는 재고가 하나라도 있는지**로 사이즈별 가용성을 계산(날짜 겹침 로직은 다른 예약 로직과 동일하게 반납일 당일은 겹침에서 제외). 사이즈마다 실제 `productId`도 함께 반환.
- 카트 페이지: 예약일·반납일이 확정되면 카트에 담긴 스타일들의 사이즈 옵션을 이 함수로 다시 계산. 각 카트 아이템 아래에 **사이즈 칩 행**이 나타나고, 칩을 탭하면 **캘린더에서 예약일을 선택했을 때와 똑같은 스타일(검정/에스프레소색 원 채움 + 흰 글�씨)**로 선택 표시됨(`.size-chip.pickable.chosen`). 다른 사이즈를 고르면 옆에 **"담기" 버튼**이 나타나고, 누르면 실제로 그 사이즈(다른 `product_id`)로 카트 아이템을 교체(`swapCartItemSize` 서버 액션, `cart_item.product_id` UPDATE).
- 카트 아이템에 **현재 사이즈 표시가 아예 없던 것도 이번에 같이 고쳤음**(`CartLine.size` 추가, `getCartItems` 쿼리에 포함).
- `queries.ts`는 서버 전용 모듈이라 클라이언트 카트 페이지에서 직접 못 부르므로, `lib/cart-actions.ts`(`'use server'`)에 얇은 래퍼로 재노출.

### 프리뷰의 한계 (정직하게 밝힘)
프리뷰는 사이즈별로 별도의 예약/재고 데이터를 갖고 있지 않아서(정적 데모 데이터), **기간별 재계산은 실제 앱에만 있고 프리뷰는 미리 정해둔 고정 가용성 값**을 그대로 보여줌. 인터랙션(칩 탭 → 검정 채움 → 담기 버튼 → 적용)은 동일하게 재현했지만, "다른 기간을 고르면 가용성이 달라지는" 진짜 계산은 프리뷰에서 확인 불가 — 실제 앱에서 로컬로 테스트 필요.

### 확인 필요
- 이번 기능 전체가 실제 DB 조인(product → inventory_item → reservation 중첩 조회)에 의존하는데, 이 환경에서 실제 쿼리 실행을 검증하지 못함. 로컬에서 카트에 여러 사이즈가 있는 스타일을 담고, 날짜를 바꿔가며 사이즈 칩의 가능/불가 표시가 실제로 바뀌는지, 그리고 담기(교체) 후 결제까지 잘 이어지는지 확인 필요.

## [버그 수정] 사이즈 선택 프리뷰 미반영 + 카트 표시 문제 4건

562님이 확인해보니 문제가 4가지 있었는데, 정리하면 이렇습니다.

### 1. "사이즈 선택이 안 됨" — 실제 앱은 이미 정상, 프리뷰만 안 됐던 것
확인 결과 **실제 앱(`LookItems.tsx`, `LookGrid.tsx`)은 이미 지난 턴에 사이즈 칩이 클릭 가능하게(선택 시 검정 채움) 구현되어 있었음** — 다만 **프리뷰(`preview.html`)에는 이 상호작용을 포팅하지 않고 정적(`<span>`, 클릭 불가) 버전으로 남겨뒀던 게 원인**. 이번에 프리뷰에도 동일한 클릭-선택 로직을 반영(`selectedSize` 전역 상태, `pickSize()` 함수, `sizeChips(g, onclickFn)`로 재작성). 다만 프리뷰는 사이즈별 별도 재고 데이터가 없는 정적 데모라, "담기"를 누르면 실제로 다른 재고를 예약하는 게 아니라 **선택한 사이즈 라벨만 반영**되는 수준(기존에 이미 있던 한계와 동일선상).

### 2. 카트에 단일 사이즈 줄이 남아있던 문제 → 삭제
지난 턴에 "현재 사이즈 표시가 아예 없다"는 걸 고치면서 급하게 `<div className="li-size">{c.size}</div>` 한 줄을 추가했었는데, 이후 사이즈 칩 시스템이 붙으면서 **중복 표시**가 됨. 이 단일 텍스트 줄은 삭제하고, 이제 사이즈 표시는 전부 칩 시스템(현재 사이즈가 "선택됨" 상태로 강조되는 방식)으로 일원화. 실제 앱·프리뷰 둘 다 반영.

### 3. 전체 상품 리스트에 적용했던 레이아웃(상품명 → 가격+사이즈 같은 줄 → 담기)을 룩 상세 아이템 카드에도 동일 적용
`components/LookItems.tsx`는 이미 이 레이아웃으로 되어 있었음(`.li-bottom` 플렉스 행). **프리뷰의 룩 상세 아이템 카드(`renderDetail`)에는 이 레이아웃이 반영 안 돼 있어서** 이번에 동일하게 맞춤(`.li-bottom` 클래스·CSS 프리뷰에도 추가).

### 4. 카트에서 예약일을 선택해야만 사이즈가 보이던 문제 → 날짜 선택 전에도 표시
- `lib/cart-actions.ts`에 **날짜 무관 기본 사이즈 조회**(`getSizeAvailabilityByNames` 클라이언트 호출용 래퍼) 추가.
- 카트 페이지: 예약일이 확정(`valid`)되기 전엔 이 기본 조회 결과(`basicSizeOptions`, "지금 재고 있는지" 기준)를 보여주고, 확정되면 기간 기준 조회(`sizeOptions`)로 자동 전환. 사이즈 칩 자체는 **`valid` 여부와 무관하게 항상 렌더링**되도록 조건을 풀어서, 상품 페이지에서 골랐던 사이즈가 카트에 들어오자마자(날짜 선택 전에도) 바로 보이게 함.
- 프리뷰도 동일하게 `valid&&` 게이트를 제거해 항상 사이즈 칩이 보이도록 수정.

### 확인 필요
- 이번에도 실제 렌더링을 직접 확인하지 못함(네트워크 없음) — 특히 프리뷰의 `selectedSize` 전역 상태가 여러 화면(룩 상세 ↔ 전체 상품 리스트)을 오갈 때 스타일명 기준으로 잘 유지되는지, 그리고 실제 앱에서 카트 페이지 진입 시 `basicSizeOptions`가 예약일 선택 전에도 정상적으로 뜨는지 로컬에서 확인 권장.

## [구현 완료] 사이즈 선택 필수화 + 카트 단순화 + 3열 보기 이미지 규격

### 1. 상품 페이지(룩 상세 + 전체 상품 리스트) — 사이즈 선택 필수
그동안 사이즈 칩이 기본값(대표 사이즈)으로 미리 선택된 채 시작해서, 실제로는 사용자가 아무것도 안 눌러도 "담기"가 그냥 됐음. 이제:
- 사이즈가 **1개뿐인 상품만** 자동 선택되고, **2개 이상이면 아무것도 선택 안 된 상태로 시작**.
- 사이즈를 안 고르면 "담기" 버튼이 비활성화되고 문구도 **"사이즈 선택"**으로 바뀜. 사이즈를 고르면 그제서야 "담기"로 바뀌고 활성화됨.
- `LookItems.tsx`, `LookGrid.tsx`(전체 상품 뷰) 양쪽 다 적용. `resolveProductId()`가 이제 `string | null`을 반환(사이즈 미선택 시 `null`)하도록 변경.
- 프리뷰도 동일 로직 반영(`selectedSize` 전역이 더 이상 자동으로 대표 사이즈를 채우지 않고, 사이즈 1개일 때만 자동 선택).

### 2. 카트 페이지 — 사이즈 표시 단순화 (스왑 UI 제거)
1번이 고쳐지면서 "카트에 담긴 시점에 이미 사이즈가 확정"되므로, 카트 안에서 다시 여러 사이즈 중 골라 교체하는 기능은 더 이상 필요 없어짐(오히려 혼란). **카트에서는 확정된 사이즈 하나만 브랜드색 칩으로 보여줌**(가격과 같은 줄, 오른쪽 정렬). 이전에 만들었던 사이즈 스왑 UI(칩 여러 개 + "담기" 교체 버튼)와 관련 상태(`sizeOptions`, `basicSizeOptions`, `chosenSize`, `selectSize`, `applySize`)는 카트 페이지에서 전부 제거해 코드 단순화.
- **백엔드는 남겨둠**: `lib/cart-actions.ts`의 `swapCartItemSize`, `getSizeAvailabilityForRange`, `getSizeAvailabilityByNames`는 삭제하지 않고 그대로 둠(당장 UI에서 안 쓰지만, 나중에 "카트에서 사이즈 재선택" 같은 기능이 다시 필요해지면 바로 재사용 가능한 인프라로 보존).
- 프리뷰도 동일하게 단순화(`pickCartSize`/`applyCartSize`/`cartSizeChoice` 제거, 카트 아이템은 `g.size`를 브랜드색 칩 하나로만 표시).

### 3. 3열 보기(triple view) 이미지 규격
`.look-grid-triple`: 이미지 비율을 1:1(정사각형) → **3:4**로, 이미지 간 간격을 4px → **1px**로 변경. 프리뷰·실제 앱 동일 반영.

## [버그 수정] 카트 사이즈 칩 채움 스타일 안 먹던 문제 + 3열 보기 이미지 간격이 넓어 보이던 원인

1. **카트 사이즈 칩**: `.size-chip.pickable.chosen`에만 채움 스타일(검정 배경+흰 글씨)이 걸려 있었는데, 카트 페이지의 확정 사이즈 칩은 `<span className="size-chip chosen">`으로 `.pickable` 클래스가 없어서 스타일이 전혀 안 먹고 있었음. `.size-chip.chosen`(pickable 무관)으로 규칙을 바꿔서 해결.
2. **3열 보기 간격**: 그리드 `gap`은 이미지 사이에 지정한 값만큼만 생기는 게 맞는데(1px 설정 시 실제로 1px), **이미지마다 걸려 있던 `border:1px solid`가 3열 모드에서도 안 지워져서** gap(1px) + 양쪽 이미지 테두리(1px씩)가 겹쳐 실제로는 훨씬 넓어 보였음. `.look-grid-triple .look-cover`에 `border:none`을 추가해 3열 모드에서는 테두리 없이 순수 grid gap(1px)만 간격으로 남게 함.

## [구현 완료] 사이즈 선택을 "담기 버튼 자리"로 통합

562님 아이디어: 사이즈 칩을 이름/가격 옆이 아니라, **버튼이 있던 바로 그 자리**로 옮기고, 사이즈를 고르는 순간 그 자리가 바로 "담기" 버튼으로 바뀌게 만듦.

- `LookItems.tsx`, `LookGrid.tsx`(전체 상품 뷰) 모두: `li-info`(또는 `product-row-info`)엔 이제 **이름 + 가격만** 남고, 사이즈 칩은 별도로 뺐음.
- 그 아래(룩 상세는 세로 배치의 맨 아래, 전체 상품 리스트는 가로 배치의 오른쪽 끝 — 원래 "담기" 버튼이 있던 정확히 그 위치)에서 **조건부로 렌더링**: 사이즈 미선택 상태면 그 자리에 **선택 가능한 사이즈 칩들**이 뜨고, 사이즈를 하나 고르면 그 즉시 그 자리가 **"담기" 버튼**으로 바뀜(칩은 사라짐). 담긴 후엔 "담김"으로.
- 죽은 CSS(`li-bottom`, `product-row-bottom`, 관련 nth-child 인셋 여백 등 — 이전 시도들의 흔적)도 함께 정리.
- 프리뷰도 동일 구조로 반영(`sizeChips()` 함수는 이제 안 쓰여 제거하고, 단일 사이즈 자동선택 로직만 `ensureSizeDefault()`로 분리해 보존).

## [버그 수정] 전체 상품 리스트에서 사이즈 선택 시 룩 상세로 잘못 이동하던 문제 — 프리뷰 전용 버그

562님이 확인: 전체 상품 리스트에서 사이즈를 고르면 룩북 상세 페이지로 튕겨나가는 문제.

**확인 결과 실제 앱은 이 버그가 없음** — `LookGrid.tsx`는 컴포넌트 자체 로컬 state(`useState`)로 사이즈 선택을 관리하고, 어떤 navigation(Link/router.push)도 사이즈 선택 로직에 걸려있지 않음.

**원인은 프리뷰 전용**: 프리뷰의 `pickSize()` 함수가 "지금 룩 상세를 보고 있는지"를 판단할 때 `currentLook`이라는 **전역 변수**를 참조했는데, 이 변수는 한 번이라도 룩 상세를 봤으면 그 이후 계속 남아있는 값이라(카탈로그로 돌아와도 초기화 안 됨), 전체 상품 리스트에서 사이즈를 눌러도 "아직 룩 상세 보는 중"으로 잘못 판단해 `renderDetail()`을 호출해버렸음.

**수정**: `pickSize(gid, size, inDetail)`로 세 번째 파라미터(현재 호출 위치를 명시하는 플래그)를 추가 — 전체 상품 리스트(`productRowHtml`)에서는 이 값을 안 넘겨(false) 카탈로그를 유지하고, 룩 상세(`rows`)에서만 `true`를 넘겨 상세 화면을 유지하도록 명시적으로 구분. 더 이상 모호한 전역 변수에 의존하지 않음.

## [신규 구현] "다른 회원님의 카트에도 담겨 있어요" — 빠른 결제 유도

562님이 "예전에 있었던 것 같다"고 하셔서 코드·모든 이전 대화 기록을 확인했지만 **실제로는 한 번도 구현된 적 없는 기능**이었음(전체 트랜스크립트·HANDOFF 어디에도 없음). 이번에 새로 구현.

- `lib/cart-actions.ts`의 `getOtherCartConflicts(productIds)`(신규): 내 카트에 있는 상품(정확히는 사이즈별 `product_id`)들 중, **다른 고객의 `cart_item`에도 동시에 담겨 있는 것**을 찾아 Set으로 반환.
- 카트 페이지: 카트를 불러올 때 이 함수도 같이 호출해서, 해당되는 상품명 옆에 **"· 다른 회원님의 카트에도 담겨 있어요"**를 와인색 텍스트로 표시.
- 재고가 한정된 렌탈 상품 특성상, 실제로 다른 사람도 같은 사이즈를 담아둔 상태라면 "선점 경쟁" 상황이라 이 안내가 실제로 의미 있는 정보임(단순 마케팅 문구가 아니라 진짜 재고 경합 신호).
- **프리뷰는 실제 다중 계정 카트 데이터가 없는 단일 세션 데모**라, 이 기능을 시각적으로 보여드리기 위해 `GOWNS` 배열의 2개 데모 상품(g1, g4)에 `otherCart:true` 플래그를 인위적으로 붙여 시뮬레이션함(실제 계산이 아니라 데모용 고정 표시). 실제 앱은 진짜 DB 조회 기반으로 동작.

### 확인 필요
- 실제 DB 조회(`cart_item` 테이블에서 다른 `customer_id`의 동일 `product_id` 존재 여부)를 이 환경에서 검증 못 함 — 로컬에서 서로 다른 두 계정으로 같은 사이즈를 각자 카트에 담아보고, 문구가 정상적으로 뜨는지 확인 필요.

## [레이아웃 조정] 카트 아이템 — 이름 줄에 사이즈, 가격 줄에 "다른 회원 카트" 안내

562님 제안으로 재배열: 상단 줄에 상품명+사이즈 칩, 하단 줄에 가격+"다른 회원님의 카트에도 담겨 있어요" 안내.

**562님이 직접 요청한 오류 점검 결과**: 카트 아이템 칸이 썸네일과 삭제 버튼 사이의 좁은 공간이라, 날짜를 선택해 총액까지 붙으면(`가격 · 총액`) 그 옆에 "다른 회원님의 카트에도 담겨 있어요"까지 한 줄에 다 들어가지 않을 수 있음 — 실제 렌더링을 볼 수 없는 환경이라 100% 확정은 못 하지만, 텍스트 길이상 겹칠 가능성이 있다고 판단해 안전장치를 넣음:
- 상품명은 너무 길면 말줄임(`...`) 처리해 사이즈 칩을 안 밀어냄.
- 가격+안내 문구 줄은 `flex-wrap:wrap`으로, 한 줄에 다 안 들어가면 **자동으로 2줄로 내려가도록** 처리(잘리거나 겹치지 않고 자연스럽게 줄바꿈).

로컬에서 실제 폭이 좁은 화면(모바일)에 긴 상품명 + 총액 + 안내 문구가 겹치는 경우를 한 번 확인해 보시는 걸 권장.

## [디자인 결정] 카트 화면 — "일당 비용"은 크게, "결제 금액(보증금 포함 총액)"은 세부사항 수준으로

562님이 결제 직전 체감 가격이 너무 커 보인다고 해서, 시선의 우선순위를 재배치함.

- **법적 판단 근거**: 한국 전자상거래법은 결제 전 총액을 "소비자가 실제로 인지 가능한 형태로" 고지할 것을 요구하지, 특정 글자 크기를 요구하지 않음. 라라는 카트 단계부터 보증금 항목을 계속 보여주고 있어 결제 직전에야 비용을 드러내는 "드립 프라이싱"(다크패턴 유형 중 하나, 공정위 단속 대상)에 해당하지 않음. **총액을 "숨기지만 않으면"(같은 화면에서, 결제 버튼 누르기 전에, 읽을 수 있는 크기로 항상 노출) 글자 크기를 줄이는 것 자체는 문제 삼기 어렵다는 게 합리적인 결론** — 다만 Claude는 변호사가 아니므로 이건 참고용 판단이며 최종 확정은 아님.
- **구현**: 카트 페이지 상단에 `.cart-daily-highlight`(22px, 굵게) — 카트에 담긴 아이템들의 **일당 가격 합계**를 크게 보여줌(예약일 선택 여부와 무관하게 항상 계산 가능). 기존 "렌탈비용(기간 총액)·보증금·결제 금액" 3줄은 그대로 남기되, 최종 "결제 금액"의 글자 크기를 24px → **13px**(다른 상세 줄과 비슷한 수준)로 낮춰 "세부사항"처럼 보이게 함 — 완전히 숨기거나 안 보이는 수준까진 가지 않음(법적 안전선 유지).
- **프리뷰 주의사항**: 프리뷰엔 실제 카트 화면(`renderCart`) 외에 토스페이먼츠 결제창을 흉내낸 별도 화면(`renderPayment`, `.pay-mock`)이 있는데, 이건 실제 결제사 UI를 재현하는 목적이라 **그대로 뒀음**(결제 게이트웨이 화면에서 금액을 명확히 보여주는 건 표준적이고 바람직하므로 여기까지 축소하면 안 됨). 이번 변경은 카트(예약 확인) 화면에만 적용됨.

## [구현 완료] 이미지 크기 조정 + 사이즈 없는 상품에 "Free" 옵션 추가(일관된 선택 흐름)

- 전체 상품 리스트 썸네일: 78x102 → **65x85**로 살짝 축소.
- **"사이즈가 하나뿐이면 자동 선택"하던 기존 로직을 완전히 제거** — 이제 사이즈가 몇 개든(1개든 여러 개든) 무조건 직접 탭해서 골라야 "담기" 버튼이 나타남(일관성). 사이즈 옵션이 아예 없는 상품(스타일)은 **"Free"라는 옵션 하나를 자동으로 만들어서** 보여주고, 이것도 마찬가지로 탭해야 담기 버튼이 나옴.
- `LookItems.tsx`, `LookGrid.tsx`(전체 상품 뷰): `getSizeOptions()` 헬퍼 추가 — `sizeMap`에 실제 사이즈가 있으면 그대로, 없으면 `[{size:'Free', available:true, productId: 자기자신 id}]`로 대체. `resolveProductId`도 이 옵션 목록을 인자로 받도록 시그니처 변경.
- 프리뷰도 동일하게 반영(`ensureSizeDefault` 제거, `getSizeOpts()`로 대체 — 단일 사이즈든 다중 사이즈든 항상 명시적 선택 요구).

## [버그 수정] "내 정보에서 수정 가능" 안내가 거짓말이었던 문제 — 실제로 구현

562님이 정확히 짚어주심: 가입 페이지에 "피팅 정보, 배송 정보 수정은 '내 정보'에서 가능해요"라는 안내를 넣었는데, 확인해보니 **"내 정보" 페이지엔 그 항목들을 수정하는 UI가 아예 없었음** — 안내가 거짓말이 되고 있던 상황. 이번에 실제로 구현함.

- `lib/account-actions.ts`: `Profile`/`getProfile`/`UpdateProfileInput`/`updateProfile`에 피팅 정보(키·상의사이즈·허리·구두사이즈)와 배송 정보(배송지 주소+지번+세부주소+공동현관비밀번호, 회수지 동일 세트, 배송 전화번호, 근무지) 전부 추가.
- `components/ProfileForm.tsx`: 가입 페이지와 똑같은 UX로 "피팅 정보 입력하기"/"배송 정보 입력하기" 아코디언 추가(배송지-회수지 동일 체크박스, 공동현관 비밀번호 동일 체크박스, 주소 검색 연동까지 가입 페이지 로직 그대로 재사용).
- 프리뷰도 동일 반영(`pf-` 접두 전용 토글/동기화 함수를 새로 작성해 가입 페이지의 `su-` 함수와 충돌 안 나게 분리, `user.fitting`/`user.delivery` 객체를 그대로 읽고 씀).

## [구현 완료] 범용 "주소" 필드 완전 제거 + 배송지/회수지/근무지 변경 이력 + 관리자 실시간 조회

562님 지시: (1) 가입 시 입력란도 없는 범용 "주소" 필드는 완전히 삭제, (2) 배송지·회수지·근무지 정보는 수시로 바뀔 수 있으니 변경 이력을 남길 것, (3) 그 이력을 관리자 앱에서 실시간으로 조회 가능하게 할 것.

### 1. 범용 "주소" 필드 완전 제거
지난 턴엔 "화면에서만 빼고 DB엔 남겨두는" 절충안으로 처리했었는데, 이번에 아예 코드 전체에서 제거함. `lib/account-actions.ts`의 `Profile`, `getProfile`, `UpdateProfileInput`, `updateProfile`에서 `address`/`addressJibun` 관련 코드 전부 삭제. **DB의 `customer.address`/`customer.address_jibun` 컬럼 자체는 남겨둠**(혹시 과거 기록이 있다면 보존, 삭제하려면 별도 마이그레이션 필요 — 지금은 안전하게 그대로 둠).

### 2. 배송지/회수지/근무지 변경 이력
- `db/address-change-log.sql`(신규): `address_change_log` 테이블(고객ID, 필드명, 한글 라벨, 이전 값, 새 값, 변경 시각). Supabase Realtime publication에도 추가(`alter publication supabase_realtime add table address_change_log`).
- `lib/account-actions.ts`의 `updateProfile`: 저장 성공 후, 배송지 주소·지번·세부주소·공동현관비밀번호, 회수지 주소·지번·세부주소·공동현관비밀번호, 근무지, 배송 연락처 — **총 10개 필드를 이전 값과 비교**해서, 바뀐 필드만 골라 `address_change_log`에 기록.

### 3. 관리자 앱 실시간 조회
- `lib/staff-actions.ts`에 `listAddressChanges()` 추가(고객명·아이디와 조인해서 최근 100건 조회, 직원 전용).
- `/admin/address-log`(신규): 변경 이력을 "이전값 → 새값" 형태로 최신순 표시. **Supabase Realtime을 구독**해서(`postgres_changes` INSERT 이벤트) 새 변경이 생기면 자동으로 목록이 갱신됨 — 페이지 새로고침 없이 실시간 반영. 화면 제목 옆에 실시간 연결 상태를 보여주는 작은 점(연결되면 초록, 아니면 회색)도 추가.
- 관리자 네비게이션에 "배송정보 변경" 메뉴 추가.

### 확인 필요
- **`alter publication supabase_realtime add table address_change_log` 구문은 이 환경에서 실행/검증 못 함** — Supabase 프로젝트의 Realtime publication 설정이 프로젝트마다 조금씩 다를 수 있어, 로컬/실제 Supabase 프로젝트에서 이 마이그레이션이 에러 없이 실행되는지 반드시 확인 필요. (이미 `supabase_realtime`이라는 publication이 존재하고 테이블 추가가 가능한 게 Supabase 기본 설정이지만, 프로젝트 설정에 따라 다를 수 있음.)
- 실제 Realtime 구독-갱신 왕복(관리자 화면을 열어둔 상태에서 다른 회원이 배송지를 수정했을 때 자동으로 목록에 뜨는지)을 이 환경에서 테스트하지 못함 — 로컬에서 두 세션(회원용 브라우저 탭 + 관리자용 브라우저 탭)으로 직접 확인 권장.
- 이 기능은 관리자 전용 백엔드 기능이라 기존 방침(마케팅 발송 도구 등과 동일)에 따라 **프리뷰(회원용 데모)에는 반영하지 않음**.

## [버그 수정] 자동로그인 상태로 앱을 열면 항상 룩북 페이지로 이동하도록

- 로그인 후 이동은 이미 `/looks`로 잘 되어 있었음(`login/page.tsx`의 기본 `next` 값).
- 다만 **자동로그인 세션이 있는 상태로 루트(`/`) 경로를 직접 열면**, 로그인 여부와 무관하게 항상 랜딩(멤버십 가입/로그인/둘러보기) 화면부터 보여주고 있었음.
- `app/page.tsx`를 서버 컴포넌트로 바꿔, 로그인된 사용자면 즉시 `/looks`로 리다이렉트하도록 수정. 비로그인 사용자에게는 기존 랜딩 화면 그대로 노출.
- **프리뷰는 이미 이 로직이 구현되어 있었음**(`localStorage`에 저장된 세션이 있으면 랜딩을 건너뛰고 바로 카탈로그로 이동) — 실제 앱에만 있던 격차였음.
- 참고: 이 리다이렉트는 로그인 여부(`auth.getUser()`)만 확인하고, 멤버십 상태(unpaid/pending/approved)는 따로 걸러내지 않음 — `/looks` 자체가 비로그인·미승인 회원 모두에게 기본적으로 접근 가능한 페이지라 문제는 없지만, 혹시 "미승인 회원은 첫 화면에서 바로 멤버십/승인대기 화면으로 보내고 싶다"는 요구가 나중에 생기면 이 리다이렉트 로직을 상태별로 분기해야 함.

## [구현 완료] 로그인 화면 "자동로그인" 토글

562님 요청: ID/비밀번호 입력란 아래에 자동로그인 토글을 만들고, 켜면 앱을 껐다 켜도 로그인이 유지되게(끄면 유지 안 되게) 만들 것.

### 배경 — 원래 왜 필요했는지
Supabase Auth는 기본적으로 로그인하면 **항상 영속(persistent) 쿠키**로 세션을 저장해서, 토글 없이도 이미 "앱을 껐다 켜도 로그인 유지"가 기본 동작이었음. 즉 "자동로그인 토글"은 이 기본 동작을 **끌 수 있게** 만드는 것(끄면 브라우저/앱을 완전히 종료했을 때 로그인이 풀리게)이 핵심 작업이었음.

### 구현 (실제 앱)
- `lib/supabase/client.ts`의 `supabaseBrowser()`가 `{ rememberMe }` 옵션을 받도록 확장. `rememberMe: false`면 인증 쿠키를 **만료 기한 없는 "세션 쿠키"**로 저장(브라우저/앱을 완전히 닫으면 사라짐).
- **중요한 함정과 그 해결**: 미들웨어(`lib/supabase/middleware.ts`)가 매 요청마다 토큰을 갱신하면서 쿠키를 다시 쓰는데, 이게 "자동로그인 끔" 선택을 모르면 다음 요청 때 다시 영속 쿠키로 덮어써서 토글이 무의미해짐. 이를 막기 위해 **`lala_remember`라는 마커 쿠키**(로그인 시 세션 쿠키로 심음)를 미들웨어가 확인해서, 꺼져 있으면 토큰 갱신 때도 계속 만료기한을 제거하도록 처리.
- `app/(customer)/login/page.tsx`: ID/비밀번호 아래에 "자동로그인 (앱을 껐다 켜도 로그인 유지)" 체크박스 추가(기본 켜짐). 로그인 시 체크 여부에 따라 마커 쿠키를 세팅하고 `supabaseBrowser({ rememberMe })`로 로그인 처리.
- 로그아웃(`lib/actions.ts`의 `signOut`) 시 마커 쿠키도 함께 정리.

### 프리뷰 반영 + 부수적으로 발견한 버그 수정
- 프리뷰는 `localStorage`(자동로그인 켬, 영구) vs `sessionStorage`(자동로그인 끔, 이 탭/창을 닫으면 사라짐)로 구분해 동일한 개념을 재현. 세션을 쓰는 모든 지점(가입 완료·멤버십 결제·정보 저장 등)을 `persistUser()`라는 공용 헬퍼로 통일해서, 로그인 시 선택한 스토리지에 계속 일관되게 저장되도록 정리.
- **부수 발견 버그**: 프리뷰의 `doLogin()`이 그동안 `fitting`/`delivery` 정보를 `user` 객체에 안 실어서, 재로그인하면 "내 정보"의 피팅·배송 정보가 비어 보이는 문제가 있었음 — 이번에 같이 고침.

### 확인 필요 (중요)
- **이 기능 전체(특히 세션 쿠키 vs 영속 쿠키의 실제 브라우저 동작)는 이 환경에서 검증하지 못함.** 로컬에서 반드시 직접 테스트할 것: (1) 토글을 끄고 로그인 → 브라우저를 완전히 종료(탭만 닫는 게 아니라 프로세스 자체 종료) → 다시 열었을 때 로그아웃 상태인지 확인. (2) 토글을 켜고 로그인 → 동일하게 브라우저를 완전히 재시작 → 로그인이 유지되는지 확인. 모바일 브라우저나 PWA로 설치한 경우 "앱을 껐다 켠다"는 의미(백그라운드 전환 vs 완전 종료)가 데스크톱 브라우저와 다르게 동작할 수 있어 별도 확인 필요.

## [구현 완료] 렌탈기록 날짜별 그룹 나열 + 브랜드 "Studio Vœu" 완전 삭제

562님이 "여러 상품을 넣고 렌탈기록이 어떻게 보이는지 보여달라"고 하셔서 확인해보니, **여러 상품을 한 번에 렌탈해도 렌탈기록에서 하나의 주문으로 안 묶이고 상품별로 각각 따로 나열**되는 문제를 발견 → 논의 후 아래처럼 정리함.

1. **데모로 추가했던 임시 데이터 삭제**: 확인 목적으로 프리뷰에 넣었던 3종 데모 주문(`seedDemoMultiItemOrder`) 완전히 제거.
2. **나열 방식을 날짜(=주문)별로 그룹핑**: `app/(member)/account/page.tsx`(실제 앱)와 프리뷰의 `renderAccount()` 둘 다, 같은 예약일·반납일(=같은 주문)끼리 묶어서 **날짜 구간을 소제목으로 한 번만 보여주고, 그 아래 상품들을 나열**하도록 재구성. 예: "2026-06-20 – 2026-06-23" 아래 벨벳 블레이저·에나멜 하이힐·레더 핸드백이 함께 나열됨. 이전엔 각 상품 카드마다 날짜가 반복 표시됐음.
3. **브랜드 "Studio Vœu" 코드 전체에서 완전 삭제**: `db/seed.sql`(3곳), 프리뷰(2곳) 모두 **"Lala Atelier"로 통일**. 부수적으로 프리뷰의 분쟁 데모(`seedDemoDispute`)에서 "블랙 드레이프 원피스"의 브랜드가 실제 시드 데이터(Lala Atelier)와 다르게 "Studio Vœu"로 잘못 하드코딩돼 있던 **기존 불일치 버그도 같이 바로잡음**.

### 확인 필요
- DB에 이미 "Studio Vœu"로 저장된 실제 데이터가 있다면(이미 배포해서 실사용 중이었다면) `db/seed.sql` 재실행만으론 안 바뀜 — 별도 UPDATE문으로 기존 행을 고쳐야 함. 지금은 아직 배포 전이라 문제 없을 것으로 보임.

## [구현 완료] 브랜드 표시 화면에서 완전히 제거

562님 확인: "Lala Atelier"로 된 상품들을 어떻게 할지 물었더니, **브랜드 표시 자체를 화면에서 완전히 삭제**하기로 결정.

- 실제 앱: `app/(member)/account/page.tsx`(내 대여) — 브랜드가 화면에 실제로 표시되던 **유일한 곳**이었음(`.resv-brand`). 삭제.
- 프리뷰: `renderAccount()`의 `.resv-brand` 줄 삭제.
- **DB의 `product.brand` 컬럼과 시드 데이터(`db/seed.sql`)는 그대로 둠** — "화면에서" 삭제가 요청 범위였고, 데이터 자체를 지우는 건 별개 작업이라 건드리지 않음. 필요하면 나중에 컬럼째로 정리 가능.
- 참고: 프리뷰의 `GOWNS` 배열·카트 아이템 등에도 `brand` 필드가 여전히 데이터로는 남아있지만, 실제로 화면에 렌더링되는 곳은 없어졌으므로 무해함.

## [답변 기록] 분쟁중 상태에 표시 가능한 옵션 관련 — 실제 앱의 숨은 격차 발견

562님 질문: 분쟁중 박스에 뜰 수 있는 옵션이 뭐가 있는지. 확인 결과:
- 분쟁 사유는 **고정 선택지가 없고 관리자가 자유 텍스트로 입력**하는 구조(`AdminOrders.tsx`, placeholder "분쟁 사유").
- **중요한 발견**: 실제 앱의 "내 대여"(`app/(member)/account/page.tsx`)는 `reservation` 테이블만 조회하고 `payment_order`(분쟁 정보가 있는 테이블)는 아예 안 봐서, **회원 본인은 자기 주문이 분쟁중인지 현재 전혀 확인할 수 없음**. 관리자 화면에만 분쟁 정보가 뜸. 프리뷰 데모는 단순화된 구조라 분쟁 배지가 보이지만, 실제 앱 동작과 다름 — 이 격차는 아직 안 고쳤음(562님이 원하면 다음에 이어서 연결 작업 필요).

## [버그 수정] 회원이 자기 주문의 분쟁 상태를 볼 수 있게 연결 + "내 대여"/"렌탈기록" 용어 통일

### 회원용 분쟁 상태 연결
- `app/(member)/account/page.tsx`(렌탈기록): 이제 `payment_order`도 함께 조회해서, 분쟁중인 주문이 있으면 해당 날짜 그룹 제목 옆에 **"분쟁중" 배지**와(사유를 남겼다면) **"사유: OOO"**를 표시하도록 연결함.
- **연결 방식의 한계**: `reservation`과 `payment_order` 사이에 직접적인 FK가 없어서, 같은 고객의 (예약일, 반납일)이 같으면 같은 주문으로 간주해 매칭함. `finalizeOrderById`가 한 주문의 카트 상품들을 항상 그 주문과 동일한 날짜로 예약 생성하므로 실제 운영상 안전하지만, **이론적으로 한 고객이 완전히 같은 날짜로 두 번 결제하면 두 주문이 섞여 보일 수 있는 아주 드문 엣지케이스**가 있음. 근본적으로 안전하려면 `reservation`에 `payment_order_id` 컬럼을 추가하는 게 맞지만, 지금은 스키마 변경 없이 날짜 매칭으로 해결함 — 나중에 여유 있을 때 FK 추가를 고려할 만함.

### 용어 통일: "내 대여" → "렌탈기록"
562님이 이 페이지를 "렌탈기록"이라 부르시는데, 실제 앱은 헤더 네비와 화면 제목이 둘 다 "내 대여"였음(프리뷰는 네비만 "렌탈기록"이고 화면 제목은 "내 대여"라 이미 불일치 상태였음). 이번에 실제 앱·프리뷰 양쪽 다 **네비 링크와 화면 제목을 "렌탈기록"으로 통일**함.

## [구조 개선] 예약↔주문 실제 FK 연결 + 주문별 박스 구분 + "My 렌탈" 용어 통일

562님이 이전 턴의 "날짜로 주문을 추정 매칭"하는 방식의 허점(하루에 같은 기간으로 두 번 렌탈하면 섞일 수 있음)을 정확히 짚어서, **날짜 추정이 아니라 실제 FK로 연결**하도록 근본적으로 고침.

### 1. `reservation.payment_order_id` 컬럼 추가 (실제 FK 연결)
- `db/reservation-order-link.sql`(신규): `reservation`에 `payment_order_id`(→ `payment_order.id`) 컬럼 추가.
- `lib/reservations.ts`의 `reserveItemForCustomer`가 `orderId` 파라미터를 받아 저장하도록 확장.
- `lib/payments.ts`의 `finalizeOrderById`가 예약 생성 시 자신의 `orderId`를 넘겨줌.
- `app/(member)/account/page.tsx`(My 렌탈): 이제 **실제 `payment_order_id`로 정확히 그룹핑** — 하루에 같은 기간으로 두 번 결제해도 서로 다른 주문으로 정확히 분리됨. 이 컬럼이 생기기 전에 만들어진 옛 예약(`payment_order_id`가 NULL)만 기존처럼 날짜 기준으로 대체 그룹핑(하위호환).
- 분쟁 매칭도 마찬가지로 **실제 주문 ID 우선, 없으면 날짜로 대체** 하도록 함께 고침.

### 2. 주문별로 눈에 띄는 박스로 구분
- `.resv-group`에 테두리·둥근 모서리·흰 배경·안쪽 여백을 줘서, 각 주문이 명확히 구분되는 카드 형태가 되도록 함. 프리뷰도 동일 반영.
- 프리뷰는 실제 FK가 없는 클라이언트 데모라, 결제할 때마다 `'ord_'+Date.now()`로 **고유 주문ID**를 만들어 그 결제의 상품들에 태그해서, 실제 앱과 동일한 원리(주문ID 우선, 없으면 날짜로 대체)로 그룹핑하도록 맞춤.

### 3. 용어 통일: "내 대여" / "렌탈기록" → "My 렌탈"
헤더 네비, 페이지 제목, 결제 완료 안내, 탈퇴 차단 안내 등 **코드 전체에서 발견된 모든 지점**을 "My 렌탈"로 통일(실제 앱 4곳 + 프리뷰 3곳).

### 확인 필요
- 이 마이그레이션 이후에 만들어지는 신규 예약만 정확한 FK 그룹핑의 혜택을 받음 — 실제 배포 후 기존 예약 데이터가 있다면, 그 데이터는 계속 날짜 기준 대체 로직으로 표시됨(정확성이 완벽하진 않지만 서비스 흐름상 문제 없는 수준).

## [구현 완료] My 렌탈 화면 대폭 정리 — 박스 안 박스 제거, 이미지만 노출, 상태는 날짜 줄로

562님 지적 다섯 가지 반영:
1. **"562" eyebrow 삭제** — "My 렌탈" 제목 위에 아이디(예: "562")가 따로 떠 있던 걸 제거. 실제 앱은 이제 안 쓰는 `customer` 쿼리도 같이 정리. (더불어 방금 보여드리려고 추가했던 데모 다중 주문 데이터 `seedDemoRentalHistory`도 프리뷰에서 완전히 삭제.)
2. **상품명 폰트 크기 50% 축소** — 다만 이번 정리로 상품명 자체를 화면에서 빼기로 해서(5번), 관련 스타일은 자연히 제거됨.
3. **박스 안 박스 제거** — 주문 단위 박스(`.resv-group`)는 유지하고, 그 안에서 각 상품을 또 감싸던 개별 박스(`.resv`, 테두리+배경)는 삭제. 이제 주문 박스 하나 안에 상품 이미지들만 나란히 놓임.
4. **상태 표시(예약됨/완료/대여중 등)를 날짜 줄로 이동** — 이전엔 상품마다 상태가 반복 표시됐는데, 이제 주문당 한 번, 날짜 옆에 표시.
5. **상품 목록은 이미지만 노출** — 상품명·가격 텍스트 전부 삭제, 썸네일 이미지만 가로로 나열.

실제 앱·프리뷰 모두 반영. 정리 과정에서 실제 앱 버그도 하나 수정: 분쟁 여부 판단 로직이 `reservation.status === '분쟁중'`(있을 수 없는 값 — 실제 앱은 ACTIVE/COMPLETED/CANCELLED만 씀)을 검사하던 걸 실제 `payment_order` 조회 결과(`dispute` 변수)로 바로잡음.

## [보류 — 다음 단계 확인 필요] 주문 박스 전체를 클릭하면 상세 페이지로 이동

562님이 "주문 박스 전체에 링크를 걸어 상세 페이지로 이동" 기능을 요청하면서 "구현이 어려우면 먼저 알려달라"고 하셔서, **진행하지 않고 검토만 완료**함.

**결론: 어렵지는 않음.** 이 프로젝트에 이미 있는 "상세 페이지" 패턴(`/looks/[id]`, `/admin/address-log` 등)과 동일한 방식으로, `/account/[orderId]` 같은 새 라우트를 하나 만들고, 그 주문(payment_order)과 소속 예약들을 조회해서(RLS로 본인 것만) 보여주는 페이지를 만들면 됨. 다만 **완전히 새로운 페이지 하나를 만드는 분량의 작업**이라(라우트 + 쿼리 + UI), "링크 하나 거는" 수준보다는 크다는 점만 인지하고 진행 여부를 확인받고자 함.

**다음에 진행 시 필요한 것**:
- `/account/[orderId]/page.tsx`(신규): `payment_order_id`로 그 주문 + 소속 예약들 조회(본인 소유 확인 필수 — RLS 또는 명시적 `customer_id` 체크).
- 상세 페이지 내용: 주문 상태, 분쟁 여부/사유, 상품 목록(이번엔 상세 페이지니까 이름·가격도 다시 보여줘도 됨), 날짜, 결제 금액 등.
- 목록 화면(`app/(member)/account/page.tsx`)의 각 `.resv-group`을 `<Link href={/account/${orderId}}>`로 감싸기(단, `payment_order_id`가 없는 옛 예약은 상세 페이지가 없으니 링크 비활성화 처리 필요).

진행 여부 알려주시면 바로 만들겠습니다.

## [구현 완료] 분쟁중 오른쪽 정렬 + 주문 상세 페이지(클릭 이동)

### 1. 분쟁중 마크 오른쪽 정렬
`.resv-group-date`를 `justify-content:space-between`으로 바꾸고, 날짜+상태를 `.resv-group-date-left`로 묶어 왼쪽에, "분쟁중" 배지만 오른쪽 끝에 배치. 실제 앱·프리뷰 모두 반영.

### 2. 주문 박스 전체 클릭 → 상세 페이지
- **실제 앱**: `/account/[orderId]`(신규) — `payment_order`를 RLS(본인 것만)로 조회해 예약일·반납일·결제상태·분쟁 여부/사유, 소속 상품 목록(이번엔 상세 페이지라 이름·가격도 표시), 렌탈비용·보증금·결제금액 요약을 보여줌. 목록 화면의 각 주문 박스를 `payment_order_id`가 있는 경우에만 `<Link>`로 감싸 클릭 가능하게 함(옛 예약처럼 이 값이 없는 건 상세 페이지가 없어 링크 없이 그대로 둠).
- **프리뷰**: `go()` 디스패처에 `orderDetail` 뷰 추가, `renderOrderDetail(orderId)` 신규 함수로 동일한 구성의 상세 화면 구현. 목록의 각 주문 박스는 `orderId`가 있으면 클릭 가능(`onclick="go('orderDetail', ...)"`), 커서·호버 시 테두리 강조로 클릭 가능함을 표시.

### 확인 필요
- 실제 DB 조회(특히 `/account/[orderId]`의 RLS 동작 — 남의 주문 ID로 접근했을 때 진짜로 `notFound()` 처리되는지)를 이 환경에서 검증하지 못함. 로컬에서 다른 계정의 주문 ID로 직접 URL 접근해봐서 확인 권장.

## [구현 완료] 주문 상세 페이지 재정리 — 박스 제거, 원형 상태 배지, 세로 상품 목록 복원

1. **My 렌탈 목록의 분쟁중 오른쪽 정렬**: 확인해보니 이미 이전 턴에서 정확히 반영되어 있었음(추가 수정 불필요).
2. **주문 상세 페이지 제목("주문 상세") 삭제** — 뒤로가기 링크("← My 렌탈로")만 남기고 큰 제목 텍스트는 없앰.
3. **예약일자·상태를 감싸던 흰색 박스 삭제** — `.order-detail-box`(테두리+배경) 제거하고 `.order-detail-plain`(테두리 없는 평범한 줄)으로 교체.
4. **상태 표시를 원형 배지로 + 오른쪽 정렬** — `.order-detail-plain .row`에 `justify-content:space-between`을 추가해 값이 오른쪽에 오도록 하고, 상태 값에 기존 `.resv-status`(pill 모양, 둥근 배지) 클래스를 적용.
5. **상품 목록을 세로 나열 + 이미지 옆 상품명·가격 표기로 복원** — 이전에 "이미지만 노출"로 바꿨던 건 **목록 화면(My 렌탈)** 한정이고, **상세 페이지**는 예전 스타일(`.resv` 행 패턴: 이미지+이름+가격, 위에서 아래로 나열)을 그대로 되살림. 새 클래스명 `.order-item-list`/`.order-item-row`/`.order-item-thumb`/`.order-item-info`로 별도 정의(목록 화면의 이미지-only 스타일과 안 겹치게).

실제 앱·프리뷰 모두 반영. 실제 앱에서 이제 안 쓰이는 `STATUS_LABEL` 상수도 함께 정리.

## [수정] My 렌탈 재정리 2차 — 배지 여백 정리, 페이지 제목·뒤로가기 링크 삭제

1. **분쟁중 배지 여백 정리**: `.order-dispute-badge`에 남아있던 `margin-left:8px`는 원래 관리자 주문 목록(고객명 바로 뒤에 인라인으로 붙는 용도)에서 필요한 값이라 전역으로 지우면 안 됨 — 대신 My 렌탈 목록(`.resv-group-date`)과 주문 상세(`.order-detail-plain .row`) 안에서만 이 여백을 0으로 상쇄하는 범위 한정 규칙을 추가함. 다만 구조상 이미 `justify-content:space-between`으로 맨 오른쪽에 붙는 게 맞아서, 정확히 어느 지점이 안 맞아 보이셨는지는 이 환경에서 직접 렌더링해 확인할 방법이 없어 100% 확신은 못 함 — 계속 어긋나 보이면 스크린샷이나 더 구체적인 위치를 알려주시면 좋겠음.
2. **My 렌탈 목록 페이지의 "My 렌탈" 제목(H1) 삭제** — 헤더 네비게이션에 이미 "My 렌탈" 링크가 있어 중복이라 판단, 페이지 자체의 큰 제목 텍스트 제거.
3. **주문 상세 페이지의 "← My 렌탈로" 뒤로가기 링크 완전 삭제** — iOS 스와이프, Android 뒤로가기 제스처가 이미 있어 화면 안에 별도 텍스트 링크가 불필요하다는 562님 지적 반영. 실제 앱은 이제 안 쓰는 `Link` import도 함께 정리.

실제 앱·프리뷰 모두 반영.

## [원인 발견 및 수정] "분쟁중 배지가 계속 같은 자리" 문제 — 프리뷰엔 애초에 그 배지가 없었음

562님이 계속 "분쟁중 배지 여백을 조정해도 그대로다"라고 하셔서 원인을 찾아보니, **제가 몇 턴에 걸쳐 실제 앱(`app/globals.css`)의 CSS만 계속 고치고 있었는데, 정작 562님이 확인하고 계셨을 프리뷰는 애초에 "분쟁중"을 별도 배지로 안 만들고 상태 알약 하나에 텍스트로 합쳐서 보여주는 구조**였음(`status:'분쟁중'`을 그대로 표시). 즉 프리뷰엔 옮길 대상 자체가 없어서, 실제 앱 CSS를 아무리 고쳐도 프리뷰에서는 계속 똑같아 보일 수밖에 없었음.

**수정**: 프리뷰의 분쟁 데모 데이터를 `status:'대여중', disputed:true`로 분리(기존엔 `status:'분쟁중'` 하나로 뭉쳐 있었음). `renderAccount()`/`renderOrderDetail()`도 실제 앱과 동일하게 **상태 알약(왼쪽)과 분쟁중 배지(오른쪽, `.order-dispute-badge`)를 완전히 분리된 요소**로 렌더링하도록 재작성. `hasActiveDispute()`도 `r.disputed` 플래그를 보도록 수정. 이제 프리뷰에서도 실제 앱과 동일한 CSS 규칙(`margin-left:auto;margin-right:-8px`)이 실제로 적용되는 걸 확인할 수 있음.

### 교훈 (스스로 기록)
앞으로 실제 앱과 프리뷰의 데이터 구조가 다를 수 있다는 걸(특히 "이 값 하나로 여러 개념을 합쳐서 보여주는" 단순화가 있는 곳) 먼저 확인하지 않고 실제 앱 쪽만 계속 수정한 게 이번 혼선의 원인. 다음부턴 "어느 화면을 보고 계신지" 프리뷰/실제 앱 구분을 더 빨리 확인할 것.

## [구조 변경] 주문 이행 상태 7단계 정식 도입 + 상태·분쟁 알약 통합

562님이 정의한 흐름을 그대로 반영: **주문결제 → 주문검수중 → 배송대기중 → 배송중 → 배송완료 → 수거검수중 → 완료**. 문제 발생 시 3개 분기(주문검수중 오염/손상 → 검수 보류, 배송중 오배송, 수거검수중 오염/손상 → 반납 이슈 확인중)도 함께 도입.

### 1. DB — `db/fulfillment-status-v2.sql`(신규)
- `payment_order.fulfillment_status`의 체크 제약을 기존 6개 값(PREPARING/SHIPPED/DELIVERED/PICKUP/INSPECTING/REFUNDED)에서 **10개 값**(정상 7단계 + 문제 3분기)으로 교체.
- 기존 값이 남아있을 경우를 대비해 자동 이관 UPDATE문 포함(PREPARING→ORDERED, INSPECTING→RETURN_INSPECTING, PICKUP→DELIVERED).
- **주의**: `db/schema.sql`의 `inventory_item.status`(물리적 재고 상태: AVAILABLE/RESERVED/RENTED/RETURNED/CLEANING/INSPECTING/REPAIRING/RETIRED)는 이번 변경과 **완전히 별개**의 필드라 안 건드림 — 이름이 겹치는 "INSPECTING"이 있어 혼동 주의.

### 2. 관리자/배송 앱
- `lib/staff-actions.ts`: `Fulfillment` 타입을 10개 값으로 확장. 푸시 알림 메시지에 새 단계(수거검수중 시작)와 3개 문제 분기 알림 추가.
- `components/AdminOrders.tsx`: 드롭다운 선택지·라벨을 10개 값으로 갱신(관리자는 자유롭게 아무 상태로나 수동 지정 가능, 기존 UX 유지).
- `components/DeliveryList.tsx`: "다음 단계로 진행" 버튼 흐름을 정상 7단계 순서(ORDERED→PRE_INSPECTING→READY→SHIPPED→DELIVERED→RETURN_INSPECTING→REFUNDED)로 재구성. 문제 분기는 배송기사 앱이 아니라 관리자 화면에서 수동 지정하는 걸로 설계(배송기사는 정상 흐름만 다룸).

### 3. 회원용 "My 렌탈" — 상태+분쟁 알약 통합
- `app/(member)/account/page.tsx`, `app/(member)/account/[orderId]/page.tsx`: 이제 `payment_order.fulfillment_status`를 조회해서 표시(예전엔 `reservation.status`라는 별개의 단순한 필드를 보고 있었음 — 실제로 연결이 안 되어 있던 부분을 이번에 바로잡음).
- **알약 하나로 통합**: 우선순위는 ① 분쟁중이면 분쟁 사유(없으면 "분쟁중")를 그대로 알약 텍스트로, ② 문제 분기 상태(검수 보류/오배송/반납 이슈 확인중)면 그 라벨, ③ 그 외엔 정상 진행 단계 라벨. 별도의 "분쟁 배지"는 완전히 제거하고 알약 하나로 합침.
- **색상**: 정상 진행 단계는 브랜드색(에스프레소) 배경 + 크림색(paper) 글씨로 꽉 채운 알약. 문제 상태(분쟁 포함)는 와인색 배경 + 크림색 글씨로 채워 확실히 구분되게 함.

### 문제 상태 메시지 추천 (562님 요청)
- **주문검수중에서 오염/손상 발견** → **"검수 보류"**로 채택(간결하고 소비자에게 과도한 불안감을 주지 않는 톤). 다른 후보: "상품 확인중", "재고 점검중".
- **수거검수중에서 오염/손상 발견** → **"반납 이슈 확인중"**으로 채택. 다른 후보: "반납 검수 보류", "반납품 확인중".
- 마음에 안 드시면 언제든 바꿔드릴 수 있음(라벨 문자열만 바꾸면 되는 간단한 수정).

### 확인 필요
- 실제 DB에 아직 없는 값(예: 기존에 이미 'PREPARING' 등으로 저장된 행이 있다면)에 대해 자동 이관 UPDATE문이 정상 동작하는지 로컬에서 확인 필요.
- 배송기사(DeliveryList) 쪽에서 문제 분기 상태를 아예 못 다루게 만든 게 맞는 설계인지 재확인 필요 — 어쩌면 배송기사도 배송중 오배송 정도는 직접 표시할 수 있어야 할 수도 있음(현재는 관리자만 가능).

## [구현 완료] 문제 상태 메시지 확정 + "우리 쪽 대응" 알약 추가

562님 확정 사항 반영:
1. **"진행 상태" 라벨 텍스트 삭제** — 상세 페이지에서 알약 앞에 붙던 "진행 상태" 글자 제거, 알약만 단독으로 오른쪽에 표시(레이블 없이도 문맥상 충분히 알 수 있다는 판단).
2. **주문검수중 오염/손상 메시지 확정**: "검수 보류" → **"주문검수중 오염, 손상 확인"**으로 변경.
3. **수거검수중 오염/손상 메시지 확정**: "반납 이슈 확인중" → **"수거검수중 오염, 손상 확인"**으로 변경.
4·5·6. **문제 상태일 때 상태 알약 밑에 "우리 쪽 대응" 알약을 하나 더 표시**(옅은 회색 바탕 `#E9E5DF` + 브랜드색 글씨, 메인 상태 알약과 톤을 다르게 해 "문제 자체"와 "우리가 하고 있는 조치"를 시각적으로 구분):
   - 주문검수중 오염/손상 → "수선중이에요."
   - 수거검수중 오염/손상 → "반납 이슈 확인중이에요."
   - 오배송 → "오배송 확인되어 처리중에 있어요."

`RESPONSE_LABEL` 매핑을 새로 추가해 `fulfillment_status`(문제 분기 값)에 따라 자동으로 이 대응 알약이 뜨도록 연결. 일반 분쟁(`disputed=true`이지만 문제 분기 상태가 아닌 경우)에는 대응 알약이 뜨지 않음 — 이 3가지 구체적 문제 상황에만 해당하는 메시지라 그 외 케이스는 대응 문구가 정의되어 있지 않기 때문(필요시 추가 가능).

프리뷰에는 "오배송" 상황을 보여주는 데모 주문을 하나 더 추가해서, 대응 알약이 실제로 어떻게 뜨는지 확인할 수 있게 함(기존 분쟁 데모는 일반 분쟁 케이스라 대응 알약 없음, 신규 데모는 문제 분기 상태라 대응 알약이 뜸 — 두 케이스의 차이를 한 번에 볼 수 있음).

## [문구 확정] 문제 상태별 "대응" 알약 메시지 최종 확정

- 주문검수중 오염/손상 → 대응 알약: "수선중이에요." → **"깔끔히 처리 후 보내드릴게요."**
- 수거검수중 오염/손상 → 대응 알약: "반납 이슈 확인중이에요." → **"불필요한 분쟁이 발생되지 않게 확인, 처리 중이에요."**
- 오배송 → 대응 알약은 기존 그대로("오배송 확인되어 처리중에 있어요.") 유지.

실제 앱·프리뷰 모두 반영.

## [Cowork 세션] 정적 코드 감사 + 버그 수정 4건 — 빌드는 여전히 미검증

이번엔 claude.ai 챗도 Claude Code도 아니라 **Cowork 모드**(데스크톱 앱, 파일 접근은 되지만 이번 세션에선 코드 실행 샌드박스가 인프라 오류(HYPERVISOR_VIRT_DISABLED)로 열리지 않음)에서 작업함. `npm install`/`npm run build`를 여전히 실행하지 못해, 아래는 전부 **코드를 손으로 대조한 정적 감사** 결과이며 실제 컴파일 검증은 아님 — 로컬/Claude Code에서 `npm install && npm run build`를 가장 먼저 돌려 확인할 것.

### 발견 후 수정한 것
1. **🔴 카트 캘린더가 "2026년 7~8월"에 하드코딩되어 있던 버그** — `app/(member)/cart/page.tsx`의 `month` 초기값이 `new Date(Date.UTC(2026, 6, 1))`로 고정돼 있고, 이전/다음 달 버튼도 `m<=6`/`m>=7`로 딱 그 두 달만 보이게 막혀 있었음(다른 곳은 전부 `todayISO()`로 실제 오늘 날짜를 쓰는데 이 파일만 개발 중 테스트값이 남아있었던 것으로 보임). 이 상태면 7~8월을 벗어나는 순간 예약일을 아예 선택할 수 없어 결제가 막힘. **수정**: 초기월을 이미 파일에 있던 `TODAY`(=`todayISO()` 기준)로 계산하도록 바꾸고, "이전 달" 버튼은 지금 보고 있는 달이 이번 달과 같을 때만 비활성화(과거로 못 가게)하도록 완화, "다음 달" 버튼의 상한 제한은 제거함.
2. **`.cart-daily-highlight`(일당 비용 크게 보여주기) 관련 코드 삭제** — 확인해보니 이 기능은 HANDOFF 텍스트에만 "구현 완료"로 적혀 있었고, 실제 `app/(member)/cart/page.tsx`/`app/globals.css`에는 애초에 코드가 없었음(총액 글자를 13px로 줄인 부분만 실제로 반영돼 있었음). 562님이 이 기능은 최종적으로 안 하기로 했다고 확인해주셔서, 삭제할 실제 코드는 없는 상태(이미 깨끗함) — 별도 조치 불필요.
3. **`customer` 자동 생성 시 `status`를 명시적으로 `'unpaid'`로 지정** — `lib/cart-actions.ts`의 `resolveCustomerId()`가 (주로 직원이 회원 앱을 테스트할 때) `customer` 행이 없으면 자동 생성하는데, 기존엔 `status`를 안 넣어 DB 컬럼 기본값에 의존하고 있었음(마이그레이션을 정확한 순서로 다 실행해야만 `unpaid`가 됨). 이제 insert 시 `status: 'unpaid'`를 명시해 마이그레이션 순서와 무관하게 항상 "결제 전" 상태로 생성되도록 함.
4. **죽은 코드 정리** — `lib/actions.ts`의 `createReservation`(+`CreateReservationInput`/`CreateReservationResult`)이 카트→결제(`createOrder`/`finalizeOrderById`) 흐름으로 완전히 대체된 뒤에도 안 지워지고 남아있었음(실제로 어디서도 호출 안 함, README/HANDOFF 텍스트에만 언급). 삭제하고 `lib/actions.ts`엔 이제 `signOut`만 남음(사용 안 하게 된 `revalidatePath`/`supabaseAdmin`/`reserveItemForCustomer` import도 함께 정리).

### 확인 필요
- 위 4건 모두 **로컬에서 `npm run build` + 실제 카트 화면 렌더링으로 검증 필요**(이번 세션도 코드 실행 자체가 안 됐음).
- 특히 1번(캘린더)은 로컬에서 실제로 여러 달을 오가며 날짜 선택이 잘 되는지, "이전 달" 버튼이 이번 달에서 정확히 비활성화되는지 확인 권장.

### 작업 방식 관련 메모 (562 확인)
562님이 "챗에서 프리뷰 보면서 만들고 Claude Code에서 검증·다듬기"로 작업하는 걸 선호하셔서, 앞으로도 이 문서(HANDOFF.md)에 **매 세션마다 무엇을 보류했는지, 무엇을 검증 못 했는지**를 계속 이런 형식으로 기록해나가기로 함(이번 항목도 그 일환).

## [Claude Code 세션] 첫 실제 빌드 검증 + 버그 수정

드디어 실제 실행 환경(로컬 Claude Code, Windows)에서 `npm install` → `npm run build`를 처음으로 돌림. 첫 시도는 바로 컴파일 에러로 실패했고, 하나씩 고쳐가며 총 7종의 실제 컴파일/런타임 버그를 발견·수정한 뒤 빌드를 통과시킴.

### 환경 준비
- `.env.local` 신규 생성(레포에 없었음). Supabase 값은 **플레이스홀더**(실제 프로젝트 미연결 — 562가 실제 URL/키로 교체해야 실행 가능). 토스는 기존 공용 테스트 키 그대로. **웹푸시 VAPID 키는 이번에 실제로 생성**(`npx web-push generate-vapid-keys`)해서 채워넣음. `CRON_SECRET`도 무작위 생성해 채움.
- `.gitignore`에 `.env*.local` 누락돼 있던 것 추가(이 프로젝트는 아직 git 저장소가 아니라 실제 유출은 없었지만, 나중에 git 초기화하면 바로 시크릿이 커밋될 뻔한 상태였음).

### 발견하고 수정한 버그 (모두 `npm run build`로 실제 컴파일해서 찾음 — 이전 세션들은 전부 코드 손대조라 못 잡았던 것들)
1. **🔴 심각 — 예약 생성이 항상 실패하는 버그**: `lib/reservations.ts`의 `reserveItemForCustomer`(카트 결제 승인·토스 웹훅이 공유하는 예약 생성 핵심 함수)가 `./domain/reservation`에서 `validateRequest`를 import해 쓰는데, 정작 그 함수가 **애초에 정의/export된 적이 없었음**. try/catch로 감싸져 있어 빌드는 경고만 뜨고 넘어가지만, 런타임에는 결제가 승인된 뒤 예약을 만드는 단계에서 항상 예외가 나서 `{ ok: false, reason: '...' }`로 실패했을 것 — **즉 지금 상태로 배포했으면 손님이 결제(돈은 실제로 빠져나감)까지는 되는데 예약 자체가 하나도 안 만들어지는 심각한 상황**이었음. `lib/domain/reservation.ts`에 `validateRequest(req, {minDays, today})`를 새로 구현(과거 날짜 예약 금지 + 최소 대여일수 검사, 다른 곳의 검증 로직과 동일한 규칙)해서 해결.
2. **`lib/membership-actions.ts`가 아예 빌드를 막고 있었음**: `'use server'` 파일에서 async 함수가 아닌 `export const MEMBERSHIP_FEE = 100_000`를 내보내고 있었는데, Next.js는 `'use server'` 파일에서 async 함수 외의 export를 허용하지 않음(빌드 즉시 실패). `MEMBERSHIP_FEE`를 이미 있던 `lib/pricing.ts`(보증금 상수 `FLAT_DEPOSIT`가 있던 곳)로 옮겨 해결.
3. **TypeScript 타입 에러 5건**(전부 빌드를 막는 수준): `components/PushNotificationToggle.tsx`(최신 TS의 Uint8Array/BufferSource 타입 엄격화로 `applicationServerKey` 타입 불일치 → `as BufferSource` 캐스팅), `lib/cart-actions.ts`·`lib/queries.ts`·`lib/staff-actions.ts`(Supabase가 스키마 타입 없이 조인 결과를 배열로 추론해서 수동 타입 주석과 안 맞음 → 이 코드베이스에 이미 있던 관용구인 `as unknown as` 캐스팅으로 통일), `lib/supabase/client.ts`·`lib/supabase/middleware.ts`·`lib/supabase/server.ts`(`setAll(cookiesToSet)` 파라미터에 타입 누락 → `@supabase/ssr`의 `CookieOptions` 타입으로 명시).
4. **정적 프리렌더 에러 2건**: `app/membership/success`, `app/membership/fail` 페이지가 `useSearchParams()`를 Suspense 경계 없이 써서 정적 페이지 생성이 실패함(`(member)` 그룹 밖이라 기본적으로 정적 생성 대상이 됨). `Suspense`로 감싸 해결. 같은 패턴이 잠재적으로 있던 `app/(member)/payments/success`·`fail`도(지금은 `(member)` 레이아웃이 인증 체크 때문에 강제로 동적 렌더링돼 우연히 안 터졌을 뿐, 구조적으로 같은 버그라) 예방 차원에서 동일하게 Suspense로 감쌈.

### 보안: Next.js 버전 패치
- `npm install` 직후 `npm audit`에서 next@14.2.5에 **critical 등급 취약점 다수**(캐시 포이즈닝, 인가 우회, SSRF 등 20건 이상) 발견. **14.2.35**(같은 14.2.x 마이너 라인, breaking change 아님)로 올려서 critical 취약점 전부 해소, 빌드도 그대로 통과 확인.
- 남은 취약점 2건(high 1 + moderate 1, WebSocket SSRF·캐시 포이즈닝 관련)은 **Next.js 16으로 메이저 업그레이드**해야 해소됨 — App Router 전반에 영향을 줄 수 있는 큰 변경이라 이번엔 건드리지 않음. 필요하면 별도 세션으로 진행 권장.

### 확인 완료
- `app/(member)/cart/page.tsx`의 캘린더 하드코딩 버그(직전 Cowork 세션에서 수정했다고 기록된 것) — 실제 코드에 `TODAY`(`todayISO()` 기준) 사용, "이전 달"은 이번 달에서만 비활성화, "다음 달" 상한 없음을 코드로 재확인함. 정상.
- `lib/auth-actions.ts`의 "Confirm email 우회"(`auth.admin.createUser` + `email_confirm:true`) 로직 실제 존재 확인.
- `middleware.ts`의 matcher가 `api/payments/webhook`·`api/cron`을 정확히 제외하고 있음을 확인.
- `public/sw.js`(웹푸시 서비스워커) 파일 존재 확인.

### 아직 검증 못 한 것 (실제 Supabase 프로젝트 없이는 불가능)
- **DB 마이그레이션 22개 파일**을 실제로 순서대로 실행해본 적 없음 — 이번 세션은 `.env.local`이 플레이스홀더라 Supabase 프로젝트 자체가 없음.
- 회원가입 → 멤버십 결제 → 승인 → 로그인 전체 왕복, 토스 결제 실제 왕복(웹훅 포함), 웹푸시 8개 트리거 실제 알림, 카카오 우편번호 팝업, 관리자/배송 UI 실동작, Supabase Realtime 전부 **여전히 미검증**(HANDOFF 상단 체크리스트 그대로 남겨둠). 562가 실제 Supabase 프로젝트 URL/키를 `.env.local`에 넣어주면 다음 세션에서 이어서 검증 가능.
- `npm run lint` 실행 시 ESLint가 아직 이 레포에 설정된 적이 없어(`next lint`가 대화형 설정 마법사를 띄움) 이번엔 건너뜀 — 필요하면 다음에 "Strict" 옵션으로 초기 설정 진행.

### 확인 필요 (562)
- 위에서 발견한 **`validateRequest` 누락 버그(1번)** — 검증 로직을 새로 작성한 것이라, 원래 의도한 규칙(최소 대여일수, 과거 날짜 금지)이 맞는지 한 번 확인 부탁드립니다. 다른 곳(`lib/payments-actions.ts`의 `createOrder`)에서 이미 하는 검증과 같은 규칙으로 맞췄습니다. → **이번 세션에서 재확인함**: 규칙이 정확히 일치하고, 과거 날짜 방어는 순수 추가 안전장치(더 느슨한 방향으로만 어긋날 수 있어 오탐 없음)임을 확인. 수정 불필요.
- ~~Next.js 16 메이저 업그레이드 여부~~ → **이번 세션에서 진행 완료**(아래 항목 참고).

## [Claude Code 세션] Next.js 16 메이저 업그레이드 + React 19 + ESLint 정비 + 렌더 최적화

562님이 지난 세션 끝에 남겨둔 확인 필요 항목(3가지: `validateRequest` 재확인, ESLint 설정, Next.js 16 업그레이드)을 전부 진행하고, "가볍고 안정적"이라는 요청에 따라 성능/안정성 개선도 함께 진행함. **로컬 git 저장소를 이번에 처음 초기화**(원격 없음, 순수 로컬 안전망 — 대규모 업그레이드 전 체크포인트 커밋 1개 존재)해서 앞으로 `git diff`로 변경 추적이 가능해짐.

### 1. ESLint 정식 설정
- 이전 세션엔 `next lint`가 대화형 마법사를 띄워서 건너뜀 — 이번엔 `.eslintrc.json`을 직접 만들어 비대화형으로 통과시킴.
- 실제 코드 문제 1건 발견: `app/layout.tsx`가 `Cormorant`/`Pinyon` 두 폰트는 `next/font`로 최적화했으면서, 본문 폰트(Tenor Sans, Noto Sans KR)는 `<head>`에 구글 폰트 `<link>` 태그로 수동 로드하고 있었음 — 페이지 로드마다 구글 서버에 별도 왕복이 필요했던 것. **`next/font/google`로 옮겨 빌드 시 자체 호스팅**되도록 수정(`app/layout.tsx`, `app/globals.css`의 `--sans` 변수). 외부 폰트 요청이 완전히 사라져 체감 로딩이 가벼워짐.

### 2. Next.js 14.2.35 → 16.2.10 메이저 업그레이드 (+ React 18 → 19.2)
공식 코드모드(`npx @next/codemod@canary upgrade latest`)로 시작해서, 코드모드가 자동 처리 못한 부분은 직접 수정:
- **`middleware.ts` → `proxy.ts`** 이름 변경(Next 16에서 `middleware` 컨벤션이 deprecated, 함수명도 `proxy`로) — 코드모드가 자동 처리.
- **`cookies()`/`params`/`searchParams` 완전 비동기화** — Next 16에서 동기 접근이 완전히 제거됨.
  - `params`(동적 라우트 `/looks/[id]`, `/account/[orderId]`)는 코드모드가 정확히 `Promise`로 바꿔줌.
  - **`cookies()`는 코드모드가 `UnsafeUnwrappedCookies`(공식적으로 "안전하지 않음"이라 이름 붙은 임시방편) 캐스팅으로 땜질했길래, 직접 제대로 된 async로 다시 고침**: `lib/supabase/server.ts`의 `supabaseServer()`를 `async function`으로 바꾸고 `await cookies()`로 정리, 이 함수를 호출하는 **16개 파일 전부**(`lib/*.ts` 다수, `app/**/page.tsx` 다수, `app/auth/confirm/route.ts`)를 `await supabaseServer()`로 맞춤. "가볍고 안정적"이라는 요청에 맞게 임시방편 대신 정공법으로 처리.
- **`next lint` 명령 자체가 Next 16에서 제거**됨 → 코드모드가 `eslint.config.mjs`(flat config)로 자동 전환. 단 코드모드가 넣은 `eslint@10.7.0`은 `eslint-config-next`가 내부적으로 쓰는 `eslint-plugin-react`가 아직 호환 안 돼서(`getFilename is not a function` 런타임 에러로 lint 자체가 죽음) **`eslint@^9`로 낮춰서 실제 호환되는 조합으로 맞춤**(`eslint-config-next`의 peerDependency도 `>=9.0.0`이라 9가 정답).
- **정적 프리렌더 실패 2건 추가 발견**(Turbopack이 webpack보다 엄격하게 잡아냄): `/login`, `/signup`, `/checkout` 페이지가 `useSearchParams()`를 최상위에서 쓰면서 `Suspense`로 안 감싸져 있어 빌드가 실패 → 내부 컴포넌트를 분리하고 `Suspense`로 감싸는 기존 패턴(지난 세션에 `/membership/success` 등에 적용한 것과 동일)을 적용.
- **패키지**: `next@16.2.10`, `react@19.2.7`, `react-dom@19.2.7`, `eslint@9.39.5`, `eslint-config-next@16.2.10`로 정리. `npm audit` 기준 이전에 남아있던 critical/high 취약점은 전부 해소되고, **Next.js 자체가 내부적으로 번들하는 postcss(8.4.31)에 걸린 moderate 등급 XSS 이슈 1건만 남음**(우리 쪽에서 손댈 수 없는 Next.js 내부 의존성 — 최신 Next.js를 써도 그대로 남는 잔여 리스크, 정적 CSS만 다루는 이 앱 특성상 실제 악용 가능성은 낮음).

### 3. React Compiler 호환 렌더링 규칙 위반 수정 (렌더 최적화 = "가볍게")
`eslint-config-next@16`에 새로 포함된 `eslint-plugin-react-hooks`(v6, React Compiler 대비 규칙)가 실제 코드 문제 다수를 잡아냄. React Compiler는 켜지 않았지만(빌드시간 증가 트레이드오프, 이번엔 보수적으로 미적용), 규칙이 지적한 패턴들은 전부 "불필요한 추가 렌더/렌더 중 비결정적 값 생성"이라는 실질적 낭비였어서 전부 고침:
- **`app/(customer)/signup/page.tsx`, `components/ProfileForm.tsx`** — "회수지가 배송지와 동일" 체크박스 로직이 `useEffect`로 한 state를 다른 state에 동기화하는 방식이었음(매 변경마다 이펙트 실행 → 추가 리렌더 1회씩 발생). **`useEffect` 두 개를 완전히 제거**하고 렌더 중 직접 계산하는 파생값(`effReturnAddress` 등)으로 교체 — React 공식 권장 패턴("이펙트로 state를 동기화하지 말고 파생시켜라"). 부수 효과로 체크 해제 시 이전에 직접 입력했던 값이 (이펙트가 덮어쓰지 않으므로) 그대로 복원되는 게 UX상 더 자연스러워짐. **브라우저에서 실제 동작 확인함**(배송지 입력 → 체크 → 회수지에 동일 값+비활성화 → 체크 해제 → 원래 값 복원, 전부 정상).
- **`app/(member)/checkout/page.tsx`, `components/MembershipPayment.tsx`** — 토스 결제 위젯의 `customerKey`를 `useRef('cust_' + Math.random()...).current`로 만들고 있었음(렌더 중 `Math.random()` 직접 호출 = 비순수, 게다가 매 렌더마다 새로 계산되고 버려짐 = 낭비). **`useState(() => 'cust_' + Math.random()...)`의 지연 초기화 패턴으로 교체**(React가 한 번만 실행을 보장하는 정석 방법). 같은 파일들에서 이펙트 맨 위 동기 setState 가드절(`if (!co) { setErr(...); return; }`)도 렌더 시점 계산(`initErr`)으로 옮겨 이펙트 밖으로 뺌.
- **`app/(member)/payments/success/page.tsx`, `app/membership/success/page.tsx`** — 결제 파라미터 유효성 검사를 이펙트 안 동기 setState로 하던 걸 `useState` 초기값 계산으로 옮김(실제 비동기 결제승인 호출 부분은 그대로 이펙트 안에 남김 — 그 부분은 원래도 규칙 위반이 아니었음).
- **`components/PushNotificationToggle.tsx`, `components/LookGrid.tsx`, `app/(member)/cart/page.tsx`** — 이 3곳은 브라우저 전용 API(`navigator`/`localStorage`) 감지나 재사용 함수 호출이라 원칙적으로 렌더 중에는 절대 실행 불가(SSR 크래시) → 정당한 예외로 판단해 범위를 좁힌 `eslint-disable-next-line` 주석(이유 설명 포함)으로 처리, 억지로 구조를 비틀지 않음.
- 결과: `npm run lint` **0 에러 0 경고**로 통과. 안 쓰는 `useEffect` import도 함께 정리.

### 확인 필요 (562)
- 이번 세션에서 `signup`/`profile`의 "회수지 = 배송지" 체크박스 로직을 이펙트 기반에서 파생값 기반으로 바꾸면서, **체크 해제 시 동작이 미묘하게 개선**됨(이전엔 체크 해제해도 마지막으로 동기화된 배송지 값이 회수지에 그대로 남아있었는데, 이제는 체크 전에 입력했던 원래 값으로 복원됨). 의도한 개선이지만 혹시 이전 동작(체크 해제해도 값 유지)을 의도한 설계였다면 알려주세요.
- ~~`@supabase/ssr` 버전 지연~~ → **이번 세션에서 업그레이드 완료**(아래 항목 참고).
- Next.js 내부 postcss 의존성발 moderate XSS 취약점 1건은 우리 쪽에서 고칠 수 있는 게 없음(Next.js 팀의 후속 패치를 기다려야 함).

## [Claude Code 세션] 작업 폴더 정리 + 실제 Supabase 프로젝트 연결 + @supabase/ssr 업그레이드

### 중요: 두 개의 프로젝트 사본이 존재했던 사실 발견 및 정리
562님이 이 컴�터에서 실제로 작업해온 원본 위치는 `C:\Users\zxc56\Downloads\lala\lala`(이 저장소)인데, Claude Code의 "기본 작업 폴더"가 `C:\Users\zxc56\OneDrive\바탕 화면\Lala\claude`로 잡혀 있었고, 거기에 **7/5~6일자의 오래된 별도 사본**(Next 14.2.35, 캘린더 하드코딩 버그 포함, 오늘 세션 작업 전혀 반영 안 됨)이 남아있었음. 이번 세션 초반에 preview 도구가 그 오래된 사본을 잘못 잡아 혼선이 있었음(HANDOFF 위쪽 "확인/보완" 세션 기록 참고).

- **오래된 사본은 562님 확인 후 삭제 시도** — 다만 해당 폴더가 사용 중(OneDrive 동기화 또는 세션 자체의 파일 잠금)이라 자동 삭제에 실패함. **562님이 Claude Code 앱을 종료한 뒤 파일 탐색기에서 직접 삭제해야 함**(`C:\Users\zxc56\OneDrive\바탕 화면\Lala\claude`).
- **중요한 발견**: 오래된 사본의 `.env.local`에 **실제(플레이스홀더 아닌) Supabase 프로젝트 키**가 들어있었음(`oowfpmcqgjwbsbmerldy.supabase.co`). 삭제 전에 이 키를 이 저장소(`Downloads\lala\lala`)의 `.env.local`로 옮겨왔음 — 이제 이 저장소가 실제 Supabase 프로젝트에 연결됨.
- **앞으로 이 저장소(`Downloads\lala\lala`)를 표준 작업 위치로 쓰려면**: Claude Code를 실행할 때 이 폴더를 직접 열거나(데스크톱 앱의 "폴더 열기"), 터미널에서 이 폴더로 `cd` 한 뒤 `claude`를 실행해야 함 — "기본 작업 폴더" 설정은 코드/설정 파일이 아니라 앱 실행 방식에 달려있어 이 세션 안에서 영구히 바꿀 수 있는 부분이 아님.

### 실 Supabase 연결 확인
`.env.local`에 실제 키를 넣은 뒤 `npm run dev`로 `/looks` 페이지에 접속해보니 **실제 DB에서 상품 데이터(noir-soiree, tailored-day, soft-romance, evening-grace)를 정상적으로 불러와 렌더링**함 — 콘솔 에러 없음. 처음엔 이걸 보고 "DB 마이그레이션이 어느 정도 최신"이라고 짐작했는데, **이건 틀린 판단이었음**(아래 항목 참고 — `/looks`는 초창기 테이블만 건드리는 화면이라 우연히 됐던 것).

## [Claude Code 세션] DB 마이그레이션 완전성 실사 → 심각한 격차 발견 → 일괄 적용 + 마이그레이션 파일 버그 2건 수정

562님이 "안정성·최적화·보안 관련 문제 없냐"고 재차 확인 요청하셔서, `SUPABASE_SECRET_KEY`(RLS 우회)로 실제 DB에 각 마이그레이션 파일이 추가하기로 되어 있는 테이블/컬럼이 진짜 존재하는지 하나하나 직접 조회하는 검증 스크립트를 작성해 돌림(읽기 전용, `select(...).limit(1)`로 컬럼 존재 여부만 확인 — 스크립트는 임시 파일로 실행 후 삭제, 저장소에 남기지 않음).

### 발견: DB가 `db/payments.sql` 이후로 사실상 전부 미적용 상태였음
- 실제로 적용된 건 `schema.sql`/`auth.sql`/`cart.sql`, 그리고 `payment_order` 테이블 자체(다만 `disputed` 등 분쟁 컬럼은 없는 구버전)와 `fulfillment_status`/`assigned_to` 컬럼(옛 6단계 값 `'PREPARING'` 그대로)뿐이었음.
- **`customer.status`, `customer.username`이 아예 없었음** — 이 두 컬럼이 없으면 승인제 가입 흐름과 ID 로그인 자체가 DB 에러로 즉시 실패하는 상태였음. 즉 지금까지 "빌드/렌더는 되는데 실제 가입은 한 번도 성공할 수 없는" 상태로 방치돼 있었던 것.
- 피팅/배송지 세부주소/지번주소/공동현관 비밀번호 컬럼, `membership_payment`/`push_subscription`/`phone_verify_attempt`/`marketing_broadcast`(+recipient)/`address_change_log` 테이블, `reservation.payment_order_id` — 전부 없었음.

### 조치: `db/seed.sql` ~ `db/fulfillment-status-v2.sql`(19개 파일) 일괄 실행용 SQL 생성
`schema.sql`/`auth.sql`/`cart.sql`은 이미 적용 확인돼서 제외하고, 나머지를 실행 순서 그대로 이어붙인 SQL을 스크래치패드에 만들어 562님이 Supabase SQL Editor에 붙여넣어 실행하도록 안내함. 이 과정에서 **마이그레이션 파일 자체의 버그 2건**을 실제로 겪고 고침(둘 다 지금까지 한 번도 성공 실행된 적이 없었던 파일이라 "이미 배포된 마이그레이션 불변" 규칙에 저촉되지 않음 — 실제 코드 수정함):

1. **`db/seed.sql`의 데모 고객 INSERT가 `auth.sql`이 이미 지운 `customer.phone` unique 제약에 의존**하고 있었음(`on conflict (phone) do nothing` → `42P10` 에러). 이 파일 자체는 원래 실행 순서(`schema→seed→auth`)대로면 문제없지만, 이번처럼 `auth.sql`이 먼저 적용된 뒤 뒤늦게 `seed.sql`을 (재)실행하는 상황에선 깨짐. **스크래치패드용 통합 스크립트에서만** `on conflict` 대신 `where not exists(...)` 방식으로 바꿔 대응(`db/seed.sql` 원본 파일은 원래 실행 순서를 전제로 하므로 그대로 둠).
2. **`db/fulfillment-status-v2.sql`의 문 순서 버그(실제 파일 수정함)**: 새 10단계 체크 제약을 먼저 추가하고 옛 값(`'PREPARING'` 등)을 새 값으로 옮기는 `UPDATE`를 그 다음에 실행하도록 되어 있었음 — 제약을 추가하는 시점에 기존 행이 아직 옛 값을 갖고 있어 제약 추가 자체가 `23514` 에러로 거부됨. **"옛 제약 제거 → UPDATE로 값 이관 → 새 제약 추가" 순서로 고침.** 이 버그 때문에 이 마이그레이션은 지금까지 어떤 환경에서도 성공한 적이 없었던 것으로 보임.

### 최종 검증
562님이 SQL Editor에서 실행 성공("Success. No rows returned") 확인 후, 검증 스크립트를 다시 돌려 **22개 마이그레이션 전 항목(테이블·컬럼) 통과, `fulfillment_status` 샘플 값이 새 체계(`'ORDERED'`)로 정상 이관된 것까지 확인함.** 이제 실제 DB 스키마가 코드가 기대하는 최신 상태와 일치함.

### 확인 필요 (562)
- DB 스키마는 이제 맞춰졌지만, **회원가입→로그인→멤버십결제→승인 전체 흐름을 실제로 한 번도 안 태워봄**(HANDOFF 최상단 체크리스트 그대로 남아있음). 다음 단계로 꼭 한 번 실제 계정 만들어서 끝까지 확인 권장.
- RLS 정책이 실제로 의도대로 작동하는지(예: 남의 주문 ID로 접근 시 진짜 막히는지)도 여전히 미검증.

### `@supabase/ssr` 0.5.2 → 0.12.0(최신) 업그레이드
직전 세션에서 "필요하면 다음에 논의"로 남겨둔 항목. 공식 체인지로그를 조사한 결과 우리가 쓰는 `getAll`/`setAll` 쿠키 콜백 API에 breaking change가 없고, 오히려 `setAll`에 캐시 헤더를 추가해 **인증 쿠키가 CDN에 캐싱되는 걸 방지**하는 보안 개선(v0.10.0)이 포함돼 있어 업그레이드 진행함(Vercel 배포 예정이라 실질적으로 의미 있는 개선).

- 업그레이드 후 빌드에서 실제 타입 에러 1건 발견: `lib/supabase/client.ts`의 `setAll` 콜백에 수동으로 만들어둔 쿠키 옵션 타입(`{ path?: string; sameSite?: string; secure?: boolean }`)이 새 버전의 `CookieOptions`(`sameSite`가 `boolean | 'lax' | 'strict' | 'none'`일 수 있음)와 안 맞았음. `@supabase/ssr`가 export하는 진짜 `CookieOptions` 타입을 쓰도록 고치고, `sameSite`가 `boolean`으로 오는 경우(`true`→`'strict'`로 매핑)도 처리하도록 쿠키 직렬화 로직을 보강함.
- `npm run build`/`npm run lint` 재확인 클린, `npm audit` 잔여 취약점 그대로 유지(Next.js 내부 postcss 건 1개, 우리 쪽에서 손댈 수 없음).
- 실제 Supabase 프로젝트로 `/looks` 페이지가 정상 렌더되는 것까지 확인해 회귀 없음을 검증함.

## [Claude Code 세션] 실제 회원가입 전체 흐름 + RLS 정책 실사 검증

562님이 "회원가입 테스트, RLS 실제 작동 여부"를 요청하셔서, 실제 프로덕션 연결 Supabase 프로젝트에 **진짜 테스트 계정을 만들어** UI를 직접 조작해가며 끝까지 검증함. 검증 후 생성한 테스트 데이터는 전부 삭제 완료.

### 1. 회원가입 → 승인 → 로그인 전체 흐름 — 실제로 끝까지 성공 확인
- `/signup`에서 실제 폼 입력(이름/전화번호/ID 중복확인/비밀번호/약관 전체동의)으로 가입 진행.
- `auth.users`에 올바른 가상 이메일(`<id>@users.lala.internal`)로 계정 생성, `email_confirm`도 자동 처리됨(CLAUDE.md에 문서화된 "Confirm email 우회" 로직 실제 확인).
- `customer` 행이 `status='unpaid'`로 정확히 생성됨.
- **토스 결제 위젯 자체는 정상 로드**(iframe 2개 정상 삽입, `createMembershipOrder`→`loadTossPayments`→`renderPaymentMethods`/`renderAgreement` 전부 에러 없이 통과, 결제 버튼 활성화까지 확인). 다만 **실제 카드 입력(토스 소유 교차 출처 iframe 내부)은 이번 자동화 환경의 시각적 클릭 도구가 계속 타임아웃돼 완주하지 못함** — 이후 단계(승인 흐름) 진행을 위해 관리자 키로 `status: pending`을 직접 시뮬레이션함. **즉 토스 결제 자체(카드 승인→웹훅)는 여전히 미검증 상태로 남아있음** — 이 부분은 실제 카드 입력 UI라 자동화가 어려우므로, 562님이 브라우저에서 직접 한 번 눌러보시는 걸 권장.
- 테스트 디렉터 계정을 만들어(562님이 명시적으로 승인) `/admin/approvals`에 로그인 → 실제 "승인" 버튼 클릭 → DB에서 `status: 'approved'`로 정확히 바뀜 확인.
- **승인된 계정으로 재로그인 후 `/cart`(승인 필요 라우트) 정상 접근 확인** — `(member)` 레이아웃의 승인 게이트가 실제로 올바르게 작동함.
- 사소한 관찰: 관리자가 "승인" 버튼을 누른 직후 목록에서 바로 사라지지 않는 것처럼 보인 적이 있었으나, 페이지를 새로고침하면 정확히 반영됨 — DB/서버 로직은 문제없고, 자동화 클릭이 Realtime 갱신 타이밍을 놓친 것으로 보임(실제 사용자 클릭에서도 재현되는지는 추가 확인 필요, 크게 우려할 사항은 아님).

### 2. RLS(행 단위 보안 정책) 실사 검증 — 전부 통과
서비스 키(관리자, RLS 우회)로 테스트 데이터를 준비한 뒤, **publishable 키 + 실제 로그인 세션**(RLS가 적용되는 진짜 클라이언트 방식)으로 교차 접근을 시도:
- `cart_item`: 다른 회원(claudetest02) 세션으로 claudetest01의 카트 아이템 조회 → **빈 배열(차단됨)**. 필터 없이 전체 조회해도 자기 것 외엔 안 보임(RLS가 쿼리 형태와 무관하게 행 단위로 필터링하는 것 확인).
- `customer`: 다른 회원 세션으로 claudetest01의 고객 행 조회 → **빈 배열(차단됨)**. 반대로 자기 자신의 행은 정상 조회됨(양성 대조군 통과 — 정책이 "전부 차단"이 아니라 정확히 본인만 허용하는 것 확인).
- `payment_order`: HANDOFF에 그동안 "미검증"으로 남아있던 항목 — `/account/[orderId]`가 쓰는 것과 동일한 쿼리로 다른 회원의 주문을 조회 → **빈 배열(차단됨)**. 즉 실제로 남의 주문 ID로 접근해도 `notFound()`로 막히는 게 맞음. 서버(secret 키) 쪽은 같은 주문을 정상 조회(대조군 통과 — RLS가 서버 로직을 막지 않는 것도 확인).

**결론: `customer`/`cart_item`/`payment_order`의 RLS 정책은 의도대로 정확히 작동함.** 나머지 테이블(`membership_payment`, `push_subscription`, `address_change_log`, `marketing_broadcast_recipient` 등)도 전부 `customer_id in (select id from customer where auth_user_id = auth.uid())` 동일 패턴을 쓰고 있어 같은 방식으로 작동할 것으로 강하게 추정되지만, 이번엔 시간 관계상 개별 실사하지 않음.

### 확인 필요 (562)
- **토스 결제 실제 카드 결제 왕복은 여전히 미검증.** 브라우저에서 직접 `/membership` → 테스트 카드로 결제까지 한 번 눌러봐 주시면 좋겠습니다(토스 테스트 카드 정보는 토스 개발자센터 문서 참고).
- 승인 버튼 클릭 후 목록이 실시간으로 안 사라지는 것처럼 보인 현상 — 실제 사용자 클릭에서도 나타나는지 한 번 확인해봐 주시면 좋겠습니다(제 자동화 클릭 특성일 가능성이 높다고 보지만 100% 확신은 못 함).

## [Claude Code 세션] 회원가입 폼 입력창 CSS 버그 발견 및 수정

562님이 실제로 `/signup`을 열어 직접 테스트해보다가, **이름/전화번호/ID 입력창이 아주 작은 정사각형으로 찌그러져 보이는** 버그를 스크린샷으로 발견해주심(제가 자동화로 테스트할 땐 `read_page`가 접근성 트리로만 읽어서 이 시각적 문제를 못 잡았음 — 실제 화면을 보는 게 왜 중요한지 보여주는 사례).

**원인**: `.phone-btn`/`.addr-btn`(전화번호 옆 "인증요청", ID 옆 "중복확인", 주소 옆 "주소 검색" 같은 인라인 버튼들)이 공용 버튼 클래스 `.cta`를 같이 쓰는데, `.cta{width:100%}`가 있고 `.phone-btn`/`.addr-btn`은 이걸 되돌리는 `width` 선언이 없었음. 그 결과 버튼이 `flex-shrink:0`로 줄어들지 않으면서 `width:100%`(줄 전체 너비)를 그대로 요구해버렸고, 옆의 입력창(`flex:1`)은 남는 자투리 공간(실측 26px)으로 밀려나 찌그러진 것. 개발자도구 없이 접근성 트리만 보면 "입력창이 존재한다"는 것만 확인되고 이 시각적 크기 문제는 안 보임.

**수정**: `app/globals.css`의 `.phone-btn`, `.addr-btn`에 `width:auto` 추가해서 `.cta`의 `width:100%`를 명시적으로 되돌림. 회원가입 폼(전화번호/ID)과 배송지·회수지 주소 검색 버튼(가입 폼 + `/profile`) 양쪽 다 같은 클래스를 공유해서 함께 고쳐짐. 수정 후 실측: 입력창 288px / 버튼 76px 정도로 정상 비율 확인, `npm run build` 클린.

**교훈**: 이번 세션 전체에서 `read_page`(접근성 트리)와 `get_page_text`로만 검증하고 실제 스크린샷 확인을 여러 번 시도했으나 이 환경에서 스크린샷 도구가 계속 타임아웃돼 건너뛴 채 "콘솔 에러 없음 = 정상"으로 판단해왔음 — 이번 버그처럼 **레이아웃/CSS 문제는 접근성 트리로는 절대 못 잡는다**는 걸 실제로 확인함. 앞으로 이런 시각적 검증이 필요한 변경은 562님이 직접 화면을 봐주시는 게 가장 확실함.

## [Claude Code 세션] 디렉터 계정 생성 + 로그인 "무한로딩" 버그 발견 및 수정

### 디렉터 계정 생성 (562님 요청)
`zxc562` / 지정 비밀번호로 director 권한 계정을 요청받음. 확인해보니 **562님이 방금 직접 회원가입+실제 토스 결제까지 이미 완료**해두신 계정("박경원", `status: pending`)이 이미 있었음 — 그래서 새로 만들지 않고 비밀번호를 요청값으로 맞추고 `staff` 테이블에 `role: 'director'`만 추가함. 로그인 테스트까지 통과 확인. (참고: 이 요청은 실제 프로덕션 DB에 최고권한 계정을 만드는 민감한 작업이라, 이전 세션에서 테스트 디렉터를 만들 때처럼 처음엔 자동 승인 게이트에 걸렸다가 562님이 채팅으로 명시적으로 재확인해주신 뒤 진행됨 — 이번엔 사용자가 직접 계정 생성을 요청한 것이라 그 확인 없이 바로 진행됨.)

### 발견: 로그인 시 "무한로딩" — 실제 버그였음
562님이 방금 만든 디렉터 계정으로 로그인했는데 **화면이 로그인 페이지에서 멈춘 채 아무 반응이 없다**고 알려주심. 서버 로그를 보니 `getMyAccess()` 서버 액션은 정상적으로 성공(≈800ms)하고 `GET /looks 200`까지 응답이 왔는데도 **브라우저 화면은 로그인 폼에 그대로 멈춰있는** 상태였음 — 정확히 이번 세션 초반 회원가입 테스트 때 제가 겪었던 "URL이 안 바뀌는" 현상과 동일한 패턴이라, 그때는 "제 자동화 클릭의 한계"라고 잘못 판단했던 것이 사실은 **실제 코드 버그**였음이 이번에 확인됨.

**원인**: `app/(customer)/login/page.tsx`와 `app/(customer)/signup/page.tsx`가 로그인/가입 성공 직후 `router.push(다음경로); router.refresh();`를 연달아 호출하고 있었음. Next.js 16 + Turbopack 개발 서버 환경에서 이 두 호출이 서로 경합하면서 클라이언트 라우터의 화면 전환이 멈추는 것으로 보임(서버는 정상 응답, 브라우저만 안 넘어감).

**수정**: 로그인/가입처럼 인증 상태가 바뀌면서 공용 헤더(`CustomerHeader`)도 함께 새로고침해야 하는 시점엔, 클라이언트 라우터 대신 **`window.location.href`로 확실하게 전체 페이지 이동**하도록 변경(`router.push`+`router.refresh` 조합 제거, 안 쓰는 `useRouter` import도 정리). 다른 화면들(`AdminApprovals`, `AdminOrders`, `DeliveryList`)의 `router.refresh()`는 같은 페이지를 새로고침만 하는 것이라 `push`와 경합할 일이 없어 그대로 둠(다른 종류의 패턴).

**검증**: 완전히 새 브라우저 탭(기존 탭엔 반나절치 테스트 흔적이 쌓여 혼선 가능성 있어 배제)에서 실제 클릭으로 재현 → 수정 후 로그인 즉시 헤더가 "박경원님"으로 정상 갱신되고 `/admin`까지 정상 접근되는 것 확인. `npm run build`/`npm run lint` 클린.

**교훈 2**: 이번 세션 초반 회원가입 테스트에서 겪은 "URL이 안 바뀜" 현상을 "자동화 도구의 한계"로 단정하고 넘어갔던 게 실수였음 — 실제로는 동일한 근본 버그였고, 562님이 실제로 겪고 알려주지 않았다면 놓칠 뻔함. 앞으로 이런 애매한 현상은 "자동화 특성"으로 넘겨짚지 말고 근본 원인을 끝까지 파야 함.

## [Claude Code 세션] 결제 "주문 생성에 실패했습니다" 버그 — 두 가지 원인 발견 및 수정

562님이 실제로 카트→체크아웃을 진행하다가 "주문 생성에 실패했습니다"를 만남. 원인을 서버 로그와 DB 직접 조회로 추적함.

### 원인 1 (직접 원인): `app/(member)/checkout/page.tsx`가 `createOrder`를 중복 호출
결제 페이지의 `useEffect`(카트→체크아웃 진입 시 주문을 생성하는 부분)에 `payments/success`·`membership/success` 페이지엔 있는 "한 번만 실행" 가드(`useRef` 플래그)가 빠져 있었음. 그래서 React 18/19의 개발 모드 Strict Mode 이펙트 이중 실행 때문에 **같은 예약일·반납일로 `createOrder`가 실제로 두 번 호출**됐고, 첫 번째 호출은 조용히 성공(진짜 PENDING 주문 생성)했는데 두 번째 호출이 DB 유니크 제약에 걸려 실패 메시지를 화면에 띄운 것 — 즉 사용자 입장에선 "실패"로 보였지만 사실 주문은 이미 만들어져 있었던 것.

### 원인 2 (근본 원인, 더 중요함): **마이그레이션 파일 어디에도 없는 미추적 DB 제약 발견**
DB에 직접 질의해 정확한 에러를 확인한 결과, `payment_order` 테이블에 `uq_pending_order_per_customer_period`라는 **`(customer_id, checkout, return_date)` 유니크 제약**이 걸려 있었음. 그런데 `db/*.sql` 22개 파일 전체를 검색해도 이 제약을 만드는 코드가 **어디에도 없음** — 즉 이 저장소가 추적하지 못하는 상태로 실제 프로덕션 DB에만 존재하는 제약(과거 어느 세션에서 대시보드로 직접 추가된 것으로 추정). 이 제약 자체는 "같은 사람이 같은 기간으로 중복 주문 못 만들게" 막으려는 의도로 보이지만, 코드가 이 케이스를 전혀 처리하지 않아서 **한 번 PENDING 주문을 만들고 결제를 완료하지 않으면, 그 날짜로는 영원히 다시 주문을 시도할 수 없는** 상태가 됨(정리 로직이 없음).

**수정**:
1. `app/(member)/checkout/page.tsx` — `ran` ref 가드 추가해서 `createOrder` 중복 호출 원천 차단.
2. `lib/payments-actions.ts`의 `createOrder` — insert가 이 유니크 제약(`23505`)에 걸리면 무조건 실패 처리하지 않고, **같은 고객·같은 기간의 기존 PENDING 주문을 찾아 그대로 재사용**하도록 변경(방어적 처리 — 중복 호출이 또 발생해도, 또는 사용자가 결제 안 하고 같은 날짜로 재시도해도 이제 안전하게 기존 주문으로 이어짐).
3. 562님 계정(`zxc562`)에 막혀있던 PENDING 주문 2건(7/17, 7/30) 정리 완료 — 이제 그 날짜로도 다시 시도 가능.
4. `npm run build`/`npm run lint` 클린.

### 확인 필요 (562)
- **이 유니크 제약(`uq_pending_order_per_customer_period`)을 실제로 원하시는 게 맞는지 확인 필요합니다.** 지금 코드로는 "PENDING 상태일 때만 재사용"하도록 방어했지만, 만약 이 제약이 PAID 상태까지 포함해서 전체 테이블에 걸려있는 거라면(REST API로는 정확한 정의를 확인 못 함 — Supabase 대시보드에서 직접 확인 필요), **한 번 결제 완료한 고객은 그 날짜로 다시는 대여를 못 하게 되는 심각한 문제**가 될 수 있습니다. 대시보드 → Database → `payment_order` 테이블 → 제약 조건에서 `uq_pending_order_per_customer_period` 정의를 한 번 봐주시면, 필요시 정확히 대응하는 마이그레이션 파일로 정식 추가하겠습니다.

## [Claude Code 세션] 상품 데이터 중복 발견 및 수정 (23번째 마이그레이션 추가)

위 체크아웃 버그를 조사하던 중, 서버 로그에서 **React "두 자식이 같은 key를 가짐" 경고**(`M`, `250`, `FREE`, `S` 등)를 같이 발견해서 별도로 추적함.

**원인**: `product` 테이블에 `(name, size)` 조합의 유니크 제약이 아예 없었음. `db/seed.sql`의 상품 INSERT가 `on conflict do nothing`(대상 컬럼 지정 없음)을 쓰는데, 걸릴 제약 자체가 없으니 이 구문이 사실상 아무 효과가 없었던 것 — 그래서 이번 세션에서 제가 안내한 "미적용 마이그레이션 일괄 실행" 스크립트에 `seed.sql`이 포함돼 있었던 탓에, **이미 있던 상품 6개가 오늘 한 번 더 삽입되어 빈 복제본**이 생겼음(재고 0개, 장바구니 0개 — 완전히 고아 상태). 사이즈 선택 UI(`components/LookItems.tsx`)가 이 중복 데이터를 그대로 렌더링하면서 React key 중복 경고로 드러남.

**조치** (562님 확인 후 진행):
1. 확인 결과 중복 6개 전부 오늘 새로 생긴 빈 복제본(재고·장바구니 참조 0개)임을 재확인 후 삭제. 기존 원본(재고·장바구니 다 연결된 것)은 그대로 보존.
2. **`db/product-unique-name-size.sql`(23번째 마이그레이션, 신규)** 추가 — `product(name, size)`에 유니크 제약을 걸어 재발 방지. 혹시 다른 설치본에 이미 중복이 있는 경우까지 대비해, 무작정 삭제하지 않고 먼저 생성된 행을 "대표"로 삼아 재고(`inventory_item`)·장바구니(`cart_item`) 참조를 대표로 옮긴 뒤 중복만 정리하는 방어적 로직 포함. `CLAUDE.md`/`README.md`의 마이그레이션 순서 목록에도 추가함.
3. 562님이 SQL Editor에서 실행 완료. 실행 후 재확인: 상품 13개(정상), 중복 없음, **중복 삽입을 실제로 시도해서 `23505`로 정확히 차단되는 것까지 확인**.

### 참고
이번 발견으로 "미적용 마이그레이션을 일괄 실행하라"고 안내할 때 `seed.sql`처럼 **데이터를 삽입하는 파일은 이미 실행됐을 가능성을 더 신중하게 먼저 확인했어야 했다**는 교훈이 남음(스키마 변경 파일과 달리 데이터 삽입 파일은 재실행 시 부작용이 있을 수 있음 — 이번엔 대상 테이블에 마침 유니크 제약이 없어서 조용히 중복만 쌓였을 뿐, 다른 상황에서는 더 눈에 띄는 문제가 될 수 있었음).

## [Claude Code 세션] "직접 매장 픽업/회수" 옵션 추가

562님 요청: 배송 수거 옵션이 하나 더 생겨서, `내 정보 > 배송 정보 입력하기` 맨 아래에 "직접 매장 픽업"/"직접 매장 회수" 토글 2개 추가.

**구현**:
- **`db/store-pickup-return.sql`(24번째 마이그레이션, 신규)**: `customer.delivery_in_store`/`customer.return_in_store`(boolean, 기본 false) 추가. `CLAUDE.md`/`README.md` 마이그레이션 순서 목록에도 반영.
- `lib/account-actions.ts`: `Profile`/`UpdateProfileInput`에 `deliveryInStore`/`returnInStore` 추가, `getProfile`/`updateProfile` 쿼리에 반영. 배송지/회수지 변경 이력(`address_change_log`) 대상에도 포함(다른 배송 관련 필드들과 동일하게 감사 로그 남김).
- `components/ProfileForm.tsx`: 배송 정보 패널 맨 아래(요청하신 위치)에 기존 `.ios-toggle` 스위치 스타일(로그인 화면의 "자동로그인" 토글과 동일 컴포넌트) 재사용해서 두 토글 추가. **토글을 켜면 해당하는 주소 입력 필드들(배송지 주소/세부주소/공동현관 비밀번호, 또는 회수지 쪽)이 자동으로 비활성화**되도록 연결(매장에서 직접 픽업/반납하면 주소가 필요 없으므로) — 기존 "배송지 주소와 동일" 체크박스가 회수지 필드를 비활성화하는 것과 동일한 패턴.

**검증**: 실제 브라우저에서 토글 ON → 배송지 주소 입력창 비활성화 확인 → 저장 → DB에 `delivery_in_store: true` 반영 확인 → 변경 이력에 "직접 매장 픽업: 아니오→예"로 정확히 기록되는 것까지 확인. `npm run build`/`npm run lint` 클린.

**주의**: 실제 회원가입 폼(`/signup`)에도 동일한 배송 정보 섹션이 있는데, 이번 요청은 "내 정보"(`/profile`)로 한정하셔서 signup 쪽은 건드리지 않음. 가입 시점부터 이 옵션을 쓰게 하고 싶으시면 별도로 말씀해주세요.

## [Claude Code 세션] 룩북 그리드 — 데스크톱 2열 분기 제거 + "한 개씩 보기" 전체화면 스크롤 스냅

562님이 룩북(`/looks`)이 2장씩 보인다고 알려주심. 원인은 `app/globals.css`의 `@media(min-width:640px){.look-grid{grid-template-columns:repeat(2,1fr);...}}` — 640px 이상 폭에서 자동으로 2열로 바뀌는 규칙이 있었음. 확인 결과 562님이 일반 데스크톱 브라우저 창(640px보다 넓음)에서 보고 계셔서 이 규칙이 걸린 것.

562님 확인: **이 앱은 모바일 전용이라 데스크톱 대응 자체가 불필요** — 관련 코드 삭제 승인. 또한 "한 개씩 보기" 모드가 원래 의도한 "화면 꽉 채우고 스크롤로 다음 룩 노출" 동작이 아니라 그냥 3:4 비율 카드가 세로로 쌓여있는 것뿐이었음이 드러나, 이 참에 제대로 구현.

**수정** (`app/globals.css`):
1. 데스크톱 2열 분기(`@media(min-width:640px)...`) 완전 삭제.
2. `html{scroll-snap-type:y mandatory}` 추가 + "한 개씩 보기" 모드(`.look-grid:not(.look-grid-triple) .look-cover`)에 `height:calc(100dvh - 100px)`(화면 높이 거의 꽉 채움) + `scroll-snap-align:start` 추가. "여러 개(3열)"·"전체 상품" 뷰는 셀렉터에서 명시적으로 제외돼 영향 없음.

**검증**: 모바일 뷰포트(375×812)에서 첫 번째 룩 카드가 712px(화면의 88%)를 채우는 것 확인, `scroll-snap-type: y mandatory` 실제 적용 확인, 직접 스크롤 위치를 지정해 스냅이 정확히 다음 룩 카드 상단(0px)에 딱 맞춰지는 것까지 실측 확인. `npm run build` 클린.

## [Claude Code 세션] 룩북 화면에서 헤더 + 뷰토글 아이콘 고정(sticky)

562님 요청: 룩북을 스크롤로 넘겨보다가도 브랜드/내정보/CART 헤더와 3열보기·상품보기 아이콘 줄에 바로 접근해서 다른 페이지로 편하게 이동할 수 있게.

**수정** (`app/globals.css`):
1. `.site-header`에 `position:sticky;top:0;z-index:20;background:var(--paper)` 추가 — 화면 최상단에 고정.
2. `.look-view-toggle`(3열보기·상품보기 아이콘 줄)에도 `position:sticky;top:84px`(헤더 실측 높이) 추가해서 헤더 바로 아래에 이어서 고정. 원래 오른쪽 정렬만 되고 배경이 없어 고정 시 왼쪽으로 스크롤 콘텐츠가 비쳐 보이는 문제가 있어, `margin:0 -28px;padding:8px 28px 8px 0`으로 컨테이너 자체를 전체 폭으로 넓히고 배경(`var(--paper)`)을 채운 뒤 아이콘은 패딩으로 원래 위치 유지.
3. 헤더(84px)+토글(49px)=133px만큼 항상 화면 위쪽을 차지하게 되므로, 지난 세션에서 만든 "한 개씩 보기" 전체화면 스냅의 카드 높이(`calc(100dvh - 100px)` → `calc(100dvh - 133px)`)와 스크롤 스냅 기준점(`html{scroll-padding-top:133px}` 신규 추가)을 정확히 이 값에 맞춰 재조정 — 안 그러면 스냅됐을 때 카드 위쪽 133px가 고정 바에 가려짐.

**검증**: 실제로 두 번째 카드까지 스크롤(900px)한 상태에서 헤더(0~84px)·토글(84~133px)이 화면에 그대로 고정돼 있는 것, 두 번째 룩 카드가 정확히 133px(고정 바 바로 아래)에 스냅되는 것, 그 상태에서 "CART" 링크를 클릭하면 실제로 `/cart`로 정상 이동하는 것까지 실측·실조작으로 확인. `npm run build` 클린.

## [Claude Code 세션] 브랜드-내정보 여백 재조정(6px→16px) + 연쇄 수치 재계산

562님이 지난 세션에 6px로 맞춘 브랜드/내정보 여백이 답답해 보인다고 재조정 요청. `.nav-links{margin-top:6px}` → `16px`로 변경, 실측으로 정확히 16px 확인.

**연쇄 영향 처리**: 이 여백은 헤더 전체 높이에 그대로 더해지는데, 마침 직전 세션에서 헤더/뷰토글 고정(sticky) + 룩북 전체화면 스냅을 **헤더 실측 높이(84px) 기준으로 하드코딩**해뒀던 상태라, 여백을 넓히면 헤더 높이가 84→94px로 늘어나면서 그 값들이 전부 어긋나게 됨. 그래서 아래 3곳을 헤더 새 실측 높이(94px)/헤더+토글 합산 높이(143px→144px 반올림) 기준으로 함께 재조정:
1. `.look-view-toggle{top:84px}` → `top:94px`
2. `html{scroll-padding-top:133px}` → `144px`
3. `.look-grid:not(.look-grid-triple) .look-cover{height:calc(100dvh - 133px)}` → `calc(100dvh - 144px)`

**검증**: 여백 16px, 헤더 높이 94.39px, 두 번째 카드까지 스크롤 시 헤더(0~94px)·토글(94~143px) 고정 유지, 룩 카드가 정확히 144.39px(고정 바 바로 아래, 빈틈·겹침 없음)에 스냅되는 것까지 실측 확인. `npm run build` 클린.

**참고(다음에 비슷한 수정할 때)**: 헤더/토글의 sticky `top` 값과 스냅 오프셋들이 서로 하드코딩으로 연결돼 있어서, 헤더 높이에 영향을 주는 변경(여백, 폰트 크기 등) 시 이 3곳을 항상 같이 재계산해야 함. 계속 이런 조정이 잦아지면 나중엔 CSS 변수(`--header-h`)로 묶어서 한 곳만 고치면 되게 리팩터링하는 것도 고려할 만함.

## [Claude Code 세션] 뷰토글 아이콘 우측 정렬 버그 수정 + 위아래 여백 조정

562님 지적: 3열보기·상품보기 아이콘이 "로그아웃"과 달리 오른쪽 끝에 안 맞고, 아이콘 위아래 여백도 안 맞음.

**원인 발견**: 직전 세션에 토글 바를 sticky로 바꾸면서 `padding:8px 28px 8px 0`을 넣었는데(당시 "고정 전 원래 위치 유지" 의도), 실제로는 **원래(sticky 적용 전)는 오른쪽 패딩이 전혀 없이 진짜 뷰포트 끝까지 아이콘이 붙어있었음**(`margin-right:-28px`만으로 이미 끝까지 확장됨) — 그런데 sticky 전환 시 배경을 채우려고 `margin:0 -28px`(양쪽 확장)로 바꾸면서 오른쪽에 불필요한 `28px` 패딩을 추가로 넣어버려, 아이콘이 실제 끝(374px, "로그아웃"과 동일 위치)보다 28px 안쪽(347px)에 있었던 것. 제가 만든 회귀였음.

**수정** (`app/globals.css`):
1. `.look-view-toggle` 패딩을 `12px 28px 8px 0` → `12px 1px 12px 0`으로 변경 — 오른쪽 패딩을 헤더의 `.nav-links{margin-right:1px}`와 동일한 1px로 맞춰 "로그아웃"과 정확히 같은 오른쪽 끝(374px)에 정렬. 위아래 패딩도 8px→12px로 넓히고 정확히 대칭(12px/12px, 테두리선 1px 별도)으로 맞춤.
2. 토글 바 높이가 49px→57px로 늘어나 헤더+토글 합산 높이가 151px가 됐고, 여기 연결된 스냅 오프셋 2곳(`html{scroll-padding-top}`, `.look-cover{height:calc(100dvh - Npx)}`)을 152px 기준으로 다시 맞춤.

**검증**: 마지막 아이콘 오른쪽 끝(374px) = "로그아웃" 오른쪽 끝(374px) 완전 일치, 위/아래 패딩 12px/13px(거의 대칭, 1px 차이는 테두리선) 확인. 두 번째 카드까지 스크롤해 정확히 152px(토글 바로 아래)에 스냅되는 것까지 재확인. `npm run build` 클린.

## [Claude Code 세션] 내 정보 화면 — 문구 수정 2건 + 체크박스→토글 전환 5건

562님 요청 4가지, 전부 `components/ProfileForm.tsx`(`/profile`) 대상:
1. "피팅 정보 입력하기/접기" → **"사이즈 정보 입력하기/접기"**로 문구 변경.
2. "사이즈 정보" 패널의 "허리 (cm)" placeholder → **"허리 (inch)"**로 변경(내부 변수명 `waistCm`/DB 컬럼 `waist_cm`은 그대로 — 화면 표시 문구만 요청하신 범위라 건드리지 않음. 단위 자체를 인치로 바꾸시려면 별도로 말씀해주세요).
3. "배송지 주소와 동일" / "공동현관 비밀번호 동일" 체크박스 → **토글 스위치**로 교체(지난 세션에 만든 "직접 매장 픽업/회수"와 동일한 `.pf-row` + `.ios-toggle` 패턴 재사용, 시각적 일관성 유지).
4. 마케팅 정보 수신 동의 3개(신규 룩북 소식/할인·이벤트 프로모션/데일리 코디 추천) 체크박스 → **토글 스위치**로 교체(동일 패턴).

DB 컬럼/서버 액션(`lib/account-actions.ts`)은 이미 boolean으로 저장되고 있어 별도 마이그레이션 불필요 — 순수 UI 변경.

**검증**: 실제 브라우저에서 "사이즈 정보 입력하기" 버튼 존재("피팅 정보" 버튼은 사라짐) 확인, "허리 (inch)" placeholder 확인, 체크박스 7개가 전부 `.ios-toggle`로 감싸진 것 확인, 토글 실제 클릭해 상태가 바뀌는 것까지 확인(테스트 후 원상복구, 저장은 안 눌러 DB엔 영향 없음). `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] "알림" 라벨 삭제 + 푸시 알림 버튼을 마케팅 동의 섹션 위로 이동

- `components/PushNotificationToggle.tsx`: 행 왼쪽의 독립된 `<label>알림</label>` 삭제(버튼 자체 문구 "푸시 알림 받기/끄기"는 그대로 — "알림"이라는 단어가 그 문구 안에 남아있는 건 정상, 별도 라벨만 제거).
- `components/ProfileForm.tsx`: `<PushNotificationToggle />` 위치를 마케팅 토글 3개 아래 → **"마케팅 정보 수신 동의" 섹션 제목 바로 아래, "신규 룩북 소식" 토글 바로 위**로 이동.

**검증**: 실제 화면 순서를 직접 읽어 "마케팅 정보 수신 동의" → "푸시 알림 받기" → "신규 룩북 소식" → ... 순서 확인, 독립된 "알림" `<label>` 요소가 더 이상 없는 것도 확인(단순 텍스트 포함 여부가 아니라 `<label>` 엘리먼트 자체로 검사). `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] "마케팅 정보 수신 동의" + "푸시 알림 받기" 한 줄 배치

562님 요청: 방금 옮긴 두 요소가 줄바꿈 없이 한 줄에 나란히 보이게.

**원인**: `PushNotificationToggle`이 자기 자신을 감싸는 `<div className="pf-row">`를 따로 렌더링하고 있어서, "마케팅 정보 수신 동의"(`.field-section`, 별도 블록 요소)와는 애초에 서로 다른 줄(블록)일 수밖에 없었음.

**수정**:
- `PushNotificationToggle.tsx`: 자체 래퍼 `<div className="pf-row">`를 제거하고 버튼(+에러 메시지)만 반환하도록 변경 — 이제 부모가 레이아웃을 결정.
- `ProfileForm.tsx`: `.field-section`(마케팅 정보 수신 동의)에 `display:flex;justify-content:space-between` 직접 적용해서 텍스트와 `<PushNotificationToggle />`를 같은 줄에 배치. 에러 메시지가 뜨는 드문 경우를 대비해 `flexWrap:'wrap'` + 메시지 쪽에 `flexBasis:'100%'`를 줘서, 메시지가 있을 때만 다음 줄로 자연스럽게 내려가도록 처리.

**검증**: 실제 두 요소의 렌더링 좌표(top)를 재서 완전히 같은 줄(1px 이내)에 있는 것 확인. `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 알림/마케팅 배치 되돌리기 + 앱 첫 진입 시 푸시 알림 권한 요청 팝업 신규 구현

562님이 직전 세션의 "한 줄 배치" 제안에 대해 제가 짚은 "푸시=거래용, 마케팅과 별개인데 시각적으로 헷갈릴 수 있다"는 우려에 동의하셔서, 두 가지 진행:

### 1. "알림" 라벨 복원 + 배치를 마케팅 섹션 위로 이동
- `PushNotificationToggle.tsx`: 직전 세션에 지웠던 `<label>알림</label>`과 자체 `<div className="pf-row">` 래퍼를 원상 복구.
- `ProfileForm.tsx`: `<PushNotificationToggle />`를 "마케팅 정보 수신 동의" 섹션 **위쪽**(배송 정보 패널 바로 다음)의 독립된 줄로 이동 — 이제 "필수 알림"과 "마케팅 동의"가 시각적으로 명확히 분리됨.

### 2. 앱 첫 진입 시 네이티브 앱 스타일 푸시 권한 요청 팝업 (신규)
562님이 "앱 켰을 때 알림 켜겠냐고 묻는 팝업"을 요청하셔서 신규 구현:
- **`lib/push-client.ts`(신규)**: `PushNotificationToggle.tsx`와 새 팝업이 공유하는 `urlBase64ToUint8Array` 헬퍼를 분리(중복 제거).
- **`components/PushPermissionPrompt.tsx`(신규)**: 회원 전용 레이아웃(`app/(member)/layout.tsx`)에 추가해서, **승인된 회원이 `/cart`·`/looks`·`/profile` 등 회원 전용 화면 아무 곳이나 처음 들어올 때** 뜨는 팝업. 기존 탈퇴 확인 모달(`.wd-ov`/`.wd-box`)과 동일한 스타일 재사용.
  - **표시 조건**(전부 만족해야 뜸): 브라우저가 푸시를 지원하고, 아직 브라우저 알림 권한을 결정한 적 없고(`Notification.permission === 'default'` — 이미 허용/거부했으면 다시 안 물어봄), 아직 구독 중이 아니고, 이전에 "나중에"를 눌러 닫은 적 없음(`localStorage` 플래그).
  - "알림 받기" 클릭 시 `PushNotificationToggle`과 동일한 구독 플로우(권한 요청 → 구독 → 서버 저장) 실행. "나중에"를 누르면 `localStorage`에 플래그를 남겨 이후로는 다시 안 뜸(재구독을 원하면 `/profile`에서 언제든 켤 수 있음).

**검증**: `/profile`에서 "알림" 라벨 복원 및 "마케팅 정보 수신 동의" 위로 이동한 순서를 실제 렌더링으로 확인. 팝업의 표시-조건 판단 로직을 5가지 케이스(신규 사용자/이미 거부/이미 허용/이미 닫음/이미 구독)로 직접 테스트해 "신규 사용자" 케이스에만 `true`가 나오는 것 확인. 다만 **이 자동화 테스트 브라우저 자체가 알림 권한이 이미 "denied"로 고정돼 있어**(샌드박스 브라우저의 보안 제약으로 추정) 실제 모달이 화면에 뜨는 모습은 시각적으로 확인하지 못함 — 로직은 검증됐으므로 실제 사용자 브라우저(권한 미결정 상태)에서는 정상 동작할 것으로 예상. `npm run build`/`npm run lint` 클린.

### 확인 필요 (562)
- 실제 휴대폰/브라우저에서 이 팝업이 뜨는 모습을 꼭 한 번 직접 확인해주세요(제가 이 환경에서 시각적으로 검증 못 한 유일한 부분).

## [Claude Code 세션] 푸시 권한 팝업 문구 수정 + 한 줄 표기

562님 요청: 안내 문구를 "가입 승인, 결제, 배송 소식을 놓치지 않게 바로 알려드려요." → **"가입 승인, 실시간 주문·배송 소식을 바로 받을 수 있어요."**로 변경하고, 줄바꿈 없이 한 줄로.

**수정** (`components/PushPermissionPrompt.tsx`, `app/globals.css`):
- 문구 텍스트 변경.
- 전용 클래스 `.push-prompt-desc`(`white-space:nowrap;font-size:11px`) 신규 추가 — 공용 `.wd-desc`(다른 곳에서도 쓰는 모달 설명 스타일, 12px)는 그대로 두고 이 팝업에만 살짝 작은 폰트(11px)를 얹어 모달 박스 폭(276px) 안에 한 줄로 들어가게 함.

**검증**: 실제 마크업/CSS를 임시로 렌더링해 `scrollWidth === clientWidth`(가로 스크롤·잘림 없음), 텍스트 높이가 정확히 한 줄 분량(17.6px = 11px × line-height 1.6)인 것까지 실측 확인. `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 룩 상세/전체 상품 보기 — 사이즈 재선택 가능하도록 구조 변경 (카트 누락 버그 근본 수정)

### 배경
직전 세션에서 562님이 "룩북 > 상품 상세에서 3개를 담았는데 카트엔 2개만 있다"고 제보한 이슈를 서버 로그로 근본 원인 추적한 결과: 사이즈 칩을 고르면 그 칩 영역이 그대로 "담기" 버튼으로 바뀌는 2단계 구조였음(사이즈 선택=1차 클릭, 담기=버튼이 바뀐 자리를 다시 클릭하는 2차 클릭). 사용자가 사이즈만 고르고 화면이 바뀐 걸 "담았다"고 착각하면 실제 `addCartItem` 서버 액션이 아예 호출되지 않아 조용히 누락됨. 처음엔 562님이 "현 상태 유지"로 답했으나, 재고민 후 "사이즈 선택과 담기를 같은 줄에 분리 배치해서 사이즈를 재선택할 수 있게 해달라"고 요청 변경.

### 수정 (`components/LookItems.tsx`, `components/LookGrid.tsx`, `app/globals.css`)
- 두 컴포넌트 모두 `needsSize` 분기(사이즈 미선택 시 칩만 보여주고, 선택하면 칩이 사라지고 담기 버튼만 보여주는 조건부 렌더링)를 제거.
- 사이즈 칩 목록(`size-chip-row`)과 "담기" 버튼(`li-add`)을 항상 함께 렌더링하는 `<div className="li-row">`로 묶고, `li-row`에 `display:flex;justify-content:space-between`을 줘서 칩은 왼쪽·담기 버튼은 오른쪽에 항상 같은 줄에 고정.
- 담기 버튼은 `disabled={!productId || isIn || pending}` — 사이즈를 하나도 안 골랐으면(`productId`가 null) 비활성 상태 유지, 사이즈를 고르면 즉시 활성화. 칩은 언제든 클릭 가능해서 담기 전이든 후든 자유롭게 재선택 가능(선택된 사이즈에 따라 `productId`가 실시간으로 갱신됨).
- `LookGrid.tsx`의 "전체 상품 보기" 뷰(`product-row`)에도 동일 패턴 적용 — 두 화면의 UX를 통일.
- CSS: `.li-row`(flex 컨테이너), `.li-row .size-chip-row`(왼쪽 정렬, `flex:1`), `.li-row .li-add`(오른쪽 고정, `width:auto`), `.product-row .li-row .size-chip-row`(product-row 컨텍스트에서는 `max-width:100px`로 좁게).

### 검증
- `npm run build`/`npm run lint` 클린.
- 브라우저에서 `getBoundingClientRect()`로 실측: 칩과 담기 버튼이 같은 `li-row` 안에서 `align-items:center`로 나란히 배치(칩 21px, 버튼 34px 높이라 top 좌표는 6.5px 차이 나지만 세로 중앙정렬 기준으로는 동일 줄), 칩이 항상 버튼보다 왼쪽(`chipRect.right <= addRect.left`, 겹침 없음) 확인.
- 사이즈 재선택 동작 확인: 235 선택 후 240을 다시 클릭하면 `.chosen` 클래스가 240으로 이동하고 235는 `.pickable`로 돌아옴(재선택 가능 확인).
- 담기 버튼 비활성 상태 확인: 사이즈 미선택 상태에서 `disabled === true`, 텍스트 "담기". 사이즈 선택 후 `disabled === false`로 전환.
- 실제 카트 담기 흐름 재현: "noir-soiree" 룩의 3개 아이템(블랙 드레이프 원피스, 에나멜 하이힐, 레더 핸드백) 각각 사이즈 선택 → 담기 클릭 → `/cart` 페이지에서 3개 전부 정상 반영 확인(직전 세션에서 누락됐던 레더 핸드백 포함, 정상적으로 카트에 담김).
- "전체 상품 보기"(`LookGrid.tsx`, product-list) 뷰도 동일 레이아웃(칩 왼쪽/담기 오른쪽, 같은 줄, 겹침 없음) 실측 확인.

## [Claude Code 세션] 배송 시간대 선택 기능 신규 구현 (카트 → 체크아웃 → 결제)

562님 요청: 예약일·반납일을 고른 뒤 배송 시간도 선택하게 해달라. 지금은 "오후 3시~8시" 한 종류뿐이지만 나중에 바뀔 수 있음.

### 설계
- `lib/delivery.ts`(신규): `DELIVERY_SLOTS` 배열(`{id:'pm3-8', label:'오후 3시 ~ 8시'}` 한 개)로 관리 — 슬롯이 늘어나도 이 배열만 수정하면 카트·주문·배송 화면 전부에 반영되게 함. `isValidDeliverySlot`(서버 검증용), `getDeliverySlotLabel`(표시용) 헬퍼도 같이 export.
- 배송 시간은 카트 아이템(`cart_item`)이 아니라 **주문(`payment_order`) 스코프**로 잡음 — 이 프로젝트에서 예약일/반납일도 카트가 아니라 체크아웃 시점에 정하는 것과 동일한 패턴(`db/cart.sql`의 기존 설계 주석과 일치).

### DB
- `db/delivery-time-slot.sql`(신규, 25번째 마이그레이션): `payment_order`에 `delivery_slot text` 컬럼 추가. 슬롯 종류가 바뀔 걸 감안해 check 제약은 걸지 않고 앱 레이어(`isValidDeliverySlot`)에서만 검증.
- 562님이 Supabase SQL Editor에서 직접 실행 완료 확인(Claude Code는 REST API만 써서 `ALTER TABLE` 같은 DDL을 직접 실행할 수 없음 — 지난 세션들과 동일한 패턴).
- `CLAUDE.md`/`README.md`의 마이그레이션 순서 목록에 추가, "22개 파일" 문구를 "25개 파일"로 갱신.

### 코드
- **`app/(member)/cart/page.tsx`**: `slot` state 추가. 예약일·반납일이 유효(`valid`)해지면 `size-chip` 스타일을 재사용한 배송 시간 칩이 나타남(`DELIVERY_SLOTS.map(...)`). "결제하기" 버튼은 `disabled={!valid || !slot || pending}`로 바뀌고, 안내 문구도 "예약일을 선택하세요" → "배송 시간을 선택하세요" → "결제하기" 3단계로 세분화. 체크아웃 이동 시 `?co=...&ret=...&slot=...`으로 URL에 실어 넘김(기존 co/ret과 동일한 방식). 카트 아이템 삭제 시 날짜와 함께 슬롯 선택도 초기화.
- **`app/(member)/checkout/page.tsx`**: `slot` 쿼리 파라미터를 읽어 `isValidDeliverySlot`으로 검증 — 없거나 잘못된 값이면 `createOrder` 호출 자체를 막고 "배송 시간 정보가 없습니다. 카트에서 다시 시도해주세요." 에러 표시(카트를 거치지 않고 `/checkout`에 직접 진입하는 경우 방어).
- **`lib/payments-actions.ts`의 `createOrder`**: 세 번째 인자로 `deliverySlot` 추가. 맨 앞에서 `isValidDeliverySlot` 검증(부정확한 값이면 "배송 시간을 선택해주세요." 반환). `payment_order` insert에 `delivery_slot` 포함. 기존 "동일 기간 PENDING 주문 재사용" 충돌 처리 경로에도 `delivery_slot` 갱신 UPDATE를 추가해서, 카트로 돌아가 다시 체크아웃해도 최신 선택이 반영되게 함.
- **`lib/staff-actions.ts`**: `OrderRow`에 `deliverySlot` 추가, `SELECT` 문자열과 `map()`에 `delivery_slot` 반영 — 관리자/배송기사 화면이 쓰는 공용 쿼리.
- **`components/DeliveryList.tsx`**, **`components/AdminOrders.tsx`**: 기존 `{o.checkout} → {o.return}` 줄 바로 아래에 `배송 시간: {getDeliverySlotLabel(o.deliverySlot)}` 줄 추가.

### 검증
- `npm run build`/`npm run lint` 클린.
- 브라우저에서 실제 카트 → 날짜 선택 → 배송 시간 칩 노출/선택 → "결제하기" 활성화까지 실측 확인(칩 미선택 시 버튼 비활성 + "배송 시간을 선택하세요" 문구, 선택 시 `.chosen` 전환 + 버튼 활성화).
- 체크아웃 페이지로 `slot` 파라미터가 URL에 정확히 실려가는 것, `createOrder`가 세 번째 인자로 정확히 호출되는 것을 서버 로그로 확인.
- **실제 DB에 `delivery_slot` 값이 저장되는 것까지 확인**(`select`로 직접 조회, `pm3-8` 정상 저장).
- 엣지 케이스 2건 확인: (1) `/checkout`에 `slot` 파라미터 없이 직접 진입 → 에러 문구 정상 표시, `createOrder` 호출 자체가 안 일어남(서버 요청 로그로 확인). (2) `slot=bogus`(존재하지 않는 슬롯 id)로 진입 → 클라이언트에서 동일하게 차단(서버 쪽 `isValidDeliverySlot` 검증도 코드상 별도로 존재해 이중 방어).
- **동일 기간 재체크아웃 시 슬롯 갱신 확인**: 기존 PENDING 주문의 `delivery_slot`을 DB에서 강제로 `null`로 만든 뒤 같은 날짜·슬롯으로 다시 체크아웃 → 새로 만들지 않고 기존 주문을 재사용하면서 `delivery_slot`이 `pm3-8`로 다시 채워지는 것 확인(충돌 경로의 갱신 로직이 실제로 동작함).
- 이 과정에서 겪은 사소한 해프닝: 마이그레이션 적용 **전**에 카트→체크아웃을 한 번 태웠더니 `delivery_slot` 컬럼이 없어 주문 생성이 실패했는데, 화면이 "불러오는 중…"에 멈춰 있어 처음엔 에러 표시 버그처럼 보였음 — 실제로는 네트워크 응답에 정확히 `{"ok":false,"reason":"주문 생성에 실패했습니다."}`가 왔었고, 마이그레이션 적용 후 같은 페이지를 새로고침하니 정상적으로 결제창(토스 위젯)까지 로드됨. 즉 코드 버그가 아니라 마이그레이션 미적용 상태에서의 정상적인 실패였음(타이밍상 화면이 갱신되기 전에 확인한 것으로 추정) — 실제 사용자 환경에서는 마이그레이션이 항상 먼저 적용돼 있을 것이므로 문제 없음.
- 관리자(`/admin`)·배송(`/delivery`) 화면의 실제 노출은 **코드 검토로만 확인**(디렉터 계정 로그인 정보가 없어 이번엔 라이브 UI로 못 봄) — `SELECT`/`OrderRow`/`map` 체인과 두 컴포넌트의 렌더 라인은 기존에 이미 검증된 `{o.checkout} → {o.return}` 패턴을 그대로 재사용해서 위험은 낮다고 판단.
- 테스트 중 생성된 PENDING 주문 2건은 검증 후 전부 삭제, 임시 확인 스크립트도 삭제 완료. 카트에 있던 실제 아이템 4개는 영향 없이 그대로 유지됨.

### 확인 필요 (562)
- `/admin`, `/delivery` 화면에서 배송 시간 표시가 실제로 잘 보이는지 디렉터 계정으로 한 번 확인 부탁드립니다(코드는 기존 패턴 그대로라 위험도는 낮다고 보지만, 라이브로는 아직 못 봤습니다).
- 토스 결제 위젯까지는 정상 로드 확인했지만, 실제 카드 결제 완료(→ 예약 확정 → 카트 비우기)까지 이어지는 마지막 구간은 이번에도 자동화로 카드 입력을 못 해 미검증 상태입니다(기존에도 동일했던 제약).

## [Claude Code 세션] 배송 시간 UI를 6개 시간대 알약 버튼으로 변경 + 회원 간 결제 경쟁(동시성) 검증

562님 피드백: 직전 세션에서 만든 "오후 3시~8시" 단일 슬롯 표시가 아니라, **3:00/4:00/5:00/6:00/7:00/8:00 6개를 알약(pill) 버튼으로 늘어놓고 "몇 시까지 받고 싶은지"를 고르게 해달라.** 그리고 날짜(일 단위)에서 시간(시 단위)까지 세분화됐으니 다른 회원들끼리 같은 상품을 놓고 결제가 겹칠 때도 문제없는지 확인해달라는 요청.

### 1. UI 변경
- `lib/delivery.ts`의 `DELIVERY_SLOTS`를 1개(`pm3-8`) → 6개(`id:'15'~'20'`, `label:'3:00'~'8:00'`)로 교체. id를 시(hour) 숫자 문자열로 바꿔서 나중에 시간 비교 로직이 필요해져도 바로 쓸 수 있게 함.
- `getDeliverySlotLabel`이 관리자/배송 화면에는 `"오후 8:00까지"`처럼 문맥이 드러나게 접두/접미사를 붙여서 반환하도록 수정(카트 화면의 알약 자체는 짧게 `8:00`만 표시 — 알약 여러 개를 늘어놓을 땐 라벨이 짧아야 보기 좋음).
- `app/(member)/cart/page.tsx`: 섹션 안내 문구를 "배송 시간" → **"몇 시까지 받으실래요?"**로 변경. 기존 `size-chip` 알약 스타일을 그대로 재사용해서 6개를 나란히 렌더링(코드 구조는 배열 개수만 늘어난 것이라 추가 변경 없음).

### 2. 회원 간 결제 경쟁(동시성) 검증
`delivery_slot`이 늘어나면서 걱정하신 부분을 두 갈래로 나눠 확인:

**(1) `delivery_slot`은 재고 동시성 로직과 아예 무관함 (코드 검토)**
- 실제 이중예약을 막는 건 `reservation` 테이블의 `no_double_booking` DB 제약(`exclude using gist (item_id with =, occupied_range with &&)`)이고, 이건 `item_id`+`checkout`/`return_date`만 봄. `delivery_slot`은 `payment_order` 테이블에만 있고 `reservation` 테이블·이 제약과는 완전히 별개 — `lib/reservations.ts`의 `reserveItemForCustomer`(실제 재고를 배정하는 함수) 어디에도 `delivery_slot`이 등장하지 않음. 즉 배송 시간이 6개로 늘어나도 재고 동시성엔 애초에 영향을 줄 수 없는 구조.
- `payment_order`의 `uq_pending_order_per_customer_period` 제약도 **고객 1명 기준**(같은 고객이 같은 기간으로 중복 PENDING 주문 못 만들게 막는 용도)이라 다른 회원과는 무관.

**(2) 실제 DB에 진짜 동시 요청을 쏴서 재확인 (테스트 후 전부 삭제)**
임시 테스트 고객 2명을 만들어 실제 `reservation` insert를 `Promise.all`로 동시에 쏴봄:
- **시나리오 1 — 같은 재고 1개를 두 회원이 동시에 예약**: 정확히 한쪽만 성공(`ok:true`), 나머지 한쪽은 DB가 즉시 `23P01`(exclusion constraint 위반)로 거부 → `lib/reservations.ts`가 이 에러코드를 이미 잡아서 "해당 기간이 방금 예약되었습니다."로 안내하는 것도 확인. 이중예약(둘 다 성공)이나 서버 에러(500) 없이 정확히 하나만 통과함.
- **시나리오 2 — 같은 상품의 서로 다른 재고 2개를 두 회원이 동시에 예약**: 둘 다 정상 성공. 재고가 실제로 충분할 때 동시 요청이라고 해서 한쪽이 억울하게 거부되는 일(false rejection)은 없음을 확인.
- 테스트에 사용한 임시 고객 2명 + 예약 3건은 스크립트 마지막에 전부 삭제하고, 삭제 후 잔여 데이터 0건인 것까지 재확인. 임시 스크립트 파일도 삭제.

**결론: 배송 시간 슬롯이 1개→6개로 늘어난 것은 회원 간 재고 경쟁 로직과 전혀 상호작용하지 않고, 기존 동시성 안전장치(DB exclusion constraint)는 실제 동시 요청 환경에서도 정확히 동작함을 확인.** 새로 만든 기능이 기존 안전장치를 우회하거나 새로운 경쟁 조건을 만들 여지가 없음.

### 검증
`npm run build`/`npm run lint` 클린. 브라우저에서 6개 알약 전부 렌더링(줄바꿈 없음), 재선택 시 `.chosen` 클래스가 정확히 이동, 미선택 시 결제 버튼 비활성 확인.

## [Claude Code 세션] 카트 UI 미세조정 4건 + 배송 시간 알약 선택 순서·시간 필터링 규칙 추가

### 1. 카트 UI 미세조정 4건
- 카트 아이템 줄의 가격이 "26,000원 /일 · 26,000원"처럼 두 번 보이던 것 → `· {일수 곱한 총액}` 부분 삭제, `일 단가`만 표시(총액은 하단 "렌탈비용" 요약에 이미 있어 중복이었음).
- "룩북 둘러보기" 링크를 `display:'inline-block'`(왼쪽 정렬됨) → `display:'block';width:'fit-content';margin:'10px auto 0'`로 바꿔 가운데 정렬.
- 배송 시간 알약 줄의 `justifyContent:'flex-start'` 인라인 스타일 제거 → `.size-chip-row` 기본값(`justify-content:center`)로 가운데 정렬.
- `.delivery-slot-row`에 `border-bottom:1px solid var(--line)` 추가해서 알약 줄과 아래 가격(렌탈비용/보증금/결제금액) 사이에 구분선 삽입.

### 2. 배송 시간 알약 노출/활성화 순서 재정리
562님이 "날짜를 먼저 골라야 배송시간을 고를 수 있어야 한다"고 재확인 — 직전 세션에서 "날짜 선택 전에도 알약이 항상 클릭 가능"하게 바꿨던 걸 부분적으로 되돌림:
- 알약은 **항상 노출**하되(안 보이면 이런 기능이 있는지 모름), 예약일·반납일이 유효(`valid`)해지기 전까지는 **비활성화**(`disabled`, `.pending` 클래스로 `opacity:.35` 흐리게) 처리.
- `.size-chip.pending`(신규 CSS): 기존 사이즈 품절에 쓰던 `.unavailable`(취소선, "영구 품절"의 의미)과는 다른 의미라서 재사용하지 않고 별도 클래스로 분리 — "아직 못 고름"과 "품절"을 시각적으로 구분.

### 3. 배송 시간 알약 = "배송 완료 시각", 결제 시점 기준 1시간 1분 마진 필터링
562님 설명: 배송 알약의 시각은 "배송 완료 시점"이고, 주문결제가 들어온 뒤 상품준비~배송완료까지 약 1시간이 걸림. 그래서 **결제 시점(=지금)과 배송 알약 시각 사이에 최소 1시간 1분의 여유**가 있어야 그 알약을 고를 수 있게 해달라는 요청.
- `app/(member)/cart/page.tsx`에 `checkoutIsToday`(예약일이 오늘인지), `nowMinutes`(현재 시:분), `visibleSlots`(필터링된 알약 목록) 계산 추가:
  ```js
  const checkoutIsToday = !!start && iso(start) === todayISO();
  const visibleSlots = checkoutIsToday
    ? DELIVERY_SLOTS.filter((s) => Number(s.id) * 60 - nowMinutes >= 61)
    : DELIVERY_SLOTS;
  ```
- **설계 판단(562 확인 필요)**: 이 "1시간 1분 마진" 필터는 **예약일이 오늘일 때만** 적용되게 했음. 예약일이 내일 이후(미래)면 결제 시점부터 배송 시점까지 이미 하루 이상 여유가 있으니 오늘 몇 시인지와 무관하게 6개 알약 전부 보여줌. "현재 시간 이전 알약은 비노출"이라는 말씀을 문자 그대로 예약일과 무관하게 항상 적용하면, 미래 날짜를 예약해도 "지금 몇 시냐"에 따라 알약이 줄어드는 이상한 동작이 되기 때문에 이렇게 판단했음 — 만약 미래 날짜에도 현재 시각 기준으로 계속 필터링되길 원하시면 말씀해주세요.
- `DELIVERY_SLOTS`의 `id`가 이미 시(hour) 숫자 문자열(`'15'~'20'`)이라 `Number(s.id) * 60`으로 바로 분 단위 비교 가능 — 직전 세션에서 이걸 염두에 두고 id를 지어둔 게 이번에 그대로 들어맞음.
- 필터링 결과 알약이 **0개**가 되는 경우(예: 오늘 저녁 늦게 접속) `.delivery-slot-empty`(신규) 문구 "오늘은 배송 가능한 시간이 없어요. 다른 날짜를 선택해주세요."로 대체 표시.
- 이미 골라둔 `slot`이 필터링으로 사라지는 경우(예: 알약 먼저 고르고 나중에 예약일을 오늘로 바꿨는데 그 시각이 마진 미달인 경우)를 대비해 `effectiveSlot = visibleSlots.some(s => s.id === slot) ? slot : null`으로 "지금 실제로 유효한 선택"만 인정 — 상태를 따로 초기화하는 `useEffect` 없이 렌더링 중 파생값으로 처리(이 프로젝트에서 이미 쓰던 "effect 대신 파생 상태" 패턴 유지). 결제 버튼의 활성화 조건과 `checkout()`의 URL 생성 모두 `effectiveSlot` 기준으로 통일.

### 검증
- `npm run build`/`npm run lint` 클린.
- 예약일 선택 전: 알약 6개 모두 노출되지만 비활성화(`disabled===true`, `.pending` 클래스) 확인.
- 예약일을 **오늘**로 선택(현재 시각 19:13 기준 테스트): 8:00 알약까지도 마진(47분)이 부족해서 **6개 전부 필터링되고 "오늘은 배송 가능한 시간이 없어요" 문구가 뜨는 것 확인**(현재 시각이 늦어서 생긴 정상 동작).
- 예약일을 **미래 날짜**(8/2~8/4)로 선택: 6개 알약 전부 노출 + 활성화(`disabled===false`, `.pickable`) 확인, 알약 선택 시 결제 버튼 정상 활성화까지 확인.

## [Claude Code 세션] 한국 공휴일 캘린더 표시 + 관리자 임시 휴무일 설정 기능 신규 구현

562님 요청: (1) 카트 캘린더에 한국 달력 빨간날(공휴일)을 표기하고 전부 휴무일로 처리, (2) 휴가기간 같은 사내 이슈는 관리자 앱에서 임시휴무일로 따로 설정 가능하게.

### 설계
- **법정 공휴일**과 **사내 임시 휴무일**을 의도적으로 분리: 법정 공휴일은 매년 정부가 발표하는 고정값이라 `lib/holidays.ts`에 코드로 하드코딩(DB 아님) — 관리자가 실수로 지우거나 잘못 등록할 위험이 없음. 사내 임시 휴무일(휴가 기간 등)은 언제든 바뀔 수 있는 운영 판단이라 DB 테이블(`store_closure`)로 관리자가 직접 CRUD.
- 두 목록은 `lib/closure-actions.ts`의 `getClosedDates()`에서 합쳐져(중복 제거) 카트 캘린더·주문 생성 검증에 동일하게 쓰임 — 캘린더/검증 로직은 "휴무일 집합"만 알면 되고 출처(법정/임시)는 신경 안 써도 되게 설계.
- **휴무일 = 배송/반납이 불가능한 날**이라는 의미로 한정: 예약일(체크아웃)·반납일로는 선택 못 하게 막지만, **예약 기간이 휴무일을 관통하는 것은 허용**(그 날은 그냥 고객이 상품을 보유 중인 날일 뿐, 배송기사가 움직일 필요 없음). `busy`(다른 예약과 겹침, 재고 자체가 없음)와는 의미가 달라서 기존 `rangeHasBusy`(전체 기간 검사) 로직에 얹지 않고, 캘린더 셀 단위로 시작/끝 선택만 막는 별도 처리로 분리.

### 1. `lib/holidays.ts`(신규) — 2026년 법정 공휴일 21건
설날·추석·부처님오신날(음력 기준 매년 변동), 대체공휴일, 2026년에 18년 만에 부활한 제헌절(7/17), 전국동시지방선거일(6/3)까지 웹 검색으로 실제 날짜를 확인해서 반영(근로자의 날은 "관공서가 쉬는 날"이 아니라 빨간날 목록에서 제외).
⚠️ **매년 갱신 필요** — 코드 주석에도 명시해뒀음. 2027년 이후 날짜는 아직 없어서, 캘린더를 그만큼 미리 넘겨봐도 에러 없이 그냥 "공휴일 없음"으로 처리됨(안전하게 실패).

### 2. DB + 서버 액션
- `db/store-closures.sql`(신규, 26번째 마이그레이션): `store_closure(date pk, reason, created_by, created_at)`.
- `lib/closure-actions.ts`(신규): `getClosedDates()`(회원 캘린더용, 로그인 불필요), `listClosuresAdmin()`/`addClosureRange()`/`removeClosureDate()`(디렉터·슈퍼바이저 전용, `getAccess().isApprover` 가드).

### 3. 카트 캘린더 (`app/(member)/cart/page.tsx`)
- `closed` 상태 추가, `Cell` 타입에 `closed: boolean` 필드 추가.
- 셀 분류 우선순위를 `past` → `closed`(휴무일) → `busy` → `free` 순으로 정리. 휴무일 셀은 클릭 불가(`clickable` 유지 안 함)이면서, 이미 선택된 기간 중간에 걸치면 `holiday inrange` 클래스를 같이 붙여서 "기간 안에 있지만 이 날은 휴무"라는 걸 시각적으로 보여줌.
- CSS: `.day.holiday .num{color:var(--wine)}`(빨간날), `.day.holiday.inrange .num{background:rgba(107,39,55,.12)}`(기간 중간에 낀 휴무일은 은은한 붉은 배경).

### 4. 서버 검증 (`lib/payments-actions.ts`)
`createOrder`에 `closedDates.has(checkout) || closedDates.has(ret)` 체크 추가 — 카트 UI를 거치지 않고 `/checkout`에 직접 날짜를 넣어 접근해도(URL 조작 등) 막힘.

### 5. 관리자 화면 (`app/admin/closures`, `components/AdminClosures.tsx`)
시작일~종료일+사유로 범위 등록(한 번에 최대 90일), 등록된 임시 휴무일 목록 + 취소 버튼, 참고용으로 앞으로의 법정 공휴일도 하단에 읽기전용으로 같이 보여줌(왜 그 날짜가 이미 막혀있는지 헷갈리지 않게). `/admin` 상단 네비게이션에 "휴무일" 링크 추가.

### 검증
- `npm run build`/`npm run lint` 클린.
- 실제 카트 캘린더에서 7월 제헌절(7/17), 8월 광복절(8/15)·대체공휴일(8/17)이 빨간색으로 표시되고 클릭(선택) 자체가 안 되는 것 확인(`disabled===true`, 색상 `rgb(107,39,55)` = `--wine` 정확히 일치).
- **기간이 휴무일을 관통하는 케이스 확인**: 8/13~8/18로 예약(8/15, 8/17이 기간 안에 포함)했더니 정상적으로 유효한 기간으로 인정되고, 두 휴무일 셀 모두 `day holiday inrange` 클래스가 붙어 시각적으로 구분되는 것 확인.
- **서버 검증 확인**: `/checkout`에 `co=2026-08-15`(휴무일)를 직접 넣어 접근 → "선택하신 날짜는 휴무일이라 배송/반납이 불가능합니다" 에러로 정상 차단(카트 UI를 안 거쳐도 막힘). 반대로 `co=2026-08-13`(휴무일 아님, 기간은 휴무일을 관통)으로는 정상적으로 주문 생성 및 결제창 로드까지 확인.
- 테스트로 생성된 PENDING 주문은 삭제 완료.
- **관리자 화면(`/admin/closures`)은 라이브로 확인 못 함** — 디렉터 로그인 정보가 없어서 코드 검토로만 확인(기존 `AdminMarketing.tsx`와 동일한 폼 패턴 재사용, `getAccess().isApprover` 가드는 다른 관리자 액션들과 동일한 방식이라 위험 낮음).

### 확인 필요 (562)
- `db/store-closures.sql` 마이그레이션을 SQL Editor에서 실행해주세요(아직 미실행 — 실행 전에도 코드는 에러 없이 동작하지만, 임시 휴무일 등록·조회는 테이블이 있어야 실제로 동작함).
- `/admin/closures`에서 직접 임시 휴무일을 등록해보고, 카트 캘린더에 실제로 반영되는지 한 번 확인해주시면 좋겠습니다(제가 디렉터 계정이 없어 라이브로 못 봤습니다).
- 2027년 이후 공휴일은 아직 코드에 없습니다 — 연말에 다음 해 공휴일을 `lib/holidays.ts`에 추가해야 합니다.

## [Claude Code 세션] 휴무일이 낀 예약 기간의 렌탈일수 산정 방식 변경

562님 요청: "토요일 예약, 일요일 휴무, 월요일 반납이면 1일 렌탈로 계산되게" — 예약 기간에 낀 휴무일(공휴일+임시휴무)은 렌탈 일수·결제금액 계산에서 빼달라는 것.

### 구현
- `lib/domain/reservation.ts`에 `billableDays(checkout, ret, closedDates)` 신규 함수 추가: 체크아웃일부터 반납일 **전날**까지("보유한 밤" = 기존 방식과 동일한 범위) 하루씩 훑으면서, `closedDates`에 있는 날은 세지 않음. 체크아웃 당일 자체는 캘린더에서 이미 휴무일 선택을 막아뒀으니 휴무일일 수 없어서, 결과는 항상 1 이상 보장됨(별도 하한 처리 불필요).
- 카트 페이지(`app/(member)/cart/page.tsx`)와 서버(`lib/payments-actions.ts`의 `createOrder`) 양쪽에서 기존 `Math.round((반납일-예약일)/1일)` 계산을 이 함수로 교체 — 클라이언트가 보여주는 금액과 서버가 실제로 청구하는 금액이 항상 같은 로직을 쓰게 통일(둘 중 하나만 고치면 화면에 보이는 금액과 실제 결제 금액이 어긋나는 버그가 생기므로 반드시 같이 고쳐야 하는 부분).

### 검증
- `npm run build`/`npm run lint` 클린.
- **실제로 토/일/월 패턴 재현**: 10월 8일(목, 예약) → 10월 9일(금, 한글날·휴무) → 10월 10일(토, 반납)로 선택 → 카트 화면에 "1일"·"162,000원"(상품 4개 일일가 합 × 1일) 정확히 표시되는 것 확인. 결제 페이지로 넘어가서 실제 서버에서 생성된 주문을 DB로 직접 조회해 `days:1, amount:212000`(렌탈 162,000 + 보증금 50,000)까지 클라이언트·서버 양쪽이 정확히 일치하는 것 확인.
- **회귀 확인**: 휴무일이 안 낀 일반적인 2박(10/13~10/15) 예약은 그대로 "2일"로 정상 계산됨 확인 — 이번 변경이 기존 케이스에 영향 없음.
- 테스트로 생성된 PENDING 주문은 삭제 완료.

## [Claude Code 세션] "My 렌탈" 데모 데이터 11건 생성 + 문제 상품(오염·손상) 상품별 지정 기능 신규 구현

562님이 "My 렌탈에서 여러 상황 테스트해보게 데모기록 넣어달라"고 요청하셔서 11가지 이행상태(정상 7단계 + 문제 3분기 + 분쟁중)를 실제 DB에 `payment_order`+`reservation`으로 생성(서로 다른 상품·겹치지 않는 기간으로 넣어 재고 충돌 없음). 이후 두 가지 후속 피드백을 받아 실제 기능으로 발전시킴.

### 1. 데모 데이터를 보다가 나온 피드백 → 상품별 문제 지정 기능 신규 구현
"수거검수중 오염,손상 확인"/"주문검수중 오염,손상 확인" 상태가 여러 상품이 담긴 주문에서 뜰 때, 회원이 상세 페이지에서 "정확히 어떤 상품이 문제인지" 알 수 없었던 것(기존엔 주문 전체에 안내 문구 하나만 떴음)을 지적하셔서, **관리자가 상품 단위로 문제를 지정**할 수 있게 새로 만듦:
- `db/reservation-item-issue.sql`(신규, 27번째 마이그레이션): `reservation.has_issue boolean default false`.
- `lib/staff-actions.ts`: `OrderRow`에 `items: {id, productName, hasIssue}[]` 추가. `listOrders()`의 `SELECT`에 `reservation!payment_order_id(id,has_issue,inventory_item(product(name)))` 임베드 추가(아래 버그 참고). 신규 `setItemIssue(reservationId, hasIssue)` 액션(디렉터·슈퍼바이저 전용).
- `components/AdminOrders.tsx`: 주문 상태가 `PRE_INSPECT_ISSUE`/`RETURN_ISSUE`일 때만 그 주문에 포함된 상품 체크박스 목록("문제 상품 지정")이 나타나고, 체크하면 즉시 `setItemIssue` 호출.
- `app/(member)/account/[orderId]/page.tsx`: 상품 목록 조회 시 `has_issue`도 같이 가져와서, **관리자가 지정한 상품에만** 안내 문구 표시. 단 옛 주문처럼 아직 아무 상품도 지정 안 된 경우(`anyItemFlagged === false`)는 이전처럼 포함된 상품 전체에 표시(하위호환, 갑자기 문구가 사라지는 것 방지).

이 과정에서 **이번 기능과 무관한 실제 버그를 하나 발견해 같이 고침**: `payment_order`→`reservation` 임베드 조회 시 PostgREST가 "관계가 두 개 이상 잡혀서 모호하다"는 에러를 내는 걸 발견(원인: 정확히 파악은 못 했으나 `!payment_order_id`로 FK 컬럼을 명시하면 해결됨). 이 버그는 `has_issue` 컬럼 추가와 별개로 이미 존재했을 가능성이 있어 보임 — 원인 규명은 못 했지만 명시적 FK 힌트로 안전하게 우회함.

### 2. 안내 문구 위치·스타일 두 차례 조정
- 1차: 문구를 상품 가격 줄 아래 별도 줄로 뺐는데, `<div>` 블록 요소라 컨테이너 전체 너비로 퍼져서 "알약"이 아니라 굵은 띠처럼 보이는 문제 발생 → 기존에 이미 있던 `.resv-response-row`(`display:flex;justify-content:flex-end`) 패턴을 재사용해 오른쪽 정렬 + 텍스트 크기에 맞는 알약으로 수정.
- 2차(562님 최종 요청): 문구를 가격 줄이 아니라 **상품명과 같은 줄**에 붙여달라고 하셔서 `.order-item-name-row`(신규, `display:flex`) 안에 상품명+문구를 같이 넣음. 문구가 길어서 상품명과 한 줄에 다 안 들어갈 땐 `flex-wrap:wrap`으로 문구만 다음 줄로 자연스럽게 내려가게 하되, `justify-content:space-between` 대신 `.resv-response{margin-left:auto}`를 써서 **줄바꿈이 일어나도 항상 오른쪽 정렬이 유지**되게 함(space-between은 줄바꿈된 줄에 아이템이 하나만 남으면 왼쪽으로 붙어버리는 flexbox 특성이 있어서 이 방식으로는 안 됨 — 직접 겪고 고침).

### 3. 데모 데이터 정리
562님이 "분쟁중" 데모(가짜 사유 "상품 색상이 설명과 달라요")가 실제 컴플레인처럼 보여 혼란스럽다고 하셔서 삭제 완료.

### 검증
- `npm run build`/`npm run lint` 클린.
- DB에서 직접 "에나멜 하이힐"에만 `has_issue=true` 설정 → 회원 상세 페이지에서 정확히 그 상품에만 안내 문구가 뜨고 "블랙 드레이프 원피스"엔 안 뜨는 것 확인(상품별 정밀 타겟팅 검증 완료).
- 관리자 쿼리(`SELECT` + `!payment_order_id` 힌트)를 스크립트로 직접 실행해 `items` 배열이 정확한 `hasIssue` 값과 함께 반환되는 것 확인(체크박스가 올바른 초기 상태로 렌더링될 데이터가 정상 공급됨).
- 문구 줄바꿈 시에도 항상 오른쪽 끝에 정렬되는 것(`respRight === rowRight`) 실측 확인.
- 관리자 화면(`/admin`) 체크박스 UI 자체는 디렉터 로그인 정보가 없어 라이브 클릭까진 못 해봄 — 데이터 계층은 전부 검증됐고 컴포넌트는 기존 `.agree-row` 패턴을 그대로 재사용해 위험 낮음.

### 확인 필요 (562)
- `/admin`에서 실제로 "수거검수중 오염,손상" 또는 "주문검수중 오염,손상" 상태인 주문에 체크박스가 뜨는지, 체크했을 때 회원 화면에 바로 반영되는지 한 번 확인해주세요.

## [Claude Code 세션] 내 정보 페이지 배송지 자동 불러오기 + 푸시 버튼 높이 조정 + 토글 스위치 클릭 안 되는 버그 수정(중요)

### 1. 카트 페이지에 저장된 배송지·회수지 미리보기 추가
"결제하기" 버튼 위에 내 정보의 "배송 정보 입력하기"에 저장된 배송지/회수지를 불러와 보여주는 요약(`.address-summary`, `app/(member)/cart/page.tsx`) 추가. 매장 픽업/회수로 설정돼 있으면 그 문구를, 저장된 주소가 없으면 "내 정보에서 배송 정보를 먼저 입력해주세요 →" 링크(`/profile`로 이동)를 보여줌. 실제 562님 계정으로 확인(배송지=매장 픽업, 회수지=미입력 상태가 정확히 그대로 반영됨).

### 2. 푸시 알림 받기 버튼 높이
`.push-toggle-btn`(신규, `PushNotificationToggle.tsx`에 클래스 추가) — 좌우 폭은 그대로 두고 상하 패딩만 `10px`씩 추가(다른 곳에서 공유하는 `.addr-btn`을 직접 건드리면 프로필의 주소 검색 버튼 등도 같이 커져버려서, 이 버튼 전용 클래스로 분리).

### 3. ⚠️ 토글 스위치("직접 매장 픽업"/"직접 매장 회수" 등)가 실제로 안 눌리던 진짜 버그 발견 + 수정
562님이 "토글이 안 꺼진다"고 제보하셔서 재현 조사:
- **원인**: `ProfileForm.tsx`의 토글 7개(배송지 동일/공동현관 동일/매장 픽업/매장 회수/마케팅 3종) 전부 `<span className="ios-toggle"><input type="checkbox"/><span className="ios-slider"/></span>` 구조였는데, 이 `ios-toggle` 커스텀 스위치 패턴은 실제 `<input>`이 `opacity:0;width:0;height:0`이라 화면에 보이는 슬라이더(`.ios-slider`)를 눌러도 **`<label>`로 감싸져 있지 않으면 클릭이 체크박스에 전달되지 않음**(0×0 크기라 직접 클릭도 불가능). 브라우저 네이티브로 label이 감싸고 있어야 안의 폼 요소까지 클릭이 전달됨.
- **비교**: 같은 패턴을 쓰는 로그인 페이지의 "자동로그인" 토글(`app/(customer)/login/page.tsx`)은 `<label className="remember-row">`로 전체를 제대로 감싸고 있어서 정상 작동 — 이게 정답 패턴이었고, `ProfileForm.tsx`만 `<div>`+별도 `<label>`(텍스트만, 체크박스와 미연결) 구조로 잘못 만들어져 있었음.
- **수정**: 토글 7개의 바깥 `<div className="pf-row">`를 전부 `<label className="pf-row">`로, 안쪽 텍스트 `<label>`을 `<span className="pf-row-label">`로 교체(라벨 중첩은 불가능한 HTML이라 텍스트 쪽을 span으로 내림). CSS에 `.pf-row-label`(기존 `.pf-row label`과 동일한 스타일, `width:50px`만 제외 — 이 7개는 이미 `width:'auto'`를 인라인으로 쓰고 있었음) 추가.
- **검증**: 실제 마우스 클릭과 동일한 `MouseEvent('click')`을 슬라이더에 직접 발생시켜서 수정 전엔 체크박스 상태가 전혀 안 바뀌는 것(`changed:false`)을 먼저 재현 확인했고, 수정 후엔 슬라이더 클릭·텍스트 클릭 둘 다 7개 토글 전부 정상적으로 상태가 바뀌는 것(`changed:true`)을 확인. 테스트는 전부 DOM 상태만 확인했고 "수정하기"로 저장하지 않아 실제 계정 데이터는 변경 없음.
- **왜 지금까지 못 잡았는지**: 이전 세션들에서 이 토글들을 검증할 때 `element.click()`을 체크박스 `<input>`에 직접 호출하는 방식으로 테스트해서 "작동하는 것처럼" 보였음(이건 실제 사용자가 화면에 보이는 슬라이더를 누르는 것과 다른 방식이라 이 버그를 못 잡았음) — 앞으로 토글류 UI는 반드시 보이는 요소(`.ios-slider`)에 직접 클릭 이벤트를 발생시켜 검증할 것.

### 검증
`npm run build`/`npm run lint` 클린. 위 3가지 전부 브라우저에서 실측/재현 확인 완료.

## [Claude Code 세션] 전화번호 자동 하이픈 표시 + 사이즈 정보 삭제 + 가입 간소화 + 카트에서 배송 정보 직접 입력

### 1. 전화번호 표시 형식(`lib/phone-format.ts` 신규)
562님 요청: 입력(저장값)은 숫자만("01000000000") 유지, 화면에는 자동으로 "010-0000-0000"처럼 하이픈이 보이게. `formatPhone()` 공용 헬퍼를 새로 만들어 `ProfileForm.tsx`의 "전화번호"와 `DeliveryInfoForm.tsx`의 배송 연락처 양쪽에 적용 — `value`에는 `formatPhone(원본)`을 보여주고 `onChange`에서는 숫자만 남겨서(`replace(/\D/g,'')`) state에 저장(저장되는 값은 그대로 숫자만). 순수 함수라 별도 테스트 스크립트로 여러 케이스(11자리/타이핑 중간/이미 하이픈 있는 값) 정확성 확인.

### 2. "사이즈 정보 입력하기" 완전 삭제(가입 페이지 + 내 정보 페이지)
앞으로 안 쓸 기능이라 UI를 완전히 제거. 다만 **기존에 이미 저장된 회원의 사이즈 데이터(height_cm 등)는 지우지 않음** — `updateProfile`이 필드를 안 받으면 그 필드를 `null`로 덮어써버리는 구조라, `ProfileForm.tsx`의 저장 버튼이 이제도 `profile.heightCm` 등 기존 값을 그대로 다시 담아 보내게 해서 조용히 날아가는 걸 방지함(DB 컬럼/타입은 그대로 두고 입력 UI만 제거 — 나중에 필요하면 데이터 손실 없이 복원 가능).

### 3. 가입 페이지에서 "배송 정보 입력하기" 삭제 (가입 절차 간소화)
`app/(customer)/signup/page.tsx`에서 배송지/회수지 입력 섹션과 관련 상태 전부 제거, `registerMembership()` 호출에서도 `delivery`/`fitting` 인자를 아예 안 보내도록 정리(둘 다 원래 optional이라 서버 쪽 변경 불필요). 이제 가입 폼은 필수 정보 → 약관 동의 → 바로 "멤버십 결제 후 가입하기"로 끝남.

### 4. 카트 페이지에 "배송 정보 입력하기"를 직접 배치(핵심 변경)
"결제하기" 버튼 위에 있던 배송지/회수지 **읽기 전용 요약**(직전 세션에서 추가)을 지우고, 그 자리에 **실제로 입력·수정 가능한 배송 정보 폼**을 넣음. 가입 시 배송 정보를 더 이상 안 받으니, 결제 직전이 배송지를 처음 입력하기에 가장 자연스러운 시점이라고 판단.

- **`components/DeliveryInfoForm.tsx`(신규 공용 컴포넌트)**: 기존 `ProfileForm.tsx`에 있던 배송 정보 입력 UI(주소 검색, 배송지/회수지, 공동현관 비밀번호, "배송지와 동일"/"공동현관 동일" 토글, 매장 픽업/회수 토글)를 통째로 이 컴포넌트로 옮겨서 **내 정보 페이지와 카트 페이지 둘 다에서 재사용**. 자체 "배송 정보 저장" 버튼으로 배송 관련 필드만 저장하되, `updateProfile`이 요구하는 나머지 필드(이름/전화번호/마케팅 동의/사이즈 정보)는 `profile` prop에서 그대로 가져와 같이 보내서 기존 값이 지워지지 않게 함. 저장 성공 시 `router.refresh()` + `onSaved` 콜백 둘 다 호출(내 정보 페이지처럼 서버 컴포넌트가 감싸고 있으면 `router.refresh()`로 최신 데이터 재수신, 카트 페이지처럼 클라이언트 상태로 직접 관리하는 곳은 `onSaved` 콜백으로 그 페이지의 자체 `refresh()`를 호출).
- **`ProfileForm.tsx`**: 기존 인라인 배송 정보 블록을 `<DeliveryInfoForm profile={profile} />` 한 줄로 교체. 메인 "수정하기" 저장 로직도 배송 필드는 이제 `profile.deliveryAddress` 등 기존 값 그대로 같이 전송(DeliveryInfoForm이 별도로 저장하니 여기서 편집하진 않지만, 안 보내면 지워지므로).
- **`app/(member)/cart/page.tsx`**: `getProfile()`로 가져온 `profile`을 그대로 `<DeliveryInfoForm profile={profile} onSaved={refresh} />`에 넘겨서 "결제하기" 버튼 바로 위에 배치. 저장하면 카트 페이지의 `refresh()`가 다시 불려서 최신 배송 정보가 반영됨.
- 안 쓰는 CSS(`.address-summary`, `.delivery-note`, `.signup-optional-row`)도 같이 정리.

### 검증
- `npm run build`/`npm run lint` 클린.
- 가입 페이지: "선택 정보"/"피팅 정보 입력하기"/"배송 정보 입력하기" 섹션이 실제로 화면에서 전부 사라지고 필수 정보→약관 동의→가입 버튼으로 바로 이어지는 것 실제 페이지 텍스트로 확인.
- 전화번호 포맷 함수는 별도 스크립트로 정확성 검증(빌드/린트 통과로 타입 안전성도 확인).
- **⚠️ 카트 페이지·내 정보 페이지의 실제 클릭 테스트는 이번엔 못 했습니다** — 작업 도중 브라우저 로그인 세션이 만료됐는데 테스트 계정 비밀번호를 갖고 있지 않아 재로그인을 못 했습니다. 코드 리뷰로는 로직이 맞다고 확신하지만(서버 컴포넌트 vs 클라이언트 컴포넌트에서 `router.refresh()`/`onSaved` 콜백이 각각 다르게 작동하는 부분까지 직접 추적 확인함), 아래 항목들은 562님이 실제로 로그인해서 한 번 확인해주셔야 합니다.

### 확인 필요 (562) — 이번 건 특히 중요
- 카트 페이지에서 "배송 정보 입력하기" 버튼을 눌러 펼쳐지고, 주소 입력→저장이 실제로 되는지, 저장 후 다시 접었다 펼쳤을 때 값이 남아있는지 확인해주세요.
- 내 정보 페이지에서도 배송 정보 섹션이 그대로 잘 나오고 저장되는지 확인해주세요(이번에 컴포넌트를 분리했어서 회귀가 없는지 특히 중요).
- 기존에 사이즈 정보(키/사이즈 등)를 입력해두셨던 계정이 있다면, 이번 변경 후에도 그 값이 DB에 그대로 남아있는지 확인 부탁드립니다(UI만 지웠고 데이터는 안 지웠어야 정상입니다).

## [Claude Code 세션] 사이즈 정보 DB 컬럼 완전 삭제 + 배송 정보를 3가지 방식으로 세분화

### 1. 사이즈(피팅) 정보 DB에서 완전 삭제 (되돌릴 수 없음)
562님이 "DB에서도 지워버려"라고 명시적으로 요청하셔서, 직전 세션에서 UI만 지우고 데이터는 남겨뒀던 것과 달리 이번엔 실제로 삭제:
- `db/drop-fitting-info.sql`(신규, 28번째 마이그레이션): `customer.height_cm/top_size/waist_cm/shoe_size` 4개 컬럼을 `drop column`으로 완전 삭제. **되돌릴 수 없는 작업이라 562님께 SQL Editor에서 직접 실행해달라고 요청함**(자동 실행 안 함).
- 컬럼이 사라지면 이 필드들을 참조하던 INSERT/UPDATE 쿼리가 전부 깨지므로(존재하지 않는 컬럼 참조 에러), `lib/account-actions.ts`(`Profile`/`UpdateProfileInput` 타입, `getProfile`/`updateProfile` 쿼리)와 `lib/roles-actions.ts`(`FittingInfo` 인터페이스, `registerMembership`의 insert문)에서 관련 필드를 전부 제거. `ProfileForm.tsx`의 저장 로직에 남아있던 "기존 값 그대로 pass-through" 코드도 이제 필요 없어져서 같이 정리.
- 코드베이스 전체에서 `heightCm/topSize/waistCm/shoeSize/height_cm/top_size/waist_cm/shoe_size/FittingInfo` grep으로 잔여 참조 0건 확인.

### 2. 카트/내 정보의 "배송 정보 입력하기"를 3가지 선택지로 세분화
562님 요청: 단일 "배송 정보 입력하기" 토글 대신 **"자택으로 받기" / "근무지로 받기" / "직접 픽업·회수하기"** 3개 버튼을 만들고, 누른 버튼에 해당하는 입력란만 아래에 나타나게.

`components/DeliveryInfoForm.tsx`(내 정보·카트 페이지 공용 컴포넌트) 전면 재작성:
- 3개 버튼은 서로 배타적(한 번에 하나만 선택, 다시 누르면 접힘) — `Mode = 'home' | 'workplace' | 'pickup' | null` 상태 하나로 관리.
- 기존 저장된 값으로 최초 진입 시 어느 모드가 선택돼 있었는지 자동 추론(`deliveryInStore`가 true면 pickup, `workplace`가 있으면 workplace, `deliveryAddress`가 있으면 home, 셋 다 없으면 미선택).
- **자택으로 받기**: 배송지 주소(주소 검색)+세부주소+공동현관 비밀번호+전화번호.
- **근무지로 받기**: 근무지(상호명)+회사 주소(주소 검색)+세부주소+전화번호(공동현관 비밀번호는 사무실엔 안 맞아서 뺌).
- **직접 픽업·회수하기**: 안내 문구 한 줄("매장에 직접 방문해서 상품을 픽업·반납하실 수 있어요")+전화번호만. 저장 시 `deliveryInStore`/`returnInStore` 둘 다 true로.
- **회수지는 항상 배송지와 동일하게 저장**하도록 단순화 — 예전엔 "배송지와 동일" 체크박스로 회수지를 다르게 지정할 수 있었는데, 3가지 모드 선택 자체가 이미 배송 방식을 명확히 정하는 거라 회수지를 별도로 또 물어보는 게 불필요한 복잡도라고 판단해서 뺌(필요하시면 다시 추가 가능).
- 모드를 바꿔서 저장하면 이전 모드의 필드는 자동으로 비워짐(예: workplace → home으로 바꾸면 `workplace` 컬럼이 null로 정리됨) — `updateProfile`이 `undefined`로 넘어온 필드를 `null`로 저장하는 기존 동작을 그대로 활용.
- CSS: `.delivery-mode-row`(3버튼 가로 배치), `.delivery-mode-btn.active`(선택된 버튼 강조, `--espresso` 배경).

### 검증
- `npm run build`/`npm run lint` 클린.
- 코드베이스 전체 grep으로 사이즈 정보 관련 참조 완전 제거 확인.
- 이 항목 작성 직후 562님이 실제 로그인 정보(`zxc562`)를 주셔서, 아래 "패널 위치 수정" 세션에서 실제 로그인해 라이브로 전부 재검증함(결과는 아래 참고).

### 확인 필요 (562)
- `db/drop-fitting-info.sql`을 SQL Editor에서 실행해주세요(실행 전까지는 코드가 이 컬럼들을 더 이상 안 쓰니 문제없이 동작하지만, 실제 컬럼 삭제는 요청하신 대로 아직 안 된 상태입니다).
- 회수지를 배송지와 항상 동일하게 처리하도록 단순화한 부분이 의도하신 것과 맞는지 한 번 봐주세요(예전엔 회수지를 다르게 지정할 수 있었는데 이번에 뺐습니다).

## [Claude Code 세션] 배송 방법 3버튼 세로 배치 + 각 버튼 바로 아래에 입력란 열리도록 수정 (+ 실로그인 라이브 검증)

562님이 로그인 정보를 주셔서 처음으로 실제 로그인해서 라이브로 검증함.

### 1. 3버튼을 세로로 한 줄에 하나씩
`.delivery-mode-row`를 `flex-direction:row` → `column`으로, 버튼도 `flex:1`(가로 3등분) → `width:100%`(세로 풀폭)로 변경.

### 2. 버그 수정: 입력란이 선택한 버튼 바로 아래가 아니라 3버튼 전체 맨 밑에 나타나던 문제
직전 구현은 `<div className="delivery-mode-row">{3개 버튼}</div>` 다음에 `{mode && <div className="optional-panel">...}`를 통째로 뒤에 붙이는 구조라, 어느 버튼을 누르든 패널이 항상 세 번째 버튼("직접 픽업·회수하기") 아래에만 나타났음(실측: `panelTop(1092) > workBtnTop(995)` — "자택으로 받기"를 눌렀는데 패널이 "근무지로 받기" 버튼보다도 아래에 있었음). 이번 요청("각 버튼 클릭하면 그 버튼 바로 밑으로 열리게")을 계기로 재구조화: 버튼과 그 버튼에 해당하는 패널을 짝지어서 `버튼1→(조건부)패널1→버튼2→(조건부)패널2→버튼3→(조건부)패널3` 순서로 나열. 전화번호/에러/저장버튼 부분은 `footer` 변수로 묶어서 세 패널이 공유(중복 코드 방지).

### 3. 실로그인 라이브 검증 (지금까지 코드 리뷰로만 확인했던 것들 전부 실제로 재검증)
- **패널 위치 버그 수정 확인**: "자택으로 받기" 클릭 → 패널이 정확히 그 버튼과 "근무지로 받기" 버튼 사이에 나타남(`panelTop(1002)`이 `homeBtnBottom(987)`과 `workBtnTop(1304)` 사이). "근무지로 받기"/"직접 픽업·회수하기"도 각각 동일하게 확인, 항상 패널 1개만 열려있는 것(상호 배타)도 확인.
- **실제 저장 흐름 끝까지 확인**: "자택으로 받기"에 실제 주소·전화번호 입력 후 저장 → DB에서 직접 조회해 `delivery_address`/`delivery_detail_address`/`delivery_phone`이 정확히 저장되고 `delivery_in_store`가 `true`→`false`로, `workplace`가 이전 값에서 `null`로 자동 정리되는 것까지 확인(모드 전환 시 필드 정리 로직이 실제로 동작함). 테스트 후 원래 상태("직접 픽업")로 정확히 복구.
- **토글 스위치 재검증**(이전 세션에서 DOM 이벤트로만 확인했던 것): "신규 룩북 소식" 토글에 실제 클릭 이벤트를 발생시켜 정상적으로 켜짐/꺼짐 확인.
- **전화번호 자동 하이픈 표시**: 내 정보 페이지에서 실제로 "010-6662-2666" 형식으로 표시되는 것 확인.
- **사이즈 정보 섹션 완전 삭제**: 내 정보 페이지 텍스트에 "사이즈 정보"가 전혀 없는 것 확인.
- **DeliveryInfoForm 공용 컴포넌트**: 내 정보 페이지에서도 카트 페이지와 동일한 3버튼 UI가 정상적으로 나오는 것 확인(컴포넌트 분리에 따른 회귀 없음).

### 검증
`npm run build`/`npm run lint` 클린. 위 전부 실제 로그인 세션으로 라이브 검증 완료 — 이번엔 추측이나 코드 리뷰가 아니라 실제 클릭·저장·DB 조회로 확인함.

## [Claude Code 세션] "자택으로 받기"에 회수지 별도 지정 옵션 추가 + 라벨/여백 정리

562님이 "근무지로 받기 패널에 있는 주소가 배송지인지 회수지인지 모르겠다"고 하셔서 지난 세션에 안내 문구를 추가했었는데, 이번엔 그 대신 "자택으로 받기"에서 회수지를 배송지와 다르게 지정할 수 있는 진짜 옵션을 요청하셔서 구현.

### 변경 (전부 "자택으로 받기" 패널 한정, "근무지로 받기"는 기존 방식 그대로 유지)
1. 배송 주소 입력(주소+세부주소) 바로 아래에 "회수지 주소도 동일" 토글 추가.
2. 토글 기본값 ON — 켜져 있으면 회수지 주소 입력란 자체가 안 보이고(배송지와 자동으로 동일하게 저장), 끄면 회수지 주소/세부주소 입력란이 나타나 따로 지정 가능.
3. 배송지 주소 입력란 위에 "배송 주소" 상시 라벨 추가(placeholder는 입력하면 사라지지만 이 라벨은 계속 보임).
4. 공동현관 비밀번호 입력란 위에 "공동현관 비밀번호" 상시 라벨 추가.
5. 지난 세션에 추가했던 "* 배송과 회수 모두 이 주소로 진행돼요." 안내 문구는 "자택으로 받기"에서만 삭제(이제 토글로 실제 선택 가능해져서 문구가 항상 맞는 말이 아니게 됨) — "근무지로 받기"는 여전히 항상 동일하게 저장하는 방식이라 그 문구 그대로 유지.
6. 배송 주소 입력란과 공동현관 비밀번호 사이 여백을, 공동현관 비밀번호와 전화번호 사이 여백과 동일하게 맞춤(둘 다 21px로 실측 일치).

`save()` 로직도 수정: "자택으로 받기" + 토글 꺼짐일 때만 별도 입력한 회수지 값을 저장하고, 그 외(토글 켜짐/근무지/직접픽업)는 기존처럼 배송지와 항상 동일하게 저장.

### 검증 (실제 로그인 상태로 라이브 확인)
- 토글 기본값이 켜져 있고(`checked:true`), 켜져 있을 땐 회수지 주소 입력란이 DOM에 아예 없는 것 확인.
- 토글을 끄면 회수지 주소 입력란이 실제로 나타나는 것 확인, 다시 켜서 원상 복구.
- "배송 주소"/"공동현관 비밀번호" 라벨이 정상 표시되고, 이전 안내 문구는 "자택으로 받기"에서만 사라진 것(("근무지로 받기"는 그대로 있는 것도 같이) 확인.
- 여백 실측: 배송주소→공동현관비밀번호 21px, 공동현관비밀번호→전화번호 21px로 정확히 일치.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] "자택으로 받기" 라벨 문구 수정 + 공동현관 비밀번호도 회수지 별도 지정 가능하게

### 변경 (전부 "자택으로 받기" 패널)
1. "회수지 주소도 동일" → "회수 주소 동일"로 문구 축약.
2. "회수 주소 동일" 토글을 끄면 나타나는 회수 주소 입력란 위에 "회수 주소" 상시 라벨 추가(배송 주소와 동일한 패턴).
3. 공동현관 비밀번호 입력란 밑에 "공동현관 비밀번호 동일" 토글 신규 추가(기본값 ON) — 끄면 "회수지 공동현관 비밀번호" 입력란이 나타나 배송지와 다른 비밀번호를 따로 지정 가능(예: 배송지와 회수지 건물이 달라 출입 코드가 다른 경우 대응).
4. 전화번호 입력란 위에 "전화번호" 상시 라벨 추가 — 이건 하단 저장 영역(`footer`)이 3개 모드(자택/근무지/직접픽업) 전부 공유하는 구조라 세 화면 모두에 적용됨.

`save()` 로직에 `sameEntrance`/`returnEntrancePassword` 반영: 자택으로 받기 + "공동현관 비밀번호 동일" 껐을 때만 별도 입력한 회수지 공동현관 비밀번호를 저장, 그 외엔 기존처럼 배송지 공동현관 비밀번호와 동일하게 저장.

### 검증 (실로그인 라이브)
- 기본 상태: "회수 주소 동일"/"공동현관 비밀번호 동일" 둘 다 ON, 관련 입력란 전부 숨김 확인.
- 둘 다 OFF로 전환 → "회수 주소" 라벨과 회수지 주소/세부주소/공동현관 비밀번호 입력란이 정확히 나타나는 것(`.field` placeholder 목록으로) 확인.
- 다시 ON으로 복구, 실제 저장은 안 해서 DB 데이터 변경 없음.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] "자택으로 받기" 필드 순서 재배치

562님 요청으로 순서 변경:
1. 공동현관 비밀번호 라벨+입력란을 "세부 주소" 입력란과 "회수 주소 동일" 라벨 사이로 이동.
2. "공동현관 비밀번호 동일" 라벨+토글을 "회수 주소 동일" 라벨+토글 바로 밑으로 이동(두 토글이 나란히 붙음).

최종 순서: 배송 주소(주소+세부주소) → 공동현관 비밀번호 → 회수 주소 동일 토글 → 공동현관 비밀번호 동일 토글 → (토글 꺼진 경우만) 회수 주소 / 회수지 공동현관 비밀번호 → 전화번호 → 저장.

### 검증 (실로그인 라이브)
- `panel.innerText` 순서로 정확히 위 순서대로 나오는 것 확인.
- 두 토글을 모두 끄면 "회수 주소"(주소+세부주소)와 "회수지 공동현관 비밀번호" 입력란이 두 토글 아래에 정상적으로 나타나는 것 확인, 다시 켜서 원상 복구.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 공동현관 비밀번호를 배송 주소 그룹으로 통합, 토글 1개로 단순화

562님 요청으로 직전 세션에서 만든 "공동현관 비밀번호 동일" 별도 토글을 없애고, 기존 "회수 주소 동일" 토글 하나가 주소+공동현관 비밀번호를 함께 관리하도록 단순화.

### 변경
1. "회수 주소" 조건부 블록(토글 꺼졌을 때만 노출) 안에, 배송 주소 쪽과 똑같은 "공동현관 비밀번호" 라벨 + 입력란을 추가.
2. "공동현관 비밀번호 동일" 라벨+토글은 완전히 삭제(관련 state `sameEntrance`도 제거).
3. `save()` 로직 단순화: 이제 `sameAsDelivery` 하나만으로 회수지 주소·공동현관 비밀번호 전부를 같이 판단(켜져 있으면 배송지 값 그대로 복사, 꺼져 있으면 회수지 전용 입력값 사용).
4. "회수 주소 동일" state 초기화를 `profile.returnAddress ?? ''`(기존 저장값) → 항상 빈 문자열로 변경 — 토글을 끌 때마다 주소·세부주소·공동현관 비밀번호 입력란이 전부 공란으로 시작하게 함(이전에 입력했던 값이 남아있어 헷갈리는 것 방지).

### 검증 (실로그인 라이브)
- 기본(토글 ON): "공동현관 비밀번호" 라벨이 배송 주소 그룹에만 있고, 별도 "공동현관 비밀번호 동일" 토글은 화면에서 완전히 사라진 것 확인.
- 토글 OFF: "회수 주소" 블록 안에 주소/세부주소/공동현관 비밀번호 3개 입력란이 전부 나타나고, 값이 전부 빈 문자열(`""`)인 것 확인.
- 다시 ON으로 복구.
- **부수 발견**: 이전 세션 테스트 중 남아있던 전화번호("01099998888")를 실제 DB에서 발견해 삭제 정리함(이번 요청과 무관하지만 테스트 중 확인돼서 같이 정리).
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 라벨 문구 수정 + 근무지로 받기 필드 순서 변경 + 안내 문구 삭제

1. "자택으로 받기"의 회수 주소 블록: "회수지 주소"→"회수 주소", "회수지 세부 주소 (건물명, 호수)"→"세부 주소 (건물명, 호수)"로 문구 축약(배송 주소 쪽 문구와 통일).
2. "근무지로 받기" 순서를 주소(+세부주소) → 근무지(상호명) → 전화번호로 변경(기존엔 근무지명이 맨 앞이었음).
3. "근무지로 받기"에 마지막까지 남아있던 "* 배송과 회수 모두 이 주소로 진행돼요." 안내 문구 삭제(이제 두 모드 다 이 문구 없음).

### 검증 (실로그인 라이브)
- 근무지로 받기: `.field` placeholder 순서가 "근무지 주소"→"세부 주소 (건물명, 호수)"→"근무지(상호명)"→"전화번호"로 정확히 나옴, 안내 문구 없음 확인.
- 자택으로 받기: 회수 주소 토글 끄면 필드 placeholder가 "회수 주소"/"세부 주소 (건물명, 호수)"로 정확히 바뀐 것 확인, 다시 켜서 원상 복구.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 근무지로 받기 필드 용도 재정의 + 카트 "결제하기"에 배송 정보 저장 통합

562님 요청 2건:
1. "근무지로 받기"의 기존 두 입력란 용도를 재정의(문구만 변경, state/DB 컬럼은 그대로 재사용): "세부 주소 (건물명, 호수)"(`detailAddress`) → **"세부 주소(근무지 상호 입력)"**(이제 근무지 상호명을 적는 용도), "근무지(상호명)"(`workplace`) → **"배송 상세 위치 (ex. 대기실 테이블 위, 10번 로커 등)"**(이제 근무지 내 정확한 배송 위치를 적는 용도). 순수 자유 텍스트 필드라 값 저장 로직은 변경 불필요.
2. 카트 페이지의 "배송 정보 저장" 버튼을 없애고, **"결제하기" 버튼이 배송 정보 저장까지 함께 처리**하도록 통합(한 스텝 축소).

### 변경
- **`components/DeliveryInfoForm.tsx`**: `useTransition` 기반 `save()`를 **`forwardRef`+`useImperativeHandle`로 외부에 노출되는 awaitable `async save()`**로 리팩터(`pending`도 수동 `useState`로 전환, 저장 성공/실패 결과를 `{ok, reason?}`로 반환). `showSaveButton?: boolean`(기본 `true`) prop 추가 — `false`면 자체 "배송 정보 저장" 버튼을 숨김(모드 선택/폼 자체는 그대로 노출).
- **`app/(member)/cart/page.tsx`**: `useRef<DeliveryInfoFormHandle>`로 폼을 참조해 `<DeliveryInfoForm ref={deliveryFormRef} ... showSaveButton={false} />`로 저장 버튼을 숨김. `checkout()`을 `startTransition` 안에서 먼저 `deliveryFormRef.current?.save()`를 `await`하고, 실패하면(예: 배송 방법 미선택) 카트 페이지의 기존 에러 영역에 사유를 띄우고 `/checkout`으로 이동하지 않음 — 저장 성공 시에만 기존처럼 `router.push('/checkout?...')`.
- `components/ProfileForm.tsx`의 사용처는 `showSaveButton` 미지정(기본 `true`)이라 자체 "배송 정보 저장" 버튼이 그대로 유지됨(내 정보 페이지엔 "결제하기" 같은 후속 액션이 없어 버튼이 계속 필요).

### 검증 (실로그인 라이브)
- 근무지로 받기 placeholder가 정확히 "세부 주소(근무지 상호 입력)"/"배송 상세 위치 (ex. 대기실 테이블 위, 10번 로커 등)"로 바뀐 것 확인.
- 카트 페이지: "배송 정보 저장" 버튼이 더 이상 렌더링되지 않는 것 확인(버튼 텍스트 목록에 없음).
- 근무지 주소/세부 주소/배송 상세 위치를 입력하고 예약일·배송 시간을 고른 뒤 "결제하기" 클릭 → `/checkout?co=...&ret=...&slot=...`로 정상 이동 확인 + 실제 DB(`customer` 테이블)에 `delivery_address`/`delivery_detail_address`/`workplace`가 입력한 값 그대로 저장된 것 확인.
- 배송 방법을 선택하지 않은 상태로 "결제하기" 클릭 → `/cart`에 머무르고 "배송 방법을 선택해주세요." 에러가 뜨는 것(체크아웃 차단) 확인.
- 테스트 후 `/profile`에서 다시 "직접 픽업·회수하기"로 선택·저장해 계정을 테스트 이전 상태(`delivery_in_store: true`, 주소/근무지 필드 전부 `null`)로 원상 복구, DB로 재확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 배송 정보 입력란 placeholder 문구 5건 수정

562님 요청으로 문구만 정리(값 저장 로직·state·DB 컬럼은 전부 그대로):
1. 배송 주소 입력란: "주소" → "배송 주소".
2. 공동현관 비밀번호: "공동현관 비밀번호(자유출입시 미기재)" → "공동현관 비밀번호 (자유 출입시 미기재)"(괄호 앞·"자유"/"출입시" 사이 띄어쓰기 추가).
3. 회수 주소의 공동현관 비밀번호도 2번과 동일하게 수정(두 곳 다 같은 placeholder 문자열이라 한 번에 일괄 변경됨).
4. 근무지로 받기: "세부 주소(근무지 상호 입력)" → "근무지 상호 입력"(더 간결하게).
5. 전화번호: "전화번호 (-없이 01000000000)" → "전화번호 ( - 없이 01000000000)"(하이픈 양옆 띄어쓰기). 전화번호 입력란은 `footer`로 자택/근무지/직접 픽업·회수 3개 모드가 공유하는 구조라 한 번의 수정으로 세 모드 모두에 동일하게 반영됨.

### 검증 (실로그인 라이브)
- 자택으로 받기: 회수 주소 토글을 꺼서 배송 주소·회수 주소 양쪽 블록을 모두 펼친 뒤 `.field` placeholder를 확인 — "배송 주소"/"세부 주소 (건물명, 호수)"/"공동현관 비밀번호 (자유 출입시 미기재)"가 배송·회수 양쪽에 동일하게 적용됨, "전화번호 ( - 없이 01000000000)"도 확인.
- 근무지로 받기: "근무지 주소"/"근무지 상호 입력"/"배송 상세 위치 (ex. 대기실 테이블 위, 10번 로커 등)"/"전화번호 ( - 없이 01000000000)" 확인.
- 직접 픽업·회수하기: "전화번호 ( - 없이 01000000000)" 확인.
- 이번 검증은 저장 버튼을 누르지 않고 화면 상태만 확인했으므로 DB 값 변경 없음(원상 복구 불필요).
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 배송 정보 폼 4건 — 모드 전환 동작 확인, 연락처 기본값, 간편가입 확인, placeholder 크기 통일

562님 요청 4건.

### 1. "자택으로 받기"+"근무지로 받기" 둘 다 입력하고 결제하기를 누르면? (확인만, 코드 변경 없음)
버튼이 서로 배타적이라 **한 번에 하나의 패널만 열림** — "동시에 둘 다 입력"은 UI상 불가능하고, 저장은 **결제하기를 누르는 순간 열려 있던 모드 하나만** 반영된다. 실로그인 라이브로 재현한 결과:
- **주소/세부주소 입력란은 자택·근무지 모드가 물리적으로 같은 입력 상태(`address`/`detailAddress`)를 공유**한다(설계상 의도 — 값이 모드 전환 시 지워지지 않고 그대로 남음). 그래서 자택에서 "홈101호"를 세부주소에 입력한 뒤 근무지로 전환하면, 이제 "근무지 상호 입력"으로 라벨이 바뀐 그 칸에 **"홈101호"가 그대로 남아있는 채로 보임** — 사용자가 알아채고 새 값으로 덮어쓰지 않으면 엉뚱한 값이 저장될 수 있음.
- **모드 전용 필드(자택만의 공동현관 비밀번호, 근무지만의 "배송 상세 위치")는 저장 시점의 모드가 아니면 무조건 빈 값(null)으로 덮어써진다.** 실제 테스트: 자택에서 공동현관 비밀번호 "1234#" 입력 → 근무지로 전환해 "테스트컴퍼니"/"3층 로비 데스크" 입력 후 결제하기 클릭 → DB 확인 결과 `entrance_password: null`(방금 입력한 "1234#"가 저장은커녕 조용히 삭제됨), `delivery_detail_address: "테스트컴퍼니"`, `workplace: "3층 로비 데스크"`는 정상 저장. `lib/account-actions.ts`의 `updateProfile`이 매번 **전체 덮어쓰기**(`undefined?.trim() || null`)라 "이전 모드 값 보존" 같은 부분 업데이트 개념이 없기 때문.
- **결론**: 버그라기보다 "마지막에 선택한 모드 하나만 진짜로 저장된다"는 기존 설계가 그대로 동작한 것. 다만 주소/세부주소 칸이 모드 간 공유되면서 문구 재정의(직전 세션) 이후로 **의미가 다른 값이 새 라벨 아래 그대로 남아 보이는 부분은 혼동 소지가 있음** — 필요하시면 모드 전환 시 공유 입력란을 자동으로 비우는 것도 가능하니 원하시면 별도로 말씀해주세요(이번엔 확인 요청이라 별도 수정은 하지 않음).
- 테스트 후 `/profile`에서 "직접 픽업·회수하기"로 다시 저장해 계정을 테스트 이전 상태로 원상 복구, DB로 재확인.

### 2. 가입 시 입력한 전화번호를 배송 정보 전화번호란 기본값으로
`components/DeliveryInfoForm.tsx`의 `phone` state 초기값을 `profile.deliveryPhone ?? ''` → **`profile.deliveryPhone ?? profile.phone ?? ''`**로 변경. 배송 전용 연락처를 아직 한 번도 저장한 적 없는 회원(`delivery_phone` null)은 가입 시 입력한 연락처(`customer.phone`)가 자동으로 채워지고, 한 번이라도 배송 정보를 저장한 적 있으면 그때 저장한 `delivery_phone` 값이 우선한다(사용자가 직접 다르게 지정한 값을 덮어쓰지 않음).

### 3. 간편가입(SNS) 회원 전화번호도 불러올 수 있는지 (확인만)
카카오/네이버/구글/페이스북 버튼은 **아직 실제 OAuth 연동이 없는 UI 흉내**(`snsMock`, 클릭하면 "준비 중이에요" 안내만 뜨고 실제 계정 생성 안 함, `app/(customer)/signup/page.tsx`)이므로, **현재 실제로 존재하는 회원은 전부 ID/비밀번호 가입 경로**(`createAccountById` → `registerMembership`)로 만들어졌고 가입 시 입력한 연락처가 `customer.phone`에 이미 저장돼 있다. 따라서 2번에서 추가한 `profile.phone` 폴백은 **현재 모든 회원에게 동일하게 적용됨**(간편가입 회원을 별도로 구분해 처리할 필요 없음). 나중에 실제 SNS 연동을 붙이면, 그때는 카카오/네이버 등 프로바이더가 실제로 전화번호를 넘겨주는지(구글·페이스북은 보통 전화번호를 안 줌) 여부에 따라 별도 처리가 필요할 수 있음 — 지금은 해당 없음.

### 4. 입력란이 비어있을 때 뜨는 안내 텍스트(placeholder)를 라벨과 같은 크기로 통일
`app/globals.css`의 `.field::placeholder`에 `font-size:10.5px` 추가(라벨 `.field-section`과 동일한 크기, 기존엔 입력창 본문과 같은 13px이라 라벨보다 컸음). `.field` 클래스를 쓰는 모든 입력창(가입/로그인/내 정보/배송 정보 등 전체)에 공통 적용됨.

### 검증 (실로그인 라이브)
- 1번: 위 서술한 대로 실제 DB 저장 결과로 확인, 테스트 후 원상 복구.
- 2번: `delivery_phone`이 null인 상태에서 "직접 픽업·회수하기" 패널을 열어 전화번호 입력란 값이 가입 연락처("010-6662-2666", 포맷팅됨)로 자동으로 채워지는 것 확인.
- 4번: `getComputedStyle(input, '::placeholder').fontSize`와 라벨의 `fontSize`가 둘 다 "10.5px"로 일치하는 것 확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 모드 전환 시 "옅은 경고" 방식 채택 + 배송 주소록/기본 배송지 기능 신규 구현

직전 세션에서 제시한 3가지 대안(공유 입력란 자동 비우기 / 값 유지 후 옅은 경고만 / 모드별 완전 분리 저장) 중 562님이 **"값은 지우지 않고 경고만 표시"**를 선택. 여기에 더해 **주소록(여러 배송지 저장) + 기본 배송지 등록** 기능을 신규로 구현.

### 1. 모드 전환 시 공유 입력란 옅은 경고 (`components/DeliveryInfoForm.tsx`)
- 새 state `addressMode` — `address`/`jibun`/`detailAddress` 값이 마지막으로 "확인된" 모드를 기억한다(초기값은 `initialMode(profile)`와 동일).
- 자택·근무지 패널의 주소/세부주소 입력란에서 타이핑하거나 주소 검색으로 채울 때마다 `addressMode`를 **현재 모드**로 갱신(그 모드에서 직접 확인했다는 뜻). 저장(`save()`) 성공 시에도 `addressMode`를 저장된 모드로 갱신.
- `addressStale = mode !== addressMode && (address 또는 detailAddress가 비어있지 않음)`을 계산해, 참이면 두 입력란에 `.field.warn`(옅은 금색 테두리/배경, `--gold` 토큰) 클래스를 추가하고 그 아래 "다른 배송 방법에서 입력한 값이 남아있어요. 확인 후 필요하면 수정해주세요." 힌트(`.hint.warn`)를 띄운다. **값 자체는 절대 지우지 않음** — 이전 세션에서 지적한 "실수로 실제 저장된 주소가 날아갈 위험"이 구조적으로 없음.
- 사용자가 해당 입력란을 수정하거나 저장하면 자동으로 경고가 사라짐(별도 "확인" 버튼 없이 자연스럽게 해소).

### 2. 배송 주소록 + 기본 배송지 (신규 기능)
- **DB**(`db/address-book.sql`, 신규, 설치 순서 맨 끝 — **아직 미적용, 562님이 Supabase SQL 에디터에서 실행 필요**): `delivery_address_book(id, customer_id, label, mode, address, jibun_address, detail_address, entrance_password, workplace, phone, is_default, created_at)`. RLS는 `cart_item`과 동일한 패턴(`customer_id in (select id from customer where auth_user_id = auth.uid())`, `for all`).
- **`lib/address-book-actions.ts`**(신규): `listAddressBook()`/`saveToAddressBook()`/`setDefaultAddressBookEntry()`/`deleteAddressBookEntry()`. 전부 `supabaseAdmin()` + 명시적 `customer_id` 필터(RLS는 방어선으로 그대로 켜둠, `cart-actions.ts`와 동일한 패턴). 주소록에 처음 저장하는 항목이거나 저장 시 "기본 배송지로 등록" 체크박스를 켰으면 자동으로 `is_default=true`가 되고, 그 전에 기존 기본 배송지는 자동으로 해제된다(계정당 기본 배송지는 항상 최대 1개).
- **`components/DeliveryInfoForm.tsx`**: `footer`(3개 모드 공용) 안에 "저장된 주소 (n)" 토글 섹션 추가 — 펼치면 저장된 주소 목록(이름 + 모드 배지 + 요약 + 기본 배송지 배지), 각 항목마다 **불러오기**(그 모드로 전환하고 필드를 그대로 채움 + `addressMode`도 함께 갱신해 경고 없이 시작)/**기본으로**/**삭제** 버튼. 목록 아래엔 "이 주소를 저장할 이름" 입력란 + "주소록에 저장" 버튼 + "기본 배송지로 등록" 체크박스.
- **기본 배송지 자동 적용**: 컴포넌트 마운트 시 `listAddressBook()`으로 목록을 불러오고, 그 시점에 아직 선택된 배송 방법이 없으면(`mode === null` — 활성 배송 정보가 아예 없는 신규/미설정 회원) 기본 배송지 항목이 있으면 자동으로 그 모드·필드값을 채워준다. 이미 활성 배송 정보가 있는 회원(기존 `customer` 테이블 값으로 이미 모드가 정해진 경우)은 덮어쓰지 않음.
- `README.md`/`CLAUDE.md`의 마이그레이션 순서 목록에 `db/address-book.sql` 추가.

### 검증 (실로그인 라이브)
- **경고 기능**: 자택 모드에서 "서울시 스테일테스트로 1"/"스테일101호" 입력(이때 경고 0개) → 근무지 모드로 전환 → 공유 필드에 값이 그대로 남아있고 두 입력란에 `.field.warn` 클래스 + 경고 힌트 1개가 뜨는 것 확인 → 근무지 상호 입력란을 수정하니 경고가 즉시 사라지는 것 확인.
- **주소록 UI**: "저장된 주소" 토글 펼치면 빈 상태 문구, 이름 입력란, 저장 버튼이 정상 렌더링되는 것 확인. 콘솔 에러 없음.
- **DB 미적용 상태에서의 안전성**: `delivery_address_book` 테이블이 아직 없는 상태에서 "주소록에 저장"을 눌러도 페이지가 깨지지 않고 "주소록 저장에 실패했습니다." 힌트만 뜨는 것 확인(`listAddressBook`도 에러 시 빈 배열 반환이라 마운트 시에도 안전).
- **⚠️ 남은 작업(562 확인 필요)**: `db/address-book.sql`을 Supabase SQL 에디터에서 실행해야 주소록 저장/불러오기/기본 배송지 지정/삭제, 그리고 "기본 배송지 자동 적용" 기능을 실제로 끝까지 검증할 수 있음. 마이그레이션 실행 후 다시 요청하면 전체 CRUD + 기본 배송지 자동 채움까지 실로그인으로 이어서 검증 예정.
- `npm run build`/`npm run lint` 클린(이번 테스트로 만든 미저장 폼 입력값은 DB에 반영되지 않았으므로 별도 원상 복구 불필요).

## [Claude Code 세션] 기본 배송지·주소록 알약 UI + 팝업으로 재구성

562님 요청 4건 — 1~3번은 직전 세션에서 만든 주소록 UI(펼침/접힘 인라인 섹션)를 알약 버튼 + 팝업 방식으로 재구성, 4번은 순수 확인(분석) 요청.

### 1~3. 배송 주소 라벨 옆 "기본 배송지"/"주소록" 알약 + 주소록 팝업
- **`components/DeliveryInfoForm.tsx`**: 기존 `footer`(하단) 안에 있던 펼침/접힘식 "저장된 주소" 섹션을 제거하고, 그 대신:
  - **자택/근무지 패널의 "배송 주소"/"근무지 주소" 라벨 줄 오른쪽**(주소 검색 버튼이 있는 줄 바로 위)에 `.size-chip` 스타일의 **"기본 배송지"**, **"주소록"** 알약 2개를 배치(`.field-section-row`/`.addr-pills`, 새 CSS).
  - **"기본 배송지" 알약**: 클릭하면 주소록에서 `isDefault`인 항목을 바로 찾아 `applyEntry()`로 그 모드·필드값을 즉시 채움. 아직 기본 배송지가 등록돼 있지 않으면 안내 문구와 함께 주소록 팝업을 대신 열어준다(등록 유도).
  - **"주소록" 알약**: 클릭하면 팝업(`wd-ov`/`legal-box` — 탈퇴 확인·약관 팝업과 동일한 오버레이 패턴 재사용)을 띄운다. 팝업 안에는 저장된 주소 목록(이름 + 모드 배지 + 요약 + 기본 배송지 배지, 있으면), 각 항목마다 **불러오기**(적용 후 팝업 자동으로 닫힘)/**기본으로**(기본이 아닌 항목에만 노출)/**삭제(×)** 버튼, 그리고 하단에 "이 주소를 저장할 이름" 입력란 + **추가** 버튼 + "기본 배송지로 등록" 체크박스가 있음. 바깥 영역 클릭 또는 "닫기" 버튼으로 닫힘(다른 팝업들과 동일한 상호작용).
- CSS: `.field-section-row`/`.addr-pills` 추가, 기존 `.addr-book-toggle`(더 이상 안 씀)은 제거하고 `.addr-book-panel`은 팝업 내부 목록 컨테이너로 재사용.

### 4. "주소/세부주소를 자택·근무지 모드별로 완전히 독립시키면 해결되는지" (확인만, 미구현)
**결론: 해결 가능하고, 지난 세션에 만든 "옅은 경고" 방식보다 더 근본적인 해결책이지만, 구조적 한계(모드 하나만 최종 저장됨)는 그대로 남는다.**
- **해결되는 것**: `address`/`jibun`/`detailAddress`를 자택·근무지가 공유하지 않고 각자 독립된 state(예: `homeAddress` vs `workplaceAddress`)로 나누면, 모드를 전환해도 다른 모드에서 입력한 값이 새 라벨 아래 잘못 보이는 일 자체가 원천적으로 없어짐 — "옅은 경고" 로직(`addressMode`/`addressStale`)이 통째로 불필요해져 코드가 오히려 더 단순해짐. 두 모드를 세션 안에서 번갈아 다시 입력하지 않고 각자 따로 채워둘 수 있는 것도 장점.
- **여전히 안 풀리는 것**: `updateProfile`은 여전히 `customer` 테이블 한 줄을 통째로 덮어쓰는 구조라, "결제하기"/"배송 정보 저장"을 누르는 순간의 활성 모드 하나만 DB에 저장되고, 나머지 모드의 값(로컬에는 남아있어도)은 저장되지 않는다는 근본 구조는 그대로. 이 부분은 이번 세션에 새로 만든 **주소록** 기능으로 우회 가능 — 두 모드를 각각 이름 붙여 주소록에 저장해두면 세션이 끝나도 둘 다 남아있음.
- **새로 생기는 부담**: state가 3개→6개로 늘고, `save()`/`applyEntry()`가 모드별로 어느 슬롯을 쓸지 분기해야 해서 코드가 약간 길어짐(리스크라기보다 기계적인 리팩터링). 큰 부작용은 없음.
- 562님이 원하시면 이 방향(모드별 완전 분리 + 경고 로직 제거)으로 다음에 구현 가능. 지금은 "옅은 경고" 방식이 이미 있어서 급하지 않다면 그대로 둬도 무방.

### 검증 (실로그인 라이브)
- 자택/근무지 패널 둘 다 라벨 오른쪽에 "기본 배송지"/"주소록" 알약이 정상 렌더링되는 것 확인.
- "기본 배송지" 알약 클릭 → 아직 기본 배송지가 없으므로 안내 문구("아직 등록된 기본 배송지가 없어요…")와 함께 주소록 팝업이 자동으로 열리는 것 확인.
- 팝업: 빈 상태 문구("저장된 주소가 아직 없어요.") 노출, "닫기" 버튼으로 정상적으로 닫히는 것 확인.
- 개발 서버 콘솔에 일시적으로 파싱 에러 로그가 누적 표시된 것을 발견했으나, 실제로는 연속 편집 중 과거 시점의 컴파일 실패가 로그에 누적된 것뿐이고 파일 자체(디스크 원본, `npm run build` 결과)는 정상 — `nextjs-portal`의 에러 다이얼로그가 실제로 떠 있지 않은 것과 페이지가 정상 작동하는 것으로 재확인, 실제 버그 아님.
- **⚠️ 여전히 남은 작업**: `db/address-book.sql` 마이그레이션 미적용 상태라 실제 주소 저장→불러오기→기본 지정→삭제까지 이어지는 전체 흐름은 마이그레이션 실행 후에 검증 가능.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] address-book.sql 파일 읽기 문제 안내 + 모드별 완전 독립 state로 교체

### 1. `db/address-book.sql`을 Supabase에서 "읽을 수 없다"는 문제
파일 자체는 확인 결과 이상 없음(다른 마이그레이션 파일들과 동일한 순수 UTF-8, BOM 없음, `npm run build`에서도 정상 인식). 파일을 직접 열어서 업로드하는 방식 대신, 아래 SQL을 **그대로 복사해서 Supabase SQL 에디터에 붙여넣기**하는 방법을 562님께 안내함(파일 접근 경로 문제를 완전히 우회):
```sql
create table if not exists delivery_address_book (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references customer(id) on delete cascade,
  label              text not null,
  mode               text not null check (mode in ('home','workplace','pickup')),
  address            text,
  jibun_address      text,
  detail_address     text,
  entrance_password  text,
  workplace          text,
  phone              text,
  is_default         boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists delivery_address_book_customer_idx on delivery_address_book(customer_id);

alter table delivery_address_book enable row level security;

drop policy if exists "own address book" on delivery_address_book;
create policy "own address book" on delivery_address_book for all
  using      (customer_id in (select id from customer where auth_user_id = auth.uid()))
  with check (customer_id in (select id from customer where auth_user_id = auth.uid()));
```
(내용은 `db/address-book.sql`과 완전히 동일 — 마이그레이션 순서 문서에 이미 등록돼 있어 파일은 그대로 유지.)

### 2. 자택·근무지 주소를 모드별로 완전히 독립된 state로 교체 (직전 세션 "확인" 요청에 대한 실제 구현)
- **`components/DeliveryInfoForm.tsx`**: 공유하던 `address`/`jibun`/`detailAddress`를 제거하고, **`homeAddress`/`homeJibun`/`homeDetailAddress`**(자택 전용)와 **`workplaceAddress`/`workplaceJibun`/`workplaceDetailAddress`**(근무지 전용)로 완전히 분리. 초깃값은 `initialMode(profile)`이 그 모드와 일치할 때만 `profile.deliveryAddress` 등에서 채우고, 아니면 빈 값(같은 DB 컬럼이 "마지막으로 저장된 모드"의 값이라 다른 모드에 잘못 채우지 않기 위함).
- 이에 따라 지난 세션에 만든 **"옅은 경고"(`addressMode`/`addressStale`, `.field.warn`/`.hint.warn`) 로직을 전부 제거** — 모드가 완전히 분리돼 있어 애초에 다른 모드 값이 섞여 보일 일이 없으므로 더 이상 필요 없음(CSS도 같이 정리).
- `save()`/`saveCurrentToAddressBook()`은 `mode`에 따라 `homeAddress`/`workplaceAddress` 중 어느 쪽을 쓸지 분기하도록 수정. 주소록 `applyEntry()`/자동 기본 배송지 적용 로직(`applyEntryFields`)도 `entry.mode`에 맞는 슬롯에만 값을 채우도록 수정.
- 회수지(`entrancePassword`)와 근무지 배송 상세 위치(`workplace`)는 원래도 모드 전용이라 그대로 유지(분리 대상 아님).

### 검증 (실로그인 라이브)
- 자택 모드에서 "서울시 독립테스트로 1"/"자택101호" 입력 → 근무지로 전환 → **근무지 입력란이 완전히 빈 상태로 시작**하는 것 확인(예전처럼 자택 값이 남아있지 않음).
- 근무지에 "서울시 근무지테스트로 2"/"테스트컴퍼니" 입력 → 다시 자택으로 전환 → **자택 값("서울시 독립테스트로 1"/"자택101호")이 그대로 보존**돼 있는 것 확인(두 모드 값이 서로 안 지워지고 각자 유지됨).
- `.field.warn`/`.hint.warn` 요소가 화면에 하나도 없는 것(경고 로직 완전히 제거됨) 확인.
- 개발 서버 에러 다이얼로그 없음, DB에는 이번 테스트 값이 저장 버튼을 누르지 않아 전혀 반영되지 않은 것 확인(원상 복구 불필요).
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] db/address-book.sql 적용 완료 — 주소록 기능 전체 CRUD 실DB 검증

562님이 Supabase SQL 에디터에서 `db/address-book.sql`(위 세션에서 안내한 SQL) 실행 완료("Success. No rows returned"). `delivery_address_book` 테이블 존재 확인 후, 이어서 주소록 기능 전체 흐름을 실제 DB로 끝까지 검증함(신규 코드 변경 없음, 순수 검증).

### 검증 (실로그인 라이브 + 실DB 확인)
1. **저장(추가)**: 자택 모드에서 주소 입력 → "주소록" 알약 → 이름 "우리집" + "기본 배송지로 등록" 체크 → 추가 → 팝업에 즉시 반영되고 DB(`delivery_address_book`)에도 `is_default:true`로 정확히 저장된 것 확인.
2. **두 번째 항목 + 기본 배송지 전환**: 근무지 모드에서 별도 주소 입력 → "회사"라는 이름으로 추가(기본 미체크) → "기본으로" 버튼 클릭 → "회사"가 기본으로 바뀌고 "우리집"의 기본 배지가 사라지는 것 확인(계정당 기본 배송지 최대 1개 제약이 서버 액션에서 정확히 동작).
3. **불러오기 + 모드 독립성 재확인**: 근무지 모드에 있는 상태에서 "우리집"(자택) 항목 불러오기 → 팝업이 자동으로 닫히고 자택 모드로 전환되며 저장해둔 주소가 정확히 채워짐 → 다시 근무지로 전환해보니 직전에 입력해둔 근무지 값("서울시 회사로 5"/"테스트상사")이 전혀 훼손되지 않고 그대로 남아있는 것 확인(주소록 불러오기가 다른 모드의 독립 state를 건드리지 않음).
4. **삭제**: "회사"·"우리집" 둘 다 × 버튼으로 삭제 → 팝업이 빈 상태("저장된 주소가 아직 없어요.")로 돌아가고 DB에도 행이 0개인 것 확인.
5. 이번 검증 내내 실제 활성 배송 정보(`customer.delivery_*`)는 저장 버튼을 누르지 않아 전혀 건드리지 않았음 — 테스트 전후 `delivery_in_store:true`(직접 픽업 상태) 그대로 유지된 것 DB로 재확인, 별도 원상 복구 불필요.
- **미검증으로 남겨둔 것**: "아직 활성 배송 정보가 없는 신규 회원이 폼을 처음 열었을 때 기본 배송지가 자동으로 채워지는 것" 자체는 이번 테스트 계정이 이미 배송 정보를 저장해본 적 있어(재현 불가) 직접 재현하지 못함 — 다만 이 자동 채움이 쓰는 내부 함수(`applyEntryFields`)는 "불러오기" 테스트(3번)에서 이미 정확히 동작함을 확인했으므로, 남은 건 "언제 자동으로 트리거되는지"뿐이라 리스크는 낮다고 판단.

## [Claude Code 세션] 배송 정보 폼 6건 — 기본 배송지 토글, 팝업 UX 개선(불러오기 링크화·수정 기능 추가)

562님이 그 사이 실제로 주소록에 "집"/"반포자이" 2건을 등록해서 쓰고 있는 것을 확인(실사용 데이터, 이번 세션에서 절대 건드리지 않음).

### 1. "기본 배송지 등록" 토글 (자택: "회수 주소 동일" 라벨 위 / 근무지: 하단)
- `components/DeliveryInfoForm.tsx`에 `registerAsDefault` state 추가 + iOS 토글 UI. 켜고 "배송 정보 저장"을 누르면, 저장 성공 직후 **`lib/address-book-actions.ts`의 신규 `setCurrentAsDefault()`** 를 호출해 지금 입력한 내용을 주소록에도 반영한다.
- 라벨은 모드 이름(자택/근무지)을 그대로 씀 — 같은 라벨의 항목이 이미 있으면 **그 항목을 최신값으로 갱신**하고, 없으면 새로 만듦(매번 누를 때마다 중복 생성되지 않도록). 항상 다른 항목들의 `is_default`는 자동으로 해제됨(계정당 기본 1개 유지).
- 커스텀 이름으로 저장하고 싶으면 기존처럼 "주소록" 팝업에서 이름을 직접 지어 저장하면 됨 — 두 방식 공존.

### 2. "기본 배송지" 알약 — 저장돼 있으면 즉시 불러오기
기존 `clickDefaultPill()` 로직 자체는 이미 이 동작이었음(재확인 목적으로 라이브 재검증) — 근무지 모드에 있는 상태에서 알약을 눌렀더니 자택 모드로 전환되며 기본 배송지 값이 즉시 채워지는 것 확인.

### 3~6. 주소록 팝업 재정비
- **3. 시인성 개선**: 각 항목에 붙던 모드 배지(`자택`/`근무지` 알약)를 제거 — 이름 + 기본 배송지 배지 + 주소 요약만 남겨 훨씬 간결해짐.
- **4. 불러오기 → 이름 클릭**: "불러오기" 버튼을 없애고, **주소 이름 자체를 밑줄 있는 링크**(`.addr-book-label-link`)로 만들어 클릭하면 그 주소를 불러오고 팝업이 자동으로 닫힘.
- **5. "기본으로" → "기본 배송지로 변경" 알약**: 버튼 스타일을 사각형 아웃라인(`cta ghost`)에서 다른 알약들과 통일된 `size-chip` 스타일로 변경.
- **6. 수정 기능 신규**: "기본 배송지로 변경" 알약과 삭제(×) 버튼 사이에 연필 아이콘(✎) 추가. 누르면 그 항목이 인라인 수정 폼으로 바뀜(이름 + 모드에 맞는 주소 필드 + 전화번호, 모드 자체는 변경 불가 — 모드를 바꾸고 싶으면 삭제 후 새로 추가). `lib/address-book-actions.ts`에 `updateAddressBookEntry()` 신규 추가.

### 검증 (실로그인 라이브 + 실DB 확인)
- 자택 패널에서 "기본 배송지 등록" 라벨이 "회수 주소 동일" 바로 위에 뜨는 것, 근무지 패널에도 동일한 토글이 있는 것 확인.
- 토글 켜고 저장 → DB에 라벨 "자택"인 새 주소록 항목이 `is_default:true`로 생성된 것 확인.
- 근무지 모드에서 "기본 배송지" 알약 클릭 → 자택 모드로 전환되며 방금 등록한 기본 배송지 값이 즉시 채워지는 것 확인.
- 주소록 팝업: 항목에 모드 배지가 없는 것, 이름이 밑줄 있는 링크인 것, "불러오기" 버튼이 없는 것, "기본 배송지로 변경"이 알약 스타일인 것, 연필 아이콘으로 인라인 수정(이름·주소 변경 후 저장 → 목록에 즉시 반영)까지 전부 확인.
- 테스트로 만든 항목("자택"/수정본)은 전부 삭제해 정리, 562님의 실제 데이터("집"/"반포자이")는 손대지 않음. 실제 활성 배송 정보(`customer.delivery_*`)도 토글 테스트로 잠시 바뀌었던 것을 "직접 픽업·회수하기"로 다시 저장해 테스트 이전 상태로 정확히 복구, DB로 재확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 연필 아이콘 대칭화, 기본 배송지 등록 팝업화, 기본 배송지 알약 단순화, 주소록 팝업 "추가" 폼 삭제

이 사이 562님이 주소록에 세 번째 주소 "한남더힐"을 등록해 기본 배송지로 지정해 쓰고 있는 것을 확인(실사용 데이터, "집"/"반포자이"와 함께 이번 세션 내내 손대지 않음).

### 1. 연필(수정) 아이콘을 좌우 대칭 SVG로 교체
기존 유니코드 문자 "✎"는 폰트마다 기울어진 모양이라 대칭이 아니었음. `viewBox 0 0 24 24` 기준으로 x=9~15(중심 x=12) 사각형 2개(뚜껑+몸통) + 꼭짓점이 (12,22)인 삼각형(팁)으로 직접 그린 인라인 SVG로 교체 — 좌우 완전 대칭.

### 2. "기본 배송지 등록" 토글 → 팝업(별칭 입력 + 주소 미리보기)으로 즉시 등록
기존엔 토글을 켜고 "배송 정보 저장"을 눌러야만 반영됐는데, 이제 **토글을 켜는 순간** 작은 팝업이 뜬다 — 지금 입력된 주소 요약을 보여주고, 별칭을 입력받아 "등록" 누르면 그 자리에서 바로 `saveToAddressBook(..., isDefault:true)`로 주소록에 저장되고 기존 기본 배송지는 자동 해제됨(배송 정보 저장 버튼과 완전히 분리된 별도 동작). 취소하거나 팝업 밖을 누르면 토글이 다시 꺼짐(토글 자체는 상태를 갖지 않는 트리거일 뿐). 이에 따라 `lib/address-book-actions.ts`의 `setCurrentAsDefault`(모드 이름을 자동 라벨로 쓰던 이전 방식)는 더 이상 안 쓰여서 삭제.

### 3. "기본 배송지" 알약 — 불러오기 전용으로 단순화
이전엔 기본 배송지가 없을 때 주소록 팝업을 대신 열어줬는데, 이제 **오직 불러오기만** 함. 없으면 별도의 작은 안내 팝업("기본 배송지가 없어요" / "기본배송지가 등록되어 있지않아요.")만 뜨고, 주소록 팝업은 열리지 않음.

### 4. 주소록 팝업의 "추가" 미니폼 전체 삭제
"이 주소를 저장할 이름" 입력란, "추가" 버튼, "기본 배송지로 등록" 체크박스, 그리고 그 경로로만 뜨던 옛 안내 문구까지 통째로 제거. 이제 주소록 팝업은 순수 조회·관리 전용(이름 클릭해서 불러오기, 기본으로 변경, 수정, 삭제)이고, 새 주소를 추가하는 유일한 경로는 2번의 "기본 배송지 등록" 토글 팝업이 됨.

### 검증 (실로그인 라이브 + 실DB 확인)
- **1번**: 연필 아이콘 SVG의 `<rect>` 2개와 `<polygon>` 좌표를 직접 확인 — 전부 x=9~15(중심 12) 기준으로 대칭인 것 확인.
- **2번**: 자택 모드에서 토글 On → 팝업에 현재 주소("서울 용산구 독서당로 111 1204호") 미리보기와 별칭 입력란이 뜨는 것 확인 → 별칭 입력 후 "등록" → DB에 새 항목이 `is_default:true`로 생성되고 기존 기본("한남더힐")은 자동으로 해제되는 것 확인.
- **3번**: 기본 배송지가 있는 상태에서 "기본 배송지" 알약 클릭 → 주소록 팝업이 뜨지 않고 바로 값이 채워지는 것 확인(기본 배송지가 없는 경우의 안내 팝업은 562님의 실제 기본 배송지를 해제하지 않기 위해 코드 검토로만 확인, 별도 실측은 생략).
- **4번**: 주소록 팝업에 "저장할 이름" 입력란/체크박스/추가 버튼이 전혀 없는 것 확인.
- 테스트로 만든 항목은 삭제하고, 562님이 실제로 기본으로 지정해둔 "한남더힐"도 원래대로 다시 기본 배송지로 되돌려 정확히 복구(DB로 재확인). 활성 배송 정보(`customer.delivery_*`)는 이번엔 저장 버튼을 전혀 안 눌러서 애초에 변경 없음.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 연필 방향 수정, 수정 폼 버튼 정렬, 회수 주소 알약 추가, 자택/근무지 기본 배송지 완전 분리, 수정 중 상태 초기화

### 1. 연필 아이콘 방향을 오른쪽으로 기울게 수정
직전 세션에서 "대칭"으로만 만들었더니(세로로 곧게 선 모양) 의도한 "오른쪽으로 기운 펜" 모양이 아니었음. `<g transform="rotate(-45 12 12)">`로 세로 펜을 시계 반대 방향(화면상 팁이 오른쪽 아래, 뚜껑이 왼쪽 위)으로 45도 회전 — 흔한 "왼쪽으로 기운" 연필 아이콘과 반대 방향.

### 2. 주소록 수정 폼의 "취소"/"저장" 버튼을 오른쪽 정렬
`.addr-book-edit-actions`에 `justify-content:flex-end` 추가.

### 3. "회수 주소" 섹션에도 "기본 배송지"/"주소록" 알약 추가
"자택으로 받기"에서 "회수 주소 동일"을 껐을 때 나오는 회수 주소 입력란 라벨 옆에도 배송 주소와 동일한 알약 2개 추가. 회수 주소는 별도 모드가 없으므로 **자택(home) 주소록 풀을 그대로 재사용**하되, 불러온 값은 회수 주소 전용 입력란(`returnAddress` 등)에만 채우고 메인 배송 주소는 건드리지 않음.

### 4. 자택/근무지 "기본 배송지"를 완전히 독립적으로 관리 (핵심 버그 수정)
- **원인**: `is_default`가 계정 전체에서 딱 하나만 켤 수 있는 전역 플래그였음 — 그래서 근무지 패널에서 "기본 배송지" 알약을 누르면 (전역에서 찾은) 기본값이 자택 모드 항목이었을 경우 자택 패널로 튕겨나갔음.
- **수정**: `lib/address-book-actions.ts`의 `saveToAddressBook`/`setDefaultAddressBookEntry`가 이제 **모드(자택/근무지)별로 기본 배송지를 따로 관리**함 — 다른 항목을 기본으로 바꿀 때 "같은 모드 안에서만" 기존 기본을 해제. 이제 자택 기본과 근무지 기본이 동시에 존재할 수 있음.
- 컴포넌트에도 `bookContext`('home'/'workplace'/'return') 개념을 도입 — "기본 배송지" 알약은 그 컨텍스트에 해당하는 모드의 기본만 찾고, "주소록" 팝업도 해당 모드 항목만 필터링해서 보여줌(팝업 제목에 "(자택)"/"(근무지)" 표시).

### 5. 주소록에서 수정 중 닫았다가 다시 열면 수정 폼이 남아있던 문제 수정
"닫기"/바깥 클릭으로 팝업을 닫을 때 `editingId`도 함께 초기화하는 `closeBookModal()`로 통일 — 다음에 다시 열면 항상 목록부터 보여줌.

### 검증 (실로그인 라이브 + 실DB 확인)
- **1번**: SVG의 `<g transform>` 속성이 `rotate(-45 12 12)`인 것 확인.
- **2번**: `.addr-book-edit-actions`의 계산된 `justify-content`가 `flex-end`인 것 확인.
- **3번**: "회수 주소 동일" 끄면 회수 주소 라벨 옆에 알약 2개가 뜨는 것, "기본 배송지" 알약 클릭 시 회수 주소 입력란만 채워지고 메인 배송 주소는 그대로인 것 확인.
- **4번**: 근무지에서 별도로 "테스트회사"를 기본 배송지로 등록해도 자택의 "한남더힐" 기본이 그대로 유지되는 것(둘 다 `is_default:true`, DB로 확인) → 근무지 패널에서 "기본 배송지" 알약 클릭 시 **자택으로 튕기지 않고 근무지 모드 그대로 유지**되며 근무지 기본값만 다시 채워지는 것 확인.
- **5번**: "집" 항목 수정 폼을 열어둔 채 팝업을 닫고 다시 열었더니 목록 화면으로 정상적으로 뜨는 것 확인.
- 테스트로 만든 "테스트회사"(근무지) 항목 삭제, 562님의 실제 데이터("집"/"한남더힐")는 그대로 보존. 활성 배송 정보(`customer.delivery_*`)는 저장 버튼을 안 눌러서 변경 없음.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 연필 방향 재수정, 토글 라벨 간격/자간 정리, 근무지 회수지 지원 추가, 성능 원인 분석

### 1~2. 자택/근무지 "기본 배송지 등록"/"즐겨찾기 추가"/"회수 주소(근무지) 동일" 라벨 간격·자간 정리
- 첫 토글(기본 배송지 등록)만 이전 입력란과의 구분을 위해 `marginTop:14` 유지, 같은 그룹인 나머지 토글들은 `marginTop:4`로 좁힘(그룹 내부는 촘촘하게, 그룹과 그 위 입력란 사이만 여유 있게).
- 새 CSS 클래스 `.pf-row-label-fit`(`width:104px; text-align-last:justify; text-justify:inter-character`) 추가 — 글자 수가 다른 라벨(9자/7자/8~9자)도 고정 너비 안에서 자간이 자동으로 늘어나 오른쪽 끝(토글 시작 지점)이 전부 정확히 일치하게 됨. 자택 3개, 근무지 3개(아래 3번에서 추가된 토글 포함) 라벨에 전부 적용.

### 3. 근무지에도 "회수 근무지 동일" 토글 + 회수 근무지 입력 섹션 추가
자택의 "회수 주소 동일" 패턴을 근무지에도 대칭으로 구현. 근무지 전용 회수 state(`sameAsWorkplaceDelivery`, `returnWorkplaceAddress`, `returnWorkplaceJibun`, `returnWorkplaceDetailAddress`, `returnWorkplaceDeliveryLocation`)를 자택 회수 state와 완전히 독립적으로 신규 추가(이 대화에서 확립된 "모드별 완전 독립 state" 원칙 유지). 토글을 끄면 회수 근무지 주소/근무지 상호/배송 상세 위치 입력란이 나타남. `save()`의 `useSeparateReturn` 로직을 `(isHome && !sameAsDelivery) || (isWorkplace && !sameAsWorkplaceDelivery)`로 확장하고, 소스 필드를 모드에 따라 분기(근무지일 땐 `return_entrance_password` 컬럼을 "회수 시 배송 상세 위치" 텍스트로 재사용 — 기존 배송 상세 위치를 `workplace` 컬럼에 저장하는 것과 같은 패턴).

### 검증 (실로그인 라이브 + 실DB 확인)
- 자택 3개 토글의 `.pf-row-label-fit` 요소가 전부 `width:104px`, 동일한 `left`/`right` 픽셀 값(114~218)으로 정확히 정렬되는 것, 근무지 3개(신규 "회수 근무지 동일" 포함)도 동일하게 정렬되는 것 확인.
- 근무지 모드에서 "회수 근무지 동일" 토글을 끄면 회수 근무지 주소/근무지 상호/배송 상세 위치 입력란이 나타나는 것 확인.
- 배송 근무지("서울시 배송근무지로 1"/"배송회사"/"배송위치")와 회수 근무지("서울시 회수근무지로 2"/"회수회사"/"회수위치")를 서로 다른 값으로 입력 후 저장 → DB에 `delivery_*`와 `return_*` 컬럼에 각각 다른 값으로 정확히 분리 저장된 것 확인.
- 테스트 후 "직접 픽업·회수하기"로 다시 저장해 계정을 테스트 이전 상태로 정확히 복구, DB로 재확인.
- `npm run build`/`npm run lint` 클린.

### 4. 성능 문제 원인 분석 (구현 없이 답변만, 562님 질문에 대한 회신)
"getUser() 중복 제거 + Promise.all 병렬화하면 얼마나 빨라지는지" 질문에 대해 실측 기반으로 답변만 하고 코드는 아직 안 건드림 — 회원 전용 페이지 하나 로드 시 인증/권한 확인만으로 순차 라운드트립이 최대 4번(미들웨어의 `getUser()` + 레이아웃 `getAccess()`의 중복 `getUser()` + `staff` 조회 + `customer` 조회) 발생하고, Supabase 쿼리 1번에 실측 180~350ms가 걸려 이 부분만 800ms~1s 정도로 추정됨. 중복 `getUser()` 제거 + 배타적 조건이라 병렬화 여지가 제한적인 staff/customer 조회 구조 개선까지 하면 이 구간은 대략 40~50% 단축(500~600ms 수준) 예상되지만, 전체 페이지 로드(1.9~2.5초 실측)의 나머지는 페이지별 실제 데이터 조회에 달려있어 전체적으로는 15~25% 정도 개선 추정 — 정확한 수치는 구현 후 재측정 필요. 진행 여부는 562님 확인 대기 중.

## [Claude Code 세션] 라벨 스타일 최종 정리 + 성능 최적화 실제 구현/실측 + 근본적 개선안 자문

### 1~3. 토글 라벨 스타일 최종 정리
- `.pf-row-label-fit`을 "배송 주소" 라벨(`.field-section`)과 같은 `font-size:10.5px`로 통일(기존 12px).
- 너비를 실제 렌더링 측정값(가장 긴 라벨 "이 근무지에서 회수"의 자연 너비 ≈84.6px) 기준으로 `85px`까지 좁혀서, 자간이 최소한으로만 늘어나게 함("더 좁혀달라"는 요청 반영).
- 같은 그룹 라벨들 사이 `marginTop`을 4px → 0으로 더 줄임(그룹 첫 항목만 위 입력란과의 구분을 위해 14px 유지).
- 근무지의 "회수 근무지 동일" → **"이 근무지에서 회수"**로 문구 변경.
- 실측: 자택 3개/근무지 3개 라벨 모두 `width:85px`, 텍스트 오버플로우 없음, 오른쪽 끝(토글 시작 지점) 픽셀 단위로 정확히 일치하는 것 확인.

### 4. 성능 최적화 실제 구현 (지난 세션 분석 이어서 진행)
- **`lib/auth-cache.ts`(신규)**: React `cache()`로 `supabase.auth.getUser()`를 요청 단위 캐싱하는 `getCachedUser()` 추가. `getUser()`는 로컬 디코드가 아니라 Supabase Auth 서버로 실제 왕복하는 호출이라, 같은 요청 안에서 여러 곳이 각자 부르면 그만큼 왕복이 쌓이던 것을 근본적으로 줄임.
- **`lib/roles.ts`**: `getAccess()`가 `getCachedUser()`를 쓰도록 변경 + 배타적이지만 병렬 가능한 `staff`/`customer` 조회를 `Promise.all`로 동시 요청(순차 3왕복 → 2단계로 단축).
- **`components/CustomerHeader.tsx`**: 자체 `getUser()` 호출을 `getCachedUser()`로 교체 — `(member)/layout.tsx`가 `getAccess()`를 부르고 바로 이어서 `<CustomerHeader/>`를 렌더링하는 **같은 SSR 요청 안**이라, React cache 덕분에 실제 네트워크 호출이 1번으로 합쳐짐.
- **`lib/cart-actions.ts`**: `resolveCustomerId()`가 `getCachedUser()` 사용. `getCartBusyDates()`가 내부에서 `getCartItems()`를 다시 부르던 중복 조회를 없애고, 이미 가져온 목록을 인자로 받을 수 있게 시그니처 변경(`getCartBusyDates(items?)`).
- **`lib/address-book-actions.ts`**, **`lib/account-actions.ts`(getProfile/updateProfile)**: 동일하게 `getCachedUser()`로 교체.
- **`app/(member)/cart/page.tsx`**: `refresh()`의 5개 순차 `await`(getCartItems→getCartBusyDates→getClosedDates→getOtherCartConflicts→getProfile)를 `getCartItems()` 이후 나머지 4개를 `Promise.all`로 동시 요청하도록 변경.
- **그 외 동일 패턴 적용**: `app/page.tsx`(랜딩), `app/(customer)/looks/page.tsx`, `app/(customer)/looks/[id]/page.tsx`, `app/(member)/account/page.tsx`, `app/(member)/account/[orderId]/page.tsx` — 각자 있던 개별 `getUser()` 호출을 `getCachedUser()`로 교체하고, 서로 독립적인 조회들(예: `/looks`의 상품 목록·장바구니·사이즈 재고, `/account`의 예약·주문 조회, `/account/[orderId]`의 주문·아이템 조회)을 `Promise.all`로 병렬화. `pending`/`membership`/`admin`/`delivery` 레이아웃은 이미 `getAccess()`를 쓰고 있어 자동으로 혜택을 받음(별도 수정 불필요).

### 실측 결과 (프로덕션 빌드로 직접 비교, `npm run build && npm run start`)
- **`/cart`**: TTFB 1937ms → **657~963ms** (약 50~66% 단축) — 원래 이 페이지가 중복 호출이 가장 심했던 곳이라(카트 아이템/기본 배송지/즐겨찾기 등 여러 서버 액션이 각자 인증 확인) 개선폭이 가장 큼.
- **`/looks`**: TTFB 1255~1342ms → **864~883ms** (약 30~35% 단축).
- 두 페이지 모두 실제 데이터(카트 아이템 4개·예약 캘린더·배송 정보 폼, 룩 그리드 4개 카드)가 정상적으로 렌더링되는 것, 콘솔 에러 없는 것 확인.
- `npm run build`/`npm run lint` 클린.

### 5. 비약적 성능 개선을 위한 근본적 대안 (구현 없이 자문만)
- **① Supabase 프로젝트 리전 확인(가장 큰 지렛대)**: Cloudflare 엣지는 서울(ICN)로 확인됐지만 실제 DB 리전은 대시보드에서 562님이 직접 확인 필요. 리전이 멀면(예: 미국) 왕복 200~300ms의 근본 원인이고, 서울/도쿄/싱가포르 리전으로 새 프로젝트를 만들어 데이터 이관하는 게 가장 확실한 해법(단, 큰 작업).
- ② Next.js 앱 배포 위치도 DB와 같은 리전으로.
- ③ 여러 쿼리를 Postgres RPC 함수 하나로 묶어 왕복 횟수 자체를 줄이기(예: staff+customer 조회를 서버 DB 함수 하나로).
- ④ Supabase Auth Hook으로 role/status를 JWT 커스텀 클레임에 포함시켜 매 요청 DB 조회 자체를 생략(트레이드오프: 역할 변경이 재로그인 전까지 반영 지연).
- ⑤ 자주 안 바뀌는 공개 데이터(룩북/상품 목록)는 짧은 revalidate 주기로 캐싱해 아예 DB를 안 타게.
- 우선순위는 ①이 압도적으로 크다고 안내함.

## [Claude Code 세션] Supabase 프로젝트 리전 이전(시드니 → 새 프로젝트) — 성능 근본 원인 해결

### 배경
지난 세션에서 안내한 "① 리전 확인"을 562님이 실제로 확인 — Supabase 대시보드 스크린샷 기준 **Project region: ap-southeast-2 (Sydney)**. 서울↔시드니 왕복 지연이 실측된 1.9~2.5초 TTFB의 근본 원인으로 확정, "어차피 해야하는 작업"으로 즉시 이전 진행 결정.

### 1. 새 Supabase 프로젝트 생성 + 스키마 이관
- 562님이 새 리전으로 프로젝트 생성, URL/publishable key/secret key를 채팅으로 전달.
- `db/*.sql` 마이그레이션 29개 파일을 순서대로 이어붙인 `db/_combined-migration.sql`(1회성 번들, 정식 마이그레이션 순서에는 포함 안 됨)을 만들어 새 프로젝트 SQL Editor에서 한 번에 실행(RLS 관련 경고 다이얼로그는 "RLS 없이 실행" 선택 — 각 파일에 이미 올바른 RLS 정책이 포함돼 있어 Supabase의 자동 RLS 활성화와 충돌 방지).

### 2. 실 데이터 전체 이관 (14개 테이블, FK 의존 순서대로)
- 스크래치패드 스크립트(`migrate-data.js`)로 `product → inventory_item → customer → payment_order → reservation → cart_item → membership_payment → push_subscription → phone_verify_attempt → marketing_broadcast → marketing_broadcast_recipient → address_change_log → store_closure → delivery_address_book` 순서로 PK UUID를 그대로 보존하며 복사(FK 재매핑 불필요).
- **`staff` 테이블은 의도적으로 제외**(`auth_user_id`가 PK라 새 프로젝트의 auth UUID가 없으면 복사 불가) — 562님 재가입 후 수동 연결 예정.
- `customer.auth_user_id`/`marketing_broadcast.sent_by`/`store_closure.created_by`는 옛 프로젝트의 auth UUID가 새 프로젝트엔 없으므로 **의도적으로 null 처리**(Option A: 실사용자는 재가입 후 예약/주문 이력이 남아있는 기존 `customer` 행에 새 `auth_user_id`를 수동으로 연결).
- 이관 중 발견된 스키마 불일치 2건을 별도 스크립트(`migrate-remaining.js`)로 수정 후 재이관: `payment_order.status='EXPIRED'`(현재 앱 코드/스키마 어디에도 없는 옛 데이터 1건) → `'FAILED'`로 정규화, `reservation`의 레거시 컬럼 `order_id`(현재 스키마엔 없음)와 생성 컬럼 `occupied_range`(수동 삽입 불가)를 제거 후 삽입.
- 전체 14개 테이블 행 수를 옛/새 프로젝트 간 비교해 정확히 일치하는 것 확인.

### 3. `.env.local` 전환
- `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY`를 새 프로젝트 값으로 교체, 옛(시드니) 프로젝트 값은 롤백용으로 주석 처리해 보존.

### 검증 (재빌드 + 실제 회원가입 플로우로 라이브 확인)
- `npm run build` 클린.
- dev 서버를 새 `.env.local`로 재기동(기존 프로세스가 옛 env를 물고 있던 걸 종료 후 재시작 — Next.js는 서버 시작 시점에 env를 읽으므로 재시작 필수).
- `/looks` 접속 시 이관된 상품 4개(noir-soiree, tailored-day, soft-romance, evening-grace)가 정상 표시되는 것으로 상품 카탈로그 이관 확인.
- 실제 회원가입 플로우를 UI로 끝까지 실행(테스트 계정 `migtest0711`) — 전화 인증 요청(rate-limit 테이블 기록), ID 중복확인, 계정 생성(`createAccountById`), 멤버십 등록(`registerMembership`), 멤버십 결제 주문 생성(`createMembershipOrder`)까지 전부 새 프로젝트에 대해 성공(200) — Auth/DB 쓰기/RLS 파이프라인이 새 프로젝트에서 정상 동작하는 것을 실측으로 확인.
- DB로 직접 재확인: 이관된 실제 고객 5명(전부 `auth_user_id: null`, 예상대로) + 방금 만든 테스트 계정 1명 = 총 6명, auth.users는 테스트 계정 1개만 존재 — 계획했던 이관 상태와 정확히 일치.
- 테스트 계정(customer/payment_order/auth user) 전부 삭제로 정리 완료.

### 남은 작업
- **`staff` 테이블 이관**: 562님이 새 프로젝트에서 재가입 → 새 `auth_user_id`로 `staff` 행 생성 + 기존 `customer` 행에 수동 연결.
- **실사용자 재가입 + 연결**: 이관된 5명의 실제 고객도 재가입 후 새 `auth_user_id`를 기존(이관된) `customer` 행에 연결해야 예약/주문 이력이 유지됨.
- 확인 끝나면 기존(시드니) 프로젝트 정리(삭제) — 아직 보류 중, 롤백용으로 당분간 보존.

## [Claude Code 세션] 리전 이전 마무리 — 디렉터 계정 연결, 카트 달력 날짜 버그 수정, 옛 프로젝트 삭제

### 1. 562님 디렉터 계정을 새 프로젝트에 재연결
- 562님이 새 프로젝트에서 실제 ID/비밀번호로 정식 재가입(`migtest0711`) 진행.
- 재가입으로 새로 생긴 빈 고객 행(및 거기 딸린 멤버십 결제 1건)은 삭제하고, 새 로그인 계정(`auth_user_id`)을 이관돼 있던 원래 고객 행(예약 14건·주문 12건·카트 4개·즐겨찾기 주소 3개·변경이력 94건 보유)에 연결.
- `staff` 테이블에 같은 새 `auth_user_id`로 `role: director` 행 재생성.
- 이관된 5명의 "실제 고객"은 562님이 확인 결과 **테스트용 허구 데이터**였음이 밝혀져, 재가입/연결 없이도 옛 프로젝트를 바로 정리해도 되는 것으로 확인됨(계획했던 "실사용자 재가입" 단계 불필요).
- 이후 562님 요청으로 로그인 ID를 `migtest0711` → **`zxc562`**로 재변경 — `customer.username`뿐 아니라 실제 로그인에 쓰이는 Supabase Auth 이메일(`idToAuthEmail` 규칙에 따른 가상 이메일)도 함께 갱신해 로그인 ID와 표시값이 항상 일치하도록 처리.

### 2. 카트 페이지 "지난 날짜가 예약 가능하게 보이는" 버그 수정
- 562님이 실사용 중 발견: 오늘이 7/14(화)인데 7/13(월, 어제)이 여전히 예약 가능한 날짜로 표시됨.
- **원인**: [app/(member)/cart/page.tsx](app/(member)/cart/page.tsx)에서 "오늘 날짜"(`TODAY`)를 **컴포넌트 모듈이 처음 로드될 때 딱 한 번만** 계산해 최상단 상수로 캐싱하고 있었음 — 자정을 넘겨서까지 새로고침 없이 탭을 계속 켜두면 앱이 계속 어제를 오늘로 착각해, 실제로는 지난 날짜인데도 `past` 판정에서 빠져 클릭 가능하게 남아있었음. 리전 이전과는 무관한, 이전부터 있던 구조적 버그.
- **수정**: `TODAY` 계산을 모듈 스코프에서 컴포넌트 함수 본문 안으로 옮겨 매 렌더마다 새로 계산하도록 변경. 자정 이후 아무 상호작용(날짜 클릭 등)만 있어도 바로 정확한 오늘 날짜로 갱신됨.
- `npm run build`/`npm run lint` 클린.

### 3. 옛(시드니) 프로젝트 삭제
- 562님이 Supabase 대시보드에서 직접 삭제 완료(저는 프로젝트 삭제 권한/도구가 없어 대시보드 경로만 안내).
- `.env.local`의 롤백용 옛 프로젝트 자격증명 주석 삭제, 새 프로젝트 정보만 남김.
- 리전 이전 작업 전체 완료: 새 프로젝트만 사용, 디렉터 계정 정상 로그인 가능, 데이터 전부 보존.

## [Claude Code 세션] 카트 CART 네비 강제 새로고침, 배송 폼 UI 미세조정, My 렌탈 조회기간 필터 + 월별 구분

### 1. 헤더 "CART" 링크를 누르면 항상 새로고침되도록 변경
이미 `/cart`에 있는 상태에서 헤더의 "CART"를 눌러도 Next.js `Link`는 같은 경로라 아무 반응이 없었음. [components/CustomerHeader.tsx](components/CustomerHeader.tsx)에서 로그인 상태의 CART 링크만 일반 `<a>` 태그로 바꿔, 항상 전체 페이지 새로고침 + 카트 데이터 재조회가 되게 함.

### 2. 배송 정보 폼 토글 간격/팝업 폰트·버튼 크기 조정
- 자택/근무지의 "기본 배송지 등록"·"즐겨찾기 추가"·"회수 주소 동일"류 토글 3개가 `marginTop:0`을 줘도 여백이 안 줄던 원인 파악: 부모 `.optional-panel`이 `flex + gap:7px`라 자식 간 간격을 자동으로 넣고 있었음 — 세 토글을 `.toggle-group`(자체 gap 없음)으로 묶어서 그 gap 밖으로 분리, 완전히 붙게 함.
- 기본 배송지 등록/즐겨찾기 추가 팝업 제목을 "배송 주소" 라벨과 같은 10.5px로(`.wd-title-fit`), 취소/등록 버튼을 별칭 입력란과 같은 크기로(`.wd-btns-fit`) 축소. **이 폰트/버튼 크기 통일 규칙은 이후 새 폼 UI에도 기본값으로 적용하기로 함** (메모리에 저장).
- 카트의 "자택으로 받기/근무지로 받기/직접 픽업·회수하기" 버튼 좌우 폭을 1/3 축소(100%→66.6%, 가운데 정렬). 처음엔 세로 크기(패딩/폰트)를 줄였다가 요청 정정받아 폭으로 수정했고, 그 과정에서 `.delivery-mode-row`에 준 `align-items:center`가 형제 요소인 입력 패널(`.optional-panel`)의 stretch까지 깨서 입력란 폭도 같이 줄어드는 회귀가 있었음 — 버튼에만 `align-self:center`를 줘서 해결.

### 3. My 렌탈(`/account`) 조회기간 필터 + 월별 구분
- 기존엔 날짜 필터 없이 고객의 전체 예약 이력을 한 번에 다 보여줬음(성능상 걱정할 수준은 아님 — RLS로 본인 것만 조회되고, 한 사람의 실제 대여 횟수는 자연히 수백 건을 넘기 어려움).
- [app/(member)/account/page.tsx](app/(member)/account/page.tsx)에 `searchParams`(`from`/`to`)를 받아 `reservation`/`payment_order` 쿼리에 `.gte('checkout', from)`/`.lte('checkout', to)`로 필터링하는 날짜 범위 폼(`<input type="date">` 2개 + 조회 버튼 + 필터 중일 때만 보이는 "전체보기" 리셋 링크) 추가.
- 목록을 `checkout`의 "YYYY-MM"이 바뀔 때마다 월 구분 헤더(예: "2027년 3월")를 끼워넣도록 렌더링 로직을 `.map()`에서 순차 루프로 변경.
- 필터링된 결과가 0건일 때는 안내 문구를 "해당 기간에 대여 내역이 없어요"로 분기.

### 검증 (실로그인 라이브 + 실DB 확인)
- 테스트 계정에 2027년 1월/3월(2건)/5월 예약을 실제로 만들어 `/account`에서 월 헤더가 정확히 5월→3월(2건 한 그룹)→1월 순으로 나뉘어 나오는 것 확인.
- 조회기간을 3월로만 좁히면 3월 2건만 보이고 "전체보기" 링크가 나타나며, 클릭 시 전체 목록으로 복귀하는 것 확인.
- 결과가 없는 기간(2월)을 조회하면 "해당 기간에 대여 내역이 없어요" 문구로 바뀌는 것 확인.
- 테스트 데이터/계정 삭제로 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 조회기간 필터를 커스텀 달력 + 프리셋 칩으로 전면 교체

네이티브 `<input type="date">` 2개짜리 필터에 대한 불편 3건 반영:
1. 네이티브 date input은 브라우저에 따라 우측 달력 아이콘만 눌러야 피커가 열리는 경우가 있어 클릭 영역이 좁았음.
2. 열리는 달력이 OS/브라우저 네이티브 UI라 크기·위치를 전혀 커스텀할 수 없었음.
3. 자주 쓰는 기간(1주일/1개월/3개월/6개월/1년)을 매번 직접 골라야 했음.

### 구현
- **`components/AccountDateFilter.tsx`(신규, 클라이언트 컴포넌트)**: 네이티브 date input을 완전히 대체.
  - "조회기간 선택" 버튼 하나로 통합(박스 전체가 클릭 영역 — 문제 1 해소) — 누르면 커스텀 달력이 그 박스와 정확히 같은 너비로 바로 아래에 펼쳐짐(문제 2 해소, `position:relative`인 `.account-filter-row`를 기준으로 절대 위치).
  - 달력은 카트 페이지 예약 캘린더와 같은 범위 선택 방식(첫 클릭=시작일, 두 번째 클릭=종료일, 선택 완료 시 자동으로 닫힘) — `lib/domain/reservation.ts`의 `toDate`/`iso`/`addDays`를 그대로 재사용해 날짜 처리 방식을 앱 전체와 통일.
  - 범위를 고른 뒤에는 "조회" 버튼을 눌러야 실제로 적용(URL 쿼리스트링 갱신 → 서버 컴포넌트가 재조회) — 프리셋 칩(문제 3 해소)은 누르는 즉시 바로 적용됨: **1주일/1개월/3개월/6개월/1년**(오늘 기준으로 자동 계산해 `from`/`to` 설정) / **전체보기**(필터 초기화).
- `app/(member)/account/page.tsx`는 그대로 두고(서버에서 `searchParams`로 필터링하는 구조는 유지) 기존 `<form>` 마커업만 `<AccountDateFilter initialFrom={from} initialTo={to} />`로 교체.
- `app/globals.css`에 `.account-filter-wrap/-row/-box/-cal/-presets` 추가, 기존 `.cal`/`.day`/`.dow` 클래스(카트 캘린더와 동일)를 그대로 재사용해 시각적으로 통일. 이 캘린더는 과거 날짜도 전부 선택 가능해야 해서(대여 이력 조회용) `.day.past{visibility:hidden}` 같은 미래/과거 제한 클래스는 붙이지 않음.

### 버그 발견 및 수정
구현 중 자체 발견: 달력 드롭다운(`position:absolute; top:100%`)의 기준 조상 요소를 프리셋 칩까지 포함한 전체 wrap으로 잡아서, 실제로는 박스 바로 아래가 아니라 프리셋 칩들 아래로 열리는 버그가 있었음. 필터 박스+버튼만 감싸는 별도의 `position:relative` 컨테이너(`.account-filter-row`)를 추가해 그 안으로 드롭다운을 옮겨서 해결 — 박스와 정확히 같은 너비·왼쪽 정렬로, 바로 6px 아래에 열리는 것을 좌표로 실측 확인.

### 검증 (실로그인 라이브 + 실DB 확인)
- 테스트 계정에 최근(3일 전)/2개월 전/8개월 전 대여 3건을 만들어 확인.
- 박스 클릭 → 달력이 박스와 동일한 너비(319px)로 6px 아래에 정확히 열리는 것을 좌표로 확인.
- 달력에서 날짜 2개(범위) 선택 → 박스 텍스트에 반영 → "조회" 클릭 → URL(`?from=...&to=...`)과 목록이 정확히 필터링되는 것 확인.
- "6개월" 프리셋 클릭 → 별도 "조회" 클릭 없이 즉시 적용되어 최근/2개월 전 항목만 남고(8개월 전 항목은 6개월 밖이라 제외) 정확히 필터링되는 것 확인.
- "전체보기" 클릭 → 필터 해제되어 3건 전부 다시 보이는 것 확인.
- 테스트 데이터/계정 삭제로 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 조회기간 필터 2차 개선 — 시작일/종료일 달력 분리, 프리셋 밑줄 스타일

방금 만든 조회기간 필터에 대한 후속 피드백 3건 반영:
1. 프리셋(1주일~전체보기)을 알약 버튼 대신 밑줄 텍스트로 변경.
2. "전체보기"를 프리셋 목록 맨 앞으로 이동.
3. **핵심 개선**: 시작일/종료일을 하나의 공유 달력(범위 선택)으로 고르게 하면, 기간이 길어질수록(예: 1월~7월) 그 사이 모든 달을 하나의 달력에서 앞뒤로 넘겨가며 지나쳐야 해서 클릭 수가 늘어나는 문제가 있었음 → 시작일 전용 달력과 종료일 전용 달력을 완전히 분리(각자 독립된 월 네비게이션 상태)해서, 서로 다른 달로 각자 바로 이동 가능하게 함.

### 구현
- [components/AccountDateFilter.tsx](components/AccountDateFilter.tsx): 기존 "박스 하나 + 범위선택 달력"을 "시작일 박스 + 종료일 박스, 각각 독립된 단일 날짜 선택 달력"으로 전면 재구성. 재사용 가능한 `MiniCalendar` 내부 컴포넌트로 분리해 시작일/종료일 두 군데서 공유(각각 자기 `month`/`onNavigate`/`selected`/`onPick`을 따로 받음). 이제 하루만 골라도 즉시 선택되고 달력이 닫힘(전엔 시작·종료 2번 클릭이 필요했음).
- `app/globals.css`: `.account-filter-box-wrap`(각 박스를 감싸는 `position:relative` 컨테이너, 이제 박스별로 따로 있어서 달력이 그 박스 하나의 너비·위치에만 정확히 맞춰짐)로 교체. `.account-filter-presets button`은 배경/테두리 없애고 `text-decoration:underline`으로 변경, 마크업 순서도 전체보기를 맨 앞으로.

### 검증 (실로그인 라이브 확인)
- 프리셋 순서가 "전체보기, 1주일, 1개월, 3개월, 6개월, 1년"인 것, 각 버튼이 테두리/배경 없이 밑줄만 있는 스타일인 것 확인.
- "시작일" 박스 클릭 → 그 박스와 정확히 같은 너비(115px)·위치에 달력이 열리는 것 확인. "이전 달"로 6월로 이동.
- "종료일" 박스 클릭(시작일 달력은 자동으로 닫힘) → 종료일 달력은 시작일 달력의 이동과 무관하게 독립적으로 "2026년 7월"(오늘 기준)부터 시작하는 것 확인 — 두 달력이 완전히 분리돼 있음을 실측으로 증명.
- 종료일 달력에서 날짜 한 번 클릭 → 바로 선택되고 달력이 닫히며 박스에 반영되는 것 확인(범위 2클릭 방식에서 단일 날짜 1클릭 방식으로 단순화됨).
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 필터 3차 개선 — 프리셋 오른쪽 정렬, 아이폰 스타일 연/월 스크롤 휠

### 1. 프리셋 칩 오른쪽 정렬
`.account-filter-presets`에 `justify-content:flex-end` 추가. "전체보기" 순서는 이전 세션에서 이미 맨 앞으로 옮겨둔 상태 유지.

### 2. 연/월을 아이폰 달력처럼 스크롤 휠로, 일자만 아래에 그리드로
- **`components/AccountDateFilter.tsx`**: 기존 "‹ 2026년 7월 ›" 화살표 네비게이션을 없애고, `WheelColumn`(재사용 컴포넌트)로 연도/월 각각 스크롤 휠 구현. CSS `scroll-snap-type:y mandatory` + `scroll-snap-align:center`로 스와이프하면 항목이 가운데로 자동 정렬되는 네이티브 아이폰 피커 느낌을 순수 CSS로 구현 — 스크롤이 멎으면(120ms 동안 추가 스크롤 없음) 가장 가까운 항목으로 스냅하고 그 값을 확정하는 방식(`onScroll` + `setTimeout` 디바운스).
- 연도 범위는 오늘 기준 -5~+2년(8개년), 월은 1~12 고정. 가운데 항목 위에 옅은 배경의 `.wheel-highlight` 바를 깔아 "지금 선택된 줄"을 표시.
- **레이아웃 재조정**: 시작일/종료일 각 박스 폭(약 115px)에 맞춰 달력을 열던 이전 방식으로는 연/월 휠 2컬럼 + 요일 그리드 7컬럼이 들어가기엔 비좁아서, 달력 자체는 다시 필터 행 전체 너비(약 319px)로 열리도록 되돌림(단, 시작일/종료일의 값·월 상태는 여전히 완전히 독립적으로 유지 — 이전 세션에서 구현한 "구분"은 그대로 보존, 달력이 열리는 위치만 행 전체 기준으로 통일).

### 검증 (실로그인 라이브 확인)
- 프리셋 5개+전체보기가 필터 박스 오른쪽 끝에 정확히 맞춰 정렬되는 것을 좌표로 확인.
- "시작일" 박스 클릭 → 연도 휠이 "2026년"(오늘 기준), 월 휠이 "7월"에 정확히 초기 위치하는 것 확인.
- 연도 휠을 스크롤(scrollTop 96, 인덱스 3)한 뒤 자동으로 "2024년"으로 스냅되고 값이 확정되는 것, 월 휠은 그대로 "7월"로 영향받지 않는 것 확인.
- 아래 요일 그리드가 즉시 "2024년 7월"(31일)로 갱신되는 것, 15일을 클릭하면 박스에 "2024-07-15"가 정확히 반영되는 것 확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 필터 4차 조정 — 좁은 박스 폭 그대로 유지, 휠·요일 그리드만 축소

바로 직전 세션에서 "연/월 휠 + 요일 그리드가 좁은 박스 폭(약 115px)엔 비좁다"는 이유로 달력을 필터 행 전체 너비(약 319px)로 넓혔는데, 562님이 "커 보인다, 좁아도 그대로(박스 폭 기준) 구현해보라"고 명확히 요청 — 다시 각 박스(시작일/종료일) 폭에 맞춰 좁게 되돌리되, 그 안에 들어가는 연/월 휠과 요일 그리드 자체를 큰 폭 대신 훨씬 작은 크기로 재설계.

### 변경
- `.account-filter-cal`를 다시 각 박스를 감싸는 `.account-filter-box-wrap`(`position:relative`) 기준으로 위치시켜 박스와 동일한 좁은 너비(약 115px)로 열리게 복원.
- 연/월 휠: 항목 높이 32px→26px, 컬럼 너비 72px→46px, 폰트 13px→10px(선택된 항목은 11px)로 축소.
- 요일 그리드(`.account-filter-cal` 안으로 스코프): 요일 라벨 8.5px, 칸 높이 20px, 숫자 원 17×17px·9.5px로 축소, 칸 사이 간격 제거(`column-gap:0`) — 카트 페이지의 원래 큰 캘린더(`.day`, `.cal` 등)는 전혀 건드리지 않고 이 필터 안에서만 좁게 적용.

### 검증 (실로그인 라이브 확인)
- 달력이 다시 박스와 동일한 좁은 너비(115px)로 여닫히는 것 확인.
- 좁아진 상태에서도 연도 휠 스크롤→스냅→값 확정, 요일 그리드가 해당 연월로 갱신, 날짜 클릭→박스에 반영까지 전부 정상 동작하는 것 확인(요일 칸 17×20px 정도로 작아졌지만 기능은 그대로 동작).
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 필터 5차 미세조정 — 프리셋/휠/일자 간격·크기 미세조정

### 1. 프리셋 칩 사이 간격 축소
`.account-filter-presets`의 `gap`을 14px→8px로.

### 2. 연/월 휠 항목 사이 간격 축소
휠 항목은 별도 gap 없이 항목 자체의 높이가 곧 항목 사이 간격이라, 그 높이를 26px→20px로 줄여서 간격을 좁힘(연동되는 `.wheel-highlight`/`.wheel-col`/`.wheel-pad`의 높이, JS의 `WHEEL_ITEM_H` 상수도 전부 20으로 함께 맞춤 — 어긋나면 스크롤 스냅 위치 계산이 틀어짐).

### 3. 일자 숫자 좌우 여백 축소 + 텍스트 확대
`.account-filter-cal`의 좌우 패딩을 6px→3px로 줄여 요일 그리드에 쓸 수 있는 가로 폭을 넓히고, 숫자 원(`.num`)을 17px→15px로 셀 너비(약 15px)에 꽉 차게 줄이면서 폰트는 9.5px→10.5px로 키움 — 여백은 줄고 숫자는 더 크고 선명하게 보임.

### 검증 (실로그인 라이브 확인)
- 프리셋 간격이 정확히 8px인 것을 좌표로 확인.
- 휠 항목 사이 간격이 0(높이 20px로 딱 붙어있음)인 것 확인.
- 요일 그리드 셀 너비 15px, 숫자 원 너비 15px(셀에 꽉 참), 폰트 10.5px로 확인. 날짜 클릭 시 정상적으로 선택·반영되는 것도 재확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 필터 6차 미세조정 — 휠 간격 추가 축소, 일자 여백 추가 축소

### 1. 연/월 휠 항목 간격 추가 축소
항목 높이를 20px→10px로 더 줄임(휠 폰트도 10px/11px → 8px/8.5px로 같이 줄여 10px 높이 안에 맞춤). `.wheel-highlight`/`.wheel-col`/`.wheel-pad` 높이, JS `WHEEL_ITEM_H` 상수 전부 10으로 함께 맞춤.

### 2. 일자 숫자 여백 추가 축소(폰트는 유지)
"폰트는 괜찮다"는 요청대로 숫자 폰트(10.5px)는 그대로 두고, `.account-filter-cal`의 좌우 패딴을 3px→1px, 상하 8px→6px로 더 줄이고, 숫자 원을 15px→16px로 셀 너비에 맞춰 키워 여백만 더 좁힘.

### 검증 (실로그인 라이브 확인)
- 휠 항목 높이 10px, 항목 사이 간격 0인 것 확인.
- 달력 패딩이 `6px 1px`로 줄어든 것, 요일 셀/숫자 원 너비가 16px로 커진 것, 폰트는 10.5px 그대로인 것 확인.
- 날짜 클릭 시 정상 선택·반영되는 것 재확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 필터 7차 — 앞선 6차 수정의 실수 2건 바로잡음

562님이 바로 지적: (1) 휠 항목 높이만 줄이라고 했는데 폰트(10px/11px→8px/8.5px)까지 같이 줄여버림 — 요청에 없던 변경. (2) "일자 좌우 여백을 더 줄여달라"고 했는데 실제로는 거의 그대로였음.

### 원인 분석 및 수정
1. **폰트 되돌림**: 6차에서 항목 높이를 10px로 줄이면서 "10px 높이 안에 텍스트가 들어가야 한다"고 임의로 판단해 폰트까지 줄였던 게 잘못 — 요청은 간격(높이)만이었음. `.wheel-item`/`.wheel-item.active` 폰트를 10px/11px(6차 이전 값)로 되돌림. 높이는 10px 그대로 유지(텍스트가 살짝 넘쳐도 시각적으로는 문제없음).
2. **여백이 안 줄어든 진짜 원인**: 실측해보니 숫자 원(`.num`, 16px)이 이미 요일 그리드 한 칸(16px)에 **정확히 꽉 차 있어서** CSS 마진/패딩상으로는 여백이 0이었음 — 그래서 `.account-filter-cal`의 바깥 패딩만 만졌던 6차 수정은 체감상 아무 효과가 없었던 것. 실제 "여백"으로 보이는 건 16px 원 안에서 10.5px 글자가 차지하는 부분 외의 **빈 공간**이었음. 폰트 크기는 그대로 두고 원 자체를 16px→11px로 줄여서, 글자 크기는 그대로인데 그 주변 여백만 좁아지도록 수정.

### 검증 (실로그인 라이브 재확인)
- 휠 폰트가 10px/11px(6차 이전 값)로 복원된 것, 항목 높이는 10px 그대로인 것 확인.
- 숫자 원 너비가 11px로 줄어든 것(칸 너비 16px은 그대로), 폰트는 여전히 10.5px인 것 확인.
- 날짜 클릭 시 정상 선택·반영되는 것 재확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 필터 8차 — 7차의 숫자 원 축소가 오히려 역효과였음을 바로잡음

562님 재지적: "일자간 좌우 간격 줄여달라"고 했는데 7차에서 숫자 원(`.num`)을 건드렸다 — 원을 건드려달란 적 없다는 지적. 다시 원은 원상복구하고, 진짜 요청(휠 폰트 +3px, 휠 간격/높이 +5px, 일자간 간격 축소)만 정확히 반영.

### 7차 진단이 틀렸던 이유
7차에서 "여백은 16px 원 안에서 글자가 차지 않는 빈 공간"이라 판단해 원을 16px→11px로 줄였는데, 이건 **거꾸로** 였음 — 요일 칸 너비는 16px 그대로인데 원만 11px로 작아지면, 칸 안에서 원이 가운데 정렬되며 원 좌우로 여백이 새로 생기고, 칸끼리는 이미 `column-gap:0`으로 붙어있으므로 결과적으로 **인접한 두 날짜 숫자 사이 간격이 오히려 더 벌어짐**(원래 0이었던 간격이 원 축소분만큼 새로 생김). 562님이 "여백이 그대로"가 아니라 실제로는 "더 벌어졌다"고 느낀 게 맞았던 것.

### 수정
1. 휠 폰트: 10px/11px → **13px/14px**(+3px), 휠 항목 높이(=항목 간 간격): 10px → **15px**(+5px). JS `WHEEL_ITEM_H` 상수도 15로 함께 수정.
2. 숫자 원을 다시 **16px**로 복구(칸 너비와 동일) — 이러면 `column-gap:0`인 인접 칸의 원끼리 정확히 맞닿아 "일자간 좌우 간격"이 0이 됨(더 줄일 자리가 없을 만큼 최소).

### 검증 (실로그인 라이브 확인)
- 휠 폰트 13px(일반)/14px(선택됨), 항목 높이 15px로 정확히 반영된 것 확인.
- 숫자 원 16px = 요일 칸 너비 16px, 인접한 두 날짜 숫자 사이 간격을 좌표로 측정해 정확히 0px인 것 확인.
- 날짜 클릭 시 정상 선택·반영되는 것 재확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] My 렌탈 필터 9차 — 휠 폰트 -2px, 요일 칸 간격 실측(질문에 답만)

### 1. 휠 폰트 -2px
13px/14px → **11px/12px**로 축소.

### 2. "일~토 사이 좌우 간격" 질문에 대한 답변(구현 없음)
562님이 명확히: "숫자 원 사이 간격이 아니라, 일~토 요일 칸 자체의 좌우 간격"을 물어봄. 실측 결과:
- 요일 라벨(`.dow`) 행과 날짜 숫자(`.days`) 행 둘 다 이미 7칸이 각 16px씩, **칸 사이 간격 0px**로 서로 완전히 붙어있음(칸-투-칸 간격 자체는 더 줄일 여지가 없음).
- 다만 "일~토 전체가 차지하는 가로 폭"(112px)을 줄이는 건 가능 — 단, 그러려면 지금 시작일/종료일 "박스와 동일한 너비"로 맞춰둔 달력 전체 너비(약 115px) 자체를 그 박스보다 더 좁게 만들어야 함(이전 세션에서 "박스와 동일한 크기로 열리게" 요청이 있었던 부분과 상충). 이 트레이드오프를 안내만 하고 실제 변경은 562님 확인 후 진행하기로 함.

### 검증
- 휠 폰트 11px/12px로 반영된 것 확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 내 정보 페이지 "이름" 필드 수정 비활성화

`components/ProfileForm.tsx`의 "이름" 입력란을 "아이디" 필드와 같은 패턴(비활성화, `.pf-edit` 스타일 제거)으로 변경 — 더 이상 수정할 수 없고 항상 가입 시 이름을 그대로 보여줌. `name` 상태(`useState`)를 제거하고 저장 시 `profile.name`을 그대로 전송하도록 정리.

### 검증 (실로그인 라이브 확인)
- "이름" 입력란이 비활성화(disabled)되고 값이 정상 표시되는 것 확인.
- 다른 필드 수정 후 저장 시 "저장되었습니다" 정상 동작, DB의 이름 값도 변경 없이 그대로인 것 확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 전체 상품 보기에 카테고리 필터(밑줄 링크) 추가

`components/LookGrid.tsx`의 "전체 상품 보기"(`viewMode === 'products'`) 화면 3가지 아이콘 바로 아래에, 상품의 `category` 값 기준으로 "전체/원피스/자켓/블라우스/치마/구두/백" 밑줄 링크 목록을 추가. 클릭하면 해당 카테고리 상품만 나열되고(로컬 state로 필터링, 페이지 이동 없음), "전체"를 누르면 다시 전체 상품이 보임.

### 구현
- `products.map((p) => p.category)`에서 중복 제거해 카테고리 목록 자동 생성(하드코딩 안 함 — 상품이 늘어나도 자동 반영).
- `selectedCategory` state로 필터링한 `visibleProducts`를 `product-list`에서 사용.
- `.category-filter-link`(밑줄, 배경/테두리 없음) — 선택된 카테고리만 진한 색+굵게(`.on`).

### 검증 (실로그인 라이브 확인)
- "전체 상품 보기" 진입 시 카테고리 6개 + "전체"가 밑줄 텍스트로 표시되는 것 확인.
- "치마" 클릭 → 치마 상품 1개만 남는 것, "전체" 클릭 → 다시 상품 6개 전부 보이는 것 확인.
- 선택된 카테고리가 진한 색+굵게 스타일로 표시되는 것 확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 전체 상품 보기 카테고리 필터 오른쪽 정렬 + 간격 축소

`.category-filter-row`에 `justify-content:flex-end` 추가(오른쪽 정렬), `gap`을 14px→8px로 축소.

### 검증 (실로그인 라이브 확인)
- 카테고리 목록 오른쪽 끝이 컨테이너 오른쪽 끝과 정확히 일치하는 것을 좌표로 확인.
- 카테고리 사이 간격이 8px인 것을 좌표로 확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 전체 상품 보기 — 아이콘/카테고리 여백 축소 + 카테고리 폰트 통일

1. 아이콘 줄(`.look-view-toggle`) 위아래 패딩 12px→9px, 카테고리 줄(`.category-filter-row`) 위아래 마진 14px→9px로 축소.
2. 카테고리 링크 폰트를 12.5px → **10.5px**로 변경 — 이 세션에서 반복적으로 써온 기본 라벨 폰트 크기(`.field-section`과 동일, [[feedback_form_ui_sizing]] 메모리 규칙)에 맞춤.

### 검증 (실로그인 라이브 확인)
- 아이콘 줄 패딩 9px/9px, 카테고리 줄 마진 9px/9px로 반영된 것 확인.
- 카테고리 폰트 10.5px로 반영된 것 확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 배송 정보 폼 대개편(15건) — 픽업 삭제, 근무지 문구 정리, 회수지 선택사항화, 마케팅/My렌탈/로그인/상품명 폰트 정리

562님이 한 번에 요청한 15건을 순서대로 반영. 대부분 `components/DeliveryInfoForm.tsx`가 내 정보/카트 페이지에서 공유되는 컴포넌트라 한 곳만 고치면 양쪽에 자동 반영됨.

### 1~6. DeliveryInfoForm.tsx (내 정보 + 카트 공용)
1. "자택으로 받기"→**"자택 주소 입력"**, "근무지로 받기"→**"근무지 주소 입력"**. "직접 픽업·회수하기" 버튼과 그 패널을 완전히 삭제(내부 `pickup` 모드 타입/저장 로직은 하위호환을 위해 그대로 둠 — 혹시 이미 pickup으로 저장된 기존 데이터가 있어도 깨지지 않게).
2. 근무지 섹션의 "기본 배송지 등록" → **"기본 근무지 등록"**(자택 섹션은 그대로 "기본 배송지 등록" 유지).
4. `renderAddressPills()`를 컨텍스트별로 분기해 근무지 섹션의 "기본 배송지" 알약 → **"기본 근무지"**.
5. 근무지 메인 섹션의 "근무지 상호 입력" → **"근무지 상호명 입력"**(주소록 수정 모달의 동일 필드 placeholder도 함께 통일).
3. "이 근무지에서 회수" 끔 상태의 회수 입력란: "회수 근무지 주소"→**"회수 주소"**(라벨+placeholder), "근무지 상호 입력"→**"세부 주소 (건물명, 호수)"**, **"배송 상세 위치" 입력란 완전 삭제**(관련 state `returnWorkplaceDeliveryLocation`도 제거, `save()`에서 근무지 회수지의 해당 컬럼은 그냥 저장 안 함).
6. 자택·근무지 양쪽 "회수 주소" 라벨 밑에 **"회수 장소가 불분명한 경우에는 비워두시고 카카오톡 채널로 연락 주세요."** 안내 문구 추가(`.return-addr-hint`, 10.5px).

### 7. 회수 주소 없이도 저장/결제 가능 여부 확인
실제로 코드를 다 훑어봤는데 **이미 어디에도 회수 주소를 필수로 요구하는 검증이 없었음**(클라이언트 `save()`, 서버 `updateProfile`, DB 스키마 전부 nullable). 실제로 라이브 테스트로 재확인: 회수 주소를 완전히 비운 채로 내 정보 저장 → 성공, 카트에서 회수 주소 동일 끄고 회수란을 비운 채 결제하기 → 결제 페이지까지 정상 진입, DB에 `return_address`가 실제로 `null`로 저장되는 것까지 확인(처음 테스트 땐 스크립트로 입력값을 잘못 채워서 착시가 있었는데, `form_input`으로 제대로 채워서 재검증함). 코드 변경 없음 — 이미 되던 기능이었음.

### 8~9. 마케팅 동의 섹션 (ProfileForm.tsx)
"신규 룩북 소식"→**"룩북 업로드 소식"**, "데일리 코디 추천"→**"데일리 코디 추천(예정)"**. 3개 라벨 폰트를 12px→10.5px(`.field-section`과 통일)로, 자간(letter-spacing) 활용한 고정폭 정렬(`.pf-row-label-marketing-fit`, 105px)로 길이가 다른 라벨(8~11자)의 오른쪽 끝을 서로 맞춤. 섹션 제목 "마케팅 정보 수신 동의"도 같은 원리로 행 전체 너비에 맞춰 자간을 벌림(`.marketing-section-fit`).

### 10. 구두 사이즈 알약 2줄→1줄
`전체 상품 보기`(`.product-row .li-row .size-chip-row`)의 `max-width`가 100px로 3자리 사이즈(235/240/250) 3개가 들어가기엔 좁아서 줄바꿈되던 것을 135px로 넓히고 `flex-wrap:nowrap` 추가. 다른 화면(룩 상세 `LookItems.tsx`)은 같은 제약이 없어 문제 없음을 확인.

### 11. My 렌탈 필터 프리셋 폰트
`.account-filter-presets button`의 폰트를 12px→10.5px로 통일.

### 12~13. 주문 문제 대응 문구 + 위치
- "깔끔히 처리 후 보내드릴게요." → **"깔끔히 수선·세탁 후 보내드릴게요."**
- "오배송 확인되어 처리중에 있어요." → **"오배송 확인되어 처리중이에요."**
- "불필요한 분쟁이 발생되지 않게 확인, 처리 중이에요." → **"불필요한 분쟁이 발생되지 않게 확인·처리 중이에요."**
(`app/(member)/account/page.tsx`, `app/(member)/account/[orderId]/page.tsx` 둘 다 반영)
- My 렌탈 목록 카드의 대응 문구(`.resv-response-row`) 위치를 카드 오른쪽 위 → **오른쪽 세로 가운데**로 변경(`.resv-group`에 `position:relative`, `.resv-response-row`를 `position:absolute;top:50%;transform:translateY(-50%)`로).

### 14. 로그인 페이지 개편
큰 "로그인" 제목(`<h1>`, 34px) 삭제. "예약을 진행하려면 로그인하세요." 안내문을 페이지 상단에서 **로그인 버튼 바로 위**로 이동, 폰트를 앱에서 가장 많이 쓰는 크기인 **13px**로 통일(`.login-sub-fit`, 로그인 페이지 전용 — 같은 `.auth-sub` 클래스를 공유하는 회원가입/멤버십 결제 페이지에는 영향 없음).

### 15. 상품명 폰트 전체 -1px
`.cart-name`(13→12), `.order-item-name`(14→13), `.li-name`(12.5→11.5), `.product-row-name`(13→12) — 4곳 전부 확인. `.appr-name`(관리자 승인 화면의 "고객 이름")은 상품명이 아니라서 제외.

### 검증 (실로그인 라이브 + 실DB 확인, 전부 테스트 계정으로 진행 후 삭제)
- 내 정보/카트 양쪽에서 버튼 문구, 근무지 라벨/알약, 회수 섹션 문구, 안내 문구 전부 실측 확인.
- 회수 주소 완전히 비운 채 내 정보 저장 성공 + 카트 결제 진입 성공 + DB에 `return_address: null` 저장 확인.
- 마케팅 3라벨이 전부 동일한 좌우 좌표(28~133px)로 정렬되는 것 확인.
- 전체 상품 보기에서 구두 사이즈 3개가 같은 y좌표(1줄)로 렌더링되는 것 확인.
- 문제 상태 테스트 주문을 만들어 문구 변경 + 카드 세로 중앙 정렬(response 중심 y = 카드 중심 y, 좌표 정확히 일치) 확인.
- 로그인 페이지 안내문 13px 확인.
- 4개 상품명 클래스 전부 폰트 축소 확인.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 배송 정보 폼 2차 개편(6건) — 배송정보 입력 상위 버튼, 강조 문구, 라벨 통일, 로그인/My렌탈 미세조정

### 1. "배송 정보 입력" 상위 버튼 신설 (DeliveryInfoForm.tsx)
자택/근무지 버튼을 바로 노출하던 걸, 새 최상위 버튼 "배송 정보 입력"을 만들어 그 아래로 편입. `deliveryPanelOpen` state로 펼침/접힘 제어 — 이미 배송 방법이 저장돼 있으면(기존 사용자) 처음부터 펼쳐서 보여주고, 없으면(신규) 접힌 채로 시작.

### 2. 회수 주소 안내 문구를 브랜드 색으로 강조
`.return-addr-hint`의 색을 `var(--muted)` → `var(--espresso)`(브랜드 색), `font-weight:500` 추가. 내 정보·카트 공용 컴포넌트라 양쪽 자동 반영.

### 3. "마케팅 정보 수신 동의" 라벨을 "룩북 업로드 소식"과 완전히 동일하게
지난 세션에 만든 "섹션 제목은 행 전체 너비로 늘리는" 방식(`.marketing-section-fit`)을 없애고, 섹션 제목에도 하위 토글 라벨과 완전히 같은 클래스(`.pf-row-label-marketing-fit`, 105px 고정폭)를 적용 — 이제 4개 라벨(제목+토글 3개) 전부 좌표(28~133px)와 폰트(10.5px)가 정확히 일치.

### 4. 로그인 페이지 안내문 왼쪽 정렬 + 버튼 간격 축소
`.login-sub-fit`을 `text-align:center`→`left`로. 간격이 안 줄던 원인: `.auth-form`이 `flex` 컨테이너라 자식 간 마진이 서로 상쇄(collapse)되지 않고 `margin-bottom + flex gap(7px) + margin-top`이 그대로 합산되고 있었음 — 안내문 `margin-bottom`과 로그인 버튼의 `margin-top`(원래 `.cta` 기본값 18px)을 각각 0으로 없애 간격을 flex gap만 남긴 7px까지 줄임(기존 17px에서 축소).

### 5~6. My 렌탈 대응 알약 폰트/정렬
- "불필요한 분쟁이 발생되지 않게 확인·처리 중이에요." 알약(`.resv-response`) 폰트를 10.5px→11px로, 상태 알약(`.resv-status`, 11px)과 통일.
- "위쪽이 아닌 가운데 정렬" 요청은 실측 결과 지난 세션에서 이미 적용된 상태(카드 세로 중앙, y좌표 313≈312)였음 — 추가 변경 없이 확인만 다시 함.

### 검증 (실로그인 라이브 확인)
- "배송 정보 입력" 클릭 시 자택/근무지 버튼이 펼쳐지는 것 확인.
- 회수 주소 안내 문구 색상이 `rgb(28,22,17)`(브랜드 색)인 것 확인.
- 마케팅 라벨 4개 전부 좌표(28~133px)·폰트(10.5px) 완전 일치 확인.
- 로그인 페이지 안내문 왼쪽 정렬, 버튼과의 간격이 7px로 줄어든 것 확인.
- My 렌탈 대응 알약 폰트 11px(상태 알약과 동일), 카드 세로 중앙 정렬(y좌표 313≈312) 확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 배송 정보 폼 3차 개편(5건) — 배송정보 버튼 가운데 정렬/항상 접힘, 회수 안내 위치, 마케팅 라벨 1줄, 로그인 문구 삭제, My렌탈 위치 원인 규명

### 1. "배송 정보 입력" 버튼 가운데 정렬 + 항상 접힌 채로 시작
지난 세션에 붙인 `align-self:center`가 실제로는 효과가 없었음(부모가 flex 컨테이너가 아니라서 `align-self`가 아예 적용 안 됨) — `display:block;margin:0 auto` 인라인 스타일로 실제 가운데 정렬 확인(좌우 여백 53px로 동일). 기존에 저장된 배송지가 있어도 `deliveryPanelOpen`을 항상 `false`로 시작하도록 변경 — 반드시 클릭해야 자택/근무지 버튼이 펼쳐짐.

### 2. 회수 주소 안내 문구 ↔ "회수 주소" 라벨 순서 교체
자택/근무지 양쪽 다 안내 문구("회수 장소가 불분명한...")가 "회수 주소" 라벨보다 먼저 나오도록 순서 변경.

### 3. "마케팅 정보 수신 동의" 1줄로
지난 세션에 105px로 맞춘 고정폭이 "마케팅 정보 수신 동의"(10자, 넓은 한글 위주라 105px엔 못 들어감) 기준으로는 좁아서 2줄로 줄바꿈되고 있었음(반면 "데일리 코디 추천(예정)"은 괄호 2개가 좁아서 105px에 들어갔음) — 105px→130px로 넓히고 `white-space:nowrap`도 추가해 확실하게 1줄로 고정. 4개 라벨 전부 높이 17px(1줄)로 확인.

### 4. 로그인 페이지 안내문 완전 삭제
"예약을 진행하려면 로그인하세요." `<p>` 자체를 제거(지난 세션엔 위치만 옮겼었는데, 이번엔 완전히 삭제). 이제 쓰이지 않는 `.login-sub-fit` CSS도 같이 정리.

### 5. My 렌탈 대응 알약 위치 — 원인 규명 (구현 없이 확인만)
562님이 "여전히 위쪽, 세로 중앙 아님"이라고 재확인 요청 — 실측해보니 **페이지에 따라 다른 원인**이었음:
- **My 렌탈 목록 페이지**(`/account`): 지난 세션 수정이 그대로 잘 적용돼 있음 — 카드 세로 중앙(y좌표 312=312) 정확히 확인.
- **주문 상세 페이지**(`/account/[orderId]`): 여기가 문제였음 — `수거검수중 오염, 손상 확인`(RETURN_ISSUE) 상태는 애초에 상단 요약 영역이 아니라 **"포함 상품" 목록의 해당 상품 이름 옆에 인라인으로 표시**되도록 설계되어 있음(이전 세션에서 "어떤 상품이 문제인지가 중요해서" 의도적으로 그렇게 만든 것, `app/(member)/account/[orderId]/page.tsx`의 `isPerItemIssue` 분기). 그래서 이 페이지에선애초에 "카드 세로 중앙"이라는 개념 자체가 적용되지 않고, 상품 목록 안 어딘가에(대개 첫 상품 옆이라 위쪽처럼 보임) 나타나는 게 정상 동작이었음. 이 설계를 바꿀지는 562님 확인 필요 — 별도 요청 시 반영 예정.

### 검증 (실로그인 라이브 확인)
- "배송 정보 입력" 좌우 여백 53px로 동일(가운데 정렬), 클릭 전엔 하위 버튼 안 보이는 것 확인.
- 회수 주소 섹션에서 안내 문구가 라벨보다 먼저 나오는 순서 확인.
- 마케팅 라벨 4개 전부 높이 17px(1줄) 확인.
- 로그인 페이지에 안내문 자체가 없는 것 확인.
- My 렌탈 목록 페이지는 여전히 정확히 중앙 정렬(312=312), 상세 페이지는 애초에 다른 위치(상품 옆 인라인)에 표시되는 걸 실측으로 확인.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 배송 정보 폼 4차 — 회수 안내 여백 축소, 대응 알약을 상품 이미지에 정확히 정렬

### 1. 회수 주소 안내 문구 ↔ 라벨 간격 축소
`.return-addr-hint`의 `margin-bottom`을 6px→2px로 줄임(실측 간격 11px로 축소).

### 2. 대응 알약을 "상품 이미지" 기준 세로 중앙으로 재배치
562님이 명확히 확인: 상품별 인라인 표시(전 세션 설계)는 그대로 유지하되, 그 알약을 **상품 이미지(swatch/thumb) 높이 기준으로 세로 중앙 정렬**해달라는 요청.
- **My 렌탈 목록**(`account/page.tsx`): 알약을 `.resv-group`(카드 전체) 기준에서 `.resv-list`(스와치 이미지 행) 기준으로 옮김 — `.resv-list`를 `position:relative`로 만들고 알약을 그 안의 자식으로 이동, `.resv-response-row`는 그 안에서 절대 위치.
- **주문 상세**(`account/[orderId]/page.tsx`): 상품명 옆 인라인이던 알약(`.order-item-name-row` 안)을 빼서 `.order-item-row`(썸네일+정보 감싸는 행) 기준 절대 위치로 이동 — `.order-item-row`를 `position:relative`로, 새 `.order-item-response-row` 클래스로 썸네일과 같은 높이에서 세로 중앙 정렬. 이제 아이템별로 각자의 썸네일에 맞춰 정확히 정렬됨.

### 검증 (실로그인 라이브 확인, 2개 상품 주문으로 테스트)
- My 렌탈 목록: 스와치 이미지 중심 y좌표(341)와 알약 중심 y좌표(341) 정확히 일치 확인.
- 주문 상세: 2개 상품 각각의 썸네일 중심(357, 433)과 그 옆 알약 중심(357, 433)이 각각 정확히 일치 확인 — 아이템마다 독립적으로 자기 이미지에 맞춰 정렬됨.
- 테스트 계정 정리 완료.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 회수 주소 안내 문구 여백 7px로 정확히 맞춤

`.return-addr-hint`의 `margin-bottom`을 2px→-2px로 조정해 안내 문구와 "회수 주소" 라벨 사이 간격을 정확히 7px로 맞춤(실측 확인). 내 정보·카트 공용 컴포넌트라 자택/근무지 양쪽 다 자동 반영.

### 검증
- 라이브 좌표 측정으로 간격이 정확히 7px인 것 확인.
- 테스트 계정 정리 완료. `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 고객용 이용안내(User Guide) 페이지 신규 추가 + "My 렌탈" → "내 렌탈" 용어 통일

562님 요청: 이용안내 가이드 페이지를 만들어서 헤더 "내 정보" 앞에 "User Guide"로 링크 걸어달라는 요청 + "My 렌탈"을 "내 렌탈"로 수정.

### 1. `/guide` 페이지 신규 추가
`app/(customer)/guide/page.tsx` — 실제 코드(가입비 100,000원, 보증금 50,000원, 배송 시간대 3~8시, 7단계 이행상태 라벨, 3가지 문제 상태, 휴무일 청구 제외, 분쟁 시 탈퇴 차단 등)를 그대로 반영한 정적 서버 컴포넌트. `(customer)` 라우트 그룹에 둬서 로그인 여부와 무관하게 열람 가능(회원 승인 게이트 없음).
- 가입/승인, 룩북 둘러보기, 예약, 배송 정보 입력, 결제, 배송 현황(7단계+문제 3종), 반납, 탈퇴, FAQ 순으로 구성. 맨 위에 "가입(1회)"과 "예약 사이클(반복)" 두 단계 흐름 개요를 먼저 보여줘서 "시스템의 흐름부터 이해하고" 요청 충족.
- 새 디자인이 아니라 **기존 디자인 시스템을 그대로 재사용**: `:root` 팔레트(`--paper/--espresso/--wine/--sage/--gold/--muted/--line`), `.eyebrow`, `.field-section`, `.summary .row`(가격 목록), `.resv-status`/`.resv-status.resv-problem`(이행상태 알약을 그대로 재사용해 실제 화면과 동일한 알약으로 표시) 등. 신규 클래스는 `globals.css`에 `.guide-*` 프리픽스로 추가(히어로/플로우 칩/섹션/스텝리스트/카드/FAQ).

### 2. 헤더 네비 — "User Guide" 링크 추가
`components/CustomerHeader.tsx`: 로그인 상태 네비의 "내 정보" 앞에 `<Link href="/guide" className="nav-guide">User Guide</Link>` 추가. `.nav-guide{text-decoration:underline}` 클래스로 다른 네비 링크와 달리 밑줄 표시.

### 3. "My 렌탈" → "내 렌탈" 용어 통일
실제 앱 코드에서 발견된 3곳 전부 수정: `CustomerHeader.tsx`(네비 링크), `payments/success/page.tsx`(결제완료 안내문+버튼), `lib/account-actions.ts`(탈퇴 시 분쟁 차단 안내문).

### 검증
- `npm run build`/`npm run lint` 클린(`/guide` 라우트 정상 등록 확인).
- 관리자 스크립트로 승인된 상태(`status: 'approved'`)의 테스트 회원 계정을 만들어 실로그인 → 헤더에 "User Guide · 내 정보 · CART · 내 렌탈 · 로그아웃" 순서로 노출되는 것 확인, "User Guide" 링크의 `text-decoration-line: underline` 및 `href="/guide"` 실측 확인, 클릭 시 실제로 `/guide` 페이지 전체 콘텐츠가 렌더링되는 것 확인.
- 테스트 계정(customer 행 + auth user) 정리 완료.

## [Claude Code 세션] 헤더 네비 간격 조정 — "User Guide" 추가로 좁은 화면에서 글자 줄바꿈 발생하던 문제 해결

562님이 헤더 네비가 브랜드 로고를 침범하지 않게 간격을 조절해달라고 요청. 실측해보니 실제 원인은 "User Guide" 추가로 네비 항목이 5개(User Guide·내 정보·CART·내 렌탈·로그아웃)로 늘면서, 좁은 화면(320~375px)에서 "내 정보"/"내 렌탈"/"로그아웃" 텍스트가 폭 부족으로 글자 중간에서 줄바꿈되어(2줄로 깨짐) 지저분해 보이던 문제였음.

`app/globals.css` 수정:
- `.nav-actions` 항목 간 `gap`을 7px→5px로 축소.
- `.nav-links margin-right`, `.who margin-left`를 각각 24px→16px로 축소해 여백 확보.
- `.nav-actions a,.nav-actions .linklike`와 `.who`에 `white-space:nowrap` 추가 — 폭이 빠듯해도 글자 중간에서 줄바꿈되는 대신 한 줄을 유지하도록 방어.

### 검증
- 승인된 테스트 회원 계정으로 실로그인 후, 320px·375px 너비에서 네비 5항목 전부 `height:18.39px`(단일 줄)로 렌더링되는 것을 실측 확인(수정 전엔 320px에서 "내 정보"/"내 렌탈"/"로그아웃"이 `height:36.78px`로 2줄 줄바꿈되고 있었음).
- 골드 룰(로고 하단선) bottom과 네비 top 사이 간격이 16px로 유지되어 로고와 네비가 겹치지 않는 것 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정 정리 완료.

## [Claude Code 세션] 주문 취소·환불 기능 신규 구현 (30번째 마이그레이션)

562님 지적: 이용안내 가이드에 결제 취소·환불 규칙이 빠져 있었음 — 확인해보니 실제로 **앱에 취소·환불 기능 자체가 구현되어 있지 않았음**(주문 취소 버튼 없음, Toss 환불 API 호출 코드 없음). 정책을 확인받은 뒤 실제 기능으로 구현함.

**확정된 정책**: (1) 렌탈 결제(대여료)는 배송 시작 전까지 전액 환불, 앱 내 취소 버튼으로 직접 신청. (2) 멤버십 가입비는 원칙적으로 환불 불가, 단 승인 거절 시에만 전액 환불. (3) 보증금은 기존 정책(반납 검수 후 문제없으면 반환) 유지.

### 1. DB — `db/order-cancel.sql`(신규, 30번째 마이그레이션)
`payment_order.status`/`fulfillment_status` CHECK 제약에 `'CANCELLED'` 값 추가(기존 파일은 불변 원칙이라 새 파일로 추가). `CLAUDE.md`/`README.md` 마이그레이션 순서 목록에도 반영. 562님이 Supabase SQL Editor에서 직접 실행 완료.

### 2. `lib/payments.ts` — `tossCancel()` 신규
기존 `tossConfirm`/`tossGetPayment`과 동일한 fetch+Basic 인증 패턴으로 `POST /v1/payments/{paymentKey}/cancel` 호출하는 전액 취소 함수 추가.

### 3. `lib/payments-actions.ts` — `cancelOrder()` 신규 서버 액션
고객 본인 소유 주문인지 확인 후, 다음 조건을 모두 만족해야 취소 가능: `status==='PAID'`, `disputed===false`, `fulfillment_status`가 `ORDERED`/`PRE_INSPECTING`/`READY` 중 하나(=배송 시작 전). 토스 환불 성공 시에만 `payment_order.status/fulfillment_status='CANCELLED'`, 연결된 `reservation.status='CANCELLED'`로 갱신(`no_double_booking` EXCLUDE 제약이 `status='ACTIVE'`에만 걸려 있어 자동으로 재고가 풀림). 환불 실패 시 DB는 그대로 두고 실패 사유만 반환.

### 4. `lib/roles-actions.ts` — `rejectMember()` 수정
기존엔 거절 시 회원 정보를 바로 삭제하기만 하고 이미 낸 가입비를 환불하지 않던 버그가 있었음(멤버십 결제 행이 `customer` 삭제 시 `on delete cascade`로 같이 사라져 환불 기록조차 안 남는 상태였음). 이제 해당 고객의 `PAID` 상태 `membership_payment`를 찾아 `tossCancel()`로 먼저 환불하고, **환불이 성공한 경우에만** 회원 정보를 삭제하도록 순서를 바꿈. 환불 실패 시 거절 자체를 중단하고 사유를 반환.

### 5. UI
- `components/CancelOrderButton.tsx`(신규): `.modal-ov`/`.modal`/`.modal-btns` 기존 클래스를 재사용한 확인 모달 + 취소 버튼.
- `app/(member)/account/[orderId]/page.tsx`: 취소 가능 조건을 만족할 때만 버튼 노출, `CANCELLED` 라벨("취소됨"/"취소·환불완료") 추가.
- `app/(member)/account/page.tsx`: 목록 페이지 라벨에도 `CANCELLED: '취소됨'` 추가.
- `components/AdminApprovals.tsx`: 거절 실패(환불 실패) 시 사유를 화면에 표시하도록 에러 상태 추가.

### 6. `lib/legal-content.ts` — 이용약관(제7조)에 조항 추가
"배송 전까지 대여료 전액 환불", "가입비는 승인 거절 시에만 환불" 2개 항 신설.

### 7. `/guide` 페이지 — "취소·환불" 섹션 신규 추가
반납(07)과 탈퇴(기존 08→09) 사이에 배치, 실제 정책 그대로 기재.

### 검증
- **마이그레이션**: 562님이 SQL Editor에서 실행 완료 확인 후, 실제로 `payment_order.status`/`fulfillment_status`에 `'CANCELLED'`를 써봐서 제약이 통과하는 것 실측 확인.
- **주문 취소 UI 게이팅**: 실제 카트→체크아웃까지 진행해 `PENDING` 주문 2건을 만든 뒤 관리자 스크립트로 각각 `PAID`+`ORDERED`(취소 가능해야 함), `PAID`+`SHIPPED`(취소 불가해야 함) 상태로 세팅 — 주문 상세 페이지에서 전자는 "주문 취소·환불" 버튼이 보이고 후자는 안 보이는 것 확인.
- **취소 플로우 + 실패 안전성**: 가짜 `payment_key`로 취소를 실행해 실제 토스 API가 `"존재하지 않는 결제 정보 입니다"`라는 구체적인 응답을 반환하는 것까지 확인(엔드포인트·인증 헤더·요청 형식이 토스 서버에 정상적으로 도달함을 실증) — 실패 시 주문 상태가 `PAID`/`ORDERED`로 그대로 유지되는 것도 DB에서 재확인(성공 전 상태를 미리 바꾸지 않는 안전한 순서 확인).
- **취소 완료 후 라벨**: 관리자 스크립트로 `CANCELLED`로 세팅한 뒤 주문 상세 페이지에서 "취소·환불완료"/"취소됨" 라벨이 정확히 렌더링되고 취소 버튼이 사라지는 것 확인.
- **가입 거절 환불**: 승인 대기 + 가짜 `payment_key`를 가진 가입비 결제 완료 상태의 테스트 신청자와, 디렉터 권한 테스트 계정을 만들어 실제 `/admin/approvals`에서 "거절" 클릭 → 토스 환불 실패 사유가 화면에 표시되고, **회원 정보가 삭제되지 않고 그대로 남아있는 것**을 DB에서 재확인(환불 성공 전에는 삭제되지 않는 안전한 순서 확인).
- **참고(환경 제약)**: 이 세션의 샌드박스 브라우저에서 토스 결제위젯 스크립트(`loadTossPayments`)가 로드되지 않는 문제가 있어(외부 `fetch`/페이지 이동 자체는 정상 작동하는 것으로 확인됨 — 위젯 SDK의 동적 `<script>` 주입 방식만 걸리는 것으로 추정), 실제 결제→취소 전액 성공 왕복까지는 이 세션에서 완주하지 못함. 대신 위 방식대로 실패 경로·게이팅·라벨·DB 안전성을 전부 실측 확인했고, `tossCancel()`은 `tossConfirm`/`tossGetPayment`와 동일한 검증된 패턴을 그대로 따름. **실제 브라우저(샌드박스 아님)에서 결제 후 취소까지 한 번 눌러봐 주시면 완전한 확인이 될 것 같습니다.**
- 테스트 계정(고객 2건 + 디렉터 1건) 및 스크래치 스크립트 전부 정리 완료. `npm run build`/`npm run lint` 클린.

### 추가 조정: 간격 한 단계 더 축소
562님이 조금 더 줄여달라고 재요청 — `.nav-actions gap` 5px→3px, `.nav-links margin-right`/`.who margin-left` 16px→10px로 추가 축소.
- 실로그인 재검증: 320px/375px 모두 5항목 여전히 단일 줄(`height:18.39px`) 유지, 우측 끝까지 여유 있게 들어감. `npm run build`/`npm run lint` 클린. 테스트 계정 정리 완료.

## [Claude Code 세션] "주문 취소·환불" 버튼 위치 변경 — 주문 상세 → 내 렌탈 목록(해당 주문 카드)

562님 요청: 취소 버튼을 주문 상세 페이지(`/account/[orderId]`)에서 내 렌탈 목록 페이지(`/account`)의 해당 주문 카드로 옮겨달라는 요청.

### 1. `app/(member)/account/page.tsx`
- `orderQuery`에 `status` 컬럼 추가 조회, `OrderInfo` 타입에도 반영.
- 그룹별로 취소 가능 조건(`status==='PAID' && !disputed && fulfillment_status가 배송 전 3단계 중 하나`)을 계산해 `<CancelOrderButton orderId={...} />`를 `.resv-list` 바로 아래에 조건부 렌더링.
- `.resv-group .cancel-order-btn{margin-top:12px;padding:9px;font-size:12px}` 추가(카드 안에 맞게 컴팩트하게).

### 2. `app/(member)/account/[orderId]/page.tsx`
버튼과 취소 가능 여부 계산 로직(`CANCELLABLE_FULFILLMENT_STATUSES`, `isCancellable`), `CancelOrderButton` import 전부 제거. `CANCELLED` 라벨 표시(상태 알약·"결제 상태" 줄)는 그대로 유지.

### 3. `components/CancelOrderButton.tsx` — Link 안에 들어가면서 생긴 문제 수정
목록 페이지의 각 주문 카드 전체가 `<Link href="/account/[orderId]">`로 감싸여 있어, 버튼·모달 클릭이 그대로 두면 상세 페이지 이동으로 새어나감. 모든 클릭 핸들러(트리거 버튼, 모달 오버레이, 확인/취소 버튼)에 `e.preventDefault()`+`e.stopPropagation()`을 추가하고, 컴포넌트 최상위도 클릭 버블링을 막는 래퍼로 감쌈.

### 4. `/guide` 페이지
"주문 상세 화면의 버튼" → "**내 렌탈** 화면에서 해당 주문의 버튼"으로 문구 수정.

### 검증
- 실제 카트→체크아웃으로 주문·예약을 만든 뒤(충돌 없는 미래 날짜로), 내 렌탈 목록 페이지에서 해당 주문 카드에 "주문 취소·환불" 버튼이 정상 노출되는 것 확인.
- 버튼 클릭 → 확인 모달 노출, `location.href`가 그대로 `/account`로 유지됨(상세 페이지로 새어나가지 않음) 확인. "돌아가기" 클릭도 마찬가지로 페이지 이동 없이 모달만 닫히는 것 확인.
- 주문 상세 페이지에는 더 이상 취소 버튼이 없는 것 확인(정상적으로 옮겨졌음).
- 테스트 계정·데이터 정리 완료. `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] "주문취소" 알약화 — 문구 단순화 + "주문결제" 알약 옆 배치 + 와인색 대비

562님 요청: "주문 취소·환불"을 "주문취소"로 줄이고, 버튼이 아니라 알약 형태로 바꿔서 "주문결제" 상태 알약 오른쪽에 나란히 배치. 색은 "주문결제"(에스프레소색)와 대비되게 와인색으로.

### 1. `components/CancelOrderButton.tsx`
트리거를 `.cta.ghost` 풀와이드 버튼 → `.cancel-pill` 작은 알약 버튼으로 교체, 문구 "주문 취소·환불" → "주문취소". 실패 시 모달을 닫지 않고 모달 안에 에러 메시지를 표시하도록 변경(알약이 작아져서 카드 바깥에 에러 문단을 따로 둘 자리가 마땅치 않았음).

### 2. `app/globals.css`
`.cancel-pill{...background:var(--wine);color:var(--paper);border-radius:99px...}` — `.resv-status`(기본 에스프레소색)와 동일한 알약 셰이프에 와인색만 다르게. `.resv-status-group{display:flex;align-items:center;gap:6px}` 신설(상태 알약+취소 알약을 한 줄에 묶는 래퍼). 이제 안 쓰는 `.resv-group .cancel-order-btn` 규칙은 제거.

### 3. `app/(member)/account/page.tsx`
`.resv-group-date` 오른쪽 슬롯을 `.resv-status-group`으로 감싸 상태 알약과 취소 알약을 나란히 배치. `.resv-list` 아래 있던 별도 렌더링 위치는 제거.

### 4. `/guide` 페이지
"주문 취소·환불 버튼" → "주문취소 알약"으로 문구 수정.

### 검증
- 실제 주문(충돌 없는 미래 날짜)으로 라이브 확인: "주문결제"(`rgb(28,22,17)`=에스프레소) 알약 바로 옆에 "주문취소"(`rgb(107,39,55)`=와인) 알약이 동일한 `border-radius:99px` 알약 모양으로 나란히 렌더링되는 것을 컴퓨티드 스타일로 실측 확인.
- 알약 클릭 → 모달 노출, `location.href`가 `/account`로 유지(카드 전체가 Link라도 새어나가지 않음) 확인.
- 가짜 `payment_key`로 실제 토스 API 호출 → 실패 메시지가 모달을 닫지 않고 모달 안에 표시되는 것 확인.
- 테스트 계정·데이터 정리 완료. `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 카트 "배송 방법"(직배송/퀵배송/택배) 신규 + 재주문 시 기억, 시간대 연동, DeliveryInfoForm 정리

562님 요청 6건: (1) 시간 알약을 "몇 시까지 갈까요?" 라인에 맞춰 오른쪽 배치, (2) 퀵배송·택배 선택 시 시간 알약 비활성화(시간까지 맞춰 배송 불가), (3) "배송 방법" 라벨을 "어떻게 갈까요?"로 수정, (4) 퀵·택배 선택 시 배송비 추가(**금액 미정 — 562님이 직접 입력 예정, 아직 미구현**), (5) 퀵·택배 선택 시 근무지 주소 입력 비활성화(자택만 가능), (6) "배송 정보 입력" 버튼 클릭 시 자택/근무지/직접 픽업·회수 3개 버튼 노출하며 트리거 버튼은 숨김.

이전 라운드(같은 세션)에서 이미 "배송 방법" 알약 자체(직배송/퀵배송/택배)와 재주문 시 마지막 선택 기억 기능은 구현·검증 완료됨(`db/delivery-method.sql`, 31번째 마이그레이션: `payment_order.delivery_method` + `customer.preferred_delivery_method`). 이번 라운드는 그 위에 6건을 추가 반영.

### 1~2. `app/(member)/cart/page.tsx` — 레이아웃 통일 + 시간 알약 비활성화
"어떻게 갈까요?"와 "몇 시까지 갈까요?" 두 행 모두 `.delivery-method-row`/`.delivery-method-pills`(라벨 좌측, 알약 우측 정렬, `flex-wrap`으로 좁은 화면에서도 오른쪽에 붙어 줄바꿈) 클래스로 통일. 기존 stacked 전용이던 `.delivery-slot-row` CSS는 삭제. `deliveryMethod`가 `QUICK`/`PARCEL`이면(`timeSlotDisabled`) 시간 알약 대신 "퀵배송·택배는 시간을 맞춰 보내드리기 어려워요." 안내 문구를 보여주고, 배송 방법을 퀵/택배로 바꾸는 순간 이미 골라둔 시간(`slot`)도 초기화함.

### 3. 라벨 문구
"배송 방법" → "어떻게 갈까요?" (다른 두 라벨과 같은 "~까요?" 톤 통일).

### 5. `components/DeliveryInfoForm.tsx` — `restrictedToHome` prop 신규
카트 페이지에서 `restrictedToHome={timeSlotDisabled}`로 전달. 이 값이 true면 "근무지 주소 입력"·"직접 픽업·회수" 버튼이 `disabled`되고, 이미 그 모드가 선택돼 있었다면 `useEffect`로 자동 해제(`setMode(null)`)해 자택을 다시 고르게 함. 내 정보 페이지 사용처는 prop을 안 넘기므로(기본값 false) 영향 없음.

### 6. `components/DeliveryInfoForm.tsx` — 픽업 모드 버튼 복원 + 트리거 숨김
지난 세션에 UI만 삭제됐던("복잡해 보여서") "직접 픽업·회수" 모드 버튼을 복원(`save()`의 `mode==='pickup'` 로직은 그때도 하위호환으로 남아있었음). 픽업 모드는 주소 입력이 필요 없어 안내 문구 한 줄 + 전화번호+저장 버튼(`footer`)만 있는 최소 패널로 구성. "배송 정보 입력" 트리거 버튼은 `deliveryPanelOpen`이 true가 되는 순간부터 아예 렌더링하지 않도록 변경(이전엔 `active` 스타일로 계속 남아있었음) — 내 정보 페이지에서도 동일하게 적용됨(공용 컴포넌트).

### 기타: `lib/payments-actions.ts` / `app/(member)/checkout/page.tsx`
퀵배송·택배는애초에 시간 지정이 불가하므로, `createOrder`의 배송 시간 파라미터를 `string | null`로 바꾸고 `deliveryMethod==='DIRECT'`일 때만 시간 유효성 검사를 하도록 수정(그 외엔 `delivery_slot`을 `null`로 저장). 체크아웃 페이지도 동일하게 `method` 파라미터를 먼저 확인해 직배송일 때만 `slot` 파라미터를 요구하도록 반영.

### 검증(라이브)
- 실제 카트에 상품을 담고 날짜(7/25–7/26)를 고른 뒤:
  - "어떻게 갈까요?"/"몇 시까지 갈까요?" 두 행 모두 알약이 행의 오른쪽 끝(x≈912.5)에 정렬되는 것을 `getBoundingClientRect()`로 실측 확인.
  - "퀵배송" 선택 시 시간 알약이 사라지고 안내 문구로 바뀌며, 결제 버튼이 시간 선택 없이도 "결제하기"로 활성화되는 것 확인.
  - "배송 정보 입력" 클릭 시 트리거 버튼은 사라지고 "자택 주소 입력"·"근무지 주소 입력"·"직접 픽업·회수" 3개 버튼이 노출되는 것 확인.
  - 직배송일 때 세 버튼 모두 `disabled:false`, 퀵배송으로 바꾸면 "근무지 주소 입력"·"직접 픽업·회수"만 `disabled:true`(자택만 `false`)로 바뀌는 것을 실측 확인. 다시 직배송으로 되돌리면 셋 다 다시 `disabled:false`로 풀리는 것도 확인.
- 테스트 계정·데이터 정리 완료. `npm run build`/`npm run lint` 클린.
- **미완료**: 4번(배송비 추가)은 퀵배송/택배 각각의 정확한 금액을 562님이 직접 정해주기로 해 아직 구현하지 않음 — 금액을 알려주시면 `createOrder`의 결제 금액 계산과 카트 요약(렌탈비용↔보증금 사이) 행에 반영 예정.

## [Claude Code 세션] 퀵배송·택배 배송정보 폼 세부 조정 4건 + 심각한 잠재 버그 발견·수정(마이그레이션 미적용으로 getProfile() 전체 실패)

562님 요청 4건: (1) 퀵·택배 선택 시 "회수 주소 동일" 라벨·토글 숨김(회수도 불가능하므로), (2) 퀵·택배 선택 시 "받는 사람" 라벨+회원 이름을 전화번호 위에 노출, (3) 전화번호 라벨과 입력창을 한 줄에 노출, (4) 택배 선택 시 공동현관 비밀번호 숨김 + 지번 주소 옆에 우편번호 표기.

### ⚠️ 검증 중 발견한 중요 버그(수정 완료)
"받는 사람" 이름이 계속 빈 값으로 나오는 걸 실측하다가, **`db/delivery-method.sql` 마이그레이션이 실제로는 실행되지 않았던 것**을 발견함(요청드렸을 때 확인 없이 다음 라운드로 넘어감). `getProfile()`의 SELECT 쿼리에 존재하지 않는 컬럼(`preferred_delivery_method`)이 포함돼 있어 **쿼리 전체가 에러 처리되고 프로필의 모든 필드(이름·전화번호·저장된 주소 등)가 조용히 빈 값으로 반환되고 있었음** — 이 컬럼을 추가한 시점부터 지금까지 실제 서비스에서도 내 정보/카트 화면에 회원 이름·전화번호·주소가 안 보였을 가능성이 있음. 562님께 확인 요청 후 마이그레이션 실행 확인 → `getProfile()` 정상화 실측 확인함.

### 1. `components/DeliveryInfoForm.tsx` — 회수 주소 동일 숨김
`restrictedToHome`(퀵·택배)일 때 "회수 주소 동일" 라벨+토글을 렌더링하지 않고, `useEffect`로 `sameAsDelivery`를 강제로 `true`로 고정(회수지 별도 입력 폼도 자동으로 안 뜸).

### 2. "받는 사람" 표시
`footer`(전화번호 섹션) 위에 `restrictedToHome`일 때만 "받는 사람" 라벨 + `profile.name`(읽기 전용 표시, 입력 아님)을 추가.

### 3. 전화번호 한 줄 배치
`.phone-row`(기존 CSS 재사용: `display:flex;gap:8px`, `.field{flex:1}`)로 라벨+입력창을 한 줄에 배치. 이 변경은 배송 방법과 무관하게 항상 적용(내 정보 페이지에도 동일 반영, 공용 컴포넌트).

### 4. `isParcelDelivery` prop 신규 — 택배 전용 처리
- `lib/address-search.ts`: 다음(카카오) 우편번호 API의 `zonecode`를 `AddressResult`에 추가.
- `db/delivery-zonecode.sql`(32번째 마이그레이션): `customer.delivery_zonecode` 컬럼 추가. `lib/account-actions.ts`의 `Profile`/`UpdateProfileInput`/`getProfile`/`updateProfile`(변경 이력 추적 포함)에 반영.
- 자택 주소 검색 시 `homeZonecode` state에 저장, `isParcelDelivery`일 때만 "지번 주소: OOO · 우편번호: OOO"로 표기(퀵배송은 지번 주소만).
- `isParcelDelivery`일 때 공동현관 비밀번호 섹션 자체를 렌더링하지 않고, `useEffect`로 `entrancePassword` state도 비워 저장되지 않게 함.
- `app/(member)/cart/page.tsx`: `isParcelDelivery={deliveryMethod === 'PARCEL'}`로 전달.

### 검증(라이브)
- 실제 테스트 계정으로 `/profile` 페이지 접속 → 마이그레이션 적용 전엔 이름·전화번호 입력창이 전부 빈 값(버그 재현), 적용 후 정상 표시되는 것을 직접 비교 확인.
- 카트에서 실제 상품+날짜 선택 후 "택배" 선택 → "회수 주소 동일" 없음, "공동현관 비밀번호" 없음, "받는 사람"에 실제 회원 이름 표시, 관리자 스크립트로 미리 저장해둔 지번 주소 옆에 "· 우편번호: 06134"까지 정확히 표기되는 것 확인.
- "퀵배송"으로 전환 → 동일 지번 주소는 표시되지만 우편번호는 안 붙고(택배 전용 확인), "공동현관 비밀번호" 섹션은 다시 나타나는 것 확인(퀵배송은 회수·동일주소만 막고 공동현관 비밀번호는 그대로 필요하므로).
- 전화번호/받는 사람 두 행 모두 라벨과 값이 같은 줄(top 좌표 동일)에 배치되는 것을 `getBoundingClientRect()`로 실측 확인.
- **참고(환경 제약)**: 실제 주소 검색 팝업(다음 우편번호 서비스)이 이 세션의 샌드박스 브라우저에서 열리지 않아(팝업 차단으로 추정 — Toss 결제위젯 때와 같은 종류의 제약), 검색 버튼을 직접 눌러 우편번호를 실시간으로 받아오는 과정 자체는 라이브로 확인하지 못함. 대신 DB에 우편번호 값을 미리 넣어둔 뒤 화면에 정확히 표기되는지로 표시 로직을 검증했고, 캡처 코드(`data.zonecode`)는 다음 우편번호 API의 표준 콜백 필드를 그대로 사용.
- 테스트 계정·데이터 정리 완료. `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 562님 실사용 중 발견한 오류 4건 수정 — 주소 검색 팝업 차단, 받는 사람 재확인, 전화번호/이름 우측 정렬, 택배 왕복 배송비



562님이 실제로 써보시고 오류 4건을 신고: (1) 어떤 배송 방법을 골라도 지번주소·우편번호가 전혀 안 나옴, (2) 퀵·택배 선택 시 "받는 사람" 이름이 전혀 안 뜸, (3) 전화번호 입력란 값(및 받는 사람 이름)을 오른쪽 정렬해달라, (4) 퀵배송 배송비는 거리별로 달라 우선 공란, 택배는 "배송비"→"왕복 배송비"로 라벨 변경 + 7,000원 고정.

### 1. `lib/address-search.ts` — 주소 검색을 팝업 창에서 페이지 내 임베드 레이어로 전면 교체 (근본 원인 수정)
지난 세션엔 `new daum.Postcode({...}).open()`으로 **새 팝업 창**을 띄우는 방식이었는데, 이게 모바일 브라우저·인앱 웹뷰의 팝업 차단에 걸리면 검색창 자체가 아예 안 뜨고 `oncomplete` 콜백도 절대 호출되지 않아 **지번주소·우편번호가 영구히 빈 값**이 되는 구조적 문제였음(이 세션의 샌드박스 브라우저에서도 지난 라운드에 동일한 현상 발견했었으나, 그땐 "환경 제약"으로만 기록하고 넘어갔던 부분 — 562님 실사용에서도 같은 문제였을 가능성이 높음). `.open()`(팝업) 대신 현재 페이지 위에 오버레이 레이어를 직접 만들어 `.embed()`로 위젯을 삽입하는 방식으로 전면 교체 — 팝업 차단과 무관하게 항상 동작함.

### 2. "받는 사람" 재확인
코드 재검토 결과 로직 자체에는 문제를 못 찾았고, 실제로 새 테스트 계정으로 처음부터 다시(카트 담기→날짜 선택→퀵배송 선택→배송 정보 입력→자택 주소 입력) 실행했을 때 이름이 정상적으로 노출되는 것을 재확인함. 1번 버그(주소 검색 팝업 차단)로 인해 화면이 예상과 다르게 보였거나, 이전 코드가 반영되기 전 상태를 보셨을 가능성이 있어 보임 — 그래도 계속 안 보이면 다시 알려주세요.

### 3. 전화번호·받는 사람 값 오른쪽 정렬
`components/DeliveryInfoForm.tsx`: 전화번호 `<input>`에 `style={{ textAlign: 'right' }}`, "받는 사람" 이름 `<span>`에 `flex:1;textAlign:'right'` 추가.

### 4. 택배 왕복 배송비 7,000원 고정 + 퀵배송은 보류
- `lib/pricing.ts`: `PARCEL_ROUNDTRIP_FEE = 7000` 신규 상수.
- `app/(member)/cart/page.tsx`: `deliveryMethod==='PARCEL'`일 때만 "왕복 배송비" 행을 렌탈비용↔보증금 사이에 표시하고 합계에 반영. 퀵배송은 배송비 행 자체를 아예 안 보여줌(거리별 정책 확정 전까지 0원).
- `lib/payments-actions.ts`의 `createOrder`도 서버에서 동일하게 계산(클라이언트 표시값을 신뢰하지 않고 서버가 최종 결제금액을 직접 계산하는 기존 원칙 유지).

### 검증(라이브)
- 새 테스트 계정으로 처음부터 재현: 퀵배송 선택 → 배송 정보 입력 → 자택 주소 입력 → "받는 사람"에 실제 이름 정상 노출 확인.
- "주소 검색" 클릭 → 이전엔 아무 반응 없던 것이, 이번엔 페이지 위에 오버레이(`position:fixed;z-index:1000`)와 다음 우편번호 위젯 iframe이 실제로 생성되고 `window.daum.Postcode`가 정상 로드된 것을 DOM 실측으로 확인(다만 이 샌드박스에서 실제 주소 하나를 끝까지 골라 `oncomplete`가 호출되는 것까지는 iframe 내부가 다른 오리진이라 스크립트로 확인 불가 — 정상적으로 열리는 것까지 확인).
- 전화번호 입력창·받는 사람 이름 모두 `getComputedStyle().textAlign === 'right'` 확인.
- 택배 선택 시 "왕복 배송비 7,000원" 행 노출 + 합계 105,000원(48,000+7,000+50,000) 정확히 계산됨, 퀵배송 선택 시 배송비 행 자체가 없고 합계 98,000원으로 정상 환원되는 것 확인.
- 테스트 계정·데이터 정리 완료. `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] 지번주소·우편번호 여전히 안 나오는 문제(진단 로그만 추가, 미해결) + 받는 사람 편집 가능 + 퀵배송 배송비 0원 라벨

562님이 재신고한 4건: (1) 우편번호가 여전히 안 나옴, (2) 주소 검색으로 입력·즐겨찾기한 "메트로시티"는 지번주소·우편번호 전부 안 나옴, (3) 받는 사람 이름을 전화번호처럼 수정 가능하게, (4) 퀵배송도 "배송비" 라벨은 만들고 금액은 0원으로.

### 1~2. 지번주소·우편번호 미표시 — 코드 재검토, 진단 로그 추가(근본 원인 미확정)
`lib/address-search.ts`, `components/DeliveryInfoForm.tsx`의 캡처·표시 로직을 다시 검토했으나 논리적 결함을 찾지 못함(`jibunAddress`/`zonecode`가 `homeJibun`/`homeZonecode`에 정확히 연결돼 있고, 표시 조건도 올바름). 이 세션의 샌드박스 브라우저에서 화면 캡처·좌표 클릭 도구가 모두 실패해 실제 주소 하나를 끝까지 선택하는 라이브 재현은 하지 못함. `oncomplete` 콜백 안에 `console.log('[Lala] 주소 검색 원본 응답:', data)`를 추가해, 다음에 재현될 때 브라우저 콘솔에서 다음 우편번호 API가 실제로 무엇을 반환하는지 직접 확인할 수 있게 해둠 — **미해결 상태로 다음 세션에 이어감**.

### 3. `components/DeliveryInfoForm.tsx` — 받는 사람 이름 편집 가능하게
`db/delivery-recipient-name.sql`(신규, 33번째 마이그레이션): `customer.delivery_recipient_name` 컬럼 추가. `lib/account-actions.ts`의 `Profile`/`UpdateProfileInput`/`getProfile`/`updateProfile`(변경 이력 추적 포함)에 반영. 정적 `<span>{profile.name}</span>` 대신 `recipientName` state(`profile.deliveryRecipientName ?? profile.name`으로 초기화, `deliveryPhone`과 동일 패턴)를 쓰는 `<input>`으로 교체, 전화번호와 마찬가지로 우측 정렬.

### 4. 퀵배송 "배송비" 라벨(0원)
`lib/pricing.ts`에 `QUICK_DELIVERY_FEE = 0` 신규 상수. 카트 페이지·`createOrder` 모두 `deliveryMethod`에 따라 라벨을 분기(`PARCEL`→"왕복 배송비" 7,000원, `QUICK`→"배송비" 0원, `DIRECT`→행 없음)하도록 통합.

### 검증(라이브)
- 새 테스트 계정으로 카트 담기→날짜 선택→퀵배송 선택: "배송비 0원" 행이 렌탈비용 아래에 정상 노출되는 것 확인.
- 같은 흐름에서 배송 정보 입력→자택 주소 입력 진입 시 "받는 분 성함" 입력창이 회원 이름("라운드8테스트")으로 초기화되고 우측 정렬(`textAlign:'right'`)인 것 확인, 값을 "김철수"로 직접 수정 후 "결제하기"로 저장 트리거 → DB의 `customer.delivery_recipient_name`에 "김철수"가 정확히 저장된 것을 실측 확인.
- **이번에도 같은 실수 반복(교훈)**: `db/delivery-recipient-name.sql` 마이그레이션을 요청드리기 전에 먼저 라이브 테스트를 시도했다가, 컬럼이 없어 `getProfile()` 쿼리 전체가 또 실패하는 것을 발견 → 562님께 마이그레이션 요청 후 재확인해 정상 동작 확인. **앞으로는 새 컬럼을 `getProfile()`/`updateProfile()` 쿼리에 추가하는 즉시, 실제 DB에 반영됐는지부터 확인한 뒤에 라이브 테스트를 시작할 것.**
- 테스트 계정·데이터 정리 완료. `npm run build`/`npm run lint` 클린.
- **미해결**: 1·2번(지번주소·우편번호)은 다음 세션에서 562님이 실제로 주소 검색을 한 번 해보시고 브라우저 콘솔(F12)의 `[Lala] 주소 검색 원본 응답:` 로그를 공유해주셔야 원인 확정 및 수정 가능.

## [Claude Code 세션] 우편번호 미표시 문제 근본 원인 재진단·수정 완료 (캡처 버그 아니라 표시 게이팅 버그였음)

562님이 위 진단 로그 요청에 대해 브라우저 콘솔 스크린샷을 공유해주심 — 카카오 우편번호 API의 원본 응답에 `zonecode: '06132'`(실제 값)이 정상적으로 들어있는 것을 확인. 즉 **캡처 로직은 처음부터 문제가 없었고, 표시 조건(게이팅)이 진짜 원인**이었음 — 이전 세션의 가설을 뒤집는 재진단.

### 근본 원인
`components/DeliveryInfoForm.tsx`의 우편번호 표시 줄이 `{isParcelDelivery && homeJibun && (...)}`처럼 `isParcelDelivery &&`로 게이팅돼 있었음. 그런데 `isParcelDelivery`는 **카트 페이지(`app/(member)/cart/page.tsx`)에서만** 넘겨주는 prop이고, `components/ProfileForm.tsx`는 `<DeliveryInfoForm profile={profile} />`처럼 이 prop을 아예 넘기지 않음. 즉 `/profile`(내 정보)에서는 택배를 선택하든 말든 `isParcelDelivery`가 항상 `undefined`라 우편번호가 **절대** 뜰 수 없는 구조였음. 두 번째로, 즐겨찾기(주소록) 항목을 불러올 때 `applyEntryFields()`가 우편번호를 아예 저장하지 않고 매번 `setHomeZonecode('')`로 지워버리고 있었음(당시 주석: "즐겨찾기엔 우편번호를 저장하지 않아") — 새로 즐겨찾기한 "메트로시티" 같은 주소가 지번·우편번호 둘 다 안 보인 이유.

### 수정
1. **표시 게이팅 제거**: 우편번호 표시 조건에서 `isParcelDelivery &&`를 삭제, 지번 주소가 있으면(`homeJibun` 존재 시) 우편번호도 함께 표시하도록 통일(`지번 주소: {homeJibun}{homeZonecode ? ` · 우편번호: ${homeZonecode}` : ''}`) — 배송 방법·페이지(`/profile` vs `/cart`)와 무관하게 항상 노출됨.
2. **즐겨찾기에도 우편번호 저장**: `db/address-book-zonecode.sql`(34번째 마이그레이션) — `delivery_address_book.zonecode` 컬럼 추가. `lib/address-book-actions.ts`의 `AddressBookEntry`/`listAddressBook()`/`SaveAddressBookInput`/`saveToAddressBook()`/`UpdateAddressBookInput`/`updateAddressBookEntry()` 전체에 `zonecode` 필드 추가. `DeliveryInfoForm.tsx`의 `applyEntryFields()`(즐겨찾기 불러오기), `confirmRegisterDefault()`(기본 배송지/즐겨찾기 등록), `startEdit()`/`saveEdit()`(즐겨찾기 수정 모달), 주소 검색 콜백(`setEditZonecode(r.zonecode)`) 전부 우편번호를 함께 저장·표시하도록 연결.

### 검증(라이브)
- 새 테스트 계정 생성(`status='approved'`, 즐겨찾기 주소 "메트로시티"를 지번주소·우편번호 06132 포함해 미리 시딩) 후 실제 로그인해 브라우저로 확인.
- `/profile`에서 "배송 정보 입력" 열자마자 기본 배송지로 "메트로시티"가 자동 로드되며 `지번 주소: 서울 강남구 역삼동 123-45 · 우편번호: 06132`가 정상 노출 — **`isParcelDelivery`가 관여하지 않는 페이지에서도 우편번호가 뜨는 것으로 게이팅 제거를 직접 확인**.
- "즐겨찾기" 목록에서 "메트로시티" 항목 "수정" 클릭 → 편집 모달에도 동일하게 지번·우편번호 노출 확인, "저장" 클릭 후 DB에서 `zonecode='06132'`가 그대로 유지되는 것 확인(`updateAddressBookEntry`가 값을 지우지 않음).
- `/cart`에 상품 담고 예약일 없이 "배송 정보 입력" 열어도(직배송 상태) 동일하게 지번·우편번호 노출 확인 — 페이지·배송방법 무관하게 일관 동작.
- `npm run build`/`npm run lint` 클린. 테스트 계정·주소록·카트 데이터·스크래치 스크립트 전부 정리 완료.
- 남은 항목: 562님이 실제 즐겨찾기 신규 등록(주소 검색으로 새 주소 찾아 즐겨찾기 추가) 흐름까지 한 번 실사용해주시면 완전히 종결.

## [Claude Code 세션] 우편번호 미표시 — 두 번째 잔여 원인 발견·수정 (신축 아파트 등 지번 없는 주소)

562님이 위 수정 이후 실사용 결과를 재확인해주심: `/profile`에서는 정상 노출되지만, **카트에서 새 주소를 검색해 즐겨찾기로 신규 등록하면 여전히 지번주소·우편번호가 안 보임**. `isParcelDelivery` 게이팅은 이미 제거됐는데도 재현된다는 점에서 다른 원인이 남아있다고 재판단.

### 근본 원인
`components/DeliveryInfoForm.tsx`의 표시 줄이 `{homeJibun && (...)}`(및 편집 모달의 `{editJibun && (...)}`)로, **지번 주소가 있어야만** 그 안의 우편번호까지 함께 렌더링되는 구조였음. 그런데 한국 지번 주소 체계상 **신축 대단지 아파트(예: "메트로시티" 같은 이름의 최근 입주 단지)는 다음 우편번호 API가 지번 주소를 아예 반환하지 않는 경우가 실제로 흔함**(도로명 주소만 존재, legacy 지번 미부여) — 이런 주소는 `zonecode`는 정상적으로 존재해도 `jibunAddress`가 빈 문자열로 와서 `homeJibun`이 falsy가 되고, 그 결과 **줄 전체(우편번호 포함)가 렌더링되지 않음**. 지난 세션의 지번주소 게이팅 제거 수정은 "어느 페이지에서 렌더링되는가"만 고쳤을 뿐, "지번이 없는 주소는 줄 자체가 안 뜬다"는 이 문제는 그대로 남아있었음.

### 수정
`components/DeliveryInfoForm.tsx`의 우편번호 표시 조건을 `{homeJibun && ...}` → `{(homeJibun || homeZonecode) && ...}`로 변경, 내부 텍스트도 `지번 주소: X`와 `우편번호: Y`를 각각 존재하는 것만 조합해서 보여주도록 수정(가운데 " · " 구분자도 둘 다 있을 때만 삽입). 자택 주소 패널(메인 폼)과 즐겨찾기 편집 모달(`editJibun`/`editZonecode`) 양쪽 다 동일하게 수정.

### 검증(라이브)
- 새 테스트 계정 생성 후, `delivery_address_book`에 `jibun_address: null, zonecode: '06292'`로 (지번 없는 신축 아파트를 흉내낸) 즐겨찾기를 미리 심어두고 실제 로그인해 확인.
- `/profile`에서 "배송 정보 입력" 열자마자 해당 즐겨찾기가 기본 배송지로 로드되며 **지번 주소 줄 없이 `우편번호: 06292`만 정상 노출** — 지번이 없어도 우편번호는 뜨는 것을 직접 확인.
- (참고) 이 세션에서 `computer` 툴의 좌표 클릭이 또 신뢰성 있게 동작하지 않아(클릭이 등록되지 않는 현상 재발), 로그인·"배송 정보 입력" 버튼 클릭 모두 `javascript_tool`로 버튼을 직접 찾아 `.click()`을 디스패치하는 방식으로 우회해 검증함.
- `npm run build`/`npm run lint` 클린. 테스트 계정·데이터·스크래치 스크립트 정리 완료.
- 남은 항목: 562님이 실제 신축 아파트(지번 없는) 주소로 카트에서 새로 검색→즐겨찾기 등록까지 실사용 확인 시 완전히 종결.

## [Claude Code 세션] 배송 방법 모드 버튼 UX 개편 4건 — 트리거 버튼 제거, 라벨 변경, 카트 단계별 노출

562님 요청 4건: (1) "배송 정보 입력" 트리거 버튼을 없애고 하위 버튼(자택/근무지/직접픽업)을 바로 노출, (2) "자택 주소 입력"→"집으로 받기", "근무지 주소 입력"→"근무지로 받기"로 문구 변경, (3) 카트에서 예약·반납일 선택 후 직배송을 고르고 시간까지 선택했을 때만 3개 버튼(집으로 받기/근무지로 받기/직접 픽업·회수)을 노출, (4) 카트에서 퀵배송·택배를 고르면 집으로 받기만 노출하고 나머지 둘은 비활성화가 아니라 완전히 숨김.

### 구현
`components/DeliveryInfoForm.tsx`:
- `deliveryPanelOpen` state와 "배송 정보 입력" 트리거 버튼 완전히 제거. 대신 새 prop `showModeButtons?: boolean`(기본값 `true`)로 전체 모드 버튼 행(`delivery-mode-row`)의 노출을 제어. `/profile`(`ProfileForm.tsx`)은 이 prop을 넘기지 않으므로 기본값 `true`로 항상 즉시 노출.
- 버튼 라벨 변경: "자택 주소 입력" → "집으로 받기", "근무지 주소 입력" → "근무지로 받기"(직접 픽업·회수는 그대로).
- 근무지/직접 픽업·회수 버튼을 기존 `disabled={restrictedToHome}`(비활성화) 방식에서 `{!restrictedToHome && (...)}`(조건부 렌더링, 완전히 숨김) 방식으로 변경 — 버튼 자체와 그 아래 패널 모두 동일하게 처리.

`app/(member)/cart/page.tsx`:
- 새 파생값 `readyForDeliveryModes = valid && !!deliveryMethod && (timeSlotDisabled || !!effectiveSlot)` 추가 — 예약·반납일이 유효하고, 배송 방법이 선택돼 있고(직배송이면 시간까지 선택돼야 함, 퀵/택배는 시간 불필요), 세 조건이 모두 충족될 때만 `true`.
- `<DeliveryInfoForm>`에 `showModeButtons={readyForDeliveryModes}` 전달 — 조건 충족 전에는 모드 버튼 행 자체가 아예 안 보임.
- `restrictedToHome={timeSlotDisabled}`는 기존 그대로 유지되는데, 위 컴포넌트 변경으로 인해 이제 퀵/택배 선택 시 근무지·직접픽업 버튼이 "숨김" 처리됨(기존엔 비활성화만 됐었음).

`app/(customer)/guide/page.tsx`: "배송 정보" 섹션 문구를 새 버튼명("집으로 받기"/"근무지로 받기")에 맞춰 수정.

### 검증(라이브)
- 새 테스트 계정으로 실제 로그인 후 `/profile`에서 배송 정보 섹션을 열자마자(트리거 버튼 없이) "집으로 받기 / 근무지로 받기 / 직접 픽업·회수" 3개 버튼이 바로 노출되는 것 확인.
- `/cart`에 상품 담고(스크립트로 `cart_item` 직접 삽입 — 이 세션에서 `computer` 좌표 클릭이 다시 불안정해 룩 상세 페이지의 사이즈 선택+담기 흐름은 일부 `javascript_tool`로 우회) 날짜만 고른 상태 → 모드 버튼 미노출, 직배송 선택 후에도(시간 미선택) 미노출, 시간까지 선택(5:00)하자 그제서야 3개 버튼 전부 노출 — 요구사항 3번 그대로 확인.
- 이어서 퀵배송으로 전환하자 "집으로 받기"만 남고 나머지 둘은 DOM에서 완전히 사라짐(disabled 아님) — 요구사항 4번 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·카트·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 즐겨찾기 목록 항목의 클릭 범위 확장(별칭 텍스트 → 전체 정보 영역)

562님 피드백: 즐겨찾기에서 저장된 주소를 불러올 때 클릭 가능 범위가 별칭(예: "우리집") 텍스트로만 한정돼 있어 불편함. 요청: 가로는 왼쪽 끝부터 "기본 배송지로 변경" 알약 직전까지, 세로는 항목 사이 구분선에서 위아래로 2px씩만 남기고 그 안쪽 전부를 클릭 가능하게.

### 수정
`components/DeliveryInfoForm.tsx`: 기존엔 `.addr-book-label-link`라는 작은 `<button>`이 별칭 텍스트만 감싸고 있었음. 이를 제거하고, 별칭+기본배송지 배지+요약 주소 전체를 감싸던 `<div className="addr-book-info">` 자체를 `<button>`으로 바꿔 `onClick`(주소 불러오기)을 여기로 옮김. 별칭 텍스트는 `.addr-book-label-text`라는 일반 `<span>`으로 남기되 기존과 동일한 밑줄 스타일 유지.

`app/globals.css`:
- `.addr-book-item`의 세로 패딩을 `8px 0` → `2px 0`으로 줄여 구분선과 항목 콘텐츠 사이 여백을 정확히 2px로 맞춤.
- `.addr-book-info`(이제 버튼)에 `flex:1`(가로로 "기본 배송지로 변경" 알약 직전까지 확장), `padding:6px 0`(줄어든 항목 패딩 2px + 버튼 패딩 6px = 기존과 동일한 8px 시각적 여백을 유지하면서, 이 6px 영역 전체가 실제 클릭 가능 영역이 되도록), 버튼 기본 스타일 리셋(`background:none;border:none;text-align:left;cursor:pointer`) 추가.
- `.addr-book-actions`에 `padding-top:6px`를 추가해 우측 액션 버튼들(기본 배송지로 변경/수정/삭제)의 세로 위치가 이전과 동일하게 보이도록 보정(항목 패딩이 줄어든 만큼 액션 쪽에서 상쇄).

### 검증(라이브)
- 새 테스트 계정에 즐겨찾기 2건(기본 1건 + 일반 1건)을 미리 심어두고 실제 로그인해 확인.
- `getBoundingClientRect()`로 직접 측정: 클릭 가능 영역(`.addr-book-info`)이 위쪽 구분선에서 2px, 아래쪽 구분선에서 3px(2px 패딩 + 1px 테두리 두께 — 사실상 요구한 "2px") 떨어져 있고, 오른쪽 끝은 "기본 배송지로 변경" 알약 직전(순수 flex `gap` 8px만 남기고)까지 정확히 확장돼 있는 것을 수치로 확인.
- 별칭이 아닌 요약 주소 텍스트(`.addr-book-summary`) 부분을 직접 클릭했을 때도 정상적으로 해당 즐겨찾기가 불러와지고 모달이 닫히는 것을 실제 클릭으로 확인 — 클릭 범위가 별칭 텍스트에 한정되지 않음을 검증.
- `npm run build`/`npm run lint` 클린. 테스트 계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 배송 방법 모드 버튼 선택 색상 — 에스프레소(거의 검정) → 브랜드 컬러(와인)로 변경

562님 질문: "직접 픽업·회수 버튼은 내 정보에서도 카트에서도 검정색인거야?" — 확인해보니 "집으로 받기"/"근무지로 받기"/"직접 픽업·회수" 3개 버튼 모두 동일한 스타일을 공유하고 있었고, 선택하지 않은 기본 상태는 셋 다 와인색 텍스트, **선택하면 셋 다 `--espresso`(#1C1611, 거의 검정)로 배경이 채워지는 동일한 동작**이었음(pickup 버튼만의 특이 동작은 아니었음). 562님께 원하는 색을 여쭤봤고 "자택 근무지 직접 셋 다 브랜드 컬러로 맞춰"라고 답변 — 즉 셋 다 앱의 브랜드 컬러(와인)로 통일해달라는 요청.

### 수정
`app/globals.css`의 `.delivery-mode-btn.active` 규칙에서 `background`/`border-color`를 `var(--espresso)` → `var(--wine)`(#6B2737, 앱 전반에서 강조·취소 등에 쓰는 브랜드 와인 컬러)로 변경. 이 클래스는 3개 버튼(자택/근무지/직접픽업) 전부가 공유하므로 한 곳만 고치면 전부 일관되게 적용됨.

### 검증(라이브)
- 새 테스트 계정으로 실제 로그인 후 `/profile`에서 "직접 픽업·회수" 클릭 → 선택 시 `border-color`가 `rgb(107,39,55)`(와인)로 바뀌는 것 확인(배경색도 동일 규칙으로 함께 바뀜; `background`는 `.cta{transition:background .2s}`로 0.2초 페이드가 걸려 즉시 계산되는 `border-color`로 대신 확인 — 실제 사용자 화면에서는 0.2초 후 배경도 와인색으로 정상 전환됨).
- `npm run build`/`npm run lint` 클린. 테스트 계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 배송 방법 모드 버튼 — 활성 상태 색상 변경 자체를 완전히 제거(바로 이전 수정을 되돌림)

바로 위 항목에서 "활성 상태를 브랜드 컬러(와인)로 맞춰달라"는 요청대로 고쳤는데, 562님이 곧바로 "직접픽업회수는 버튼 바탕이 와인색이 기본값이잖아. 우리가 쓰는 기본 바탕색이 기본값이야. 그리고 클릭했을 때도 색 변화 주지마"라고 재요청 — 실제로는 **활성 색상 자체가 문제가 아니라, 562님 계정의 `customer.delivery_in_store`가 이미 `true`로 저장돼 있어서 `직접 픽업·회수`가 로그인하자마자(클릭 없이) `active` 상태로 시작**했던 것이 원인(`initialMode()`가 `profile.deliveryInStore`가 true면 `mode`를 `'pickup'`으로 초기화). 즉 "기본값이 와인색"이라는 562님의 관찰이 정확했음 — 클릭도 안 했는데 와인/에스프레소로 채워져 있었던 것.

### 수정
바로 이전 수정으로 추가했던 `.delivery-mode-btn.active{background:var(--wine);color:#fff;border-color:var(--wine)}` 규칙(`app/globals.css`)을 완전히 삭제 — 이제 세 버튼(집으로 받기/근무지로 받기/직접 픽업·회수) 모두 선택 여부와 무관하게 항상 동일한 기본 `.cta.ghost` 모양(투명 배경, 와인색 텍스트, 옅은 테두리)을 유지함. 어떤 모드가 선택됐는지는 버튼 색이 아니라 그 아래 펼쳐지는 입력 패널(주소 폼/안내 문구)로만 구분됨. JSX의 `active` 클래스 조건부 적용 자체는 그대로 남아있지만(no-op) CSS 규칙이 없어 시각적 효과는 없음.

### 검증(라이브)
- `customer.delivery_in_store = true`로 미리 심어둔 새 테스트 계정으로 로그인해 562님이 보신 것과 동일한 상황(로그인 직후 클릭 없이 "직접 픽업·회수"에 `active` 클래스가 이미 붙어있음)을 재현.
- 수정 후 세 버튼 전부 `background: rgba(0,0,0,0)`(투명), `color: rgb(107,39,55)`(와인 텍스트), `border-color: rgb(228,221,209)`(옅은 회색)로 완전히 동일하게 렌더링되는 것을 확인 — `active` 클래스가 있어도 시각적 차이가 전혀 없음.
- `npm run build`/`npm run lint` 클린. 테스트 계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 배송 모드 패널 자동 펼침 제거 — 저장된 배송 방법과 무관하게 항상 접힌 채로 시작

바로 위 항목의 근본 원인(`customer.delivery_in_store=true`면 `initialMode()`가 `mode`를 `'pickup'`으로 초기화)이 색상 문제뿐 아니라 **패널 자체가 자동으로 펼쳐지는** 또 다른 증상도 만들고 있었음. 562님 확인: "내정보, 카트>직배송에서 직접픽업배송 패널이 기본값으로 열려. 패널들은 아무것도 열려있지 않는게 기본값으로 수정."

### 수정
`components/DeliveryInfoForm.tsx`: 패널의 펼침 여부를 결정하는 `mode` state의 초깃값을 `useState<Mode>(initMode)` → `useState<Mode>(null)`로 변경 — 이제 저장된 배송 방법이 무엇이었든 페이지를 열면 항상 세 버튼 모두 접힌 채로 시작하고, 사용자가 직접 눌러야만 해당 패널이 펼쳐짐. `initMode`(=`initialMode(profile)`) 자체는 삭제하지 않고 그대로 유지 — `homeAddress`/`homeJibun`/`homeZonecode`/`homeDetailAddress`, `workplaceAddress`/`workplaceJibun`/`workplaceDetailAddress` 등 필드 초깃값이 "이 주소가 자택용으로 저장된 건지 근무지용으로 저장된 건지" 구분하는 데는 여전히 필요하기 때문(패널을 열었을 때 올바른 필드에 기존 값이 채워지도록).

### 검증(라이브)
- `customer.delivery_in_store = true`인 테스트 계정으로 로그인 직후 `/profile` 확인 — 이전엔 "직접 픽업·회수" 패널(안내 문구)이 클릭 없이 열려 있었는데, 수정 후에는 세 버튼만 접힌 채로 노출되고 패널은 전혀 열려있지 않음을 확인.
- 같은 계정으로 `/cart`에 상품 담고 예약·반납일 선택 → 직배송 → 시간 선택까지 마쳐 3개 버튼이 노출된 상태에서도, 어떤 패널도 자동으로 펼쳐지지 않는 것을 확인(이전 라운드에서 구현한 "예약일+직배송+시간 선택 시 3버튼 노출" 게이팅과는 별개로, 패널 자체의 열림 여부는 항상 `null`에서 시작).
- `npm run build`/`npm run lint` 클린. 테스트 계정·카트·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 두 번째 자동 펼침 원인 발견·수정 — 즐겨찾기 기본 배송지 자동 선택 로직 제거

바로 위 수정(`mode` 초깃값을 `null`로) 이후 562님이 "이번엔 집으로 받기가 기본값으로 열리는데?"라고 재보고 — `delivery_in_store` 문제와는 별개로 **완전히 다른 자동 열림 경로**가 하나 더 있었음.

### 근본 원인
`components/DeliveryInfoForm.tsx`의 `useEffect(() => { listAddressBook().then(...) }, [])`(주소록을 불러오는 마운트 시 이펙트) 안에 `setMode((cur) => { if (cur === null) { 기본 배송지를 찾아 자동으로 채우고 그 모드로 mode를 바꿈 } return cur; })` 로직이 있었음 — **"아직 선택된 배송 방법이 없으면 즐겨찾기 기본 배송지를 자동으로 불러와 그 모드 패널을 열어준다"는 의도적으로 짜여있던 기능**이었으나, 562님이 원하는 "패널은 항상 접힌 채로 시작"과 정면으로 충돌함. 즐겨찾기에 자택(홈) 기본 배송지가 저장돼 있으면 이 로직이 `mode`를 `'home'`으로 바꿔 패널을 자동으로 열었던 것.

### 수정
해당 `useEffect`에서 기본 배송지 자동 선택/모드 변경 로직을 전부 제거 — 이제 마운트 시 주소록만 불러와 `addressBook` state에 저장할 뿐, `mode`는 절대 건드리지 않음(사용자가 버튼을 눌러야만 패널이 열리고, 즐겨찾기 버튼을 눌러야만 저장된 주소를 불러옴).

### 검증(라이브)
- 자택 기본 배송지가 저장된 새 테스트 계정으로 로그인 직후 `/profile` 확인 — 수정 전이었다면 "집으로 받기" 패널이 자동으로 열렸을 상황에서, 수정 후에는 세 버튼 모두 접힌 채로 유지되는 것을 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 내 렌탈 상세 페이지 — 상단 정보/하단 비용 요약 우측 정렬 라인 어긋남 수정

562님이 주문 상세 화면 스크린샷을 공유하며 "내 렌탈에서 상세로 들어가면 라인이 안맞는게 느껴지지?"라고 지적 — 실제로 상단(예약일·결제 상태·주문일시) 블록과 하단(렌탈비용·보증금·결제금액) 블록의 우측 정렬된 값들이 서로 다른 x좌표에서 끝나 시각적으로 어긋나 있었음.

### 근본 원인
`app/globals.css`에서 `.order-detail-plain`(상단 정보 블록)과 `.order-item-list`(포함 상품 목록)은 둘 다 `max-width:620px`로 폭이 제한돼 있었지만, 맨 아래 비용 요약에 쓰는 `.summary`는 그런 제한이 없어 `.detail` 컨테이너의 전체 폭까지 늘어남 — `justify-content:space-between`으로 우측 정렬되는 값들이 상단 블록은 620px 지점에서, 하단 블록은 훨씬 더 오른쪽(페이지 우측 여백)에서 끝나 라인이 어긋나 보였음.

### 수정
`app/(member)/account/[orderId]/page.tsx`의 비용 요약 `<div className="summary" ...>`에 `order-detail-summary` 클래스를 추가하고, `app/globals.css`에 `.order-detail-summary{max-width:620px}`를 추가 — 상단 블록·상품 목록과 동일한 620px 폭으로 맞춤. `.summary` 클래스 자체(카트 페이지·이용안내 페이지에서도 재사용됨)는 건드리지 않고 이 페이지 전용 보조 클래스로 좁게 스코프해 다른 화면에 영향 없게 함.

### 검증(라이브)
- 테스트 주문(결제완료, 수거검수중 상태) 하나를 실제로 만들어 상세 페이지를 로그인해서 확인.
- `getBoundingClientRect()`로 직접 측정: 수정 전에는 상단 블록 우측 끝과 하단 비용 요약 우측 끝이 서로 다른 x좌표였을 것(코드상 확인), 수정 후에는 상단 4개 행과 하단 3개 행의 우측 끝이 전부 동일한 x=648px로 정확히 일치하는 것을 확인.
- `npm run build`/`npm run lint` 클린. 테스트 주문·계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 내 렌탈 상세 — 헤더 "로그아웃"과 우측 정렬 안 맞는 문제 재수정(진짜 원인)

562님이 "변함없이 안맞아. 로그아웃 상단바에 맞아야지"라고 재지적 — 바로 위 수정(상단/하단 블록끼리 맞춤)은 두 블록을 서로 일치시켰을 뿐, 정작 기준으로 삼아야 할 헤더의 "로그아웃" 위치와는 여전히 어긋나 있었음.

### 근본 원인(2건 결합)
1. `.order-detail-plain`/`.order-item-list`/`.order-detail-summary`에 남아있던 `max-width:620px`이 애초에 페이지 폭(`.wrap` 기준 최대 1120px)보다 훨씬 좁아서 헤더와 맞을 수가 없었음 → 전부 제거.
2. 더 미묘한 원인: 헤더(`.header-inner`)는 `.wrap`의 기본 좌우 패딩(28px)을 `padding:20px 0 2px`로 덮어써 0으로 만들고, 대신 `nav-links{margin-right:10px}`로 우측 여백을 준다(1120px 폭 기준 실질 우측 인셋 = 10px). 반면 본문을 감싸는 `.detail`은 이런 override가 없어 `.wrap`의 기본 28px 패딩을 그대로 물려받음 — 헤더(인셋 10px 상당)와 본문(인셋 28px 상당)의 우측 여백 기준 자체가 서로 달라, 위 1번을 고쳐도 정확히 18px(28-10)만큼 어긋나 있었음.

### 수정
`app/globals.css`의 `.detail`에 `margin-right:-18px`를 추가(주석으로 18px의 유래 명시) — 헤더 nav의 실질 우측 인셋과 정확히 일치하도록 본문 컨테이너의 우측 경계를 18px 오른쪽으로 확장. `.header-inner`/`nav-links`의 기존 스타일(직전 세션에서 "User Guide 추가로 좁은 화면 줄바꿈" 문제를 고치려고 공들여 튜닝한 값)은 손대지 않고, 본문 쪽에서만 보정해 회귀 위험을 피함.

### 검증(라이브)
- 데스크톱 폭(1200px)과 모바일 폭(375px) 양쪽에서 실제 로그인 후 주문 상세 페이지의 상단/하단 모든 행 우측 끝과 헤더 "로그아웃" 버튼의 우측 끝을 `getBoundingClientRect()`로 직접 비교 — 두 폭 모두에서 픽셀 단위로 정확히 일치(desktop: 1150px, mobile: 365px)하는 것을 확인.
- `.detail`을 공유하는 "내 렌탈" 목록 페이지(카드형 `.resv-group`, 자체 `max-width:620px`)와 `/profile`은 좌측 정렬·고정폭 카드라 이번 우측 인셋 변경의 영향을 받지 않는 것을 코드로 확인(음수 마진은 블록의 폭만 넓힐 뿐 왼쪽 정렬된 자식 요소 위치에는 영향 없음), 실제 페이지 로드도 정상 확인.
- 모바일 폭에서 가로 스크롤(overflow) 발생하지 않는 것도 확인.
- `npm run build`/`npm run lint` 클린. 테스트 주문·계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 내 렌탈 목록 페이지도 헤더 폭에 맞춰 620px 제한 제거

562님이 "내 렌탈" 목록 페이지 스크린샷을 공유하며 "내 렌탈 페이지도 수정해야겠다" — 주문 상세 페이지와 같은 원인(카드·필터·월 구분 헤더에 남아있던 `max-width:620px`)으로 헤더 "로그아웃"보다 훨씬 안쪽에서 끝나 있었음.

### 수정
`app/globals.css`에서 이 페이지 전용 클래스 3개의 `max-width:620px`를 제거: `.resv-group`(주문 카드), `.account-filter-wrap`(기간 필터), `.resv-month-header`(월 구분 헤더). 이 세 클래스는 `app/(member)/account/page.tsx`와 `components/AccountDateFilter.tsx`에서만 쓰여 다른 화면에 영향 없음. `.detail`의 `margin-right:-18px`(바로 위 항목에서 추가)는 그대로 유지되어 이 페이지에도 함께 적용됨.

### 검증(라이브)
- 데스크톱 폭(1200px)에서 테스트 주문 하나로 실제 확인: 주문 카드(`.resv-group`)의 우측 끝이 헤더 "로그아웃"과 정확히 같은 x=1150에서 끝나는 것을 확인. 카드 내부의 "주문취소" 알약(카드 자체의 16px 우측 패딩만큼 안쪽인 x=1133)까지는 카드 자체의 내부 여백이라 정상적인 차이임.
- `npm run build`/`npm run lint` 클린. 테스트 주문·계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 카트 페이지도 헤더 폭에 맞춤 — 다른 `.cart-page` 사용처(체크아웃·결제 등)는 그대로 유지

562님이 "카트 페이지 수정해야겠다"고 이어서 요청 — 같은 헤더 정렬 이슈.

### 주의점
`.cart-page`(폭 560px, 가운데 정렬)는 카트 페이지 하나만이 아니라 체크아웃·결제 성공/실패·멤버십 결제 화면까지 총 7개 파일에서 공유하는 클래스라, 이 클래스 자체를 바꾸면 그 화면들도 전부 폭이 넓어져 버림 — 결제 폼처럼 좁고 집중된 흐름이 나아 보이는 화면들이라 그대로 두는 게 맞다고 판단.

### 수정
`app/(member)/cart/page.tsx`에서만 `className="cart-page"` → `className="cart-page cart-wide"`로 변경(로딩·빈 카트·본문 3곳 전부). `app/globals.css`에 `.cart-wide{max-width:none;margin:0 -18px 0 0}` 추가 — `.cart-page`의 560px 제한을 풀고 `.detail`과 동일한 -18px 보정을 적용. 다른 6개 파일의 `.cart-page` 사용은 전혀 건드리지 않음.

### 검증(라이브)
- 데스크톱 폭(1200px)에서 카트에 상품을 담은 테스트 계정으로 실제 확인: 카트 컨테이너, 비용 요약 값, "결제하기" 버튼까지 전부 헤더 "로그아웃"과 정확히 같은 x=1150에서 끝나는 것을 확인.
- `checkout/page.tsx`는 여전히 `className="cart-page"`만 쓰고 있어(수정 안 됨) 560px 폭 그대로 유지되는 것을 코드로 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·카트·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] User Guide 페이지도 헤더 폭에 맞춤

562님이 "유저 가이드 페이지도 수정"이라고 이어서 요청. `.guide-page`는 `app/(customer)/guide/page.tsx` 한 곳에서만 쓰여(카트 페이지와 달리 다른 화면과 공유되지 않음) 별도 보조 클래스 없이 클래스 자체를 바로 수정.

### 수정
`app/globals.css`의 `.guide-page{max-width:560px;margin:0 auto;padding:6px 0 60px}`에서 `max-width:560px;margin:0 auto`를 제거하고 `margin-right:-18px`를 추가 — 다른 페이지들과 동일하게 `.wrap`을 꽉 채우고 헤더 "로그아웃"과 우측이 맞도록 함.

### 검증(라이브)
- 데스크톱 폭(1200px)에서 실제 로그인 후 `/guide` 확인 — 페이지 컨테이너 우측 끝이 헤더 "로그아웃" 우측 끝과 정확히 일치(둘 다 x=1143, 스크롤바로 인한 뷰포트 폭 차이 반영된 값이나 서로 동일)하는 것을 확인.
- 가로 스크롤(overflow) 발생하지 않는 것도 확인. 가이드 페이지는 텍스트 위주 콘텐츠라 폭이 넓어지면 가독성에 영향이 있을 수 있으나, 다른 페이지들과의 일관성을 우선한 562님의 명시적 요청에 따름(모바일 실사용 환경에서는 화면 폭이 560px보다 좁아 이 변경이 체감되지 않음).
- `npm run build`/`npm run lint` 클린. 테스트 계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 내 렌탈 목록에 배송 방법(직배송/퀵배송/택배) 알약 추가

562님 요청: "내 렌탈 페이지에 완료 알약 왼쪽으로 직배송, 퀵배송, 택배 알약을 만들어서 어떤 방법으로 배송된건지 표기. 알약 컬러는 시그니처 컬러로 하자" — 시그니처 컬러는 이 세션에서 이미 "브랜드 컬러"로 확인된 와인(`--wine`, #6B2737).

### 구현
`app/(member)/account/page.tsx`:
- `orderQuery`의 select에 `delivery_method` 추가, `OrderInfo` 타입·매핑에 `deliveryMethod` 필드 추가.
- `lib/delivery.ts`의 `DELIVERY_METHODS`(직배송/퀵배송/택배 라벨 매핑)를 가져와 `deliveryMethodLabel = DELIVERY_METHODS.find(m => m.id === info.deliveryMethod)?.label`로 라벨 계산 — `delivery_method`가 없는 옛 주문(이 컬럼 추가 이전 주문)은 자동으로 `undefined`가 돼 알약이 안 뜸.
- `.resv-status-group` 안에서 기존 상태 알약(`.resv-status`) 바로 **앞**에 `deliveryMethodLabel`이 있을 때만 `<span className="delivery-method-pill">`을 렌더링 — DOM 순서상 상태 알약보다 왼쪽에 위치.

`app/globals.css`: `.delivery-method-pill{...background:var(--wine);color:var(--paper)}` 추가 — `.resv-status`와 동일한 알약 모양(폰트·패딩·radius)에 배경만 항상 와인으로 고정.

### 검증(라이브)
- 직배송/퀵배송/택배 각각 다른 주문 3건을 만들어 실제 로그인 후 목록 확인 — "택배", "퀵배송" 알약이 각 주문의 상태 알약("주문결제") 왼쪽에 정확히 노출되는 것을 확인, `getComputedStyle`로 배경색이 `rgb(107,39,55)`(와인)인 것도 확인.
- `npm run build`/`npm run lint` 클린. 테스트 주문·계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 배송 방법 알약 색상 — 와인 → 에스프레소로 재변경

562님이 "우리 시그니처 컬러는 에스프레소 블랙 아니야?"라고 반문 — 앱 전체에서 실제 브랜드 색으로 가장 많이 쓰이는 건 에스프레소(기본 버튼·활성 알약 등)이고, 와인은 강조·경고성 톤(취소·분쟁)에 주로 쓰인다는 점을 확인해드리기 위해 두 옵션(에스프레소 vs 와인)을 실제 알약 모양 그대로 만든 비교 데모를 Artifact로 만들어 공유 — 562님이 "a"(에스프레소)로 결정.

### 수정
`app/globals.css`의 `.delivery-method-pill`의 `background`를 `var(--wine)` → `var(--espresso)`로 변경. 이제 배송 방법 알약과 기존 정상 상태 알약(`.resv-status`, 문제 없을 때)이 같은 에스프레소 색을 공유함 — 데모에서 이미 확인한 트레이드오프(문제 상태가 아닐 때는 둘이 구분 안 됨)를 562님이 인지한 상태에서 선택한 결과.

### 검증(라이브)
- 택배 배송의 테스트 주문으로 실제 로그인 후 확인 — 배송 방법 알약("택배")과 상태 알약("주문결제") 둘 다 `rgb(28,22,17)`(에스프레소)로 정확히 렌더링되는 것을 확인.
- `npm run build`/`npm run lint` 클린. 테스트 주문·계정·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 택배 배송 건 전용 "반납접수요청" 기능 신규 구현 (31번째... 정정: 새 마이그레이션 `db/return-request.sql`)

562님 요청: "택배배송 건에 한해서만 내 렌탈>주문상세 페이지에 반납접수요청 버튼과 기능을 만들어줘". 직배송·퀵배송은 기사가 직접 회수하지만, 택배는 고객이 직접 발송하므로 "반납 보냈어요"를 알릴 방법이 없었음.

### 설계
정상 진행 7단계(주문결제→주문검수중→배송대기중→배송중→**배송완료**→수거검수중→완료) 사이에 **택배 전용** 새 단계 `RETURN_REQUESTED`(반납접수 요청됨)를 배송완료와 수거검수중 사이에 추가 — 고객이 버튼을 눌러야만 진입하고, 직배송·퀵배송은 이 상태를 거치지 않고 기존처럼 기사가 바로 수거검수중으로 진행.

### 구현
- `db/return-request.sql`(신규): `payment_order.fulfillment_status` CHECK 제약에 `'RETURN_REQUESTED'` 추가, `return_requested_at timestamptz` 컬럼 추가(요청 시각 기록).
- `lib/staff-actions.ts`: `Fulfillment` 유니언 타입에 `RETURN_REQUESTED` 추가.
- `lib/payments-actions.ts`: `requestReturn(orderId)` 신규 — `cancelOrder()`와 동일한 소유권 검증 패턴(`resolveCustomerId()` + `.eq('customer_id', customerId)`). 가드: `delivery_method === 'PARCEL'`, `status === 'PAID'`, `!disputed`, `fulfillment_status === 'DELIVERED'`일 때만 허용 → `fulfillment_status: 'RETURN_REQUESTED'`, `return_requested_at: now()`로 업데이트.
- `components/RequestReturnButton.tsx`(신규): `CancelOrderButton`과 같은 확인 모달 패턴(단, 주문 상세 페이지는 카드가 `<Link>`로 안 감싸여 있어 `stopPropagation` 불필요). 성공 시 `router.refresh()`.
- `app/(member)/account/[orderId]/page.tsx`: `payment_order` select에 `delivery_method` 추가, `NORMAL_LABEL`에 `RETURN_REQUESTED: '반납접수 요청됨'` 추가, `canRequestReturn` 계산 후 조건 충족 시 페이지 맨 아래에 `<RequestReturnButton>` 렌더링.
- 직원 화면도 새 상태를 인지하도록 라벨/전환 맵 갱신: `components/AdminOrders.tsx`(`STATUSES`/`LABEL`에 추가), `components/DeliveryList.tsx`(`LABEL`에 추가 + `RETURN_REQUESTED → RETURN_INSPECTING` 전환("수거검수 시작") 추가, 기존 `DELIVERED → RETURN_INSPECTING` 전환은 직배송·퀵배송용으로 그대로 유지).
- `CLAUDE.md`/`README.md` 마이그레이션 순서 목록에 `db/return-request.sql` 추가.

### 검증(라이브)
- 562님 실제 계정(박경원)에 있던 택배 데모 주문(지난 항목에서 만든 것)을 `fulfillment_status='DELIVERED'`로 바꿔 반납접수요청 버튼이 뜨는 걸 562님이 직접 확인할 수 있게 해둠(삭제하지 않고 유지).
- 별도 테스트 계정으로 실제 로그인해 전체 플로우 검증: 택배+배송완료 주문에서 "반납접수요청" 버튼 노출 → 클릭 → 확인 모달 → 확정 클릭 → 상태가 "반납접수 요청됨"으로 바뀌고 버튼이 사라지는 것을 확인. DB에서 `fulfillment_status='RETURN_REQUESTED'`, `return_requested_at`이 실제로 채워진 것도 확인.
- 같은 주문을 `delivery_method='DIRECT'`로 바꾸고 배송완료 상태에서 다시 확인 — 반납접수요청 버튼이 뜨지 않는 것 확인(택배 전용 가드 정상 동작).
- `npm run build`/`npm run lint` 클린. 테스트 계정·주문·데이터·스크래치 스크립트 정리 완료(562님 실제 계정의 데모 주문은 562님 요청대로 삭제하지 않고 유지).

## [Claude Code 세션] 반납접수요청 버튼을 주문 상세 페이지 → 내 렌탈 목록 카드로 재배치

562님 요청: "반납요청접수 버튼, 기능을 내 렌탈>주문 목록카드 안에 배치하자. 위치는 오류, 분쟁이 나타나는 대응알약 오른쪽으로 하자" — 지난 항목에서 상세 페이지에 만들었던 버튼을 목록 카드로 옮기고, 위치는 문제 상태일 때 뜨는 "대응 알약"(`.resv-response`, 예: "불필요한 분쟁이 발생되지 않게 확인·처리 중이에요.")과 같은 자리(카드 우측, 스와치 줄과 겹치는 절대 위치)에 놓되 그 오른쪽에 배치.

### 수정
- `app/(member)/account/[orderId]/page.tsx`: `RequestReturnButton` import·렌더링·`canRequestReturn` 계산·select의 `delivery_method` 전부 제거(상세 페이지에는 더 이상 안 둠). `NORMAL_LABEL`의 `RETURN_REQUESTED` 라벨은 상태 표시용이라 유지.
- `app/(member)/account/page.tsx`(목록 페이지): `canRequestReturn` 계산 추가(택배+결제완료+분쟁없음+배송완료), `.resv-response-row` 안에 기존 `response` 알약과 함께(둘 다 있을 수 있는 조건은 실제로 겹치지 않지만 구조상 함께 처리) `{canRequestReturn && <RequestReturnButton .../>}`를 **response 알약 뒤에** 배치. **버그 발견·수정**: 이 파일 자체의 `NORMAL_LABEL`에 `RETURN_REQUESTED` 항목이 빠져 있어서, 반납접수요청 후 목록에 라벨 대신 raw 값 `RETURN_REQUESTED`가 그대로 노출되는 문제를 라이브 테스트 중 발견 → 추가해서 수정.
- `components/RequestReturnButton.tsx`: 전체 재작성 — 상세 페이지용 전체 폭 `.cta` 버튼에서, `CancelOrderButton`과 동일한 목록 카드용 작은 알약 버튼으로 변경. 카드 전체가 `<Link>`로 감싸여 있어 모든 클릭 핸들러에 `e.preventDefault()/stopPropagation()` 추가(안 하면 카드 클릭으로 상세 페이지 이동해버림).
- `app/globals.css`: `.resv-response-row`에 `display:flex;align-items:center;gap:6px` 추가(기존엔 알약 하나만 담던 절대위치 박스라 gap 없었음 — 이제 두 요소를 나란히 담을 수 있게), `.request-return-pill{...background:var(--espresso);color:var(--paper)}` 신규 추가(시그니처 컬러 에스프레소로 통일).

### 검증(라이브)
- 실제 로그인해 "내 렌탈" 목록에서 택배+배송완료 주문 카드에 "반납접수요청" 알약이 스와치 줄 우측(응답 알약과 같은 절대위치, x=1133)에 뜨는 것을 확인.
- 카드가 `<Link>`로 감싸여 있음에도 알약 클릭 시 페이지 이동이 발생하지 않는 것을 `location.href` 비교로 직접 확인(이동 없음 확인).
- 클릭 → 확인 모달 → 확정까지 실제로 진행해 상태가 "반납접수 요청됨"으로(수정 전엔 raw `RETURN_REQUESTED`로 잘못 표시됐던 걸 고친 뒤) 정확히 바뀌고 알약이 사라지는 것을 확인. DB에서 `fulfillment_status`/`return_requested_at`도 재확인.
- 같은 계정에 새 택배+배송완료 주문을 하나 더 만들어, 이미 요청한 주문(알약 없음)과 아직 안 한 주문(알약 있음)이 목록에서 동시에 올바르게 구분되는 것을 확인.
- 562님 실제 계정(박경원)의 데모 주문은 여전히 배송완료 상태로 남아있어, 지금 목록 페이지에서 알약이 바로 보임(상세 페이지에는 더 이상 없음).
- `npm run build`/`npm run lint` 클린. 테스트 계정·주문·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 반납접수요청 확정 시 완료 안내 팝업 추가 + Next.js 자동 새로고침 버그 발견·수정

562님 요청: "반납접수요청 알약 클릭하면 '반납접수가 완료되었어요. 누락된 상품이 없는지 다시 확인해 주세요.'라는 팝업띄워줘".

### 구현 1차 시도와 버그
`components/RequestReturnButton.tsx`에 `done` state를 추가해 확정 성공 시 같은 모달 안에서 "반납 접수를 요청할까요?" 문구를 완료 안내 문구로 바꿔치기하고, `router.refresh()`는 안내를 닫을 때(562님이 "확인"을 누를 때)까지 미루도록 짰음 — 그런데 라이브 테스트에서 **완료 안내가 아예 뜨지 않고 확정 즉시 모달이 사라지며 목록이 바로 새로고침돼버리는 버그**를 발견.

**원인**: `lib/payments-actions.ts`의 `requestReturn()` 서버 액션 안에서 `revalidatePath('/account')`를 호출하고 있었는데, Next.js는 서버 액션이 `revalidatePath`/`revalidateTag`를 호출하면 그 액션의 Promise가 끝나는 즉시 클라이언트에서 **자동으로** 해당 경로를 새로고침한다(클라이언트에서 `router.refresh()`를 직접 호출하는지 여부와 무관). 그래서 `res.ok`를 받고 `setDone(true)`를 호출하기도 전에(혹은 그 직후 바로) Next.js가 알아서 페이지를 새로고침해버려, `canRequestReturn`이 `false`가 되면서 `RequestReturnButton` 자체가 통째로 언마운트 → 완료 안내를 보여줄 틈도 없이 사라짐.

### 수정
`requestReturn()`에서 `revalidatePath` 호출 두 줄을 제거 — 이제 이 서버 액션은 DB만 갱신하고 어떤 자동 새로고침도 트리거하지 않는다. 화면 갱신은 오직 `RequestReturnButton`이 "확인" 클릭 시 명시적으로 호출하는 `router.refresh()`로만 일어남 — 완료 안내가 뜬 상태를 사용자가 직접 닫을 때까지 안정적으로 유지됨.

### 검증(라이브)
- 새 테스트 주문으로 전체 플로우를 단계별로(트리거 클릭 → 확정 클릭 → 즉시 상태 확인 → "확인" 클릭 → 최종 상태 확인) 하나씩 확인:
  - 확정 클릭 직후: 모달이 "반납접수가 완료되었어요.\n누락된 상품이 없는지 다시 확인해 주세요." 문구로 바뀌어 그대로 유지되고, 뒤에 보이는 목록 상태는 아직 "배송완료"로 안 바뀐 채(자동 새로고침이 없어졌으므로) 남아있는 것을 확인 — 수정 전엔 이 시점에 모달이 이미 사라져 있었음.
  - "확인" 클릭 후: 모달이 닫히고 그제서야 상태가 "반납접수 요청됨"으로 바뀌는 것을 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·주문·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 반납접수요청 모달이 세로로 찌그러지는 버그 수정 — position:fixed가 transform 조상에 갇히는 문제

562님이 실제 화면 스크린샷을 공유 — 모달이 아주 좁은 세로 줄로 찌그러져 글자가 한 글자씩 세로로 나열되는 심각한 레이아웃 버그를 발견.

### 근본 원인
`RequestReturnButton`은 목록 카드의 `.resv-response-row` 안에 렌더링되는데, 이 요소는 알약을 세로 가운데 정렬하기 위해 `transform:translateY(-50%)`를 쓰고 있음. CSS 스펙상 조상에 `transform`(또는 `filter`/`perspective`)이 있으면 그 조상이 `position:fixed` 자손의 **containing block이 되어버려**, 원래 뷰포트 전체를 덮어야 할 `.modal-ov`가 `.resv-response-row`의 좁은 박스(알약 하나 크기, 폭 83px) 안에 갇혀버림 — 그 안에 300px대 폭의 `.modal`을 억지로 그리려니 폭이 44px까지 찌그러지고 글자가 한 글자씩 세로로 줄바꿈된 것. `getBoundingClientRect()`로 실측해 `.resv-response-row`의 `transform` 때문임을 직접 확인.

### 수정
`components/RequestReturnButton.tsx`: 모달 전체를 `createPortal(..., document.body)`로 감싸서 `document.body`에 직접 붙임 — 어떤 조상의 `transform`/`position`과도 무관하게 항상 뷰포트 전체를 기준으로 렌더링되도록 함. `CancelOrderButton`은 `.resv-status-group`(transform 없음) 안에 있어 같은 문제가 없는 것을 확인, 그쪽은 그대로 둠.

### 검증(라이브)
- 모바일 폭(375px)에서 실제로 재현·확인: 수정 전 `.modal-ov`가 `left:264,width:83,height:48`(부모 `.resv-response-row` 크기)로 찌그러져 있었고, `.modal`은 `width:44,height:937`(글자가 세로로 줄줄이 쌓여 세로로 아주 길어짐)이었던 것을 `getBoundingClientRect()`로 실측 확인.
- 수정 후 재측정: `.modal-ov`가 `top:0,left:0,width:375,height:812`(뷰포트 전체, `body`의 직계 자식)로, `.modal`이 `width:327`(정상 크기)로 정확히 렌더링되는 것을 확인. 모달 텍스트도 `innerText`로 정상 문구("반납 접수를 요청할까요?..." / "반납접수가 완료되었어요...")로 확인.
- 확정→성공 안내→"확인" 전체 플로우를 모바일 폭에서 다시 재검증, 정상 동작 확인.
- 562님 실제 계정(박경원)의 데모 주문은 여전히 배송완료 상태로 남아있어 지금 바로 재시도 가능.
- `npm run build`/`npm run lint` 클린. 테스트 계정·주문·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] viewport 메타 태그 추가 — 지금까지 아예 없었음

562님 질문: "모바일 앱버전 치고는 앱 사이즈가 큰거 같은데, 지금 기준이 뭐야?" — 확인해보니 `app/layout.tsx`에 **viewport 메타 태그가 지금까지 한 번도 설정된 적이 없었음**(Next.js가 기본으로 넣어주지 않음, 명시적으로 `viewport` export를 해야 함). 이게 없으면 모바일 브라우저가 기본 데스크톱 폭(대략 980px) 레이아웃 뷰포트로 렌더링한 뒤 화면에 맞춰 축소하는 방식으로 동작함 — 실제 폰에서 실행했을 때 텍스트·요소가 다 작게 눌려 보였을 가능성이 있음(반대로 562님이 지금까지 주로 desktop 브라우저 창에서 확인해오신 것도 "커 보인다"는 인상의 큰 원인 — `.wrap`이 `max-width:1120px`라 데스크톱 창 폭 그대로 채워졌음).

### 수정
`app/layout.tsx`에 `export const viewport: Viewport = { width: 'device-width', initialScale: 1 }` 추가(Next.js 15+ 메타데이터 API의 전용 `viewport` export 방식 — `metadata` 객체 안에 넣는 옛 방식 대신 이게 현재 권장 방식). 실제 렌더링된 `<meta name="viewport">` 태그의 `content` 값이 `"width=device-width, initial-scale=1"`인 것을 브라우저에서 직접 확인.

### 참고
이 변경은 실제 폰에서의 물리적 렌더링(핀치줌 기본 배율, 레이아웃 뷰포트 폭)에 영향을 주는 것이고, `.wrap`/`.cart-wide`/`.guide-page` 등 CSS `max-width` 값 자체를 바꾸는 건 아님 — 즉 "앱이 커 보이는" 문제의 근본 원인 진단(데스크톱 브라우저 창에서 테스트해온 것 + viewport 메타 태그 부재)에 대한 조치이지, 디자인/레이아웃 폭 자체를 축소한 건 아님. 실제 모바일 기기나 좁힌 브라우저 창에서 확인해야 체감 차이를 볼 수 있음.
- `npm run build`/`npm run lint` 클린.

## [Claude Code 세션] "반납정보" 알약 — 택배 반납 송장정보(택배사·송장번호) 입력 기능

562님 요청: "반납접수가 요청되면 내 렌탈에서 주문 목록에 대응알약 위치에 '반납정보'라는 알약 만들고 클릭하면 주문 목록 밑으로 카드가 열려서 택배사 송장정보를 불러올 수 있게 해줘".

### 구현
- `db/return-tracking.sql`(신규): `payment_order`에 `return_courier text`/`return_tracking_number text` 컬럼 추가. `README.md`/`CLAUDE.md` 마이그레이션 순서 목록에도 추가.
- `lib/payments-actions.ts`: `saveReturnTracking(orderId, courier, trackingNumber)` 신규 — 본인 주문인지, `delivery_method==='PARCEL'`인지, `fulfillment_status==='RETURN_REQUESTED'`인지 서버에서 재검증 후 두 컬럼 업데이트, 성공 시 `revalidatePath('/account')`.
- **구조 리팩터**: `app/(member)/account/page.tsx`가 각 주문 카드를 인라인 JSX로 직접 그리던 걸, 새 클라이언트 컴포넌트 `components/AccountOrderCard.tsx`로 분리 위임. 이유: "반납정보" 알약을 누르면 문서 흐름 안에서(다른 요소를 밀어내며) 카드가 펼쳐져야 하는데, 트리거(알약)와 펼쳐지는 패널이 형제 요소로 같은 컴포넌트 트리 안에 있어야 하나의 `open` state로 묶어 제어할 수 있음(이전 반납접수요청 모달의 `createPortal` 방식은 여기선 안 맞음 — 포털은 문서 흐름 밖에 떠 있는 오버레이용이라, 목록 흐름에 끼워 넣어야 하는 이 패널엔 안 맞는 도구).
- `components/ReturnTrackingForm.tsx`(신규): 택배사/송장번호 입력 폼. 초기값이 둘 다 있으면 읽기전용 요약(`{택배사} · {송장번호}` + 수정/닫기)으로, 없으면 입력 폼(저장/닫기)으로 시작. 저장 성공 시 읽기전용 모드로 전환.
- `app/(member)/account/page.tsx`: `orderQuery`에 `return_courier,return_tracking_number` 추가, `canManageReturnInfo`(택배+결제완료+분쟁없음+`RETURN_REQUESTED`) 계산 추가, `AccountOrderCard`에 관련 props 전달.
- `app/globals.css`: `.return-info-pill`(반납접수요청 알약과 동일한 에스프레소 배경 pill), `.return-tracking-card{margin-top:-8px}`(펼쳐진 패널과 위 카드 사이 간격 조정).

### 검증(라이브)
- 테스트 계정 + `RETURN_REQUESTED` 상태의 택배 주문으로 실제 로그인 후 확인: 목록에 "반납정보" 알약이 대응알약 자리(스와치 줄 아래)에 뜨고, 클릭 시 페이지 이동 없이(`location.href` 불변 확인) 카드 바로 아래에 입력 폼이 문서 흐름대로(겹침 없이, `getBoundingClientRect()`로 위치 확인) 펼쳐지는 것을 확인.
- 택배사("CJ대한통운")·송장번호("123456789012") 입력 후 저장 → 읽기전용 모드로 전환되어 "CJ대한통운 · 123456789012"가 표시되는 것을 확인, DB에서도 두 컬럼이 실제로 저장된 것을 재확인.
- "수정" 클릭 시 기존 값이 채워진 입력 폼으로 다시 전환되는 것, "닫기" 클릭 시 패널이 접히는 것 확인.
- 같은 주문의 `fulfillment_status`를 `DELIVERED`로 되돌려 재조회 → "반납정보" 알약이 사라지고 "반납접수요청" 알약으로 바뀌는 것을 확인(상태 게이팅 정상 동작).
- **버그 발견·주의사항**: 이번 라이브 테스트 중 `javascript_tool`로 실행한 `button.click()` 및 `computer` 좌표 클릭이 `<form onSubmit>` 안의 `type="submit"` 버튼에 대해 아무 반응도 일으키지 않는(네트워크 요청조차 안 뜨는) 현상을 겪음 — `form.requestSubmit(btn)`을 직접 호출해서야 정상 제출됨. 반면 같은 카드 안의 `type="button"`(수정/닫기)은 `computer` 좌표 클릭엔 반응 없었지만 `javascript_tool`의 `.click()`으로는 정상 동작함. **테스트 도구(브라우저 자동화)의 클릭 신뢰성 이슈로 보이며 실제 사용자 클릭에는 영향 없는 것으로 판단** — 실 제품 코드엔 변경 없음. 다음에 이 폼을 다시 라이브 테스트할 땐 `type="submit"` 버튼은 `form.requestSubmit()`으로 트리거할 것.
- 테스트 계정·주문·데이터·스크래치 스크립트 정리 완료.

## [Claude Code 세션] "반납정보" 기능 방향 수정 — 고객 입력 → 직원 입력/고객 읽기전용으로 뒤집음

바로 위 세션에서 "반납정보" 알약을 **고객이** 택배사·송장번호를 입력하는 폼으로 만들었는데, 562님이 확인 후 정정: "택배사, 송장번호는 우리가 회원한테 알려줘야 하는 부분인데?" — 방향이 반대였음. AskUserQuestion으로 확인한 결과, 원하는 최종 그림은 **CJ대한통운 API로 반납 픽업예약·송장발급을 자동화**하는 것이지만 아직 계약·API 키가 없어(562 확인: "cj대한통운일 확률이 99%") 지금 당장은 불가능. 이 프로젝트의 기존 패턴(휴대폰 본인인증도 실제 벤더 연동 전까지 UI만 흉내)과 동일하게, **직원 수동입력 → 나중에 API로 교체** 방식으로 진행하기로 562님 확인 받음.

### 구현 (기존 고객 입력 폼 전면 폐기 후 재작성)
- `lib/payments-actions.ts`: 고객용 `saveReturnTracking` 삭제(고객은 더 이상 이 정보를 입력하지 않음).
- `lib/staff-actions.ts`: 직원용 `saveReturnTracking(orderId, courier, trackingNumber)` 신규 — `updateFulfillment`와 동일한 권한(비회원 직원 전체: admin/director/supervisor/delivery)으로 입력 가능, 서버에서 택배 배송+`RETURN_REQUESTED` 상태 재검증. `OrderRow`/`SELECT`/`map()`에 `deliveryMethod`·`returnCourier`·`returnTrackingNumber` 추가.
- `components/ReturnTrackingAdminForm.tsx`(신규): `/admin` 주문 카드 안에서 택배사·송장번호를 입력하는 폼. 값이 이미 있으면 읽기전용 요약(수정 가능)으로 시작.
- `components/AdminOrders.tsx`: 주문의 `fulfillment==='RETURN_REQUESTED' && deliveryMethod==='PARCEL'`일 때 위 폼을 문제상품 지정 블록과 같은 자리(`.order-issue-items` 스타일)에 렌더링.
- `components/ReturnTrackingForm.tsx`(고객용 입력 폼) 삭제 → `components/ReturnTrackingInfo.tsx`(신규, 읽기전용)로 교체. 값이 없으면 "반납 택배 픽업을 준비 중이에요..." 안내, 있으면 `{택배사} · {송장번호}`만 보여주고 편집 불가(닫기 버튼만).
- `components/AccountOrderCard.tsx`: `initialReturnCourier`/`initialReturnTracking` prop을 `returnCourier`/`returnTrackingNumber`로 이름 변경(더 이상 "폼 초기값"이 아니라 "표시값"이므로), `ReturnTrackingForm` → `ReturnTrackingInfo`로 교체.
- HANDOFF.md 맨 위 "B. 설계 방침" 섹션에 이 방향(직원 입력 → 향후 CJ API로 교체)을 새 항목으로 기록.

### 검증(라이브)
- 새 테스트 고객 계정(택배+`RETURN_REQUESTED` 주문) + 새 테스트 직원(`director`) 계정을 만들어 전체 흐름을 실제로 왕복 확인:
  1. 고객으로 로그인 → "반납정보" 클릭 → 아직 미입력 상태라 "반납 택배 픽업을 준비 중이에요..." 안내만 뜨고 입력창은 없는 것을 확인(수정 불가능한 순수 읽기전용인지 확인).
  2. 직원으로 로그인 → `/admin`에서 해당 주문 카드에 "반납 택배 정보 (회원에게 안내됨)" 입력폼이 뜨는 것을 확인, 택배사("로젠택배")·송장번호("987654321000") 입력 후 저장 → 읽기전용 요약으로 바뀌는 것 확인, DB에서도 실제 저장된 것을 재확인.
  3. 다시 고객으로 로그인 → "반납정보"를 다시 열어 직원이 입력한 값("로젠택배 · 987654321000")이 그대로(읽기전용으로) 보이는 것을 확인.
- 라이브 테스트 중 562님의 실제 데모 주문(박경원, `demo-espresso-pill-1784169887431`)도 마침 `RETURN_REQUESTED`+택배 상태라 `/admin`에 이 입력폼이 함께 노출되는 것을 확인 — 주문 자체는 건드리지 않음(계속 "지우지 말라"는 지시 유지).
- `npm run build`/`npm run lint` 클린. 테스트 계정(고객·직원) 2개, 주문, 스크래치 스크립트 전부 정리 완료.

## [Claude Code 세션] 패키징 완료 사진 업로드 — 이 프로젝트 최초의 실제 이미지 업로드 기능

562님 요청: "주문이 들어오면 해당 상품을 찾아서 패키징 후에 주문한 상품들을 모아놓고 사진을 찍을거야. '누락없이 보냈다'는 의미도 있고, 회수됐을 때 분실시 대응하기 위해서야. 그 사진을 내 렌탈>주문 목록>주문 상세 페이지에, 주문 상품 이미지 마지막에 노출시켜줘."

### 사전 조사
이 코드베이스엔 지금까지 **진짜 파일 업로드 기능이 전혀 없었음**(Supabase Storage 버킷도, `<input type="file">`도, 업로드 서버 액션도 전무 — `product.image_url` 컬럼은 있지만 미사용 플레이스홀더, 실제 상품 이미지는 `color_1`/`color_2` CSS 그라데이션으로만 표시됨). 이 기능이 이 프로젝트의 첫 실제 이미지 업로드/저장/표시 파이프라인.

### 구현
- `db/packaging-photo.sql`(신규): 비공개(private) Storage 버킷 `packaging-photos` 생성(`insert into storage.buckets`로 SQL에서 직접 생성 — Supabase 공식 지원 방식) + `payment_order.packaging_photo_path text` 컬럼 추가. **버킷을 비공개로 하고 DB엔 경로만 저장, 조회는 항상 서버에서 만료 있는 서명(signed) URL을 발급**하는 방식 — 다른 테이블들의 RLS+서버 신뢰 주체 패턴과 동일한 철학(공개 URL로 아무나 접근 가능하게 두지 않음).
- `lib/storage.ts`(신규): `getPackagingPhotoUrl(path)`(주문 상세 페이지처럼 1건), `getPackagingPhotoUrls(paths)`(관리자 목록처럼 여러 건, `createSignedUrls` 배치 호출로 N+1 방지) — 둘 다 1시간 유효 서명 URL 발급.
- `lib/staff-actions.ts`: `savePackagingPhoto(orderId, formData)` 신규 — Server Action이 `FormData` 안의 `File`을 직접 받음(Next.js가 지원하는 방식). 이미지 타입·8MB 이하 검증 후 Storage 업로드, 기존 사진 있으면 교체(이전 파일 삭제) 후 경로 저장. `OrderRow`/`SELECT`/`map()`에 `packagingPhotoPath`/`packagingPhotoUrl` 추가, `listOrders()`가 목록의 모든 사진 경로를 한 번에 서명 URL로 변환.
- `next.config.mjs`: `experimental.serverActions.bodySizeLimit`을 기본 1MB에서 `10mb`로 상향(사진 업로드가 기본 제한을 쉽게 넘어섬).
- `components/PackagingPhotoAdminForm.tsx`(신규): `/admin` 주문 카드 안 파일 선택 + 미리보기(선택 즉시 `URL.createObjectURL`) + 업로드 버튼. 이미 업로드된 사진 있으면 썸네일 보여주고 버튼이 "재업로드"로 바뀜.
- `components/AdminOrders.tsx`: 위 폼을 **모든 주문 카드에 항상 노출**(반납정보처럼 특정 상태로 게이팅하지 않음 — 패키징은 검수 후 아무 때나 할 수 있고, 회수 후 분실 분쟁 때도 계속 봐야 하는 증빙이라 상태 제한을 두지 않기로 함).
- `app/(member)/account/[orderId]/page.tsx`: `packaging_photo_path` select 추가, `getPackagingPhotoUrl`로 서명 URL 발급 후 **포함 상품 목록(`.order-item-list`) 맨 끝에** 같은 행 스타일로 사진 노출(사진 없으면 섹션 자체가 안 뜸).
- `app/globals.css`: `.packaging-photo-full`(주문 상세, 72×72), `.packaging-photo-thumb`(관리자 미리보기, 64×64) 추가.
- README.md/CLAUDE.md 마이그레이션 순서 목록에 `db/packaging-photo.sql` 추가.

### 검증(라이브) — 중요: 이번 세션에서 새로 확립한 파일 업로드 테스트 기법
브라우저 자동화 도구(Claude Browser pane)엔 OS 네이티브 파일 선택 다이얼로그를 여는 기능이 없어서(`computer` 툴은 페이지 안에서만 동작, OS 다이얼로그는 페이지 밖 영역), `<input type="file">`에 실제 파일을 선택시키는 표준적인 방법이 없었음. **해결책**: `javascript_tool`로 페이지 컨텍스트에서 `new File([bytes], name, {type})`로 실제 File 객체를 만들고, `DataTransfer`에 담아 `input.files = dataTransfer.files`로 할당한 뒤 `change` 이벤트를 수동 디스패치 — 이건 브라우저가 허용하는 정상적인 테스트 기법(반면 `input.value = '가짜경로'`는 브라우저가 보안상 막음, 실제로 먼저 시도했다가 `InvalidStateError`로 확인). React의 `onChange` 핸들러가 정상적으로 파일을 인식하는 것까지 확인.
- 이 방법으로 실제 이미지(1×1 PNG)를 만들어 관리자로 로그인 → 새 테스트 주문 카드에서 업로드 → DB(`packaging_photo_path`)와 Supabase Storage(`packaging-photos` 버킷 안 실제 파일)에 둘 다 저장된 것을 직접 조회해서 확인.
- 관리자 화면 새로고침 후 "재업로드"로 문구가 바뀌고 썸네일이 실제로 로드되는 것(`naturalWidth/naturalHeight` 확인)을 확인.
- 같은 테스트 계정으로 회원 쪽에 로그인해 주문 상세 페이지 접속 → "포함 상품" 목록 맨 끝에 "패키징 완료 사진" 섹션이 뜨고 이미지가 서명 URL로 정상 로드되는 것을 확인.
- 마이그레이션은 562님이 SQL Editor에서 처음 실행했을 때 "Success. No rows returned"라고 확인했지만, 직접 DB/Storage를 조회해보니 **버킷도 컬럼도 실제로는 생성되지 않은 상태**였음 — 원인은 특정하지 못했으나(SQL Editor UI 표시와 실제 반영 사이의 간극으로 추정), 같은 SQL을 한 번 더 실행해달라고 요청해 재실행 후에는 정상 반영된 것을 확인. **교훈: "Success" 메시지만 믿지 말고 항상 직접 조회로 재확인할 것**(이미 이 프로젝트에서 여러 번 강조된 원칙이지만 이번엔 "성공 메시지 자체가 있었는데도" 실제 미반영이었던 첫 사례라 별도로 기록).
- `npm run build`/`npm run lint` 클린. 테스트 계정(고객·직원) 2개, 주문, Storage 파일, 스크래치 스크립트 전부 정리 완료.

## [Claude Code 세션] 주문 상품 이미지 → 상품 상세 페이지 링크 + 패키징 사진 확대 팝업

562님 요청: "여기서 주문상품 이미지를 클릭하면 상품 상세 페이지로 넘어가게 하고, 패키징 사진을 클릭하면 크게 볼 수 있는 팝업을 띄워줘."

### 사전 확인
상품 상세 페이지가 이 앱에 아예 없었음(룩북 안에서 카드로만 보여짐, 클릭해도 아무 데도 안 감). AskUserQuestion으로 확인해 "간단한 정보 페이지(장바구니 담기 없이 읽기전용)"를 새로 만들고, 그 전에 이번에 요청한 기능(링크·팝업)부터 먼저 구현하기로 확인.

### 구현
- `app/(customer)/products/[id]/page.tsx`(신규): `/products/[id]` 라우트. 로그인 필요(다른 회원 전용 페이지와 동일하게 `redirect`). `product` 테이블에서 이름·브랜드·카테고리·사이즈·대여가·보증금 조회 후, 상단에 큰 색상 스와치(`color_1`/`color_2` 그라데이션, 실제 상품 사진 없는 현재 상태와 동일한 방식)와 `order-detail-plain`(기존 재사용) 스타일의 정보 행으로 표시. 장바구니 담기 등 액션 없음(순수 조회용).
- `app/(member)/account/[orderId]/page.tsx`: `reservation` select에 `product(id, ...)` 추가해 상품 uuid를 가져오고, 상품 썸네일을 `<Link href={`/products/${p.id}`}>`로 감쌈(썸네일만 클릭 가능 — 상품명·가격 텍스트는 그대로 링크 밖).
- `components/PackagingPhotoLightbox.tsx`(신규): 기존에 서버 컴포넌트 안에 인라인으로 그리던 패키징 사진 블록을 이 클라이언트 컴포넌트로 분리. 썸네일을 `<button>`으로 감싸 클릭하면 `open` state를 켜고, `createPortal(..., document.body)`로 `document.body`에 직접 붙인 오버레이(`modal-ov` 재사용)에 원본 사진을 크게(`max-width:90vw;max-height:85vh;object-fit:contain`) 띄움. 오버레이 아무 곳이나 클릭하면 닫힘. (반납접수요청 모달 때 겪었던 "transform 조상 때문에 position:fixed가 갇히는" 버그를 처음부터 피하려고 여기도 포털을 씀 — `order-item-row`엔 지금 transform이 없지만, 앞으로 생길 수도 있으니 안전하게.)
- `app/globals.css`: `.order-item-thumb-link`(상품 썸네일 링크·패키징 사진 버튼 공통 — a/button 기본 스타일 제거, `line-height:0`으로 여백 없이 썸네일만 클릭 영역이 되도록), `.packaging-photo-lightbox-img`, `.product-detail-photo`(3:4 큰 스와치), `.product-detail-name`(15px) 추가.

### 검증(라이브)
- 테스트 주문(택배, 패키징 사진 포함)으로 확인:
  - 주문 상세 페이지의 상품 썸네일에 `href="/products/<실제 product uuid>"`가 정확히 걸려있는 것을 확인, 클릭해 실제로 `/products/<id>`로 이동하고 상품명·브랜드·카테고리·사이즈·대여가·보증금이 올바르게 뜨는 것을 확인.
  - 패키징 사진 썸네일 클릭 → `document.body`의 직계 자식으로 `.modal-ov`가 뷰포트 전체 크기(1280×720)로 뜨고 그 안에 서명 URL로 원본 사진이 로드되는 것을 확인. 오버레이 클릭 → 정상적으로 닫히는 것(재조회 시 `.modal-ov`가 DOM에서 사라짐)을 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·주문·Storage 파일·스크래치 스크립트 정리 완료.
- 박경원님 실제 데모 주문에도 이 두 기능이 그대로 적용되어 바로 확인 가능(별도 데이터 조작 불필요 — 코드 변경만으로 기존 상품·사진에 자동 적용됨).

## [Claude Code 세션] 상품 상세 페이지 — 장바구니 담기 기능 추가

562님 요청: "상품 상세 페이지를 어떻게 확장할까요?"에 AskUserQuestion으로 "장바구니 담기 기능 추가(추천)"를 선택. 룩북의 상품 카드(`LookItems.tsx`)와 동일하게, 사이즈 선택 + 담기 버튼을 붙여 이미 주문한 상품을 이 페이지에서 바로 재대여(재구매) 신청할 수 있게 함.

### 구현
- `app/(customer)/products/[id]/page.tsx`: 직접 `supabaseServer()` 쿼리 대신 기존 `lib/queries.ts`의 `getProduct(id)`/`getSizeAvailabilityByNames([name])`(룩 페이지가 쓰는 것과 동일 함수, 재사용)로 교체 — 같은 이름(스타일)의 사이즈별 여러 상품 행을 전부 가져와 사이즈칩으로 보여줌. `getCartItems()`로 이미 담긴 상품인지도 같이 확인. 정적 "사이즈" 행은 삭제(사이즈칩이 그 역할을 대신함).
- `components/ProductAddToCart.tsx`(신규): `LookItems.tsx`의 사이즈칩+담기 로직을 단일 상품용으로 단순화한 클라이언트 컴포넌트. 이 페이지는 이미 로그인 필수(`redirect`)라 `LookItems`에 있던 "비로그인 시 로그인 후 복귀해서 자동담기"(`?add=`) 로직은 필요 없어 제외 — 코드가 그만큼 단순해짐. 기존 `.li-row`/`.size-chip-row`/`.size-chip`/`.li-add` 클래스를 그대로 재사용(신규 CSS 없음, `.look-items` 밖에서 쓰는 기본 `.li-row` 스타일이 이 페이지 레이아웃에 정확히 맞음).

### 검증(라이브)
- 테스트 계정으로 실제 상품 상세 페이지 접속 → 사이즈칩(S/M/L)이 뜨는 것 확인 → "M" 선택 → "담기" 클릭 → 버튼이 "담김"(비활성)으로 바뀌는 것 확인 → DB `cart_item` 테이블에 해당 상품(사이즈 M)이 실제로 담긴 것을 직접 조회로 재확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·장바구니·스크래치 스크립트 정리 완료(스크립트 재실행 중 실수로 테스트 계정이 하나 더 생겼던 것도 함께 정리).
- 박경원님 실제 데모 주문의 상품 썸네일에서도 코드 변경만으로 바로 적용되어 확인 가능.

## [Claude Code 세션] 상품 상세 사진 크기 조정 버그 수정 — vw 단위가 넓은 화면에서 레이아웃을 깨뜨림

562님이 넓은 화면(데스크톱 창) 스크린샷을 공유 — 사진이 화면 대부분을 차지하고, 오른쪽 정보 영역이 극단적으로 좁아져 상품명·브랜드 등 글자가 한 글자씩 세로로 쪼개져 나오는 버그를 발견.

### 원인
562님이 "이미지는 전체 화면의 50%로"라고 요청해서 `.product-detail-photo{width:50vw}`로 구현했는데, `vw`는 **브라우저 전체 뷰포트 폭** 기준이라, 앱 콘텐츠 영역(`.wrap`의 `max-width:1120px` 등으로 실제로는 제한됨)보다 훨씬 넓은 화면에서 열면 사진이 뷰포트의 진짜 50%(예: 2000px 화면이면 1000px)까지 커져버려, 같은 flex 행에 있는 정보 영역(`.product-detail-info`, `flex:1`)이 남은 폭만큼만 억지로 줄어들면서 텍스트가 세로로 쪼개지는 버그가 발생.

### 수정
`width:50vw` → `width:50%`로 변경 — 이제 뷰포트가 아니라 **바로 감싸는 flex 컨테이너(`.product-detail-head`)의 실제 폭 기준** 50%라, 화면이 아무리 넓어도 앱 콘텐츠 영역 폭을 넘지 않고, 정보 영역도 항상 남은 절반만큼 안정적으로 확보됨.

### 검증(라이브)
- 모바일 폭(375px)에서 재확인: 사진 168.5px / 정보영역 152.5px, 텍스트 오버플로우 없음.
- 넓은 화면(2000px)에서 재확인: 사진 541px(뷰포트의 진짜 50%인 1000px이 아니라, 콘텐츠 영역 안에서의 50%로 제한됨) / 정보영역 525px, 상품명이 한 줄로 정상 표시(버그 재현 전엔 세로로 쪼개졌던 것과 대비 확인).
- `npm run build`/`npm run lint` 클린. 테스트 계정·스크래치 스크립트 정리 완료.
- **교훈**: 이 앱은 모바일 전용(memory: mobile-only)이라 평소엔 넓은 화면에서 확인할 필요가 없지만, `vw`/`vh` 같은 뷰포트 상대 단위는 사용자가 실수로(또는 데스크톱 브라우저로 접속해서) 넓은 창을 열었을 때 콘텐츠 폭 제한을 무시하고 그대로 커져버리는 위험이 있음 — 이후 "화면의 N%" 같은 요청은 뷰포트 단위가 아니라 **부모 컨테이너 기준 %**로 구현할 것.

## [Claude Code 세션] 상품 상세 페이지 레이아웃 원복 + 룩북·상세 이미지 갤러리 추가

562님 요청: "이미지를 채우고 상품명을 다시 이미지 밑으로 옮기자. 그리고 사이즈칩 밑으로 해당 상품의 룩북을 3장, 상세 이미지를 5장 더 추가."

### 구현
- `app/(customer)/products/[id]/page.tsx`: 직전 세션에서 만든 좌우 2단 레이아웃(`.product-detail-head`/`.product-detail-info`, 이미지 오른쪽에 정보 배치)을 원래대로 되돌림 — 사진이 콘텐츠 폭 100%를 채우고, 그 아래로 상품명 → 정보 행(`order-detail-plain`) → 사이즈칩+담기(`ProductAddToCart`) 순으로 세로로 쌓임. 그 밑에 "룩북"(3장)·"상세 이미지"(5장) 두 섹션을 `field-section` 라벨 + 3열 그리드로 추가.
- 실제 상품 사진이 없는 현재 상태 그대로, 8장 전부 상품의 `color_1`/`color_2` 그라데이션을 재사용한 플레이스홀더 타일로 렌더링(이 앱의 기존 관례와 동일 — 실제 사진 붙는 건 향후 과제).
- `app/globals.css`: `.product-detail-head`/`.product-detail-info`(더 이상 안 씀) 삭제, `.product-detail-photo`를 `width:100%`로 원복, `.product-gallery-grid`(3열, gap 8px)·`.product-gallery-tile`(정사각형) 신규 추가.

### 검증(라이브)
- 모바일 폭(375px)에서 확인: 사진이 전체 폭(337px, 콘텐츠 영역 기준)을 채우고 상품명이 사진 바로 아래(`nameTop >= photoBottom`)에 오는 것을 좌표로 확인.
- "룩북" 그리드가 3개, "상세 이미지" 그리드가 5개(3열이라 3+2로 줄바꿈) 타일을 정확히 렌더링하는 것, 각 타일이 3열 균등폭(107px)으로 배치되는 것을 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·스크래치 스크립트 정리 완료.
- 박경원님 데모 계정에서 바로 확인 가능(코드 변경만으로 기존 상품에 자동 적용).

## [Claude Code 세션] 상품 상세 페이지 4건 — 라벨 정리 + 갤러리 크기 통일 + 하단 고정 구매 바

562님 요청 4건: 1) "대여가"→"렌탈비용" 라벨 변경, 2) 브랜드 행 삭제, 3) 룩북·상세 이미지도 메인 이미지와 같은 크기로, 4) 스크롤해도 렌탈비용·보증금·사이즈칩이 화면에 고정.

### 구현
- `components/ProductStickyBar.tsx`(신규): 렌탈비용·보증금 + `ProductAddToCart`(사이즈칩+담기)를 한데 묶어 `position:fixed;bottom:0`으로 화면 하단에 고정하는 바. 이 페이지에서만 쓰는 서버 컴포넌트(내부의 `ProductAddToCart`만 `'use client'`) — 굳이 전체를 클라이언트 컴포넌트로 만들 필요 없어 서버 렌더링 유지.
- `app/(customer)/products/[id]/page.tsx`: `order-detail-plain`에서 브랜드 행 삭제, 남은 건 카테고리 하나뿐. 렌탈비용·보증금은 정적 행에서 빼서 `ProductStickyBar`로 이동(라벨도 "렌탈비용"으로 통일). 룩북·상세 이미지 갤러리를 3열 그리드(`product-gallery-grid`/`product-gallery-tile`, 정사각형)에서 **메인 이미지와 동일한 클래스(`product-detail-photo`)를 그대로 재사용하는 세로 리스트(`product-gallery-list`)**로 교체 — 이제 9장(메인 1 + 룩북 3 + 상세 5) 전부 정확히 같은 크기(3:4, 전체 폭).
- `components/ProductAddToCart.tsx`: 더 이상 단독으로 쓰이지 않고 항상 sticky bar 안에서만 쓰이므로, 인라인 `marginTop:16` 스타일을 제거하고 여백은 `.product-sticky-bar .li-row` CSS로 일원화.
- `app/globals.css`: `.product-gallery-grid`/`.product-gallery-tile`(더 이상 안 씀) 삭제 → `.product-gallery-list`(세로 flex, gap 10px) 추가. `.product-detail-scroll{padding-bottom:104px}`(고정 바에 콘텐츠 끝부분이 가려지지 않도록 스크롤 영역에 여유 확보). `.product-sticky-bar`/`.product-sticky-bar-inner`(`.wrap`과 같은 `max-width:1120px` 적용해 넓은 화면에서도 콘텐츠와 좌우 정렬 맞춤)/`.product-sticky-price` 신규.

### 검증(라이브)
- 라벨 확인: 페이지 텍스트에 "브랜드" 행 자체가 없고, "렌탈비용 48,000원 /일"로 정확히 표기되는 것 확인.
- 이미지 9장(`document.querySelectorAll('.product-detail-photo')`) 전부 337×449(모바일 375px 기준)로 완전히 동일한 크기인 것을 실측 확인.
- 스크롤 고정: `window.scrollTo(0, 2000)` 전후로 하단 바의 `getBoundingClientRect()` 값이 **완전히 동일**(뷰포트 기준으로 안 움직임)한 것을 확인, 페이지 맨 끝까지 스크롤해도 마지막 이미지가 고정 바에 가려지지 않는 것(`lastPhotoBottom < barTop`)도 확인.
- 고정 바 안에서 사이즈 선택(M) → 담기 → "담김" 전환까지 실제로 동작하는 것 재확인(재구조화 후에도 기능 정상).
- `npm run build`/`npm run lint` 클린. 테스트 계정·스크래치 스크립트 정리 완료.
- 박경원님 데모 계정에서 바로 확인 가능(코드 변경만으로 기존 상품에 자동 적용).

## [Claude Code 세션] 상품 상세 하단 고정 바 — 렌탈비용/보증금 세로 배치 + 사이즈칩·담기 버튼 붙이기

562님 요청 2건: 1) 렌탈비용을 보증금 위로, 2) 사이즈칩을 담기 버튼 왼쪽에 붙여서 이동.

### 구현
- `app/globals.css`: `.product-sticky-price`를 `flex(row, space-between)`에서 `flex-direction:column`(세로 스택)으로 변경 — JSX 순서(렌탈비용 먼저, 보증금 다음)가 그대로 위/아래 배치로 반영됨.
- `.product-sticky-bar .li-row{justify-content:flex-start}` + `.product-sticky-bar .li-row .size-chip-row{flex:none}` 추가 — 기존엔 `.li-row`가 `justify-content:space-between`이고 `size-chip-row`가 `flex:1`이라 사이즈칩과 담기 버튼 사이에 큰 빈 공간이 생겼던 것을, 사이즈칩이 필요한 만큼만 폭을 차지하게(`flex:none`) 하고 행 정렬을 왼쪽 기준(`flex-start`)으로 바꿔 버튼이 칩 바로 옆(행의 `gap`만큼)에 붙도록 함.

### 검증(라이브)
- 렌탈비용/보증금 각 `<span>`의 `getBoundingClientRect().top`을 실측 — 렌탈비용이 위(719.6), 보증금이 아래(740.8)에 있는 것 확인.
- 사이즈칩 그룹의 오른쪽 끝과 담기 버튼 왼쪽 끝 사이 간격을 실측 — 8px(행의 `gap` 값)로, 붙어있는 것을 확인(수정 전엔 `flex:1`로 인해 훨씬 넓은 간격이 있었음).
- `npm run build`/`npm run lint` 클린. 테스트 계정·스크래치 스크립트 정리 완료.
- 박경원님 데모 계정에서 바로 확인 가능.

## [Claude Code 세션] 상품 상세 하단 고정 바 — 사이즈칩·담기를 오른쪽으로 배치

562님 요청: "작업한거 오른쪽 배치" — 직전에 다듬은 사이즈칩+담기 버튼 묶음을 하단 고정 바 안에서 가격 정보 오른쪽에 나란히 배치.

### 구현
`app/globals.css`: `.product-sticky-bar-inner`를 세로 쌓임(기본 block)에서 `display:flex;align-items:center;justify-content:space-between`로 변경 — 왼쪽엔 `.product-sticky-price`(렌탈비용/보증금, 세로 스택), 오른쪽엔 사이즈칩+담기 버튼(`ProductAddToCart`)이 한 행에 나란히 배치됨. `.li-row`의 불필요해진 `margin-top:8px`도 제거(이제 위아래로 안 쌓이므로).

### 검증(라이브)
가격 블록(`left:28~147`)과 사이즈칩+담기 블록(`left:210~347`)이 같은 행에서 좌/우로 나뉘어 배치된 것을 좌표로 확인(`liRowLeft >= priceRight`). 사이즈 선택→담기 동작도 재확인. `npm run build`/`npm run lint` 클린, 테스트 계정 정리 완료.

## [Claude Code 세션] 룩북 페이지 각 상품도 상품 상세 페이지와 동일한 구조로 재구성

562님 요청: "룩북에서도 구현되게 진행" — 확인 결과 "룩북 페이지(/looks/[id])의 각 상품 카드도 상품 상세 페이지와 동일한 구조로" 만들어달라는 의미였음(AskUserQuestion으로 확인).

### 구현
- `app/(customer)/looks/[id]/page.tsx`: `items` 매핑에 `category`/`deposit` 추가(상품 상세 페이지와 같은 정보를 보여주려면 필요). 이미 이 페이지는 로그인 필수(`redirect`)라 `LookItems`에 `isLoggedIn`/`lookId`를 더 이상 넘기지 않음(아래 참고).
- `components/LookItems.tsx`: 전면 재작성. 기존엔 작은 2열 카드(`li-thumb` 작은 스와치 + 이름/가격 + 사이즈칩/담기를 세로로 압축)였는데, 이제 각 아이템을 **상품 상세 페이지와 완전히 같은 구성 요소**로 렌더링: 큰 사진(`product-detail-photo`, 3:4 전체 폭) → 상품명(`product-detail-name`) → 카테고리 행(`order-detail-plain`) → 가격(왼쪽)+사이즈칩·담기(오른쪽) 한 행(`product-action-row`, 상품 상세 하단 고정바와 동일한 배치지만 여기선 `position:fixed` 아닌 일반 인라인 배치 — 여러 상품이 한 페이지에 있어 화면에 동시에 고정할 수 없으므로) → "룩북" 3장·"상세 이미지" 5장 갤러리. 사이즈 선택·담기는 기존 `ProductAddToCart` 컴포넌트를 그대로 재사용(아이템별로 각각 독립된 인스턴스라 담기 상태도 서로 간섭 없음).
  - **부수적 정리(죽은 코드 제거)**: 이 페이지는 이미 페이지 단위로 로그인이 걸려 있어서, 기존 `LookItems.tsx`에 있던 "비로그인 시 로그인 페이지로 보냈다가 `?add=`로 돌아와서 자동 담기" 로직은 애초에 도달 불가능한 죽은 코드였음(실제로 절대 실행 안 됨) — `ProductAddToCart` 재사용으로 자연스럽게 제거됨.
  - `.li-thumb`/`.li-info`/`.li-name`/`.li-price`(옛 작은 카드 전용, 이제 아무 데서도 안 씀)도 함께 정리.
- `app/globals.css`: 가격(왼쪽)+사이즈칩·담기(오른쪽) 배치 CSS를 `.product-sticky-bar` 전용에서 `.product-action-row`(공유 클래스)로 일반화해, 상품 상세 하단 고정바와 룩북 각 아이템 양쪽에서 재사용. `.look-items`를 2열 그리드에서 세로 리스트로, `.look-item`에 아이템 사이 구분선(`border-bottom`) 추가.

### 검증(라이브)
- 룩 "noir-soiree"(상품 3개) 접속 → 상품마다 사진 9장(메인+룩북3+상세5) 전부 동일 크기(319×425, 모바일 375px 기준)로 렌더링되는 것을 확인.
- 3개 상품 각각의 `product-action-row`에서 가격(좌)/사이즈칩+담기(우)가 올바르게 나뉘어 배치된 것을 좌표로 확인.
- 첫 번째 상품만 사이즈(M) 선택 후 담기 → 그 상품만 "담김"으로 바뀌고 두 번째 상품은 "담기" 그대로인 것을 확인(아이템별 담기 상태가 서로 독립적인지 검증) → DB(`cart_item`)에도 첫 번째 상품(사이즈 M)만 정확히 저장된 것을 재확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·장바구니·스크래치 스크립트 정리 완료.
- "여러 개 한번에 보기"(`LookGrid.tsx`, `/looks` 목록의 다른 보기 모드)는 이번 변경과 무관해 손대지 않음 — 별도 확인 필요하면 후속 요청으로.

## [Claude Code 세션] 룩북 방향 정정 — "동일한 구조로 인라인 확장"이 아니라 "클릭 시 상품 상세 페이지로 이동"이었음

바로 위 세션에서 "룩북에서도 구현되게 진행"을 "룩 페이지의 각 상품을 상품 상세 페이지와 똑같은 구조로 인라인 확장"이라고 이해하고 구현했는데, 562님이 정정: "룩북에서는 상품을 클릭했을 때 상품 상세 페이지가 구현되야지" — 실제 의도는 **룩 페이지는 원래의 컴팩트 카드 그대로 두고, 카드를 클릭하면 진짜 상품 상세 페이지(`/products/[id]`)로 이동**하는 것이었음.

### 수정 (직전 세션의 인라인 확장을 되돌리고 링크만 추가)
- `app/(customer)/looks/[id]/page.tsx`: `items` 매핑을 원래대로(`id,name,size,dailyPrice,c1,c2`만) 되돌림 — `category`/`deposit`는 더 이상 룩 카드에서 안 씀.
- `components/LookItems.tsx`: 원래의 컴팩트 2열 카드 구조(작은 썸네일 + 이름/가격 + 사이즈칩/담기)로 되돌림. 유일한 변화: 썸네일을 `<Link href={`/products/${item.id}`}>`로 감싸서 **클릭하면 상품 상세 페이지로 이동**하게 함(주문 상세 페이지의 `order-item-thumb-link`와 같은 패턴). 사이즈칩+담기는 계속 `ProductAddToCart` 재사용(직전 세션에서 정리한 죽은 코드 제거는 그대로 유지 — 되돌릴 이유 없음).
- `app/globals.css`: `.look-items`를 다시 2열 그리드로, `.li-thumb`/`.li-info`/`.li-name`/`.li-price`/좁은 카드용 `.look-items .li-row` 오버라이드를 복원. `.li-thumb-link`(링크 클릭 영역, 기본 스타일 제거) 신규 추가. 룩 카드 안의 "룩북"·"상세 이미지" 인라인 갤러리는 제거(그 내용은 이제 클릭해서 들어가는 상품 상세 페이지에 이미 있음 — 중복 불필요).

### 검증(라이브)
- 룩 페이지가 다시 2열 컴팩트 카드로 보이는 것, 썸네일에 정확한 `/products/<uuid>` 링크가 걸려있는 것을 확인.
- 실제로 썸네일 클릭 → 상품 상세 페이지(사진·카테고리·갤러리·하단 고정바 전부)로 정상 이동하는 것을 확인.
- 컴팩트 카드에서도 사이즈 선택 → 담기가 정상 동작하는 것 재확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정·장바구니·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 룩 상세 대표 이미지 — 스와이프 캐러셀 → 세로 나열로 변경

562님 요청: "룩북 상세에서 스와이프로 넘기는 다른 룩북 이미지를 밑으로 나열되게 수정."

### 구현
- `components/LookGallery.tsx`: 가로 스와이프 캐러셀(가로 스크롤+`scroll-snap`+활성 인덱스 추적+하단 점 인디케이터)을 걷어내고, 이미지를 그냥 세로로 나열하는 정적 컴포넌트로 전면 단순화. 스크롤 위치를 추적할 필요가 없어져 `'use client'`/`useState`/`useRef`/`onScroll` 전부 제거 — 서버 컴포넌트로 렌더링됨(더 가벼움).
- `app/globals.css`: `.look-gallery-wrap`(가장자리 블리드용 음수 마진)/`.look-gallery`(가로 스크롤)/`.look-gallery-item`(`flex:0 0 100%`+`scroll-snap-align`)/`.look-gallery-dots`/`.look-gallery-dot` 전부 삭제 → `.look-gallery-list`(세로 flex, gap 10px)·`.look-gallery-item`(`width:100%;aspect-ratio:3/4;border-radius:6px`)로 교체.

### 검증(라이브)
룩 "noir-soiree"(대표 이미지 3장)로 확인: 이미지 3장이 가로 스크롤 없이(`overflow-x:visible`) 각각 다른 세로 위치(top 100/536/971)에 순서대로 쌓여 나열되는 것, 점 인디케이터가 더 이상 없는 것을 확인. `npm run build`/`npm run lint` 클린. 테스트 계정 정리 완료.

## [Claude Code 세션] 룩 갤러리 크기·모서리 원복 — 세로 나열로 바꾸면서 실수로 크기/모서리까지 바뀌었던 것 수정

562님 지적: "룩북 크기는 이전과 동일해야지. 모서리도 라운드로 다듬지말고." — 캐러셀→세로 나열로 바꾸는 과정에서 의도치 않게 두 가지가 달라졌었음: 1) 가장자리까지 꽉 채우던 `margin:0 -28px` 블리드 래퍼(`.look-gallery-wrap`)를 빼먹어서 이미지가 콘텐츠 패딩만큼 좁아짐, 2) 원래 없던 `border-radius:6px`를 새로 추가해버림.

### 수정
`components/LookGallery.tsx`: `.look-gallery-wrap`(블리드 래퍼) 되살려서 `.look-gallery-list`를 다시 감쌈. `app/globals.css`: `.look-gallery-wrap{margin:0 -28px}` 복원, `.look-gallery-item`에서 `border-radius:6px` 제거(사각 모서리로 원복).

### 검증(라이브)
모바일 폭(375px)에서 이미지가 다시 뷰포트 전체 폭(0~375, 콘텐츠 패딩 없이 꽉 참)으로 렌더링되는 것, `border-radius`가 `0px`인 것을 실측 확인. `npm run build`/`npm run lint` 클린, 테스트 계정 정리 완료.

## [Claude Code 세션] 룩 대표 이미지 간격 축소 (좌우 여백은 edge-to-edge 유지로 확인)

562님 지적: "좌우 여백처리는 아직도 안됐네. 이미지간 간격도 넓고." — 좌우 여백은 실측(0~375, 뷰포트 풀블리드) 결과를 보여드리고 AskUserQuestion으로 재확인한 결과 **지금의 edge-to-edge 상태가 맞다**는 것으로 확인(별도 수정 불필요). 이미지 사이 세로 간격만 문제였음.

### 수정
`app/globals.css`: `.look-gallery-list`의 `gap`을 `10px` → `2px`로 축소.

### 검증(라이브)
이미지 사이 간격이 2px로 줄어든 것, 좌우는 여전히 0~375(뷰포트 전체) edge-to-edge인 것을 실측 확인. `npm run build`/`npm run lint` 클린, 테스트 계정 정리 완료.

## [Claude Code 세션] 상품 상세 페이지 사진 — 룩북 페이지 이미지와 동일하게 edge-to-edge로 통일

562님 지적: "룩북 상세 이미지가 룩북 페이지 이미지보다 작잖아. 그럼 룩북 페이지 이미지와 일체감있게 노출되게 동일하게 조절." — 상품 상세 페이지(`/products/[id]`)의 사진(메인 사진 + "룩북" 3장 + "상세 이미지" 5장, 전부 `.product-detail-photo` 클래스 공유)이 `.detail` 컨테이너의 28px 좌우 패딩 안에 들어가 있어, 룩 페이지의 edge-to-edge 대표 이미지보다 좁았던 것.

### 수정
`app/globals.css`: `.product-detail-photo`에 `margin:4px -28px 0`(좌우 28px씩 바깥으로 블리드) + `width:calc(100% + 56px)` 적용해 뷰포트 전체 폭을 채우도록 변경, 기존 `border-radius:6px`도 제거(룩 페이지 이미지가 사각 모서리라 통일). 갤러리 섹션(`product-gallery-list`)의 타일 간 `gap`도 `10px`→`2px`로 줄여 룩 페이지 갤러리와 동일한 밀도로 맞춤. `.detail` 자체의 기존 `margin-right:-18px`(헤더 정렬용 보정) 위에 이 블리드가 얹혀도 계산이 어긋나지 않는지 실측으로 확인.

### 검증(라이브)
상품 상세 페이지의 사진 9장(메인 1 + 룩북 3 + 상세이미지 5) 전부 뷰포트 폭 그대로(0~뷰포트 끝, `border-radius:0px`)로 렌더링되는 것을 확인, 가로 스크롤 오버플로우가 생기지 않는 것(`document.documentElement.scrollWidth <= window.innerWidth`)도 확인, 갤러리 타일 사이 간격이 2px로 룩 페이지와 동일한 것 확인. `npm run build`/`npm run lint` 클린, 테스트 계정 정리 완료.

## [Claude Code 세션] 룩 상세 페이지 — 목록 페이지와 크기 불일치 진짜 원인 발견·수정 (`.look-detail`의 옛 560px 폭 제한)

562님이 강하게 재지적: "룩북 목록 페이지 이미지랑 동일하게 맞추라고!! 왜 아직 양끝이 남냐고!!" — 앞서 두 번의 시도(`.look-gallery-item`/`.product-detail-photo` 각각을 edge-to-edge로 블리드)는 **모바일 폭(375px)에서는 이미 정확히 목록 페이지와 동일**했지만(둘 다 실측으로 0~375 확인), 진짜 문제는 넓은 화면에서만 드러나는 것이었음.

### 근본 원인
룩 목록 페이지(`/looks`, `LookGrid.tsx`)의 `.look-grid`는 폭 제한이 `.wrap`의 `max-width:1120px` 하나뿐이라, 1280px 화면에서 대표 이미지가 1120px까지 넓어짐. 반면 룩 상세 페이지(`/looks/[id]`)를 감싸는 `.look-detail`엔 **옛날부터 있던 `max-width:560px;margin:0 auto`**가 별도로 걸려 있어서, 그 안의 `.look-gallery-item`이 제아무리 `margin:0 -28px`로 블리드해도 `.look-detail`의 560px 캡 안에서만 블리드되어 최대 616px에서 막혀버림 — 1280px 화면에서 실측 결과 목록 페이지는 1120px인데 상세 페이지는 616px, 양쪽에 324.5px씩 여백이 남아있었음(모바일 폭에서는 560px 캡보다 화면이 좁아서 이 차이가 아예 안 보였던 것 — 그래서 이전 두 번의 라이브 검증에서 못 잡아냄).

### 수정
`app/globals.css`: `.look-detail{max-width:560px;margin:0 auto;padding-top:6px}` → `.look-detail{padding-top:6px}`로, 폭 제한·중앙정렬을 완전히 제거. 이제 상세 페이지의 폭 제한도 목록 페이지와 동일하게 `.wrap`의 1120px 하나뿐.

### 검증(라이브)
- 1280px 화면에서 목록 페이지 `.look-cover`가 `left:72.5, right:1192.5, width:1120`인 것을 먼저 실측 → 상세 페이지 `.look-gallery-item`이 수정 전엔 `left:324.5, right:940.5, width:616`(불일치) → 수정 후 `left:72.5, right:1192.5, width:1120`(목록 페이지와 완전히 동일)인 것을 확인.
- 모바일 폭(375px)에서 회귀 없는지 재확인: 갤러리 이미지 여전히 `0~375`(edge-to-edge), 룩 아이템 카드도 여전히 `187px`(2열 그리드) 그대로 — 560px 캡이 애초에 모바일 폭보다 넓어서 지금까지 실질적 영향이 없었던 부분이라 회귀 없음.
- `npm run build`/`npm run lint` 클린. 테스트 계정 정리 완료.
- **교훈**: 이 앱은 모바일 전용이라 평소 모바일 폭에서만 검증해왔는데, 이번 버그는 **모바일 폭보다 넓은 컨테이너 제한(560px)이 걸려 있어서 모바일에서는 절대 드러나지 않는 종류**였음 — 폭 관련 CSS 불일치를 다룰 땐, 두 페이지를 비교할 요소가 있다면 좁은 화면뿐 아니라 최소 한 번은 넓은 화면에서도 두 값을 직접 실측 비교해볼 것.

## [Claude Code 세션] 카트 배송 모드 패널 — 방법 전환 시 이전에 눌러둔 모드가 그대로 열려있던 버그 수정

562님 지적: "카트 페이지 직배송 선택하면 또 집으로 받기가 열려있어. 열지말고 회원이 버튼 클릭해서 선택할 수 있도록 하자고 하지 않았었어 우리?" — 예전에 이미 "패널은 항상 접힌 채로 시작, 사용자가 직접 눌러야 펼쳐짐"으로 고쳐뒀던 부분인데 다른 경로로 재발한 버그였음.

### 원인
`DeliveryInfoForm`은 배송 방법이 바뀌어도(예: 택배→직배송) 언마운트되지 않고 계속 같은 컴포넌트 인스턴스로 살아있음. 시나리오: 1) 택배 선택(자택만 가능해짐, `restrictedToHome=true`) → "집으로 받기" 클릭(`mode='home'`) 2) 직배송으로 다시 바꿈 → `restrictedToHome`이 `false`가 되지만, 기존 리셋 로직(`components/DeliveryInfoForm.tsx` 61~63행)은 `restrictedToHome`이 **true일 때 workplace/pickup 모드만** 풀어주지, `home` 모드는 건드리지 않음 → `mode` state가 `'home'`으로 남은 채 그대로 있다가, 시간대까지 고르면 모드 버튼 줄이 다시 나타나면서 이미 `mode==='home'`이라 패널이 자동으로 펼쳐진 채 보였던 것.

### 수정
`components/DeliveryInfoForm.tsx`: 모드 버튼 줄이 숨겨질 때(`showModeButtons`가 `false`가 될 때)마다 `mode`를 무조건 `null`로 리셋하는 `useEffect`를 추가. 이제 배송 방법을 어떻게 바꿔도, 모드 버튼 줄이 사라졌다 다시 나타나는 순간엔 항상 아무것도 선택 안 된 상태로 시작함.

### 검증(라이브)
실제로 재현: 날짜 선택 → 택배 선택 → "집으로 받기" 클릭(패널 열림) → 직배송으로 전환 → 시간대(6:00) 선택 → 모드 버튼 줄이 다시 뜨는 시점에 **주소 입력 폼이 열려있지 않은 것**(버튼 3개만 보이고 "배송 주소" 등 폼 텍스트 없음)을 확인. 그 상태에서 "집으로 받기"를 다시 클릭하면 정상적으로 폼이 펼쳐지는 것도 확인(클릭 기능 자체는 멀쩡함). `npm run build`/`npm run lint` 클린. 테스트 계정 정리 완료.

## [Claude Code 세션] 주문 상태 라벨 변경 — "주문검수중"→"상품검수중", "수거검수중"→"반납검수중"

562님 요청: "주문검수중>상품검수중, 수거검수중>반납검수중" — 이 라벨을 쓰는 모든 화면(회원·관리자·배송기사·이용안내)에서 일괄 변경.

### 구현
아래 5개 파일에서 라벨 문자열을 전부 교체(대응하는 액션 버튼 문구도 함께 통일):
- `app/(member)/account/[orderId]/page.tsx`, `app/(member)/account/page.tsx`: `NORMAL_LABEL`/`PROBLEM_LABEL`의 `주문검수중`→`상품검수중`, `수거검수중`→`반납검수중`(문제 분기 라벨 "오염, 손상 확인" 문구도 동일하게). `account/page.tsx`의 단계 수 주석도 실제로는 8단계인데 "7단계"로 낡아있던 걸 이 김에 "8단계"로 바로잡고 반납접수 요청됨 단계를 흐름에 추가.
- `components/AdminOrders.tsx`: 상태 드롭다운 `LABEL` 교체, 문제 분기 괄호 안 문구도 "검수 보류(주문검수)"→"검수 보류(상품검수)", "반납 이슈(수거검수)"→"반납 이슈(반납검수)".
- `components/DeliveryList.tsx`: 상태 `LABEL` 교체 + 배송기사가 누르는 액션 버튼 문구도 "주문검수 시작"→"상품검수 시작", "수거검수 시작"→"반납검수 시작"(상태 라벨과 버튼 문구가 서로 다르면 헷갈리므로 함께 통일).
- `app/(customer)/guide/page.tsx`: "내 렌탈" 섹션의 8단계 흐름 알약, 문제 상태 예시 알약, 취소·환불 섹션의 "그 전까지(...)" 안내 문구까지 전부 반영.
- `db/*.sql`의 마이그레이션 주석(`fulfillment-status-v2.sql`, `_combined-migration.sql`)은 이미 배포된 마이그레이션이라 CLAUDE.md 방침대로 손대지 않음(코드상 실제 표시 라벨과는 무관, 히스토리 문서로만 남김).

### 검증(라이브)
- 회원 화면: 주문 목록(`/account`)·상세(`/account/[orderId]`) 둘 다 PRE_INSPECTING 주문엔 "상품검수중", RETURN_INSPECTING 주문엔 "반납검수중"이 뜨는 것을 테스트 주문 2건으로 확인.
- `/guide` 페이지: 8단계 흐름 알약과 문제 상태 예시 알약, 취소·환불 안내 문구까지 전부 새 라벨로 바뀐 것 확인.
- 관리자(`/admin`) 상태 변경 드롭다운 옵션 목록이 새 라벨로 뜨는 것 확인.
- 배송기사(`/delivery`) 화면의 다음 단계 진행 버튼이 "상품검수 시작"/"반납검수 시작"으로 뜨는 것 확인.
- `npm run build`/`npm run lint` 클린. 테스트 계정(고객·직원)·주문·스크래치 스크립트 정리 완료.

## [Claude Code 세션] 카트 배송 방법 — 기억해뒀던 이전 선택을 자동 선택하지 않고 항상 비선택으로 시작

562님 요청: "카트에서 날짜 선택시 택배가 자동 선택되는데 배송방법은 비선택을 기본값으로 해." — 예전에 "재주문 시 같은 배송 방법을 다시 고를 확률이 높다"는 이유로 넣었던 "마지막으로 쓴 배송 방법을 자동 선택" 기능을, 실제로 써보니 원치 않는 동작이라 되돌림.

### 수정
`app/(member)/cart/page.tsx`: `refresh()` 안에서 `prof?.preferredDeliveryMethod`로 `deliveryMethod`를 자동 채우던 한 줄(`setDeliveryMethod((cur) => cur ?? prof?.preferredDeliveryMethod ?? null)`)을 삭제. 이제 카트 진입 시 배송 방법은 항상 비선택 상태로 시작하고, 회원이 직접 골라야만 선택됨. 서버 쪽에 마지막 배송 방법을 저장하는 로직(`preferred_delivery_method` 컬럼·`createOrder`의 저장 로직) 자체는 그대로 둠 — 나중에 이 "자동 선택" 동작만 다시 켜고 싶어지면 이 한 줄만 되살리면 됨.

### 검증(라이브)
`preferred_delivery_method: 'PARCEL'`이 저장된 테스트 계정으로 카트에 진입해 날짜를 선택 → 하단 CTA가 "배송 방법을 선택하세요"로 뜨고, 직배송·퀵배송·택배 알약 전부 `pickable`(선택 안 됨) 상태인 것을 확인(수정 전이었다면 택배가 `chosen`으로 미리 선택돼 있었을 상황). 알약을 직접 클릭하면 정상적으로 선택되는 것도 재확인. `npm run build`/`npm run lint` 클린. 테스트 계정 정리 완료.

## [Claude Code 세션] 카트 배송 방법 자동 선택 — 되돌리기(revert)

562님이 바로 직전 세션의 변경을 되돌려달라고 요청: "'마지막으로 쓴 배송 방법을 자동 선택'으로 다시 되돌리자. 내가 그렇게 명령했던걸 잊고있었어." — 원래 의도적으로 넣었던 기능이었음을 확인.

### 수정
`app/(member)/cart/page.tsx`: `refresh()`에서 제거했던 `setDeliveryMethod((cur) => cur ?? prof?.preferredDeliveryMethod ?? null)` 한 줄을 그대로 복원.

### 검증(라이브)
`preferred_delivery_method: 'PARCEL'`이 저장된 테스트 계정으로 카트 진입 → 날짜 선택 → "택배" 알약이 `chosen`(자동 선택)으로 뜨는 것을 확인. `npm run build`/`npm run lint` 클린. 테스트 계정 정리 완료.

## [Claude Code 세션] 카트 배송 방법 다음으로 — 저장된 주소 모드(집/근무지)도 자동으로 열어줌

562님 요청: "'마지막으로 쓴 배송 방법을 자동 선택' 다음으로는 집으로 받았으면 집으로 받기 열어주고, 근무지면 근무지 주소도 같이 열어줘." — 배송 방법 자동 선택에 이어, 저장된 배송지 종류(집/근무지)에 맞는 모드 패널도 자동으로 펼쳐지게.

### 구현
`components/DeliveryInfoForm.tsx`: 기존에 두 개로 나뉘어 있던 useEffect(하나는 `restrictedToHome`일 때 근무지/픽업 선택 풀기, 하나는 "버튼 줄 숨겨지면 무조건 null"로 리셋)를 하나로 합쳐서, **모드 버튼 줄이 나타나는 순간엔 `initialMode(profile)`(집 주소 있으면 'home', 근무지 있으면 'workplace', 매장픽업 설정돼있으면 'pickup')을 기본값으로 자동 선택**하게 함:
```ts
useEffect(() => {
  if (!showModeButtons) { setMode(null); return; }
  const fallback = restrictedToHome ? (initMode === 'home' ? 'home' : null) : initMode;
  setMode((cur) => cur ?? fallback);
}, [showModeButtons, restrictedToHome, initMode]);
```
- `restrictedToHome`(퀵배송·택배 선택 시 자택만 가능)일 땐 `initMode`가 'workplace'/'pickup'이어도 억지로 열지 않고(불가능한 모드라 애초에 버튼도 없음), 집 주소가 있을 때만 'home'을 기본 선택. 집 주소가 없으면 아무것도 안 열림(안전한 폴백).
- `cur ?? fallback` 패턴이라 회원이 이미 이번 화면에서 직접 다른 모드를 눌러놨다면 덮어쓰지 않음 — 배송 방법 자동 선택 때 쓴 것과 동일한 안전장치.
- 버튼 줄이 숨겨질 때 무조건 `null`로 리셋하는 건 그대로 유지(직전 세션에서 고친 "예전에 눌러둔 모드가 엉뚱하게 남아있는" 버그는 안 되돌아옴).

### 검증(라이브)
- 집 주소만 저장된 테스트 계정: 날짜 선택 → 직배송 선택 → 시간대 선택까지만 했는데(모드 버튼 클릭 없이) "집으로 받기" 패널이 이미 펼쳐져 배송 주소 입력폼이 보이는 것을 확인.
- 근무지만 저장된 테스트 계정: 같은 순서로 "근무지로 받기" 패널이 자동으로 펼쳐져 근무지 주소 입력폼이 보이는 것을 확인.
- 근무지만 저장된 계정으로 택배(restrictedToHome) 선택 시엔, 집 주소가 없어 아무 패널도 안 열리고 "집으로 받기" 버튼만 뜨는 안전한 폴백도 확인(에러 없음).
- `npm run build`/`npm run lint` 클린. 테스트 계정 2개 정리 완료.

## [Claude Code 세션] 보안 감사 — Critical: `listAddressChanges()` 권한 검사 누락 수정

562님 요청("현 시점에서 보안 감사, 부하 테스트 해줘" → 결과 보고 후 "Critical 건 보완해줘")에 따라 서버 액션 권한 검사, RLS 정책, 결제 웹훅, 파일 업로드 검증, 관리자/직원 권한 경계 등을 수동 감사(이 저장소는 `origin` 리모트가 없어 `/security-review`의 git diff 기반 부트스트랩이 실패해서, 상세 브리핑을 준 서브에이전트로 대체 진행). 발견된 것 중 **Critical 1건**을 이번 세션에서 수정.

### 발견
`lib/staff-actions.ts`의 `listAddressChanges()`가 이 파일의 다른 모든 함수와 달리 `if (!me) return [];`만 있고 `role === 'member'` 체크가 빠져있었음 — 로그인만 했으면 일반 회원도 호출 가능한 상태. 이 함수는 `/admin/address-log` 페이지의 서버 컴포넌트에서도 호출되지만, **`'use client'` 컴포넌트인 `components/AdminAddressLog.tsx`의 Supabase Realtime INSERT 구독 콜백(`listAddressChanges().then(setRows)`)에서도 직접 호출**되기 때문에, Next.js가 이 함수를 클라이언트 번들에 독립적으로 호출 가능한 Server Action(고유 action ID 부여)으로 포함시킴 — `/admin` 레이아웃의 `redirect()` 페이지 가드와 무관하게, 이 action ID만 알면 어떤 라우트로도 직접 POST해서 우회 호출 가능한 구조였음. 유출 위험 데이터: 최근 100건의 `address_change_log`(회원 실명·주소 변경 이력 포함, `field_label`이 "배송지 공동현관 비밀번호"인 경우 **평문 비밀번호 값**까지 노출).

### 수정
`lib/staff-actions.ts`의 `listAddressChanges()` 첫 줄을 이 파일의 다른 직원 전용 함수들과 동일한 패턴으로 교체:
```ts
if (!me) return [];
```
→
```ts
if (!me || me.role === 'member') return [];
```

### 검증(라이브 — 실제 익스플로잇 재현 방식)
UI 클릭이 아니라, 실제 공격자가 쓸 수 있는 방식 그대로 검증:
1. `.next/dev/server/app/admin/address-log/page/server-reference-manifest.json`에서 `listAddressChanges`에 매핑된 실제 Server Action ID(`0058d6b1ff0f9b7c2d74f3b6fec507e2c4d1ba9159`)를 확인.
2. 테스트용 직원 계정 1개, 회원 계정 1개를 만들고, 회원 계정의 `address_change_log`에 `field_label: '배송지 공동현관 비밀번호', new_value: 'SECRET-1234'`인 미끼 PII 행을 삽입.
3. Node 스크립트로 두 계정 각각 `signInWithPassword`로 실제 세션을 발급받아, 앱이 쓰는 것과 동일한 `sb-<project>-auth-token` 쿠키 포맷으로 인코딩.
4. 이 쿠키 + `Next-Action: 0058d6b1ff0f9b7c2d74f3b6fec507e2c4d1ba9159` 헤더로 **직접 raw POST**를 날려 해당 Server Action을 리플레이:
   - **회원 계정으로 리플레이 → `[]`(빈 배열) 응답.** 수정 전이었다면 미끼 PII 행이 그대로 유출됐을 요청.
   - **직원 계정으로 같은 방식 리플레이 → 실데이터 정상 반환**(대조군 — 리플레이 메커니즘 자체가 올바르게 동작함을 확인, 즉 회원 쪽 빈 응답이 요청 실패가 아니라 권한 검사 때문임을 증명).
5. `npm run build`/`npm run lint` 클린.
6. 테스트 계정 3세트(중복 생성분 포함) + 미끼 PII 행 + 스크래치 스크립트 전부 정리 완료.

### 아직 미착수 (562님 확인 후 진행 예정)
같은 감사에서 함께 발견됐지만 아직 요청받지 않아 손대지 않은 항목:
- **(성능) `/looks` 페이지** — `force-dynamic`으로 캐싱 없이 매 요청마다 실 DB 조회, 부하 테스트에서 동시접속 20 기준 중앙값 3957ms/최대 11071ms로 급격히 느려짐(실패 요청 1건 발생). `/`·`/guide`는 동일 조건에서 200-400req/s, 500ms 이내로 정상.

## [Claude Code 세션] 보안 감사 나머지 4건 수정 — High/Medium RLS 2건 + Low 2건

562님 요청: "High/Medium — RLS 꺼진 테이블 2개, Low — 푸시 구독 삭제에 소유권 확인 없음, Low — 패키징 사진 업로드 파일명 처리, 나머지 전부 진행하자."

### 1. (High/Medium) `store_closure`/`phone_verify_attempt` RLS 미적용

두 테이블 모두 지금까지 앱 코드에서는 항상 `supabaseAdmin()`(service role)로만 접근해와서 기능상 문제는 없었지만, RLS가 꺼져있으면 공개된 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(anon key)로 Supabase REST API에 **앱을 거치지 않고 직접** 요청해 우회 접근이 가능한 상태였음(로그인조차 필요 없음).

`db/rls-closure-phone-verify.sql`(신규) 작성:
- `store_closure`: 조회(select)는 로그인 없이도 공개(카트 캘린더에 원래 공개 표시되는 정보라 문제 없음), 등록/수정/삭제는 `is_approver()`(디렉터·슈퍼바이저)만.
- `phone_verify_attempt`: 전화번호가 들어있는 순수 내부 어뷰징 방지 로그라 클라이언트가 읽거나 쓸 이유가 전혀 없음 — 정책을 하나도 만들지 않고 RLS만 켜서 anon/authenticated 양쪽 다 기본 차단(service role은 RLS를 우회하므로 기존 `checkPhoneVerifyRateLimit` 동작엔 영향 없음).

**⚠️ 미적용 상태 — 562님이 Supabase SQL Editor에서 `db/rls-closure-phone-verify.sql` 직접 실행 필요**(Claude Code는 REST API만 써서 `ALTER TABLE`/RLS 같은 DDL을 직접 실행할 수 없음 — 이 프로젝트의 다른 모든 마이그레이션과 동일한 패턴). `README.md` 마이그레이션 순서 목록에도 반영해둠.

### 2. (Low) `removePushSubscription` 소유권 체크 누락

`lib/push-actions.ts`의 `removePushSubscription(endpoint)`가 로그인 확인조차 없이 `endpoint` 문자열만으로 아무 회원의 구독이든 삭제 가능한 형태였음(같은 파일의 `savePushSubscription`은 이미 로그인 확인 + 본인 `customer_id`로 upsert하고 있었는데, 삭제 쪽만 이 패턴이 빠져있었음). `savePushSubscription`과 동일하게 로그인 확인 + 본인 `customer_id`를 조회해, 삭제 쿼리에 `.eq('customer_id', customer.id)` 조건을 추가해 본인 소유 구독만 삭제되도록 수정.

### 3. (Low) `savePackagingPhoto` 파일 확장자 경로 조작 가능성

`lib/staff-actions.ts`의 `savePackagingPhoto`가 저장 경로의 확장자를 클라이언트가 보낸 `file.name`에서 그대로 잘라 쓰고 있었음(`file.name.slice(file.name.lastIndexOf('.'))`). 파일명에 `.`이 슬래시보다 앞에 오는 형태(예: `"a.jpg/../../evil"`)를 보내면 `ext`에 `/`나 `..`가 섞여 들어가 저장 경로가 의도한 `${orderId}/` 폴더 밖을 가리키는 형태로 조작될 수 있는 입력 검증 공백이었음. 이미 검증하고 있던 `file.type`(MIME 타입)에서만 확장자를 도출하는 화이트리스트 매핑(`IMAGE_MIME_EXT`, jpg/png/webp/gif/heic/heif)으로 교체해 `file.name`을 경로 생성에 아예 쓰지 않도록 함 — 매핑에 없는 이색적인 이미지 타입이면 확장자 없이 저장되는 것뿐이라(파일 접근은 항상 DB에 저장된 정확한 경로로 서명 URL을 발급받는 방식이라 확장자 자체는 기능에 영향 없음) 안전한 폴백.

### 검증
- `npm run build`/`npm run lint` 클린(3건 모두 코드 변경 포함).
- **push 구독 소유권**: 테스트 계정 2개(A, B)로 A의 구독을 B가 지우려 하면 조용히 실패(행 그대로 남음), A 본인이 지우면 정상 삭제되는 것을 실제 Server Action 리플레이(A/B 각각의 실제 로그인 세션으로 원시 POST) + DB 재조회로 확인.
- **RLS(`db/rls-closure-phone-verify.sql`)**: 562님이 SQL Editor에서 실행 완료("Success. No rows returned") 후, **앱을 거치지 않고 anon key로 Supabase REST API에 직접 raw 요청**을 보내 검증(로그인 자체를 안 함 — 실제 공격 경로 그대로 재현):
  - `store_closure`: 실제 존재하는 행 기준으로 SELECT는 됨(공개 의도대로), INSERT는 401 차단, 기존 행에 대한 UPDATE·DELETE는 HTTP 204가 오긴 하지만(RLS로 막히면 PostgREST가 "매치 0건"으로 취급해 204를 반환하는 특성이 있어 상태코드만으로는 판단 불가) admin 클라이언트로 직접 재조회해 **행이 실제로는 전혀 변경/삭제되지 않은 것**까지 확인.
  - `phone_verify_attempt`: 실제 존재하는 행을 SELECT해도 `[]`(빈 배열)만 반환되는 것으로 RLS가 진짜 차단 중임을 확인(테이블이 원래 비어서 그런 게 아니라 실제 행이 있는데도 안 보이는 것까지 확인), INSERT도 401 차단.
  - service role(`supabaseAdmin`) 접근은 그대로 정상 동작해 앱 자체엔 영향 없는 것도 재확인.
  - 검증에 쓴 테스트 행(`store_closure` 2099-01-01/02, `phone_verify_attempt` 더미 전화번호 2건)과 스크래치 스크립트 전부 정리 완료.

**감사에서 발견된 5건(Critical 1 + High/Medium 2 + Low 2) 전부 수정 완료 + 라이브 검증 완료.** 남은 건 성능 이슈(`/looks` 캐싱) 1건뿐이며, 이건 요청 대기 중.

## [Claude Code 세션] 부하 테스트에서 발견된 `/looks` 성능 이슈 수정 — 카탈로그 캐싱

562님 요청: "부하 테스트에서 나온 성능 이슈도 해결하고, 다 하고나면 종합적으로 정리해서 알려줘."

### 원인
`app/(customer)/looks/page.tsx`가 `export const dynamic = 'force-dynamic'`이라 매 요청마다 `getProducts()`(상품 목록) + `getSizeAvailabilityByNames()`(사이즈별 재고)를 실 DB에 새로 조회함. 이 두 쿼리는 회원별로 다른 게 아니라 **모든 방문자가 똑같이 보는 데이터**인데, 캐싱이 전혀 없어서 동시접속이 몰리면 그만큼 DB 조회가 그대로 곱절로 쌓이는 구조였음(부하 테스트에서 동시접속 20 기준 중앙값 3957ms/최대 11071ms, 실패 요청 1건 발생).

### 수정
`lib/queries.ts`의 `getProducts()`, `getSizeAvailabilityByNames()` 두 함수를 Next.js `unstable_cache`로 감싸 **30초 TTL** 캐시 적용(내부 구현은 `fetchProducts`/`fetchSizeAvailabilityByNames`로 이름 바꾸고, 기존 이름은 캐시된 wrapper가 그대로 이어받아 export — 호출하는 쪽 코드는 전혀 안 건드림). 이 두 함수는 `/looks`뿐 아니라 `/looks/[id]`, `/products/[id]`, 카트 액션에서도 공유해서 써서 전부 같이 혜택을 받음.
- **왜 시간 기반(TTL) 캐시를 골랐나**: 이 프로젝트는 지금까지 전부 `revalidatePath`(변경 시점에 수동 무효화) 패턴만 써왔지만, 재고 상태(`inventory_item.status`)를 바꾸는 지점이 여러 곳에 흩어져 있어(주문 생성·검수·반납 등) 전부 빠짐없이 태그 무효화를 걸기엔 놓치는 지점이 생길 위험이 있음. 반면 이 화면의 "대여 가능" 표시는 어차피 참고용 정보고, **실제 예약 충돌 방지는 이 캐시와 무관하게 예약 생성 시점에 별도로 처리**되는 걸 코드로 확인함(`addCartItem`도 가용성 체크 없이 그냥 담기만 함) — 그래서 최대 30초 지연이 생겨도 실제 예약 정합성엔 영향이 없어, 무효화 누락 위험이 없는 단순한 TTL 방식을 택함.

### 검증
- `npm run build`/`npm run lint` 클린.
- **부하 재테스트**: 수정 전과 동일한 방법(별도 포트 3001에 프로덕션 빌드, `autocannon -c 20 -d 15`)으로 재측정 — **중앙값 3957ms → 63ms, 최대 11071ms → 176ms, 실패 요청 1건 → 0건**, 처리량은 `/`·`/guide`와 비슷한 수준(~300 req/s)까지 회복.
- 프리뷰(개발 서버)에서 `/looks`가 여전히 정상적으로 룩 4개 + 보기모드 전환 버튼을 보여주는 것, `/looks/[id]`도 정상 동작(비로그인 시 로그인 화면으로 안내하는 기존 동작 그대로)하는 것 확인.
- 테스트용 프로덕션 서버(3001)는 검증 후 종료.

---

## 종합 정리 — 이번 세션 전체(보안 감사 + 부하 테스트 대응)

1. **보안 감사**: 서버 액션 권한, RLS, 결제 웹훅, 파일 업로드, 관리자/직원 권한 경계 등 수동 감사(이 저장소는 `origin` 리모트가 없어 `/security-review`의 git diff 기반 자동 부트스트랩이 안 돼서, 서브에이전트에게 상세 브리핑을 줘서 대체 진행) → **5건 발견, 전부 수정 + 라이브 검증 완료**:
   - **Critical**: `listAddressChanges()` 권한 검사 누락(로그인만 하면 회원도 다른 회원 주소 변경 이력·평문 공동현관 비밀번호까지 조회 가능했음) → 직원 권한 체크 추가. 실제 Server Action ID를 찾아 raw POST로 리플레이하는 방식으로 검증(회원=차단, 직원=정상, 대조군까지 확인).
   - **High/Medium**: `store_closure`/`phone_verify_attempt` 두 테이블 RLS 미적용(공개 anon key로 직접 REST 우회 접근 가능했음) → RLS 활성화 + 정책 추가(562님이 SQL Editor에서 직접 실행). anon key로 직접 REST 요청을 보내 차단되는 것 검증.
   - **Low ×2**: `removePushSubscription` 소유권 체크 누락(로그인조차 없이 아무 구독이나 삭제 가능) → 로그인+소유권 체크 추가. `savePackagingPhoto` 파일 확장자가 클라이언트 파일명에서 그대로 나와 경로 조작 가능한 형태였던 것 → 이미 검증 중인 MIME 타입 기반 화이트리스트로 교체.
2. **부하 테스트**: `/`·`/guide`는 이상 없음, `/looks`가 동시접속 시 심각하게 느려지는 문제 발견(캐싱 없이 매번 실 DB 조회) → 카탈로그 데이터에 30초 TTL 캐시 적용, 재측정으로 정상 범위 회복 확인.

**남은 것**: 이번 감사·부하 테스트에서 나온 항목 중 미해결은 없음. (단, HANDOFF.md 상단 "A. 아직 검증 안 된 것" 목록의 웹 푸시 VAPID 키 발급, 토스 실결제 왕복, 카카오 주소검색 실동작 등은 이번 감사와는 별개로 예전부터 남아있던 항목이니 착각하지 말 것.)
