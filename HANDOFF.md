# Lala — 프로젝트 인수인계 (HANDOFF)

이 문서는 다른 환경(예: Claude Code)에서 이 프로젝트를 이어서 작업할 때 필요한 맥락을 담고 있습니다.

---

## 🚨 CLAUDE CODE — 작업 시작 전 반드시 확인 (로컬에서만 검증 가능) 🚨

> 이 프로젝트는 네트워크가 없는 환경(claude.ai 챗)에서 만들어졌다. 아래 항목들은 **한 번도 실제로 실행/검증되지 않았고**, 로컬(Claude Code)에서 반드시 처리해야 한다. 절대 빠뜨리지 말 것.

### A. 아직 검증 안 된 것 (빌드/실행/네트워크 관련)
- [x] **`npm install` 후 `npm run build`부터 실행** — Claude Code 세션에서 처음으로 실제 실행, 발견된 컴파일 에러 전부 수정 후 통과 확인. 상세는 맨 아래 "[Claude Code 세션] 첫 실제 빌드 검증 + 버그 수정" 항목 참고.
- [ ] **DB 마이그레이션 실행 순서 지키기** — 아래 "DB 설치 순서" 섹션의 SQL 파일들을 Supabase SQL 에디터에서 **그 순서 그대로** 실행. 파일이 많고(schema~phone-verify-limit까지 16개) 순서가 중요함.
- [ ] **Supabase "Confirm email" 관련** — 이제는 회피 로직(`createAccountById`, admin API로 확정 생성)을 써서 이 설정을 안 건드려도 되지만, 혹시 이상 동작 시 이 설정도 확인.
- [ ] **웹 푸시(Web Push) VAPID 키 생성 필수** — `npx web-push generate-vapid-keys` 실행 후 `.env.local`에 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` 채우기. **이거 안 하면 푸시 알림이 조용히 아예 발송 안 됨**(에러는 안 나지만 기능이 죽어있는 상태).
- [ ] **푸시 알림 실제 동작 테스트** — VAPID 키 넣은 후 `/profile`에서 "푸시 알림 받기" 켜고, 8개 트리거(가입 승인 / 멤버십 결제완료·실패 / 렌탈 결제완료 / 배송 시작·완료 / 보증금 환불 / 탈퇴 처리)를 실제로 실행해 브라우저에 알림이 뜨는지 확인.
- [ ] **토스페이먼츠 실제 결제 왕복 테스트** — 멤버십 가입비(100,000원)와 렌탈 결제 둘 다, 테스트 카드로 결제 → 웹훅 수신까지 확인(웹훅은 `ngrok`으로 로컬 노출 필요, 문서 하단 "웹훅" 섹션 참고). `unpaid→pending` 상태 전환도 실결제로 확인.
- [ ] **카카오 우편번호(주소검색) API 실제 팝업 동작 확인** — 코드는 넣었지만 실제 브라우저에서 팝업이 뜨고 도로명/지번 주소가 정확히 채워지는지 미검증.
- [ ] **회원가입 → 로그인 → 멤버십 결제 → 승인 → 앱 이용까지 전체 흐름을 실제로 한 번 끝까지 테스트** — 각 구간은 개별적으로 만들었지만 전체 연결 왕복은 못 해봄.
- [ ] **관리자(`/admin`) 분쟁 지정 UI, 배송(`/delivery`) 이행상태 변경 UI 실제 동작 확인**.
- [ ] **실시간(Supabase Realtime) 동작 확인** — 관리자 주문 목록·승인 목록의 실시간 갱신이 실제로 되는지 미검증.
- [ ] **휴대폰 본인인증(이름-전화번호 실검증)은 아직 벤더 미연동, 어뷰징 가드만 구현됨** — 아래 "[진행중]" 섹션 참고. `lib/phone-verify-actions.ts`의 `checkPhoneVerifyRateLimit`(하루 5회 제한)만 실제로 동작하고, 실제 인증(포트원 통합인증 등)은 여전히 UI 흉내(mock) 상태.

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
- 위에서 발견한 **`validateRequest` 누락 버그(1번)** — 검증 로직을 새로 작성한 것이라, 원래 의도한 규칙(최소 대여일수, 과거 날짜 금지)이 맞는지 한 번 확인 부탁드립니다. 다른 곳(`lib/payments-actions.ts`의 `createOrder`)에서 이미 하는 검증과 같은 규칙으로 맞췄습니다.
- Next.js 16 메이저 업그레이드 여부(남은 보안 취약점 2건) — 진행 여부 알려주시면 이어서 진행하겠습니다.
