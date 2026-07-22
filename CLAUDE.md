# Lala 프로젝트 — Claude Code 시작 가이드

이 파일은 Claude Code가 이 저장소에서 세션을 시작할 때 자동으로 읽는 프로젝트 지침 파일입니다.
**이 프로젝트는 지금까지 네트워크/실행 환경이 없는 채팅 환경(claude.ai, Cowork)에서만 작업되어 왔고, `npm install`/`npm run build`를 포함한 어떤 코드 실행도 아직 한 번도 검증되지 않았습니다.** 이 세션이 이 프로젝트를 처음으로 실제 실행 환경에서 확인하는 자리입니다.

## 0. 가장 먼저 할 일: 문서 읽기

1. **`HANDOFF.md` 전체를 읽으세요.** 특히:
   - 맨 위 "🚨 CLAUDE CODE — 작업 시작 전 반드시 확인" 섹션 — 검증 안 된 항목 체크리스트
   - 맨 아래 "[Cowork 세션] 정적 코드 감사 + 버그 수정 4건" 항목 — 가장 최근에 발견/수정된 내용
2. `README.md`는 **초반 버전 기준으로 작성되어 일부 내용이 낡아 있습니다**(예: `createReservation`은 삭제됨, 이행상태 6단계는 10단계로 확장됨, 역할은 admin/delivery뿐 아니라 director/supervisor/delivery로 확장됨). 상충하는 내용이 있으면 **HANDOFF.md를 신뢰**하세요.
3. `CODE_AUDIT.md` — 직전 세션(Cowork, 코드 실행 불가 상태)에서 코드를 손으로 대조해 찾은 문제 목록과 수정 여부 스냅샷.

## 1. 환경 설정

```bash
npm install
```

`.env.local.example`을 복사해 `.env.local`을 만들고 채우세요:

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` — Supabase 프로젝트 필요(562에게 프로젝트 URL/키 확인, 없으면 새로 만들어야 함).
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY` — 기본값(토스 공용 테스트 키)이 이미 채워져 있어 그대로 테스트 결제 가능.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` — 아래 명령으로 생성 후 채우기:
  ```bash
  npx web-push generate-vapid-keys
  ```
- `CRON_SECRET` — 아무 임의의 긴 문자열로 채우기(예: `openssl rand -hex 32`).

## 2. DB 마이그레이션 (Supabase SQL 에디터, **반드시 이 순서대로**)

```
db/schema.sql
db/seed.sql
db/auth.sql
db/cart.sql
db/payments.sql
db/roles.sql
db/profile-fields.sql
db/username-auth.sql
db/fitting-delivery.sql
db/address-detail.sql
db/jibun-address.sql
db/entrance-password.sql
db/membership-fee.sql
db/push-subscriptions.sql
db/phone-verify-limit.sql
db/marketing-broadcast.sql
db/marketing-compliance.sql
db/marketing-schedule.sql
db/marketing-granular-consent.sql
db/address-change-log.sql
db/reservation-order-link.sql
db/fulfillment-status-v2.sql
db/product-unique-name-size.sql
db/store-pickup-return.sql
db/delivery-time-slot.sql
db/store-closures.sql
db/reservation-item-issue.sql
db/drop-fitting-info.sql
db/address-book.sql
db/order-cancel.sql
db/delivery-method.sql
db/delivery-zonecode.sql
db/delivery-recipient-name.sql
db/address-book-zonecode.sql
db/return-request.sql
db/return-tracking.sql
db/packaging-photo.sql
```

Supabase Authentication 설정에서 "Confirm email"은 꺼도 되고 안 꺼도 됩니다 — 가입 로직이 관리자 API(`auth.admin.createUser` + `email_confirm:true`)로 이 설정을 우회하도록 이미 구현되어 있습니다(`lib/auth-actions.ts`). 다만 실제로 그렇게 동작하는지는 검증 항목입니다.

## 3. 빌드 검증 (최우선 순위 — 지금까지 한 번도 안 됨)

```bash
npm run build
```

타입 에러/설정 에러가 나면 고치세요. 다 고친 뒤:

```bash
npm run dev
```

브라우저에서 `/` → 가입 → 멤버십 결제(테스트 카드) → 승인(디렉터 계정으로) → `/looks` 진입까지 한 번 끝까지 돌려보세요.

## 4. 검증 체크리스트 (HANDOFF.md 상단 체크리스트를 실행 가능한 순서로 재정리)

- [ ] `npm run build` 통과
- [ ] DB 마이그레이션 28개 파일 순서대로 에러 없이 실행됨
- [ ] 회원가입(ID/비번) → 멤버십 결제(테스트 카드) → `customer.status`가 `unpaid → pending`으로 바뀌는지 확인
- [ ] 디렉터 계정으로 `/admin/approvals`에서 승인 → 해당 계정 로그인 시 `/looks` 진입 가능한지 확인
- [ ] 웹 푸시: VAPID 키 설정 후 `/profile`에서 알림 켜고, 승인/멤버십결제/렌탈결제/배송시작·완료/보증금환불/탈퇴 각 트리거에서 브라우저 알림이 실제로 뜨는지 확인
- [ ] 카카오 우편번호(주소검색) 팝업이 실제로 뜨고 도로명/지번 주소가 정확히 채워지는지 확인 (가입 폼 배송/회수지 + `/profile`)
- [ ] 토스페이먼츠 결제 왕복(멤버십 100,000원 + 렌탈) — 웹훅까지 확인하려면 `ngrok http 3000` 후 토스 개발자센터 웹훅에 `https://<ngrok>/api/payments/webhook` 등록
- [ ] `/admin` 주문 상태 변경 UI, `/delivery` 이행상태 진행 버튼 실제 동작
- [ ] Supabase Realtime — 관리자/배송 화면이 다른 탭에서의 변경을 자동 반영하는지 (두 브라우저 탭으로 확인)
- [ ] **카트 예약 캘린더(직전 세션에서 수정한 부분)** — `app/(member)/cart/page.tsx`. 오늘 날짜 기준으로 이번 달이 뜨는지, "이전 달"이 이번 달에서 비활성화되는지, "다음 달"로 자유롭게 여러 달 넘어갈 수 있는지 확인
- [ ] 휴대폰 본인인증은 아직 UI 흉내(mock) 단계 — 실제 벤더(포트원 등) 연동은 562 확인 후 별도 진행(지금 범위 아님)
- [ ] SNS(카카오/네이버/구글/페이스북) 로그인·가입도 아직 UI 흉내 — 실제 연동 시 HANDOFF.md의 "[설계 방침 기록] SNS 간편가입도 승인제 적용 대상" 항목 필수로 지킬 것

## 5. 작업 규칙 (562 확인)

- 이 프로젝트는 **claude.ai/Cowork에서 프리뷰를 보며 설계 → Claude Code에서 검증·다듬기**로 이어가는 방식으로 진행됩니다.
- **작업할 때마다 `HANDOFF.md` 맨 아래에 새 항목을 이어서 기록하세요**(기존 항목들과 같은 형식: 무엇을 했는지, 무엇을 검증했는지/못했는지, 남은 일). 이 문서가 세션 간의 유일한 연속성 기록입니다.
- 위 체크리스트에서 확인이 끝난 항목은 `HANDOFF.md` 맨 위 체크리스트에도 `[x]`로 표시해주세요.
- 코드 수정 시 `db/*.sql`에 새 컬럼이 필요하면 **새 파일을 추가**하고(기존 파일 수정 금지 — 이미 배포된 마이그레이션은 불변으로 취급), 위 마이그레이션 순서 목록(2번, README.md, 이 파일)에도 추가하세요.
